const path = require('node:path');
require('ts-node').register({
  project: path.join(__dirname, '..', 'tsconfig.json'),
  compilerOptions: { module: 'CommonJS', moduleResolution: 'Node10' }
});
require('tsconfig-paths').register({
  baseUrl: path.join(__dirname, '..'),
  paths: { '@/*': ['src/*'] }
});
