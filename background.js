import { ensureDefaults, getSettings, subscribeSettings, DEFAULT_SETTINGS } from './lib/settings.js';

const CONCURRENCY_LIMIT = 4;
const REQUEST_TIMEOUT = 30_000;
const RETRY_LIMIT = 1;

const tasks = new Map();
const queue = [];
let activeCount = 0;
let authPromise = null;
let cachedSettings = null;
const notificationActions = new Map();

chrome.runtime.onInstalled.addListener(async () => {
  await ensureDefaults();
  await refreshCachedSettings();
  await recreateContextMenus();
});

(async () => {
  await ensureDefaults();
  await refreshCachedSettings();
  await recreateContextMenus();
})();

subscribeSettings(async () => {
  await refreshCachedSettings();
  await recreateContextMenus();
});

async function recreateContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'save-image',
      title: '保存到 Zmage',
      contexts: ['image']
    });
    chrome.contextMenus.create({
      id: 'save-video',
      title: '保存视频到 Zmage',
      contexts: ['video']
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab) return;
  if (info.menuItemId === 'save-image' && info.srcUrl) {
    await enqueueSingleUpload('image', info.srcUrl, tab);
  }
  if (info.menuItemId === 'save-video' && info.srcUrl) {
    await enqueueSingleUpload('video', info.srcUrl, tab);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = messageHandlers[message.type];
  if (handler) {
    handler(message, sender).then((result) => {
      sendResponse(result);
    }).catch((error) => {
      console.error('[Zmage] message handler error', message.type, error);
      sendResponse({ error: error.message || String(error) });
    });
    return true;
  }
  return false;
});

const messageHandlers = {
  'get-settings': async () => {
    return await getCachedSettings();
  },
  'check-auth': async () => {
    const settings = await getCachedSettings();
    return await checkAuthenticated(settings.baseUrl);
  },
  'start-bulk-upload': async (message) => {
    const { resources, tabId, tabUrl, tabTitle } = message;
    if (!Array.isArray(resources) || resources.length === 0 || !tabId) {
      return { started: false };
    }
    for (const resource of resources) {
      await enqueueUpload({
        type: resource.type,
        sourceUrl: resource.src,
        pageUrl: tabUrl,
        title: resource.alt || resource.title || tabTitle || '',
        originTabId: tabId
      });
    }
    processQueue();
    return { started: true };
  },
  'get-tasks': async () => {
    return Array.from(tasks.values()).map(cloneTaskForUi);
  },
  'retry-task': async (message) => {
    const task = tasks.get(message.taskId);
    if (!task) return { ok: false };
    task.error = undefined;
    task.retries = 0;
    task.status = 'pending';
    queue.push(task);
    processQueue();
    broadcastTasks();
    return { ok: true };
  },
  'open-login': async () => {
    const settings = await getCachedSettings();
    await openLoginTab(settings.baseUrl);
    return { opened: true };
  }
};

async function enqueueSingleUpload(type, srcUrl, tab) {
  await enqueueUpload({
    type,
    sourceUrl: srcUrl,
    pageUrl: tab.url,
    title: tab.title || '',
    originTabId: tab.id
  });
  processQueue();
}

async function enqueueUpload(taskConfig) {
  const id = crypto.randomUUID();
  const task = {
    id,
    type: taskConfig.type,
    sourceUrl: taskConfig.sourceUrl,
    pageUrl: taskConfig.pageUrl,
    title: taskConfig.title,
    status: 'pending',
    retries: 0,
    createdAt: Date.now(),
    originTabId: taskConfig.originTabId
  };
  tasks.set(id, task);
  queue.push(task);
  broadcastTasks();
}

async function processQueue() {
  while (activeCount < CONCURRENCY_LIMIT && queue.length > 0) {
    const task = queue.shift();
    if (!task) break;
    if (task.status !== 'pending') continue;
    activeCount += 1;
    runTask(task).catch((error) => {
      console.error('[Zmage] task failed', error);
    }).finally(() => {
      activeCount = Math.max(0, activeCount - 1);
      processQueue();
    });
  }
}

async function runTask(task) {
  const settings = await getCachedSettings();
  task.status = 'uploading';
  broadcastTasks();
  try {
    await ensureAuthenticated(settings.baseUrl);
  } catch (error) {
    task.status = 'error';
    task.error = error.message || 'Authentication failed';
    broadcastTasks();
    return;
  }

  try {
    const result = await performUpload(task, settings);
    task.status = 'success';
    task.completedAt = Date.now();
    task.response = result;
    broadcastTasks();
    await handlePostUpload(task, result, settings.baseUrl);
  } catch (error) {
    if (!task.error) {
      task.error = error.message || 'Upload failed';
    }
    const retriable = shouldRetry(error) && task.retries < RETRY_LIMIT;
    if (retriable) {
      task.retries += 1;
      task.status = 'pending';
      queue.push(task);
    } else {
      task.status = 'error';
    }
    broadcastTasks();
  }
}

function shouldRetry(error) {
  if (!error) return false;
  if (error.authRequired) return false;
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return false;
  }
  return true;
}

async function getCachedSettings() {
  if (!cachedSettings) {
    await refreshCachedSettings();
  }
  return cachedSettings;
}

async function refreshCachedSettings() {
  cachedSettings = await getSettings();
  cachedSettings.baseUrl = normalizeBaseUrl(cachedSettings.baseUrl);
}

