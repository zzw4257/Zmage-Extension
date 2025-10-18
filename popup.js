import { getSettings } from './lib/settings.js';
import { t } from './lib/i18n.js';

let settings = null;
let language = 'en';
let resources = [];
let activeTab = null;

const elements = {};

async function init() {
  elements.baseUrlLabel = document.getElementById('baseUrlLabel');
  elements.popupTitle = document.getElementById('popupTitle');
  elements.authStatus = document.getElementById('authStatus');
  elements.loginButton = document.getElementById('loginButton');
  elements.scanButton = document.getElementById('scanButton');
  elements.uploadSelected = document.getElementById('uploadSelected');
  elements.resourceList = document.getElementById('resourceList');
  elements.noResources = document.getElementById('noResources');
  elements.resourcesHeading = document.getElementById('resourcesHeading');
  elements.tasksHeading = document.getElementById('tasksHeading');
  elements.taskList = document.getElementById('taskList');
  elements.openImages = document.getElementById('openImages');
  elements.openVideos = document.getElementById('openVideos');
  elements.openOptions = document.getElementById('openOptions');

  await loadSettings();
  applyTranslations();
  await refreshAuthStatus();

  activeTab = await getActiveTab();
  if (activeTab) {
    await scanResources();
  } else {
    renderResources([]);
  }

  await refreshTasks();
  registerEvents();
  observeRuntimeMessages();
}

document.addEventListener('DOMContentLoaded', init);

async function loadSettings() {
  settings = await chrome.runtime.sendMessage({ type: 'get-settings' });
  if (!settings) {
    settings = await getSettings();
  }
  language = settings.language || 'en';
  const normalizedBase = settings.baseUrl?.replace(/\/$/, '') || '';
  elements.baseUrlLabel.textContent = `${t(language, 'baseUrlLabel')}: ${normalizedBase}`;
  elements.openImages.dataset.target = `${normalizedBase}/library/images`;
  elements.openVideos.dataset.target = `${normalizedBase}/library/videos`;
}

function applyTranslations() {
  elements.popupTitle.textContent = 'Zmage';
  elements.loginButton.textContent = t(language, 'openLogin');
  elements.scanButton.textContent = t(language, 'collectResources');
  elements.uploadSelected.textContent = t(language, 'startUpload');
  elements.noResources.textContent = t(language, 'noResources');
  elements.resourcesHeading.textContent = t(language, 'collectResources');
  elements.tasksHeading.textContent = t(language, 'tasksTitle');
  elements.openImages.textContent = t(language, 'libraryImages');
  elements.openVideos.textContent = t(language, 'libraryVideos');
  elements.openOptions.textContent = t(language, 'openOptions');
}

async function refreshAuthStatus() {
  const status = await chrome.runtime.sendMessage({ type: 'check-auth' });
  updateAuthStatus(status?.authenticated);
}

function updateAuthStatus(isAuthenticated) {
  if (isAuthenticated) {
    elements.authStatus.textContent = t(language, 'statusLoggedIn');
    elements.loginButton.disabled = true;
  } else {
    elements.authStatus.textContent = t(language, 'statusLoggedOut');
    elements.loginButton.disabled = false;
  }
}

async function scanResources() {
  if (!activeTab) return;
  try {
    const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'scan-page-resources' });
    if (response?.resources) {
      resources = response.resources;
    } else {
      resources = [];
    }
  } catch (error) {
    resources = [];
  }
  renderResources(resources);
}

