"""登录与修改密码接口。"""

from __future__ import annotations

from flask import Blueprint, current_app, g, jsonify

import db
from errors import ApiError, json_body
from security import (
    authenticate,
    create_token,
    hash_password,
    require_auth,
    verify_password,
)
from validation import Payload

bp = Blueprint("auth", __name__)


@bp.post("/api/auth/login")
def login():
    """校验用户名密码并签发 token。"""
    payload = Payload(json_body())
    username = payload.text("username", "用户名", min_len=1, max_len=64)
    password = payload.secret("password", "密码", min_len=1, max_len=128)
    payload.finish()

    user = authenticate(username, password)
    if user is None:
        # 约定：不统计失败次数、不锁账号，只返回统一的 401。
        raise ApiError(401, "UNAUTHORIZED", "用户名或密码错误")

    token = create_token(int(user["id"]), int(user["token_version"]))
    return jsonify({"token": token, "expires_in": current_app.config["TOKEN_MAX_AGE"]})


@bp.post("/api/auth/password")
@require_auth
def change_password():
    """校验旧密码后更新密码，并给当前会话换发新 token。"""
    payload = Payload(json_body())
    old_password = payload.secret("old_password", "旧密码", min_len=1, max_len=128)
    new_password = payload.secret("new_password", "新密码", min_len=8, max_len=128)
    payload.finish()

    if len(new_password.encode("utf-8")) > 72:
        raise ApiError(
            400,
            "VALIDATION_FAILED",
            "字段校验失败",
            details={"new_password": "新密码过长（bcrypt 最多 72 字节）"},
        )

    user = db.get_db().execute(
        "SELECT id, password_hash, token_version FROM users WHERE id = ?", (g.user["id"],)
    ).fetchone()
    if user is None or not verify_password(old_password, user["password_hash"]):
        raise ApiError(
            400,
            "VALIDATION_FAILED",
            "旧密码不正确",
            details={"old_password": "旧密码不正确"},
        )

    # 约定：token_version 递增会让所有旧 token 失效（其他设备需重新登录）。
    new_version = int(user["token_version"]) + 1
    with db.transaction() as conn:
        conn.execute(
            "UPDATE users SET password_hash = ?, token_version = ? WHERE id = ?",
            (hash_password(new_password), new_version, user["id"]),
        )

    # 当前会话不能跟着失效，换发一枚携带新 ver 的 token。
    token = create_token(int(user["id"]), new_version)
    return jsonify({"token": token, "expires_in": current_app.config["TOKEN_MAX_AGE"]})
