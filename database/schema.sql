IF DB_ID(N'BookBackendManage') IS NULL
BEGIN
  CREATE DATABASE BookBackendManage;
END;
GO

USE BookBackendManage;
GO

IF OBJECT_ID(N'dbo.book_info', N'U') IS NOT NULL DROP TABLE dbo.book_info;
IF OBJECT_ID(N'dbo.book_type', N'U') IS NOT NULL DROP TABLE dbo.book_type;
GO

CREATE TABLE dbo.book_type (
  id INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_book_type PRIMARY KEY,
  typeName NVARCHAR(50) NOT NULL
);
GO

CREATE TABLE dbo.book_info (
  bookId INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_book_info PRIMARY KEY,
  bookCode NVARCHAR(30) NOT NULL CONSTRAINT UQ_book_info_code UNIQUE,
  bookName NVARCHAR(100) NOT NULL,
  bookType INT NOT NULL,
  bookAuthor NVARCHAR(100) NOT NULL CONSTRAINT DF_book_info_author DEFAULT(N''),
  publishPress NVARCHAR(100) NOT NULL CONSTRAINT DF_book_info_press DEFAULT(N''),
  publishDate DATE NOT NULL,
  borrowed TINYINT NOT NULL CONSTRAINT DF_book_info_borrowed DEFAULT(0),
  createdBy NVARCHAR(50) NOT NULL,
  creationTime DATETIME2(0) NOT NULL,
  lastUpdatetime DATETIME2(0) NULL,
  CONSTRAINT FK_book_info_book_type FOREIGN KEY (bookType) REFERENCES dbo.book_type(id),
  CONSTRAINT CK_book_info_borrowed CHECK (borrowed IN (0, 1))
);
GO

CREATE INDEX IX_book_info_creationTime ON dbo.book_info(creationTime DESC);
CREATE INDEX IX_book_info_bookName ON dbo.book_info(bookName);
GO

INSERT INTO dbo.book_type (typeName) VALUES
  (N'小说'),
  (N'文学'),
  (N'传记'),
  (N'艺术'),
  (N'少儿'),
  (N'经济'),
  (N'管理'),
  (N'科技');
GO

INSERT INTO dbo.book_info
  (bookCode, bookName, bookType, bookAuthor, publishPress, publishDate, borrowed, createdBy, creationTime, lastUpdatetime)
VALUES
  (N'BK000023', N'企业应用架构模式', 8, N'（英）Martin Fowler', N'机械工业出版社', '2004-06-01', 0, N'系统管理员', '2014-07-03 10:20:00', NULL),
  (N'BK000024', N'精通Hibernate', 8, N'刘洋', N'电子工业出版社', '2005-04-01', 1, N'系统管理员', '2014-05-03 09:15:00', NULL),
  (N'BK000025', N'天龙八部', 1, N'金庸', N'中原出版社', '2003-09-01', 0, N'系统管理员', '2014-03-12 15:30:00', NULL),
  (N'BK000026', N'寻找家园', 4, N'高尔泰', N'北京十月文艺出版社', '2011-04-01', 0, N'系统管理员', '2014-03-01 11:45:00', NULL),
  (N'BK000027', N'小猫莫格成长系列', 5, N'（英）朱迪斯·克尔', N'接力出版社', '2013-01-01', 1, N'系统管理员', '2014-01-01 08:30:00', NULL),
  (N'BK000028', N'现代文学导读', 2, N'陈思和', N'复旦大学出版社', '2012-08-01', 0, N'系统管理员', '2013-12-20 14:10:00', NULL),
  (N'BK000029', N'乔布斯传', 3, N'沃尔特·艾萨克森', N'中信出版社', '2011-10-24', 1, N'系统管理员', '2013-11-15 16:20:00', NULL),
  (N'BK000030', N'经济学原理', 6, N'曼昆', N'北京大学出版社', '2009-05-01', 0, N'系统管理员', '2013-10-05 10:00:00', NULL),
  (N'BK000031', N'卓有成效的管理者', 7, N'彼得·德鲁克', N'机械工业出版社', '2009-09-01', 0, N'系统管理员', '2013-09-12 13:40:00', NULL),
  (N'BK000032', N'深入理解计算机系统', 8, N'Randal E. Bryant', N'机械工业出版社', '2011-01-01', 1, N'系统管理员', '2013-08-18 09:05:00', NULL);
GO
