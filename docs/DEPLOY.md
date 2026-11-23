# easy-kanban 部署方案

> 版本：v0.1（草稿）· 日期：2026-11-23 · 配套 [PRD.md](PRD.md)、[DATA-API.md](DATA-API.md)

---

## 1. 部署形态

| 项 | 值 |
|---|---|
| 访问路径 | `/easy-kanban/`（子路径） |
| 前端路由 | hash 模式，地址形如 `/easy-kanban/#/pc`、`/easy-kanban/#/m` |
| 后端端口 | `127.0.0.1:5003`，只监听本机 |
| Python 环境 | 自备（miniconda），本文不涉及 |
| 进程管理 | systemd |

hash 路由的好处：刷新任何子页面都不需要服务端做回退，Nginx 只负责把 `/easy-kanban/` 指向静态目录。

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
    alias /path/to/easy-kanban/web/dist/;
}
```

`proxy_pass` 结尾的 `/api/` 会把 `/easy-kanban` 前缀替换掉，后端只看到 `/api/**`。

## 3. systemd

下面的路径是示例（`/srv/easy-kanban`），换成你的实际位置；`ExecStart` 指向 conda 环境里的 gunicorn。

```ini
[Unit]
Description=easy-kanban
After=network.target

[Service]
Type=simple
User=<运行用户>
WorkingDirectory=/srv/easy-kanban/server
EnvironmentFile=/srv/easy-kanban/.env
Environment=TZ=Asia/Shanghai
ExecStart=/srv/miniconda3/envs/easy-kanban/bin/gunicorn \
    --workers 1 \
    --threads 4 \
    --bind 127.0.0.1:5003 \
    --access-logfile - \
    --error-logfile - \
    wsgi:app
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

两点说明：

- **只能 1 个 worker**：SQLite 的写锁是文件级的，多进程并发写会互相等锁。
- **首次启动**自动建表、写入内置的「待分配」人员；`users` 为空时按环境变量创建账号。
- `TZ` 不要漏：数据库里的时间戳存的是服务器本地时间，漏了会整体偏移。
