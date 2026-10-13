# Qwen Code Project Notes

This repository implements the book-borrowing backend assignment with Express and SQL Server.

## Commands

- Install dependencies: `npm install`
- Initialize database: `npm run db:setup`
- Start application: `npm start`
- Run regression tests: `npm test`

## Development Rules

- Keep the five-row pagination and descending `creationTime` ordering.
- Keep form validation on both the browser and server.
- Read book types from `book_type`; never hard-code the select options.
- Preserve `createdBy` and `creationTime` during updates.
- Add or update regression tests for behavioral changes.
- Do not commit `.env` or `node_modules`.
