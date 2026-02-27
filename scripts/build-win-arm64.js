'use strict';

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const certPath = path.join(root, 'win-cert.pfx');
const certPathBuild = path.join(root, 'build', 'win-cert.pfx');
const cert = fs.existsSync(certPath) ? certPath : fs.existsSync(certPathBuild) ? certPathBuild : null;
if (cert && process.env.CSC_KEY_PASSWORD) {
  process.env.CSC_LINK = cert;
  console.log('Using self-signed cert for code signing:', cert);
}

const now = new Date();
const buildId = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
  String(now.getHours()).padStart(2, '0'),
  String(now.getMinutes()).padStart(2, '0'),
  String(now.getSeconds()).padStart(2, '0'),
].join('');

process.env.BUILD_ID = buildId;
console.log('Build ID:', buildId);

execSync('node scripts/copy-jsbarcode.js', { cwd: root, stdio: 'inherit' });
execSync('npx electron-builder --win --arm64 --config electron-builder.config.js', {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
