const { sql, getPool } = require('../db');

function likePattern(value) {
  const escaped = String(value || '').replace(/[\\%_\[]/g, (character) => `\\${character}`);
  return `%${escaped}%`;
}

function mapBook(row) {
  return {
    bookId: row.bookId,
    bookCode: row.bookCode,
    bookName: row.bookName,
    bookType: row.bookType,
    typeName: row.typeName,
    bookAuthor: row.bookAuthor,
    publishPress: row.publishPress,
    publishDate: row.publishDate,
    borrowed: row.borrowed,
    createdBy: row.createdBy,
    creationTime: row.creationTime,
    lastUpdatetime: row.lastUpdatetime,
  };
}

const bookProjection = `
  SELECT bi.bookId, bi.bookCode, bi.bookName, bi.bookType, bt.typeName,
         bi.bookAuthor, bi.publishPress, bi.publishDate, bi.borrowed,
         bi.createdBy, bi.creationTime, bi.lastUpdatetime
  FROM dbo.book_info AS bi
  INNER JOIN dbo.book_type AS bt ON bt.id = bi.bookType
`;

function createSqlBookRepository() {
  return {
    async list({ name = '', page = 1, pageSize = 5 }) {
      const pool = await getPool();
      const offset = (page - 1) * pageSize;
      const namePattern = likePattern(name);

      const countResult = await pool.request()
        .input('namePattern', sql.NVarChar(200), namePattern)
        .query(`
          SELECT COUNT_BIG(1) AS total
          FROM dbo.book_info AS bi
          WHERE (@namePattern = N'%%' OR bi.bookName LIKE @namePattern ESCAPE '\\')
        `);

      const result = await pool.request()
        .input('namePattern', sql.NVarChar(200), namePattern)
        .input('offset', sql.Int, offset)
        .input('pageSize', sql.Int, pageSize)
        .query(`
          ${bookProjection}
          WHERE (@namePattern = N'%%' OR bi.bookName LIKE @namePattern ESCAPE '\\')
          ORDER BY bi.creationTime DESC, bi.bookId DESC
          OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
        `);

      return {
        items: result.recordset.map(mapBook),
        total: Number(countResult.recordset[0].total),
      };
    },

    async getById(bookId) {
      const pool = await getPool();
      const result = await pool.request()
        .input('bookId', sql.Int, bookId)
        .query(`${bookProjection} WHERE bi.bookId = @bookId`);
      return result.recordset[0] ? mapBook(result.recordset[0]) : null;
    },

    async getTypes() {
      const pool = await getPool();
      const result = await pool.request().query(`
        SELECT id, typeName
        FROM dbo.book_type
        ORDER BY id ASC
      `);
      return result.recordset;
    },

    async create(book) {
      const pool = await getPool();
      const result = await pool.request()
        .input('bookCode', sql.NVarChar(30), book.bookCode)
        .input('bookName', sql.NVarChar(100), book.bookName)
        .input('bookType', sql.Int, book.bookType)
        .input('bookAuthor', sql.NVarChar(100), book.bookAuthor)
        .input('publishPress', sql.NVarChar(100), book.publishPress)
        .input('publishDate', sql.Date, book.publishDate)
        .input('borrowed', sql.TinyInt, book.borrowed)
        .input('createdBy', sql.NVarChar(50), book.createdBy)
        .input('creationTime', sql.DateTime2, book.creationTime)
        .query(`
          INSERT INTO dbo.book_info
            (bookCode, bookName, bookType, bookAuthor, publishPress, publishDate,
             borrowed, createdBy, creationTime, lastUpdatetime)
          OUTPUT INSERTED.bookId
          VALUES
            (@bookCode, @bookName, @bookType, @bookAuthor, @publishPress, @publishDate,
             @borrowed, @createdBy, @creationTime, NULL)
        `);
      return result.recordset[0].bookId;
    },

    async update(bookId, book) {
      const pool = await getPool();
      const result = await pool.request()
        .input('bookId', sql.Int, bookId)
        .input('bookCode', sql.NVarChar(30), book.bookCode)
        .input('bookName', sql.NVarChar(100), book.bookName)
        .input('bookType', sql.Int, book.bookType)
        .input('bookAuthor', sql.NVarChar(100), book.bookAuthor)
        .input('publishPress', sql.NVarChar(100), book.publishPress)
        .input('publishDate', sql.Date, book.publishDate)
        .input('borrowed', sql.TinyInt, book.borrowed)
        .query(`
          UPDATE dbo.book_info
          SET bookCode = @bookCode,
              bookName = @bookName,
              bookType = @bookType,
              bookAuthor = @bookAuthor,
              publishPress = @publishPress,
              publishDate = @publishDate,
              borrowed = @borrowed,
              lastUpdatetime = SYSDATETIME()
          WHERE bookId = @bookId
        `);
      return result.rowsAffected[0] === 1;
    },

    async remove(bookId) {
      const pool = await getPool();
      const result = await pool.request()
        .input('bookId', sql.Int, bookId)
        .query('DELETE FROM dbo.book_info WHERE bookId = @bookId');
      return result.rowsAffected[0] === 1;
    },
  };
}

module.exports = { createSqlBookRepository };
