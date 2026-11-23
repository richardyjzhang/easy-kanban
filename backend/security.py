"""密码哈希、签名 token 与登录态校验。"""

from __future__ import annotations

import time
from functools import wraps
from typing import Any, Callable, TypeVar

import bcrypt
from flask import current_app, g, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from db import get_db
from errors import ApiError

_SALT = "easy-kanban.auth"
_DUMMY_HASH: str | None = None

F = TypeVar("F", bound=Callable[..., Any])


def hash_password(password: str) -> str:
    """把明文密码哈希成可入库的字符串。"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """校验明文密码与哈希是否匹配。"""
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def _dummy_hash() -> str:
    """返回用于「用户不存在」分支的假哈希。"""
    # 让不存在的用户名也走一次 bcrypt，避免通过响应耗时枚举用户名。
    global _DUMMY_HASH
    if _DUMMY_HASH is None:
        _DUMMY_HASH = hash_password("easy-kanban-dummy-password")
    return _DUMMY_HASH


def _serializer() -> URLSafeTimedSerializer:
    """构造当前应用的 token 序列化器。"""
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt=_SALT)


def create_token(user_id: int, token_version: int) -> str:
    """签发登录 token。"""
    # 约定：token 里带 ver，改密码时递增数据库里的 ver 即可让旧 token 全部失效。
    payload = {"sub": str(user_id), "ver": token_version, "iat": int(time.time())}
    return _serializer().dumps(payload)


def _read_token(token: str) -> dict | None:
    """解析并校验 token 的签名与有效期。"""
    try:
        payload = _serializer().loads(token, max_age=current_app.config["TOKEN_MAX_AGE"])
    except (BadSignature, SignatureExpired):
        return None
    if not isinstance(payload, dict):
        return None
    if not isinstance(payload.get("sub"), str) or not isinstance(payload.get("ver"), int):
        return None
    return payload


def unauthorized(message: str = "登录状态已失效，请重新登录") -> ApiError:
    """构造 401 异常。"""
    return ApiError(401, "UNAUTHORIZED", message)


def authenticate(username: str, password: str) -> dict | None:
    """校验用户名密码，成功时返回账号信息。"""
    row = get_db().execute(
        "SELECT id, username, password_hash, token_version FROM users WHERE username = ?",
        (username,),
    ).fetchone()
    if row is None:
        verify_password(password, _dummy_hash())
        return None
    if not verify_password(password, row["password_hash"]):
        return None
    return dict(row)


def require_auth(fn: F) -> F:
    """装饰器：要求请求带有效 token，并把当前账号放进 g.user。"""

    @wraps(fn)
    def wrapper(*args: Any, **kwargs: Any):
        """校验请求 token 后调用原处理函数。"""
        header = request.headers.get("Authorization", "")
        scheme, _, token = header.partition(" ")
        if scheme.lower() != "bearer" or not token.strip():
            raise unauthorized()

        payload = _read_token(token.strip())
        if payload is None:
            raise unauthorized()

        try:
            user_id = int(payload["sub"])
        except (TypeError, ValueError):
            raise unauthorized()

        row = get_db().execute(
            "SELECT id, username, token_version FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        # 每次请求都对一次 ver，改密码后旧 token 立即失效。
        if row is None or int(row["token_version"]) != payload["ver"]:
            raise unauthorized()

        g.user = row
        return fn(*args, **kwargs)

    return wrapper  # type: ignore[return-value]
