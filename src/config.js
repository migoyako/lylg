const path = require('node:path');
require('dotenv').config();

function toBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const trustedConnection = toBoolean(process.env.DB_TRUSTED, true);

module.exports = {
  port: Number.parseInt(process.env.PORT || '3000', 10),
  rootDir: path.resolve(__dirname, '..'),
  db: {
    server: process.env.DB_SERVER || 'localhost',
    port: Number.parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_DATABASE || 'BookBackendManage',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    trustedConnection,
    options: {
      encrypt: toBoolean(process.env.DB_ENCRYPT, false),
      trustServerCertificate: toBoolean(process.env.DB_TRUST_SERVER_CERTIFICATE, true),
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30_000,
    },
  },
};
