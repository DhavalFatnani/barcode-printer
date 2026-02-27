'use strict';

const path = require('path');
const pkg = require('./package.json');

// When BUILD_ID is set (e.g. by scripts/build-win.js), append to version so each build
// produces distinct artifacts in dist/ (e.g. 1.0.0.20250224143022) and doesn't overwrite previous builds.
const buildId = process.env.BUILD_ID;
const version = buildId ? `${pkg.version}.${buildId}` : pkg.version;

module.exports = {
  ...pkg.build,
  // Build only; do not publish (avoids GH_TOKEN requirement when CI is detected)
  publish: null,
  extraMetadata: {
    ...pkg.build.extraMetadata,
    version,
  },
};
