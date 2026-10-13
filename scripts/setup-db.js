const fs = require('node:fs/promises');
const path = require('node:path');
const sql = require('mssql');
const { createPoolConfig } = require('../src/db');
const config = require('../src/config');

function splitBatches(sqlText) {
  return sqlText
    .split(/^\s*GO\s*;?\s*$/gim)
    .map((batch) => batch.trim())
    .filter(Boolean);
}

async function run() {
  const schemaPath = path.join(config.rootDir, 'database', 'schema.sql');
  const schemaText = await fs.readFile(schemaPath, 'utf8');
  const batches = splitBatches(schemaText);
  const createDatabaseBatch = batches.find((batch) => /CREATE DATABASE/i.test(batch));

  if (!createDatabaseBatch) throw new Error('schema.sql 缺少数据库创建语句');

  const masterPool = await new sql.ConnectionPool(createPoolConfig({
    database: 'master',
    pool: { max: 1, min: 0, idleTimeoutMillis: 5_000 },
  })).connect();
  await masterPool.request().batch(createDatabaseBatch);
  await masterPool.close();

  const databasePool = await new sql.ConnectionPool(createPoolConfig()).connect();
  for (const batch of batches) {
    if (/CREATE DATABASE/i.test(batch) || /^USE\s+/i.test(batch)) continue;
    await databasePool.request().batch(batch);
  }
  await databasePool.close();

  console.log(`数据库 ${config.db.database} 初始化完成`);
}

run().catch((error) => {
  console.error('数据库初始化失败：', error.message);
  process.exitCode = 1;
});
