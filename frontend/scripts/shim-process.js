/**
 * shim-process.js
 *
 * Ensures node_modules/process/browser/browser.js exists so Vite/Rollup
 * won't fail on imports like "process/browser/browser".
 *
 * This creates a tiny shim that re-exports ../browser.js if missing.
 */

const fs = require('fs');
const path = require('path');

const shimPath = path.join(__dirname, '..', 'node_modules', 'process', 'browser', 'browser.js');
const shimDir = path.dirname(shimPath);

try {
  if (!fs.existsSync(shimPath)) {
    fs.mkdirSync(shimDir, { recursive: true });
    const content = "module.exports = require('../browser.js');\n";
    fs.writeFileSync(shimPath, content, { encoding: 'utf8' });
    console.log('[shim-process] created', shimPath);
  } else {
    console.log('[shim-process] already exists:', shimPath);
  }
} catch (err) {
  console.error('[shim-process] error creating shim:', err && err.message ? err.message : err);
  // Do not fail install/build; just warn.
}