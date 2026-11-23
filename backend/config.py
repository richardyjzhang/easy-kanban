"""环境变量配置。所有配置只从环境变量读取，`.env` 仅用于本地开发。"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

TOKEN_MAX_AGE = 7 * 24 * 60 * 60  # 约定：登录 token 有效期 7 天


class ConfigError(RuntimeError):
    """缺少或写错了必需的环境变量。"""


def load_config() -> dict:
    """读取并校验启动配置。"""
    secret_key = os.environ.get("EASY_KANBAN_SECRET_KEY", "").strip()
    if not secret_key:
        raise ConfigError(
            "缺少环境变量 EASY_KANBAN_SECRET_KEY，"
            "请参考 backend/.env.example 配置后重启。"
        )

    # 默认与代码同级的 data 目录，.gitignore 已忽略 data/ 和 *.db。
    db_path = os.environ.get("EASY_KANBAN_DB", "").strip() or str(
        BASE_DIR / "data" / "easy-kanban.db"
    )

    return {
        "DB_PATH": db_path,
        "SECRET_KEY": secret_key,
        "TOKEN_MAX_AGE": TOKEN_MAX_AGE,
        # 这两项只在 users 表为空时用于创建唯一账号。
        "BOOTSTRAP_USERNAME": os.environ.get("EASY_KANBAN_USERNAME", "").strip(),
        "BOOTSTRAP_PASSWORD": os.environ.get("EASY_KANBAN_PASSWORD", ""),
    }
