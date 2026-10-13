const sql = require('mssql');
const config = require('./config');

let poolPromise;

function createPoolConfig(overrides = {}) {
  const { trustedConnection, user, password, ...base } = config.db;
  const dbConfig = {
    ...base,
    ...overrides,
    options: {
      ...base.options,
      ...(overrides.options || {}),
    },
    pool: {
      ...base.pool,
      ...(overrides.pool || {}),
    },
  };

  if (!trustedConnection) {
    dbConfig.user = user;
    dbConfig.password = password;
  }

  return dbConfig;
}

async function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(createPoolConfig()).connect();
  }

  try {
    return await poolPromise;
  } catch (error) {
    poolPromise = undefined;
    throw error;
  }
}

async function closePool() {
  if (!poolPromise) return;
  const pool = await poolPromise;
  poolPromise = undefined;
  await pool.close();
}

module.exports = {
  sql,
  createPoolConfig,
  getPool,
  closePool,
};
