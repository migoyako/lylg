const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');
const { createMemoryBookRepository } = require('./memoryBookRepository');

const seedBooks = [
  {
    bookId: 1,
    bookCode: 'BK000001',
    bookName: '软件工程',
    bookType: 8,
    bookAuthor: '作者甲',
    publishPress: '科技出版社',
    publishDate: new Date('2020-01-01'),
    borrowed: 0,
    createdBy: '系统管理员',
    creationTime: new Date('2024-04-15T02:00:00Z'),
    lastUpdatetime: null,
  },
  {
    bookId: 2,
    bookCode: 'BK000002',
    bookName: '小说选',
    bookType: 1,
    bookAuthor: '作者乙',
    publishPress: '文学出版社',
    publishDate: new Date('2021-02-01'),
    borrowed: 1,
    createdBy: '系统管理员',
    creationTime: new Date('2024-04-14T02:00:00Z'),
    lastUpdatetime: null,
  },
  {
    bookId: 3,
    bookCode: 'BK000003',
    bookName: '计算机基础',
    bookType: 8,
    bookAuthor: '作者丙',
    publishPress: '教育出版社',
    publishDate: new Date('2019-03-01'),
    borrowed: 0,
    createdBy: '系统管理员',
    creationTime: new Date('2024-04-13T02:00:00Z'),
    lastUpdatetime: null,
  },
  {
    bookId: 4,
    bookCode: 'BK000004',
    bookName: '文学史',
    bookType: 2,
    bookAuthor: '作者丁',
    publishPress: '文学出版社',
    publishDate: new Date('2018-04-01'),
    borrowed: 0,
    createdBy: '系统管理员',
    creationTime: new Date('2024-04-12T02:00:00Z'),
    lastUpdatetime: null,
  },
  {
    bookId: 5,
    bookCode: 'BK000005',
    bookName: '艺术概论',
    bookType: 4,
    bookAuthor: '作者戊',
    publishPress: '艺术出版社',
    publishDate: new Date('2017-05-01'),
    borrowed: 1,
    createdBy: '系统管理员',
    creationTime: new Date('2024-04-11T02:00:00Z'),
    lastUpdatetime: null,
  },
  {
    bookId: 6,
    bookCode: 'BK000006',
    bookName: '经济学',
    bookType: 6,
    bookAuthor: '作者己',
    publishPress: '经济出版社',
    publishDate: new Date('2016-06-01'),
    borrowed: 0,
    createdBy: '系统管理员',
    creationTime: new Date('2024-04-10T02:00:00Z'),
    lastUpdatetime: null,
  },
];

test('图书列表默认显示五个条目的第一页', async () => {
  const app = createApp(createMemoryBookRepository(seedBooks));
  const response = await request(app).get('/books').expect(200);

  assert.match(response.text, /图书借阅系统-后台管理/);
  assert.match(response.text, /软件工程/);
  assert.match(response.text, /艺术概论/);
  assert.doesNotMatch(response.text, /经济学/);
  assert.match(response.text, /共 6 条，第 1 \/ 2 页/);
});

test('按名称模糊查询并保留查询条件', async () => {
  const app = createApp(createMemoryBookRepository(seedBooks));
  const response = await request(app).get('/books').query({ name: '计算机' }).expect(200);

  assert.match(response.text, /value="计算机"/);
  assert.match(response.text, /计算机基础/);
  assert.doesNotMatch(response.text, /软件工程/);
});

test('查看页面显示完整且只读的图书信息', async () => {
  const app = createApp(createMemoryBookRepository(seedBooks));
  const response = await request(app).get('/books/1').query({ returnTo: '/books?name=软件&page=1' }).expect(200);

  assert.match(response.text, /查看图书信息/);
  assert.match(response.text, /BK000001/);
  assert.match(response.text, /系统管理员/);
  assert.doesNotMatch(response.text, /<form/);
  assert.match(response.text, /href="\/books\?name=软件&amp;page=1"/);
});

test('新增表单校验必填项，并在成功后写入数据', async () => {
  const repository = createMemoryBookRepository(seedBooks);
  const app = createApp(repository);

  const invalid = await request(app)
    .post('/books')
    .type('form')
    .send({ bookCode: '', bookName: '', bookType: '', borrowed: '0', createdBy: '系统管理员' })
    .expect(422);
  assert.match(invalid.text, /请输入图书编号/);
  assert.match(invalid.text, /请输入图书名称/);

  const valid = await request(app)
    .post('/books')
    .type('form')
    .send({
      bookCode: 'BK000010',
      bookName: '新图书',
      bookType: '1',
      bookAuthor: '新作者',
      publishPress: '新出版社',
      borrowed: '0',
      createdBy: '系统管理员',
      creationTime: '2024-05-01T10:00',
    })
    .expect(302);
  assert.equal(valid.headers.location, '/books?notice=create-success');

  const created = await repository.getById(7);
  assert.equal(created.bookName, '新图书');
  assert.equal(created.publishDate.getFullYear(), 2024);
});

test('修改时保留入库人和入库时间', async () => {
  const repository = createMemoryBookRepository(seedBooks);
  const original = await repository.getById(1);
  const app = createApp(repository);

  await request(app)
    .post('/books/1')
    .type('form')
    .send({
      bookCode: 'BK000001-X',
      bookName: '软件工程（第2版）',
      bookType: '8',
      bookAuthor: '新作者',
      publishPress: '科技出版社',
      borrowed: '1',
      createdBy: '试图篡改',
      creationTime: '2099-01-01T00:00',
    })
    .expect(302);

  const updated = await repository.getById(1);
  assert.equal(updated.bookName, '软件工程（第2版）');
  assert.equal(updated.createdBy, original.createdBy);
  assert.equal(updated.creationTime.getTime(), original.creationTime.getTime());
  assert.equal(updated.borrowed, 1);
});

test('删除前页面提供确认信息，删除后显示结果提示', async () => {
  const repository = createMemoryBookRepository(seedBooks);
  const app = createApp(repository);

  const list = await request(app).get('/books').expect(200);
  assert.match(list.text, /data-confirm="确定删除该图书信息？"/);

  const deleted = await request(app).post('/books/1/delete').type('form').send({ returnTo: '/books' }).expect(302);
  assert.match(deleted.headers.location, /notice=delete-success/);
  assert.equal(await repository.getById(1), null);

  const notice = await request(app).get(deleted.headers.location).expect(200);
  assert.match(notice.text, /删除成功！/);
});
