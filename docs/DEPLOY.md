# easy-kanban 部署方案

> 版本：v0.1（草稿）· 日期：2026-11-23 · 配套 [PRD.md](PRD.md)、[DATA-API.md](DATA-API.md)

---

## 1. 部署形态

| 项 | 值 |
|---|---|
| 访问路径 | `/easy-kanban/`（子路径） |
| 前端路由 | hash 模式，地址形如 `/easy-kanban/#/pc`、`/easy-kanban/#/m` |
| 后端入口 | `python run.py`（Flask 自带服务器），默认 `127.0.0.1:5003` |
| Python 环境 | 自备（miniconda），本文不涉及 |
| 进程管理 | systemd |

hash 路由的好处：刷新任何子页面都不需要服务端做回退，Nginx 只负责把 `/easy-kanban/` 指向静态目录。

单用户自部署场景不引入 gunicorn 等额外进程管理器，直接用 `run.py` 启动即可；写操作已经用 SQLite 事务串行化。

## 2. Nginx

只需要两段：前端的 alias、后端的 proxy_pass。不区分静态资源，不配缓存与回退。

```nginx
location /easy-kanban/api/ {
    proxy_pass http://127.0.0.1:5003/api/;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /easy-kanban/ {
    alias /path/to/easy-kanban/frontend/dist/;
}
```

`proxy_pass` 结尾的 `/api/` 会把 `/easy-kanban` 前缀替换掉，后端只看到 `/api/**`。

## 3. 首次初始化数据库

应用启动**不会**执行建表或改表；结构对不上会直接报错退出。首次部署手动执行 `schema.sql`：

```bash
cd /srv/easy-kanban/backend
mkdir -p data
sqlite3 data/easy-kanban.db < schema.sql
```

（如果 `EASY_KANBAN_DB` 指向别处，请对那个文件执行。）

建表后启动应用：启动只会补齐内置的「待分配」人员，并在 `users` 为空时按 `.env` 创建账号，不会修改任何表结构。之后若修改 `schema.sql`，需要自己写迁移并更新数据。

## 4. systemd

下面的路径是示例（`/srv/easy-kanban`），换成你的实际位置；`ExecStart` 指向 conda 环境里的 python。

```ini
[Unit]
Description=easy-kanban
After=network.target

[Service]
Type=simple
User=<运行用户>
WorkingDirectory=/srv/easy-kanban/backend
EnvironmentFile=/srv/easy-kanban/.env
Environment=TZ=Asia/Shanghai
ExecStart=/srv/miniconda3/envs/easy-kanban/bin/python run.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now easy-kanban
sudo journalctl -u easy-kanban -f
```

三点说明：

- **只能 1 个进程**：SQLite 的写锁是文件级的，多进程并发写会互相等锁；`run.py` 单进程启动正好符合。
- **启动只校验结构**：库结构与 `schema.sql` 不一致时，`run.py` 会打印差异并退出，不会修改任何 DDL。
- `TZ` 不要漏：数据库里的时间戳存的是服务器本地时间，漏了会整体偏移。
