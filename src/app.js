const express = require('express');
const path = require('node:path');
const config = require('./config');
const { createBookService } = require('./services/bookService');
const { createBooksRouter } = require('./routes/books');

function createApp(repository) {
  if (!repository) throw new Error('createApp 需要图书数据仓库');

  const app = express();
  const bookService = createBookService(repository);

  app.set('view engine', 'ejs');
  app.set('views', path.join(config.rootDir, 'views'));
  app.locals.formatDate = (value) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Shanghai',
    }).format(date).replaceAll('/', '-');
  };
  app.locals.formatDateTimeInput = (value) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const parts = new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Shanghai',
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
  };

  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(config.rootDir, 'public')));
  app.use('/books', createBooksRouter(bookService));
  app.get('/', (_request, response) => response.redirect('/books'));

  app.use((_request, response) => {
    response.status(404).render('error', {
      title: '页面不存在',
      message: '请求的页面不存在。',
    });
  });

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).render('error', {
      title: '系统错误',
      message: '系统处理请求时发生错误，请稍后重试。',
    });
  });

  return app;
}

module.exports = { createApp };
