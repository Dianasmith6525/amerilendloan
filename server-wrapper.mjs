#!/usr/bin/env node
/**
 * Server wrapper to ensure process stays alive
 */

import './server/_core/index.ts' assert { type: 'module' };

// Keep process alive indefinitely
process.stdin.resume();
setInterval(() => {}, 1000);
