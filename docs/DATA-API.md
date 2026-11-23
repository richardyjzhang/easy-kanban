# easy-kanban 数据模型与 API 契约

> 版本：v0.1（草稿）· 日期：2026-11-23 · 配套 [PRD.md](PRD.md)

---

## 1. 数据库

SQLite，只做数据存储：**不建外键、不写 CHECK**。唯一性交给唯一索引保证，其余业务约束由服务层在事务内处理。
时间戳统一为 `YYYY-MM-DD HH:MM:SS`（服务器本地时间，如 `2026-11-23 10:51:35`）；业务日期为 `YYYY-MM-DD`。

```sql
CREATE TABLE people (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  color       TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL,
  archived_at TEXT    NULL,                 -- 'YYYY-MM-DD HH:MM:SS'
  is_system   INTEGER NOT NULL DEFAULT 0,   -- 1 = 内置的「待分配」
  created_at  TEXT    NOT NULL
);

CREATE UNIQUE INDEX ux_people_name_active ON people(name) WHERE archived_at IS NULL;
CREATE INDEX ix_people_sort ON people(sort_order);

CREATE TABLE projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  color       TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL,
  archived_at TEXT    NULL,
  created_at  TEXT    NOT NULL
);

CREATE UNIQUE INDEX ux_projects_name_active ON projects(name) WHERE archived_at IS NULL;
CREATE INDEX ix_projects_sort ON projects(sort_order);

CREATE TABLE tasks (
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

CREATE INDEX ix_tasks_cell ON tasks(person_id, project_id);
CREATE INDEX ix_tasks_project ON tasks(project_id);
CREATE INDEX ix_tasks_dates ON tasks(start_date, end_date);

CREATE TABLE users (
  id            INTEGER PRIMARY KEY,
  username      TEXT    NOT NULL,
  password_hash TEXT    NOT NULL,
  token_version INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL
);
```

设计说明：

- `people` 中有一行内置人员 `name = '待分配'`、`is_system = 1`、`sort_order = 0`。所有任务都挂在某个人员名下，未指派即挂在它名下。
- 唯一索引只在**未归档范围内**生效（`WHERE archived_at IS NULL`），归档后名称可被复用；恢复时若撞名，服务层捕获索引冲突并返回 409。
- 其余索引只用于查询性能，不承担约束职责。
- 数据库没有外键，不会替我们级联；删除人员／项目前由服务层先统计名下任务，有任务就拒绝删除。
- `users` 固定只有一行，由服务层保证。
- 应用启动只校验库结构与 `schema.sql` 是否一致，**不会执行任何 DDL**；不一致会直接报错退出。首次部署需手动执行 `schema.sql` 建库，结构变更需手动迁移。

**服务层需要保证的约束**（数据库一概不管）：

| 约束 | 处理方式 |
|---|---|
| 人员姓名、项目名称在未归档范围内唯一 | 唯一索引兜底，服务层捕获冲突返回 409 |
| 任务的人员、项目必须存在且未归档 | 写入前校验 |
| 日期两两关系：都为非空时 `start_date ≤ end_date` | 写入前校验 |
| `status` 取值合法 | 白名单校验 |
| `is_system` 行不可改名、归档、删除 | 入口处拦截，返回 409 |
| 人员／项目名下无任务时才允许删除 | 删除前统计，有任务返回 409 |
| 单账号 | 启动时检查行数，多于一行拒绝启动 |

## 2. 字段规则

| 字段 | 规则 |
|---|---|
| `name` | 去首尾空格后 1–30 字；未归档范围内唯一 |
| `project.name` | 去首尾空格后 1–50 字；未归档范围内唯一 |
| `color` | 必须是色板之一：`#5B8FF9 #61DDAA #65789B #F6BD16 #7262FD #78D3F8 #9661BC #F6903D` |
| `title` | 去首尾空格后 1–120 字 |
| `note` / `description` | ≤ 500 字，纯文本 |
| `start_date` / `end_date` | `YYYY-MM-DD` 或 `null`；两者都非空时要求 `start_date ≤ end_date` |
| `status` | `todo` 未开始 / `doing` 进行中 / `blocked` 阻塞 / `done` 已完成 |
| `sort_order` | 整数，越大越靠后；新建取当前最大值 +10，为后续插入留空隙 |
| `is_system` | 仅内置「待分配」为 1；只读，不接受客户端修改 |
| `created_at` / `updated_at` / `archived_at` | `YYYY-MM-DD HH:MM:SS`，服务端生成，不接受客户端写入 |