function renderResources(items) {
  elements.resourceList.innerHTML = '';
  if (!items || items.length === 0) {
    elements.noResources.style.display = 'block';
    elements.uploadSelected.disabled = true;
    return;
  }
  elements.noResources.style.display = 'none';
  elements.uploadSelected.disabled = false;
  items.forEach((item, index) => {
    const container = document.createElement('label');
    container.className = 'resource-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.dataset.index = index;

    const preview = document.createElement(item.type === 'video' ? 'video' : 'img');
    preview.src = item.src;
    if (item.type === 'video') {
      preview.muted = true;
      preview.loop = true;
      preview.autoplay = true;
    }

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `
      <div>${item.type.toUpperCase()}</div>
      <div title="${item.src}">${escapeHtml(item.alt || item.title || item.src)}</div>
    `;

    container.appendChild(checkbox);
    container.appendChild(preview);
    container.appendChild(meta);
    elements.resourceList.appendChild(container);
  });
}

async function startUpload() {
  if (!activeTab) return;
  const selected = Array.from(elements.resourceList.querySelectorAll('input[type="checkbox"]:checked'))
    .map((checkbox) => resources[Number(checkbox.dataset.index)])
    .filter(Boolean);
  if (selected.length === 0) return;
  elements.uploadSelected.disabled = true;
  await chrome.runtime.sendMessage({
    type: 'start-bulk-upload',
    resources: selected,
    tabId: activeTab.id,
    tabUrl: activeTab.url,
    tabTitle: activeTab.title
  });
  elements.uploadSelected.disabled = false;
}

async function refreshTasks() {
  const taskItems = await chrome.runtime.sendMessage({ type: 'get-tasks' });
  if (Array.isArray(taskItems)) {
    renderTasks(taskItems);
  }
}

function renderTasks(taskItems) {
  elements.taskList.innerHTML = '';
  if (!taskItems || taskItems.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'task-item';
    empty.textContent = t(language, 'emptyQueue');
    elements.taskList.appendChild(empty);
    return;
  }
  taskItems.sort((a, b) => b.createdAt - a.createdAt);
  taskItems.forEach((task) => {
    const item = document.createElement('li');
    item.className = 'task-item';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = task.title || task.sourceUrl;

    const statusLine = document.createElement('div');
    statusLine.className = 'status-label';
    const badge = document.createElement('span');
    badge.className = `badge ${task.status}`;
    const statusKey =
      task.status === 'pending'
        ? 'pending'
        : task.status === 'uploading'
        ? 'uploading'
        : task.status === 'success'
        ? 'success'
        : 'error';
    badge.textContent = t(language, statusKey);
    statusLine.appendChild(badge);
    if (task.error) {
      const errorText = document.createElement('span');
      errorText.textContent = task.error;
      statusLine.appendChild(errorText);
    }
    item.appendChild(title);
    item.appendChild(statusLine);

    if (task.status === 'error') {
      const retry = document.createElement('button');
      retry.className = 'secondary';
      retry.textContent = t(language, 'retry');
      retry.addEventListener('click', () => retryTask(task.id));
      item.appendChild(retry);
    }

    elements.taskList.appendChild(item);
  });
}

async function retryTask(taskId) {
  await chrome.runtime.sendMessage({ type: 'retry-task', taskId });
}

function registerEvents() {
  elements.loginButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'open-login' });
  });
  elements.scanButton.addEventListener('click', () => {
    scanResources();
  });
  elements.uploadSelected.addEventListener('click', () => {
    startUpload();
  });
  elements.openImages.addEventListener('click', (event) => {
    event.preventDefault();
    openLink(event.currentTarget.dataset.target);
  });
  elements.openVideos.addEventListener('click', (event) => {
    event.preventDefault();
    openLink(event.currentTarget.dataset.target);
  });
  elements.openOptions.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

function observeRuntimeMessages() {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'tasks-updated') {
      renderTasks(message.tasks);
    }
    if (message.type === 'auth-required') {
      updateAuthStatus(false);
    }
    if (message.type === 'auth-restored') {
      updateAuthStatus(true);
    }
  });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function openLink(url) {
  if (!url) return;
  chrome.tabs.create({ url, active: true });
}

function escapeHtml(input) {
  if (!input) return '';
  return input.replace(/[&<>\"]+/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  })[char] || char);
}
