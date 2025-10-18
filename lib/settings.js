export const DEFAULT_SETTINGS = {
  baseUrl: 'http://localhost:3000',
  language: 'zh',
  includeMemo: true
};

export async function ensureDefaults() {
  const stored = await chrome.storage.sync.get(null);
  const updates = {};
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (!(key in stored)) {
      updates[key] = value;
    }
  }
  if (Object.keys(updates).length > 0) {
    await chrome.storage.sync.set(updates);
  }
}

export async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings) {
  await chrome.storage.sync.set(settings);
}

export function subscribeSettings(callback) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      callback(changes);
    }
  });
}
