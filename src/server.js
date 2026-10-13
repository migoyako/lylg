const config = require('./config');
const { createApp } = require('./app');
const { createSqlBookRepository } = require('./repositories/sqlBookRepository');
const { closePool } = require('./db');

const app = createApp(createSqlBookRepository());
const server = app.listen(config.port, () => {
  console.log(`图书借阅系统后台管理已启动：http://localhost:${config.port}`);
});

async function shutdown() {
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
