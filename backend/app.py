"""Flask 应用工厂：读取配置、校验数据库、注册蓝图与错误处理。"""

from __future__ import annotations

from flask import Flask, request

import db
from config import load_config
from errors import register_error_handlers
from routes import register_routes


def create_app(overrides: dict | None = None) -> Flask:
    """创建 Flask 应用；可传入 overrides 覆盖环境配置。"""
    app = Flask(__name__)
    app.config.update(load_config())
    if overrides:
        app.config.update(overrides)

    # 中文直接输出，字段顺序按我们构造的顺序返回，便于阅读和调试。
    app.json.ensure_ascii = False
    app.json.sort_keys = False

    db.init_app(app)
    # 约定：启动只校验库结构，不执行任何 DDL；结构不一致会直接抛错。
    db.prepare_database(app)

    register_routes(app)
    register_error_handlers(app)

    @app.after_request
    def _no_store(response):
        """给所有 API 响应加上禁止缓存与 MIME 嗅探的头。"""
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
            response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    return app
