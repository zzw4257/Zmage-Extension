import { getSettings } from './lib/settings.js';
import { t } from './lib/i18n.js';

let language = 'en';
let baseUrl = 'http://localhost:3000';
let imageId = null;

const refs = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  refs.status = document.getElementById('status');
  refs.title = document.getElementById('title');
  refs.previewSection = document.getElementById('previewSection');
  refs.preview = document.getElementById('preview');
  refs.download = document.getElementById('download');
  refs.openLibrary = document.getElementById('openLibrary');

  const params = new URLSearchParams(window.location.search);
  imageId = params.get('imageId');
  if (!imageId) {
    setStatus('Missing imageId', true);
    return;
  }

  const settings = await getSettings();
  language = settings.language || 'en';
  baseUrl = (settings.baseUrl || baseUrl).replace(/\/$/, '');
  applyTranslations();

  refs.openLibrary.addEventListener('click', () => {
    openLibrary();
  });

  await runRemoveBackground();
}

function applyTranslations() {
  document.title = `${t(language, 'removeBg')} | Zmage`;
  refs.title.textContent = t(language, 'removeBg');
  refs.download.textContent = t(language, 'download');
  refs.openLibrary.textContent = t(language, 'viewLibrary');
}

async function runRemoveBackground() {
  setStatus(t(language, 'processing'));
  try {
    const response = await fetch(`${baseUrl}/api/create/remove-bg`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageId })
    });
    if (response.status === 401) {
      setStatus(t(language, 'loginRequired'), true);
      chrome.runtime.sendMessage({ type: 'open-login' });
      return;
    }
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Request failed');
    }
    const payload = await response.json();
    if (!payload?.imageDataUrl) {
      throw new Error('No image data returned');
    }
    showPreview(payload.imageDataUrl);
    setStatus('');
  } catch (error) {
    console.error('Remove background failed', error);
    setStatus(`${t(language, 'connectionFailed')}: ${error.message}`, true);
  }
}

function showPreview(dataUrl) {
  refs.preview.src = dataUrl;
  refs.download.href = dataUrl;
  refs.previewSection.classList.remove('hidden');
}

function openLibrary() {
  const url = `${baseUrl}/library/images/${encodeURIComponent(imageId)}`;
  chrome.tabs.create({ url, active: true });
}

function setStatus(message, isError = false) {
  refs.status.textContent = message;
  refs.status.classList.toggle('error', Boolean(isError));
}
