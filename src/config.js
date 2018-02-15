const path = require('path');

const config = (filename) => {
  const configPath = path.join(__dirname, '..', 'config', filename);
  const cfg = require(configPath);
  return cfg;
};

module.exports = config;
