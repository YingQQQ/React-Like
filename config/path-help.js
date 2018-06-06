const { join, resolve } = require('path');

const hotPort = process.env.PORT || 8001;
const PATHS = {
  app: join(__dirname, '../', 'src'),
  build: join(__dirname, '../', 'dist'),
  favicon: join(__dirname, '../', 'apple-icon-60x60.png'),
  postcss: resolve(__dirname, '../', 'config', 'postcss.config'),
  recordsPath: join(__dirname, '../', 'records.json')
};

module.exports = {
  hotPort,
  PATHS
};
