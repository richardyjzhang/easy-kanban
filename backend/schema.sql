-- easy-kanban 数据库结构（与 docs/DATA-API.md 保持一致）。
-- 由部署者手动执行（例如 sqlite3 data/easy-kanban.db < schema.sql）。
-- 应用启动只校验结构，不会执行任何 DDL；不一致会直接报错。
-- SQLite 只做数据存储：不建外键、不写 CHECK，业务约束由服务层保证。

CREATE TABLE IF NOT EXISTS people (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  color       TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL,
  archived_at TEXT    NULL,                 -- 'YYYY-MM-DD HH:MM:SS'
  is_system   INTEGER NOT NULL DEFAULT 0,   -- 1 = 内置的「待分配」
  created_at  TEXT    NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_people_name_active ON people(name) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_people_sort ON people(sort_order);

CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  color       TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL,
  archived_at TEXT    NULL,
  created_at  TEXT    NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_projects_name_active ON projects(name) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_projects_sort ON projects(sort_order);

CREATE TABLE IF NOT EXISTS tasks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  person_id  INTEGER NOT NULL,              -- 系统人员的 id 表示待分配
  project_id INTEGER NOT NULL,
  start_date TEXT    NULL,                  -- 'YYYY-MM-DD'，可为空
  end_date   TEXT    NULL,                  -- 'YYYY-MM-DD'，可为空
  status     TEXT    NOT NULL DEFAULT 'todo',
  note       TEXT    NOT NULL DEFAULT '',
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_tasks_cell ON tasks(person_id, project_id);
CREATE INDEX IF NOT EXISTS ix_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS ix_tasks_dates ON tasks(start_date, end_date);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  username      TEXT    NOT NULL,
  password_hash TEXT    NOT NULL,
  token_version INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL
);
