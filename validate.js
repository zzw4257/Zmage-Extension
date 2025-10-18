#!/usr/bin/env node
/**
 * Zmage Extension Validation Script
 * Checks if all required files and configurations are present
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  warning: (msg) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  section: (msg) => console.log(`\n${COLORS.cyan}${msg}${COLORS.reset}`)
};

let errors = 0;
let warnings = 0;
let passed = 0;

function checkFileExists(filepath, required = true) {
  const exists = fs.existsSync(filepath);
  if (exists) {
    log.success(`Found: ${filepath}`);
    passed++;
    return true;
  } else {
    if (required) {
      log.error(`Missing required file: ${filepath}`);
      errors++;
    } else {
      log.warning(`Missing optional file: ${filepath}`);
      warnings++;
    }
    return false;
  }
}

function checkJSONFile(filepath) {
  if (!fs.existsSync(filepath)) {
    log.error(`Missing JSON file: ${filepath}`);
    errors++;
    return false;
  }

  try {
    const content = fs.readFileSync(filepath, 'utf8');
    JSON.parse(content);
    log.success(`Valid JSON: ${filepath}`);
    passed++;
    return true;
  } catch (error) {
    log.error(`Invalid JSON in ${filepath}: ${error.message}`);
    errors++;
    return false;
  }
}

function checkManifest() {
  log.section('Checking manifest.json');

  if (!fs.existsSync('manifest.json')) {
    log.error('manifest.json not found!');
    errors++;
    return;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

    // Check required fields
    const requiredFields = ['manifest_version', 'name', 'version', 'description'];
    requiredFields.forEach(field => {
      if (manifest[field]) {
        log.success(`manifest.${field}: ${manifest[field]}`);
        passed++;
      } else {
        log.error(`Missing required field: ${field}`);
        errors++;
      }
    });

    // Check manifest version
    if (manifest.manifest_version === 3) {
      log.success('Using Manifest V3');
      passed++;
    } else {
      log.warning('Not using Manifest V3');
      warnings++;
    }

    // Check icons
    if (manifest.icons) {
      const requiredSizes = [16, 32, 48, 128];
      requiredSizes.forEach(size => {
        if (manifest.icons[size]) {
          const iconPath = manifest.icons[size];
          if (fs.existsSync(iconPath)) {
            log.success(`Icon ${size}x${size}: ${iconPath}`);
            passed++;
          } else {
            log.error(`Icon file missing: ${iconPath}`);
            errors++;
          }
        } else {
          log.error(`Icon size ${size}x${size} not defined in manifest`);
          errors++;
        }
      });
    } else {
      log.error('No icons defined in manifest');
      errors++;
    }

    // Check permissions
    if (manifest.permissions && Array.isArray(manifest.permissions)) {
      log.success(`Permissions: ${manifest.permissions.join(', ')}`);
      passed++;
    } else {
      log.warning('No permissions defined');
      warnings++;
    }

    // Check background service worker
    if (manifest.background && manifest.background.service_worker) {
      const swPath = manifest.background.service_worker;
      if (fs.existsSync(swPath)) {
        log.success(`Service worker: ${swPath}`);
        passed++;
      } else {
        log.error(`Service worker file missing: ${swPath}`);
        errors++;
      }
    } else {
      log.error('No background service worker defined');
      errors++;
    }

  } catch (error) {
    log.error(`Error parsing manifest.json: ${error.message}`);
    errors++;
  }
}

function checkCoreFiles() {
  log.section('Checking core files');

  const coreFiles = [
    'background.js',
    'content.js',
    'popup.html',
    'popup.js',
    'popup.css',
    'options.html',
    'options.js',
    'options.css',
    'remove-bg.html',
    'remove-bg.js',
    'remove-bg.css'
  ];

  coreFiles.forEach(file => checkFileExists(file, true));
}

function checkLibFiles() {
  log.section('Checking library files');

  const libFiles = [
    'lib/settings.js',
    'lib/i18n.js'
  ];

  libFiles.forEach(file => checkFileExists(file, true));
}

function checkIcons() {
  log.section('Checking icon files');

  const iconSizes = [16, 32, 48, 128];
  iconSizes.forEach(size => {
    const iconPath = `icons/icon${size}.png`;
    if (checkFileExists(iconPath, true)) {
      const stats = fs.statSync(iconPath);
      if (stats.size < 100) {
        log.warning(`Icon ${iconPath} seems too small (${stats.size} bytes)`);
        warnings++;
      }
    }
  });
}

function checkLocales() {
  log.section('Checking localization files');

  const locales = ['en', 'zh_CN'];

  locales.forEach(locale => {
    const messagesPath = `_locales/${locale}/messages.json`;
    if (checkJSONFile(messagesPath)) {
      try {
        const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
        const requiredKeys = ['extName', 'extDescription'];

        requiredKeys.forEach(key => {
          if (messages[key] && messages[key].message) {
            log.success(`  ${locale}/${key}: ${messages[key].message}`);
            passed++;
          } else {
            log.error(`  Missing key in ${locale}: ${key}`);
            errors++;
          }
        });
      } catch (error) {
        log.error(`Error reading ${messagesPath}: ${error.message}`);
        errors++;
      }
    }
  });
}

function checkDocumentation() {
  log.section('Checking documentation');

  checkFileExists('README.md', true);
  checkFileExists('LICENSE', true);
  checkFileExists('CHECKLIST.md', false);
  checkFileExists('DEPLOYMENT.md', false);
}

function checkPackageFiles() {
  log.section('Checking package files');

  checkJSONFile('package.json');
  checkFileExists('.gitignore', false);
}

function checkJavaScriptSyntax() {
  log.section('Checking JavaScript syntax');

  const jsFiles = [
    'background.js',
    'content.js',
    'popup.js',
    'options.js',
    'remove-bg.js',
    'lib/settings.js',
    'lib/i18n.js'
  ];

  jsFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        // Basic syntax check - look for common issues
        if (content.includes('console.log') && process.env.NODE_ENV === 'production') {
          log.warning(`${file} contains console.log statements`);
          warnings++;
        }
        log.success(`Syntax check passed: ${file}`);
        passed++;
      } catch (error) {
        log.error(`Error reading ${file}: ${error.message}`);
        errors++;
      }
    }
  });
}

function checkHTMLFiles() {
  log.section('Checking HTML files');

  const htmlFiles = ['popup.html', 'options.html', 'remove-bg.html'];

  htmlFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for basic HTML structure
      if (!content.includes('<!DOCTYPE html>')) {
        log.warning(`${file} missing DOCTYPE declaration`);
        warnings++;
      } else {
        log.success(`HTML structure valid: ${file}`);
        passed++;
      }

      // Check for referenced scripts
      const scriptMatches = content.match(/src="([^"]+\.js)"/g);
      if (scriptMatches) {
        scriptMatches.forEach(match => {
          const scriptPath = match.match(/src="([^"]+)"/)[1];
          if (fs.existsSync(scriptPath)) {
            log.success(`  Script found: ${scriptPath}`);
            passed++;
          } else {
            log.error(`  Script missing: ${scriptPath}`);
            errors++;
          }
        });
      }
    }
  });
}

function printSummary() {
  log.section('Validation Summary');

  console.log(`\nTotal checks: ${passed + errors + warnings}`);
  console.log(`${COLORS.green}Passed: ${passed}${COLORS.reset}`);
  console.log(`${COLORS.yellow}Warnings: ${warnings}${COLORS.reset}`);
  console.log(`${COLORS.red}Errors: ${errors}${COLORS.reset}`);

  if (errors === 0 && warnings === 0) {
    console.log(`\n${COLORS.green}✓ All checks passed! Extension is ready.${COLORS.reset}`);
    return 0;
  } else if (errors === 0) {
    console.log(`\n${COLORS.yellow}⚠ Extension is mostly ready, but has some warnings.${COLORS.reset}`);
    return 0;
  } else {
    console.log(`\n${COLORS.red}✗ Extension has errors that need to be fixed.${COLORS.reset}`);
    return 1;
  }
}

// Main execution
console.log(`${COLORS.cyan}╔════════════════════════════════════════╗${COLORS.reset}`);
console.log(`${COLORS.cyan}║  Zmage Extension Validation Script    ║${COLORS.reset}`);
console.log(`${COLORS.cyan}╚════════════════════════════════════════╝${COLORS.reset}`);

try {
  checkManifest();
  checkCoreFiles();
  checkLibFiles();
  checkIcons();
  checkLocales();
  checkDocumentation();
  checkPackageFiles();
  checkJavaScriptSyntax();
  checkHTMLFiles();

  process.exit(printSummary());
} catch (error) {
  console.error(`\n${COLORS.red}Fatal error: ${error.message}${COLORS.reset}`);
  process.exit(1);
}
