import { getSettings, saveSettings } from './lib/settings.js';
import { t } from './lib/i18n.js';

let language = 'en';

const refs = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  refs.form = document.getElementById('settingsForm');
  refs.baseUrl = document.getElementById('baseUrl');
  refs.language = document.getElementById('language');
  refs.includeMemo = document.getElementById('includeMemo');
  refs.status = document.getElementById('status');
  refs.title = document.getElementById('title');
  refs.baseUrlText = document.getElementById('baseUrlText');
  refs.languageText = document.getElementById('languageText');
  refs.memoText = document.getElementById('memoText');
  refs.saveButton = document.getElementById('saveButton');
  refs.testButton = document.getElementById('testButton');

  const settings = await getSettings();
  language = settings.language || 'en';
  refs.baseUrl.value = settings.baseUrl || 'http://localhost:3000';
  refs.language.value = language;
  refs.includeMemo.checked = settings.includeMemo !== false;

  applyTranslations();

  refs.form.addEventListener('submit', onSubmit);
  refs.language.addEventListener('change', onLanguageChange);
  refs.testButton.addEventListener('click', onTestConnection);
}

function applyTranslations() {
  refs.title.textContent = t(language, 'optionsTitle');
  refs.baseUrlText.textContent = t(language, 'baseUrlLabel');
  refs.languageText.textContent = t(language, 'languageLabel');
  refs.memoText.textContent = t(language, 'privacyLabel');
  refs.saveButton.textContent = t(language, 'save');
  refs.testButton.textContent = t(language, 'testConnection');
  const zhOption = refs.language.querySelector('option[value="zh"]');
  const enOption = refs.language.querySelector('option[value="en"]');
  if (zhOption) zhOption.textContent = t(language, 'languageChinese');
  if (enOption) enOption.textContent = t(language, 'languageEnglish');
}

async function onSubmit(event) {
  event.preventDefault();
  const baseUrl = refs.baseUrl.value.trim() || 'http://localhost:3000';
  const includeMemo = refs.includeMemo.checked;
  language = refs.language.value || 'en';
  await saveSettings({ baseUrl, includeMemo, language });
  showStatus(t(language, 'settingsSaved'), true);
}

function onLanguageChange(event) {
  language = event.target.value || 'en';
  applyTranslations();
}

async function onTestConnection() {
  const baseUrl = refs.baseUrl.value.trim().replace(/\/$/, '') || 'http://localhost:3000';
  showStatus('…', false);
  try {
    const response = await fetch(`${baseUrl}/api/images?limit=1`, {
      credentials: 'include'
    });
    if (response.status === 401) {
      showStatus(t(language, 'loginRequired'), false, true);
      return;
    }
    if (!response.ok) {
      showStatus(t(language, 'connectionFailed'), false, true);
      return;
    }
    showStatus(t(language, 'connectionOk'), true);
  } catch (error) {
    console.error('Connection test failed', error);
    showStatus(t(language, 'connectionFailed'), false, true);
  }
}

function showStatus(message, success, isError = false) {
  refs.status.textContent = message;
  refs.status.classList.remove('success', 'error');
  if (success) {
    refs.status.classList.add('success');
  } else if (isError) {
    refs.status.classList.add('error');
  }
}
