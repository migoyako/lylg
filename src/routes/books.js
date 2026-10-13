const express = require('express');
const { ValidationError } = require('../services/bookService');

const noticeMessages = {
  'create-success': { type: 'success', text: '新增成功！' },
  'create-error': { type: 'error', text: '新增失败！' },
  'update-success': { type: 'success', text: '修改成功！' },
  'update-error': { type: 'error', text: '修改失败！' },
  'delete-success': { type: 'success', text: '删除成功！' },
  'delete-error': { type: 'error', text: '删除失败！' },
};

function asyncHandler(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

function safeReturnTo(value) {
  const candidate = String(value || '');
  return candidate.startsWith('/books') && !candidate.startsWith('//') ? candidate : '/books';
}

function withNotice(returnTo, notice) {
  const separator = returnTo.includes('?') ? '&' : '?';
  return `${returnTo}${separator}notice=${notice}`;
}

function formValues(book = {}) {
  return {
    bookCode: book.bookCode || '',
    bookName: book.bookName || '',
    bookType: book.bookType || '',
    bookAuthor: book.bookAuthor || '',
    publishPress: book.publishPress || '',
    borrowed: String(book.borrowed ?? 0),
    createdBy: book.createdBy || '系统管理员',
    creationTime: book.creationTime || new Date(),
  };
}

function friendlyError(error) {
  if (error instanceof ValidationError) return error;
  if (error?.number === 2627 || error?.number === 2601) {
    return new ValidationError({ bookCode: '该图书编号已存在，请更换后重试' });
  }
  return error;
}

function renderForm(response, options) {
  return response.status(options.status || 200).render('books/form', {
    title: options.mode === 'create' ? '新增图书信息' : '修改图书信息',
    mode: options.mode,
    types: options.types,
    values: options.values,
    errors: options.errors || {},
    notice: options.notice || null,
    returnTo: options.returnTo,
    bookId: options.bookId || null,
  });
}

function createBooksRouter(bookService) {
  const router = express.Router();

  router.get('/', asyncHandler(async (request, response) => {
    const result = await bookService.list(request.query);
    const encodedName = encodeURIComponent(result.name);
    const notice = noticeMessages[request.query.notice] || null;
    response.render('books/index', {
      title: '图书借阅系统-后台管理',
      ...result,
      queryString: `name=${encodedName}`,
      editReturnTo: `/books?name=${encodedName}&page=${result.page}`,
      notice,
    });
  }));

  router.get('/new', asyncHandler(async (request, response) => {
    const types = await bookService.getTypes();
    const returnTo = safeReturnTo(request.query.returnTo);
    renderForm(response, {
      mode: 'create',
      types,
      values: formValues(),
      errors: {},
      returnTo,
    });
  }));

  router.post('/', asyncHandler(async (request, response) => {
    const returnTo = safeReturnTo(request.body.returnTo);
    try {
      await bookService.create(request.body);
      response.redirect(withNotice(returnTo, 'create-success'));
    } catch (error) {
      const friendly = friendlyError(error);
      if (!(friendly instanceof ValidationError)) throw friendly;
      const types = await bookService.getTypes();
      return renderForm(response, {
        mode: 'create',
        types,
        values: formValues(request.body),
        errors: friendly.errors,
        notice: noticeMessages['create-error'],
        returnTo,
        status: 422,
      });
    }
  }));

  router.get('/:id/edit', asyncHandler(async (request, response) => {
    const book = await bookService.get(request.params.id);
    if (!book) return response.status(404).render('error', { title: '图书不存在', message: '指定的图书信息不存在。' });
    const types = await bookService.getTypes();
    const returnTo = safeReturnTo(request.query.returnTo);
    return renderForm(response, {
      mode: 'edit',
      types,
      values: formValues(book),
      errors: {},
      returnTo,
      bookId: book.bookId,
    });
  }));

  router.post('/:id', asyncHandler(async (request, response) => {
    const returnTo = safeReturnTo(request.body.returnTo);
    try {
      const updated = await bookService.update(request.params.id, request.body);
      response.redirect(withNotice(returnTo, `update-${updated ? 'success' : 'error'}`));
    } catch (error) {
      const friendly = friendlyError(error);
      if (!(friendly instanceof ValidationError)) throw friendly;
      const book = await bookService.get(request.params.id);
      if (!book) return response.status(404).render('error', { title: '图书不存在', message: '指定的图书信息不存在。' });
      const types = await bookService.getTypes();
      return renderForm(response, {
        mode: 'edit',
        types,
        values: { ...formValues(book), ...formValues(request.body) },
        errors: friendly.errors,
        notice: noticeMessages['update-error'],
        returnTo,
        bookId: book.bookId,
        status: 422,
      });
    }
  }));

  router.post('/:id/delete', asyncHandler(async (request, response) => {
    const deleted = await bookService.remove(request.params.id);
    const returnTo = safeReturnTo(request.body.returnTo);
    response.redirect(withNotice(returnTo, `delete-${deleted ? 'success' : 'error'}`));
  }));

  router.get('/:id', asyncHandler(async (request, response) => {
    const book = await bookService.get(request.params.id);
    if (!book) return response.status(404).render('error', { title: '图书不存在', message: '指定的图书信息不存在。' });
    return response.render('books/show', {
      title: '查看图书信息',
      book,
      returnTo: safeReturnTo(request.query.returnTo),
    });
  }));

  return router;
}

module.exports = { createBooksRouter, safeReturnTo };