async function ensureAuthenticated(baseUrl) {
  if (authPromise) {
    return authPromise;
  }
  authPromise = (async () => {
    const status = await checkAuthenticated(baseUrl);
    if (status.authenticated) {
      return true;
    }
    broadcastLoginRequired();
    await openLoginTab(baseUrl);
    const success = await waitForLogin(baseUrl);
    if (!success) {
      throw new Error('Login timeout');
    }
    broadcastLoginRestored();
    return true;
  })();
  try {
    return await authPromise;
  } finally {
    authPromise = null;
  }
}

function broadcastLoginRequired() {
  sendRuntimeMessage({ type: 'auth-required' });
}

function broadcastLoginRestored() {
  sendRuntimeMessage({ type: 'auth-restored' });
}

async function checkAuthenticated(baseUrl) {
  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/images?limit=1`, {
      credentials: 'include'
    }, 10_000);
    if (response.status === 401) {
      return { authenticated: false };
    }
    if (!response.ok) {
      return { authenticated: false, error: await response.text() };
    }
    return { authenticated: true };
  } catch (error) {
    return { authenticated: false, error: error.message };
  }
}

async function openLoginTab(baseUrl) {
  const loginUrl = `${baseUrl.replace(/\/$/, '')}/login`;
  await chrome.tabs.create({ url: loginUrl, active: true });
}

async function waitForLogin(baseUrl) {
  const maxAttempts = 45;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await checkAuthenticated(baseUrl);
    if (result.authenticated) {
      return true;
    }
    await delay(2000);
  }
  return false;
}

async function performUpload(task, settings) {
  const baseUrl = settings.baseUrl;
  const endpoint = task.type === 'video' ? '/api/upload/video' : '/api/upload/from-url';
  const memoPrefix = settings.language === 'en' ? 'Collected from: ' : '采集自: ';
  const body = {
    url: task.sourceUrl,
    tags: task.type === 'image' ? ['from:extension'] : undefined,
    memo: settings.includeMemo && task.pageUrl ? `${memoPrefix}${task.pageUrl}` : undefined
  };

  const response = await fetchWithTimeout(`${baseUrl}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }, REQUEST_TIMEOUT);

  if (response.status === 401) {
    const error = new Error('Not authenticated');
    error.authRequired = true;
    throw error;
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) {
        message = data.error;
      }
    } catch (jsonError) {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  return await response.json();
}

async function handlePostUpload(task, result, baseUrl) {
  if (task.type === 'image' && result?.image?.id) {
    const imageId = result.image.id;
    await createMediaNotification({
      task,
      mediaId: imageId,
      baseUrl,
      type: 'image'
    });
  }

  if (task.type === 'video' && result?.video?.id) {
    await createMediaNotification({
      task,
      mediaId: result.video.id,
      baseUrl,
      type: 'video'
    });
  }
}

async function createMediaNotification({ task, mediaId, baseUrl, type }) {
  const libraryUrl = type === 'video'
    ? `${baseUrl.replace(/\/$/, '')}/library/videos/${mediaId}`
    : `${baseUrl.replace(/\/$/, '')}/library/images/${mediaId}`;
  const gifUrl = `${baseUrl.replace(/\/$/, '')}/main/create/gif?imageId=${mediaId}`;
  const notificationId = `zmage-${task.id}`;
  const title = type === 'video' ? '视频已保存到 Zmage' : '图片已保存到 Zmage';
  const message = task.title ? task.title : task.sourceUrl;

  notificationActions.set(notificationId, {
    mediaId,
    type,
    baseUrl,
    libraryUrl,
    gifUrl
  });

  chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title,
    message,
    contextMessage: type === 'image' ? '点击通知打开图库' : undefined,
    buttons: type === 'image'
      ? [
          { title: '生成 GIF 雪碧图' },
          { title: '移除背景' }
        ]
      : [
          { title: '在图库中查看' }
        ]
  });
}

chrome.notifications.onClicked.addListener((notificationId) => {
  const payload = notificationActions.get(notificationId);
  if (!payload) return;
  chrome.tabs.create({ url: payload.libraryUrl, active: true });
  notificationActions.delete(notificationId);
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  const payload = notificationActions.get(notificationId);
  if (!payload) return;
  if (payload.type === 'image') {
    if (buttonIndex === 0) {
      chrome.tabs.create({ url: payload.gifUrl, active: true });
    }
    if (buttonIndex === 1) {
      openRemoveBgView(payload.mediaId);
    }
  } else if (payload.type === 'video') {
    chrome.tabs.create({ url: payload.libraryUrl, active: true });
  }
  notificationActions.delete(notificationId);
});

chrome.notifications.onClosed.addListener((notificationId) => {
  notificationActions.delete(notificationId);
});

function openRemoveBgView(imageId) {
  const url = chrome.runtime.getURL(`remove-bg.html?imageId=${encodeURIComponent(imageId)}`);
  chrome.tabs.create({ url, active: true });
}

function broadcastTasks() {
  sendRuntimeMessage({
    type: 'tasks-updated',
    tasks: Array.from(tasks.values()).map(cloneTaskForUi)
  });
}

function cloneTaskForUi(task) {
  return {
    id: task.id,
    type: task.type,
    sourceUrl: task.sourceUrl,
    pageUrl: task.pageUrl,
    title: task.title,
    status: task.status,
    retries: task.retries,
    error: task.error,
    createdAt: task.createdAt,
    completedAt: task.completedAt
  };
}

function sendRuntimeMessage(payload) {
  chrome.runtime.sendMessage(payload).catch(() => {
    // ignored: no listeners in popup/options
  });
}

async function fetchWithTimeout(resource, options = {}, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeBaseUrl(url) {
  const fallback = DEFAULT_SETTINGS.baseUrl;
  const value = url && typeof url === 'string' ? url : fallback;
  return value.replace(/\/$/, '');
}
