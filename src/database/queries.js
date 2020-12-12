const path = require('path');
const { QueryFile } = require('pg-promise');

const sql = file => {
  const fullPath = path.join(__dirname, file);
  return new QueryFile(fullPath, { minify: true });
};

module.exports = {
  resetSchema: sql('schema.sql'),
};
