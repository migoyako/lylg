function createMemoryBookRepository(seedBooks = [], seedTypes = [
  { id: 1, typeName: '小说' },
  { id: 2, typeName: '文学' },
  { id: 3, typeName: '传记' },
  { id: 4, typeName: '艺术' },
  { id: 5, typeName: '少儿' },
  { id: 6, typeName: '经济' },
  { id: 7, typeName: '管理' },
  { id: 8, typeName: '科技' },
]) {
  let nextId = Math.max(0, ...seedBooks.map((book) => book.bookId)) + 1;
  const books = seedBooks.map((book) => ({ ...book }));
  const types = seedTypes.map((type) => ({ ...type }));

  function withType(book) {
    return {
      ...book,
      typeName: types.find((type) => type.id === Number(book.bookType))?.typeName || '',
    };
  }

  return {
    async list({ name = '', page = 1, pageSize = 5 }) {
      const filtered = books
        .filter((book) => book.bookName.includes(name))
        .sort((left, right) => new Date(right.creationTime) - new Date(left.creationTime));
      const offset = (page - 1) * pageSize;
      return {
        items: filtered.slice(offset, offset + pageSize).map(withType),
        total: filtered.length,
      };
    },

    async getById(bookId) {
      const book = books.find((candidate) => candidate.bookId === Number(bookId));
      return book ? withType(book) : null;
    },

    async getTypes() {
      return types.map((type) => ({ ...type }));
    },

    async create(book) {
      const bookId = nextId;
      nextId += 1;
      books.push({ ...book, bookId, lastUpdatetime: null });
      return bookId;
    },

    async update(bookId, book) {
      const index = books.findIndex((candidate) => candidate.bookId === Number(bookId));
      if (index === -1) return false;
      books[index] = {
        ...books[index],
        ...book,
        bookId: Number(bookId),
        lastUpdatetime: new Date(),
      };
      return true;
    },

    async remove(bookId) {
      const index = books.findIndex((candidate) => candidate.bookId === Number(bookId));
      if (index === -1) return false;
      books.splice(index, 1);
      return true;
    },
  };
}

module.exports = { createMemoryBookRepository };
