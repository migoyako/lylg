# 图书借阅系统后台管理

依据《2016年10月学士后Java毕业考试机试试卷-2.pdf》的程序效果实现。项目位于课程目录的 `.venv/QUIZ`。

## 技术栈

- 开发工具：Qwen Code
- 页面与服务端：Express + EJS
- 数据库：SQL Server
- 测试：Node.js Test Runner + Supertest
- CI：GitHub Actions

## 功能

- 图书列表按入库时间倒序排列，每页 5 条
- 按图书名称模糊查询，并保留查询条件和分页状态
- 查看只读的图书详细信息
- 新增和修改图书，图书类型来自 `book_type` 表
- 修改时锁定入库人与入库时间
- 删除前确认，并在操作后显示成功或失败提示
- 服务端校验与浏览器端必填项校验

## 本地运行

1. 安装依赖：

   ```powershell
   npm install
   ```

2. 复制 `.env.example` 为 `.env`，按本机 SQL Server 配置调整连接信息。

3. 初始化数据库：

   ```powershell
   npm run db:setup
   ```

4. 启动应用：

   ```powershell
   npm start
   ```

5. 访问 `http://localhost:3000`。

## 测试

```powershell
npm test
```

测试使用内存数据仓库验证 HTTP 页面与业务行为，不需要连接 SQL Server。数据库脚本位于 `database/schema.sql`。

## 数据库

`database/schema.sql` 会创建：

- `book_type`：8 种图书类型，含 8 条测试数据
- `book_info`：图书信息，含 10 条测试数据

重复执行 `npm run db:setup` 会重建两张业务表，请勿对生产数据库直接执行。

## 开发流程

- 前端和后端任务分别通过 GitHub Issue 模板登记。
- 功能开发在独立分支进行，通过 Pull Request 合并到 `main`。
- `.github/workflows/ci.yml` 在推送和 PR 时运行回归测试。