## 3. API 约定

- **前缀**：服务端只认 `/api/**`。部署在 `/easy-kanban/` 时由 Nginx 剥掉前缀转发。
- **鉴权**：除登录外全部要求 `Authorization: Bearer <token>`。
- **Token**：`itsdangerous` 签名的 JSON，载荷 `{sub: "1", ver: <token_version>, iat}`，有效期 7 天；每次请求校验 `ver` 与库中一致。
- **格式**：请求与响应均为 JSON，UTF-8。
- **写操作一律全量 PUT**：请求体包含该资源的全部可编辑字段，服务端整体覆盖，不接受部分字段更新。前端持有完整对象，改一个字段也整体回传。
- **成功响应**：直接返回资源对象，不包裹多余信封。
- **错误响应**：`{ "error": { "code": "NAME_CONFLICT", "message": "项目名已存在" } }`，配合语义化 HTTP 状态码。
- **并发**：不做乐观锁，后写覆盖先写（单用户场景可接受）。

错误码对照：

| HTTP | code | 场景 |
|---|---|---|
| 400 | `VALIDATION_FAILED` | 字段校验失败，`details` 给出字段级原因 |
| 401 | `UNAUTHORIZED` | 无 token／签名无效／版本过期 |
| 404 | `NOT_FOUND` | 资源不存在 |
| 409 | `NAME_CONFLICT` | 名称重复 |
| 409 | `HAS_ACTIVE_TASKS` | 存在未完成任务，拒绝归档 |
| 409 | `HAS_TASKS` | 名下仍有任务，拒绝删除 |
| 409 | `ARCHIVED` | 目标已归档，操作不可用 |
| 409 | `SYSTEM_ROW` | 试图修改／归档／删除内置的「待分配」人员 |
| 500 | `INTERNAL_ERROR` | 未预期错误 |

## 4. 接口清单

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/login` | 登录，返回 token |
| POST | `/api/auth/password` | 修改密码（校验旧密码） |
| GET | `/api/state` | 一次性拉取全量人员、项目、任务 |
| POST | `/api/people` | 新建人员 |
| PUT | `/api/people/{id}` | 全量更新姓名／颜色（`is_system=1` 返回 409） |
| POST | `/api/people/{id}/archive` | 归档（`is_system=1` 返回 409） |
| POST | `/api/people/{id}/restore` | 恢复 |
| DELETE | `/api/people/{id}` | 仅当名下无任务时删除；有任务返回 409；`is_system=1` 返回 409 |
| PUT | `/api/people/order` | 批量保存人员顺序（不含 `is_system` 行） |
| POST | `/api/projects` | 新建项目 |
| PUT | `/api/projects/{id}` | 全量更新名称／颜色／描述 |
| POST | `/api/projects/{id}/archive` | 归档 |
| POST | `/api/projects/{id}/restore` | 恢复 |
| DELETE | `/api/projects/{id}?confirm_name={name}` | 仅当项目下无任务时删除；有任务返回 409 |
| PUT | `/api/projects/order` | 批量保存项目顺序 |
| POST | `/api/tasks` | 新建任务 |
| PUT | `/api/tasks/{id}` | 全量更新任务（含状态、人员、项目） |
| DELETE | `/api/tasks/{id}` | 删除任务 |

### 4.1 登录

```
POST /api/auth/login
{ "username": "manager", "password": "******" }

200 { "token": "...", "expires_in": 604800 }
401 UNAUTHORIZED
```

不做失败次数统计，输错直接返回 401，不锁定账号。

### 4.2 全量状态

```
GET /api/state

