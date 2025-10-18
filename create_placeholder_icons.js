#!/usr/bin/env node
/**
 * Create placeholder icon files for Chrome Extension
 * This creates simple base64-encoded PNG placeholder icons
 */

const fs = require('fs');
const path = require('path');

// Simple 1x1 pixel PNG with blue color (#4A90E2) in base64
// We'll create actual sized placeholder PNGs
const ICON_SIZES = [16, 32, 48, 128];
const ICON_DIR = 'icons';

// Base64 encoded minimal PNG files with blue background and white "Z"
// These are pre-generated minimal PNGs
const ICONS_BASE64 = {
  16: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZklEQVQ4T2NkYGD4z0AEYGJgYmD8z8TAxMDMwMLAysDKwMbAzsDOwMHAycDFwM3Aw8DLwMfAz8DPIMAgyMDPIMggyiDKIMYgziDBIMEgySDBIMUgzSDDIMsgySDNIMsgzyAvwAkAvdMGwf8MKqcAAAAASUVORK5CYII=',
  32: 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAmUlEQVRYR+2WMQ7AIAwD7///dIbOLFWGDtABGVAEclIkFhR7HMexGzAzM7MCVVU1oKra1VXdQES0E5F2EBFtRKQdRES7iGgnIu0iIu0iIu0iIu0iIl1EpItIdBGRLiLSRSS6iEQXkegiEl1EoouIdBGJLiLRRUS6iER3Ielee+217kJE+hAi0odI9CES3Yeoex91H6LufYi6z2b2AFc5Vyfp7g1gAAAAAElFTkSuQmCC',
  48: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAxklEQVRoQ+2YwQ3AIAwD8///dJgYukwMXaaGLlPUKhISlDgQPlLi82E7BmPMYWYFqqoaoKrqhapqD0Ske0Skh0B6CCL9CKKPINKHIPqIQB8R6CMifUSgj4j0EYE+ItJHBPqIQB8R6SMCfUSgjwj0EYE+ItBHBPqIQB8R6CMCfUSgjwj0EYE+ItBHBPqISN8i0rdI9C0SfYtE3yLRt0j0LRJ9i0TfItK3ien7xvR9J+k7Rt0xkY5RpGMU6RhFOkaRjlGkYxTpZ2Z2AI5rXzDzhGSsAAAAAElFTkSuQmCC',
  128: 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAC/klEQVR4Xu2cMU7DQBBFbZQOiQ5xAW4AEhKnQOIenIAOiRZxA64QCQkJiVNwA+QCdHRItCl4otVotXa84/F4vf5PikL8Z+b9XTu249lut9sFH6QCnKQf0gcBIAEkQAKFAvyfB0gLpSVSAYwKYOQBadFUSAswKoCRB6RFUyGtwA2TQFqQdgVQAaWCdCtAC9KuAOwK0IK0K4AKKBWgXQFakHYFYFeAFqRdAVRAqQDtCtCCtCsAuwK0IO0KoAJKBWhXgBakXQHYFaAFaVcAFVAqQLsCtCDtCsCuAC1IuwKogFIB2hWgBWlXAHYFaEHaFUAFlArQrgAtSLsCsCtAC9KuACqgVIB2BWhB2hWAXQFakHYFUAGlArQrQAvSrgDsCtCCtCuACigVoF0BWpB2BWBXgBakXQFUQKkA7QrQgrQrALsCtCDtCqACSgVoV4AWpF0B2BWgBWlXABVQKkC7ArQg7QrArgAtSLsCqIBSAdoVoAVpVwB2BWhB2hVABZQK0K4ALUi7ArArQAvSrgAqoFSAdgVoQdoVgF0BWpB2BVABpQK0K0AL0q4A7ArQgrQrgAooFaBdAVqQdgVgV4AWpF0BVECpAO0K0IK0KwC7ArQg7QqgAkoFaFeAFqRdAdgVoAVpVwAVUCpAuwK0IO0KwK4ALUi7AqiAUgHaFaAFaVcAdgVoQdoVQAWUCtCuAC1IuwKwK0AL0q4AKqBUgHYFaEHaFYBdAVqQdgVQAaUCtCtAC9KuAOwK0IK0K4AKKBWgXQFakHYFYFeAFqRdAVRAqQDtCtCCtCsAuwK0IO0KoAJKBWhXgBakXQHYFaAFaVcAFVAqQLsCtCDtCsCuAC1IuwKogFIB2hWgBWlXAHYFaEHaFUAFlArQrgAtSLsCsCtAC9KuACqgVIB2BWhB2hWAXQFakHYFUAGlArQrQAvSrgDsCtCCtCuACigVoF0BWpB2BWBXgBakXQFUQKkA7QrQgrQrALsCtCDtCqACSgVoV4AWpF0BnivwBXKjkYo3XqSXAAAAAElFTkSuQmCC'
};

function createPlaceholderIcons() {
  // Ensure icons directory exists
  if (!fs.existsSync(ICON_DIR)) {
    fs.mkdirSync(ICON_DIR, { recursive: true });
  }

  console.log('Creating placeholder icons...\n');

  ICON_SIZES.forEach(size => {
    const filename = `icon${size}.png`;
    const filepath = path.join(ICON_DIR, filename);

    // Create a simple colored square PNG as placeholder
    // Using a minimal valid PNG structure
    const buffer = Buffer.from(ICONS_BASE64[size], 'base64');

    fs.writeFileSync(filepath, buffer);
    console.log(`✓ Created ${filepath}`);
  });

  console.log('\n✓ All placeholder icons created successfully!');
  console.log('\nNote: These are simple placeholder icons.');
  console.log('Replace them with your actual icon designs before publishing.');
  console.log('\nRecommended tools for creating icons:');
  console.log('  - Figma (https://figma.com)');
  console.log('  - Adobe Illustrator');
  console.log('  - Inkscape (free)');
  console.log('  - Online: https://realfavicongenerator.net/');
}

// Run the function
try {
  createPlaceholderIcons();
} catch (error) {
  console.error('Error creating icons:', error);
  process.exit(1);
}
