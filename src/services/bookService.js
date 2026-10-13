const PAGE_SIZE = 5;

class ValidationError extends Error {
  constructor(errors) {
    super('图书信息校验失败');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

function toPositiveInt(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function validateBookPayload(payload) {
  const normalized = {
    bookCode: normalizeText(payload.bookCode),
    bookName: normalizeText(payload.bookName),
    bookType: toPositiveInt(payload.bookType, 0),
    bookAuthor: normalizeText(payload.bookAuthor),
    publishPress: normalizeText(payload.publishPress),
    borrowed: String(payload.borrowed) === '1' ? 1 : 0,
    createdBy: normalizeText(payload.createdBy) || '系统管理员',
    creationTime: parseDateTime(payload.creationTime) || new Date(),
  };

  const errors = {};
  if (!normalized.bookCode) errors.bookCode = '请输入图书编号';
  if (!normalized.bookName) errors.bookName = '请输入图书名称';
  if (!normalized.bookType) errors.bookType = '请选择图书类型';
  if (!['0', '1'].includes(String(payload.borrowed))) errors.borrowed = '请选择是否借阅';
  if (!normalized.createdBy) errors.createdBy = '请输入入库人';

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  return normalized;
}

function createBookService(repository) {
  return {
    async list(rawQuery = {}) {
      const name = normalizeText(rawQuery.name);
      const requestedPage = toPositiveInt(rawQuery.page, 1);
      let page = requestedPage;
      let result = await repository.list({ name, page, pageSize: PAGE_SIZE });
      const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

      if (page > totalPages) {
        page = totalPages;
        result = await repository.list({ name, page, pageSize: PAGE_SIZE });
      }

      return {
        items: result.items,
        total: result.total,
        page,
        pageSize: PAGE_SIZE,
        totalPages,
        name,
      };
    },

    async get(bookId) {
      const parsedId = toPositiveInt(bookId, 0);
      return parsedId ? repository.getById(parsedId) : null;
    },

    getTypes() {
      return repository.getTypes();
    },

    async create(payload) {
      const book = validateBookPayload(payload);
      book.publishDate = book.creationTime;
      return repository.create(book);
    },

    async update(bookId, payload) {
      const parsedId = toPositiveInt(bookId, 0);
      if (!parsedId) return false;

      const existing = await repository.getById(parsedId);
      if (!existing) return false;

      const book = validateBookPayload({
        ...payload,
        createdBy: existing.createdBy,
        creationTime: existing.creationTime,
      });
      book.publishDate = payload.publishDate || existing.publishDate || book.creationTime;
      return repository.update(parsedId, book);
    },

    remove(bookId) {
      const parsedId = toPositiveInt(bookId, 0);
      return parsedId ? repository.remove(parsedId) : Promise.resolve(false);
    },
  };
}

module.exports = {
  PAGE_SIZE,
  ValidationError,
  createBookService,
  validateBookPayload,
};
