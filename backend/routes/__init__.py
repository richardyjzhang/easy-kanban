"""路由注册：把各个 Blueprint 挂到应用上。"""

from __future__ import annotations

from flask import Flask

from . import auth, people, projects, state, tasks


def register_routes(app: Flask) -> None:
    """注册全部业务蓝图。"""
    for module in (auth, state, people, projects, tasks):
        app.register_blueprint(module.bp)