200 {
  "people": [
    { "id": 1, "name": "待分配", "color": "#8C8C8C", "sort_order": 0,
      "archived_at": null, "is_system": true, "created_at": "2026-11-20 09:00:00" },
    { "id": 2, "name": "张三", "color": "#5B8FF9", "sort_order": 10,
      "archived_at": null, "is_system": false, "created_at": "2026-11-20 09:05:00" }
  ],
  "projects": [
    { "id": 1, "name": "支付重构", "color": "#F6BD16", "description": "",
      "sort_order": 10, "archived_at": null, "created_at": "2026-11-20 09:01:00" }
  ],
  "tasks": [
    { "id": 9, "title": "接口拆分", "person_id": 2, "project_id": 1,
      "start_date": "2026-11-20", "end_date": "2026-11-26",
      "status": "doing", "note": "",
      "created_at": "2026-11-20 09:10:00", "updated_at": "2026-11-23 10:51:35" }
  ]
}
```

- 返回**包含已归档**的人员与项目，前端自行过滤矩阵；设置页要用归档数据。
- 任务全量返回（上限 2000 条），矩阵按 `(person_id, project_id)` 前端分组；切周、转置、拖拽均不再请求。
- 系统人员随人员列表一起返回，前端据 `is_system` 渲染为不可操作的第一行。
- 响应加 `Cache-Control: no-store`，避免 WebView 缓存脏数据。

### 4.3 新建／全量更新任务

```
POST /api/tasks
{
  "title": "接口拆分",
  "person_id": 2,
  "project_id": 1,
  "start_date": "2026-11-20",
  "end_date": "2026-11-26",
  "status": "todo",
  "note": ""
}

201 { ...完整任务对象... }
```

```
PUT /api/tasks/9
{
  "title": "接口拆分",
  "person_id": 1,          // 改成系统人员 = 退回待分配
  "project_id": 1,
  "start_date": "2026-11-20",
  "end_date": "2026-11-26",
  "status": "doing",
  "note": "等前端联调"
}

200 { ...完整任务对象，updated_at 已刷新... }
```

- 七个可编辑字段必须全部出现，缺任何一个返回 400；`note` 允许空字符串。
- `start_date`、`end_date` 可传 `null`，表示还没定；两者都非空时才校验先后顺序。
- 状态切换同样走全量 PUT：前端把任务对象整体回传，只改 `status`。
- 服务端忽略或拒绝客户端提交的 `id`、`created_at`、`updated_at`。
- 校验失败返回 400，`details` 形如 `{ "end_date": "不能早于开始日期" }`。

### 4.4 归档与恢复

```
POST /api/projects/1/archive

200 { "id": 1, "archived_at": "2026-11-23 10:51:35" }
409 { "error": { "code": "HAS_ACTIVE_TASKS", "message": "该项目还有 3 条未完成任务" },
      "active_task_count": 3 }
```

- 未完成任务 = `status != 'done'`。
- 恢复时若名称与在册条目冲突，返回 409 `NAME_CONFLICT`，提示先改名。
- 对 `is_system = 1` 的「待分配」调用归档／恢复，一律返回 409 `SYSTEM_ROW`。

### 4.5 顺序

```
PUT /api/people/order
{ "ids": [2, 3] }

200 { "updated": 2 }
```

- `ids` 必须恰好等于**当前未归档、且 `is_system = 0`** 的人员集合，否则 400；服务端按数组下标重写 `sort_order`（步长 10），系统人员始终保持 `sort_order = 0`。
- 项目同理（项目没有系统行）。

### 4.6 删除

```
DELETE /api/projects/1?confirm_name=支付重构
204 No Content

DELETE /api/projects/1?confirm_name=支付重构
409 { "error": { "code": "HAS_TASKS", "message": "该项目下还有 5 条任务，请先删除任务或改用归档" },
      "task_count": 5 }

DELETE /api/people/3
204 No Content
```

- 删除前统计名下任务；只要存在任何任务（含已完成）即拒绝，返回 409 `HAS_TASKS`，提示改用归档。
- 项目还需 `confirm_name` 与库中名称一致，否则返回 400。
- 删除只删这一条记录，不触碰任务；要清理整个项目请先删任务，或直接归档。
- 对 `is_system = 1` 的人员调用删除，返回 409 `SYSTEM_ROW`。

## 5. 前端类型

```ts
export type TaskStatus = 'todo' | 'doing' | 'blocked' | 'done'

export interface Person {
  id: number
  name: string
  color: string
  sort_order: number
  archived_at: string | null   // 'YYYY-MM-DD HH:MM:SS'
  is_system: boolean
  created_at: string
}

export interface Project {
  id: number
  name: string
  color: string
  description: string
  sort_order: number
  archived_at: string | null
  created_at: string
}

export interface Task {
  id: number
  title: string
  person_id: number        // 系统人员的 id 表示待分配
  project_id: number
  start_date: string | null  // 'YYYY-MM-DD'
  end_date: string | null
  status: TaskStatus
  note: string
  created_at: string
  updated_at: string
}

export interface AppState {
  people: Person[]
  projects: Project[]
  tasks: Task[]
}
```
