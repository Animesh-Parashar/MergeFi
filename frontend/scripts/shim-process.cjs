// shim-process.cjs
//
// CommonJS version of the shim that ensures
// node_modules/process/browser/browser.js exists so Vite/Rollup
// won't fail on imports like "process/browser/browser".
//
// This file uses CommonJS so __dirname is defined even when
// the project uses "type": "module" in package.json.

const { existsSync, mkdirSync, writeFileSync } = require('fs');
const { join, dirname } = require('path');

const shimPath = join(__dirname, '..', 'node_modules', 'process', 'browser', 'browser.js');
const shimDir = dirname(shimPath);

try {
  if (!existsSync(shimPath)) {
    mkdirSync(shimDir, { recursive: true });
    const content = "module.exports = require('../browser.js');\n";
    writeFileSync(shimPath, content, { encoding: 'utf8' });
    console.log('[shim-process] created', shimPath);
  } else {
    console.log('[shim-process] already exists:', shimPath);
  }
} catch (err) {
  console.error('[shim-process] error creating shim:', err && err.message ? err.message : err);
  // Do not fail install/build; just warn.
}
