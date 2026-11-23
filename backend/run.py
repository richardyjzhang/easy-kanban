"""启动入口：在 backend 目录下执行 `python run.py`。

数据库需要部署者手动执行 schema.sql 初始化；本入口只校验库结构，
不会执行任何 DDL。
"""

from __future__ import annotations

import os
import sys

from app import create_app
from config import ConfigError
from db import SchemaError


def main() -> None:
    """创建应用并启动 HTTP 服务；配置或结构有问题时直接退出。"""
    try:
        app = create_app()
    except (ConfigError, SchemaError) as exc:
        print(f"启动失败：{exc}", file=sys.stderr)
        raise SystemExit(1)

    host = os.environ.get("EASY_KANBAN_HOST", "127.0.0.1")
    port = int(os.environ.get("EASY_KANBAN_PORT", "5003"))
    debug = os.environ.get("EASY_KANBAN_DEBUG") == "1"
    app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    main()
