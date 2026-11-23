"""统一错误类型、错误响应格式与全局异常处理。"""

from __future__ import annotations

import logging
import sqlite3
from typing import Any

from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)


class ApiError(Exception):
    """业务异常，携带 HTTP 状态码与稳定的错误码。"""

    def __init__(
        self,
        status: int,
        code: str,
        message: str,
        details: dict[str, str] | None = None,
        extra: dict[str, Any] | None = None,
    ) -> None:
        """记录状态码、错误码、提示文案与附加信息。"""
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.details = details or {}
        self.extra = extra or {}

    def payload(self) -> dict[str, Any]:
        """生成契约约定的错误响应体。"""
        body: dict[str, Any] = {"error": {"code": self.code, "message": self.message}}
        # details 放字段级原因；extra 放业务附加信息（如 task_count）。
        if self.details:
            body["details"] = self.details
        body.update(self.extra)
        return body


def json_body() -> dict[str, Any]:
    """读取并校验请求体是 JSON 对象。"""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError(400, "VALIDATION_FAILED", "请求体必须是 JSON 对象")
    return data


def register_error_handlers(app: Flask) -> None:
    """把各类异常统一转换为契约里的错误响应。"""

    @app.errorhandler(ApiError)
    def _handle_api_error(error: ApiError):
        """业务异常按自带状态码返回。"""
        return jsonify(error.payload()), error.status

    @app.errorhandler(sqlite3.IntegrityError)
    def _handle_integrity_error(error: sqlite3.IntegrityError):
        """唯一索引冲突兜底为名称冲突。"""
        # 库里只有一个名称唯一索引，撞上它基本就是重名。
        logger.warning("integrity error: %s", error)
        return (
            jsonify({"error": {"code": "NAME_CONFLICT", "message": "名称已存在"}}),
            409,
        )

    @app.errorhandler(HTTPException)
    def _handle_http_error(error: HTTPException):
        """把 Flask/Werkzeug 的 HTTP 异常翻译成统一格式。"""
        if error.code == 404:
            return jsonify({"error": {"code": "NOT_FOUND", "message": "接口或资源不存在"}}), 404
        if error.code == 405:
            return (
                jsonify({"error": {"code": "METHOD_NOT_ALLOWED", "message": "请求方法不被允许"}}),
                405,
            )
        return (
            jsonify({"error": {"code": "HTTP_ERROR", "message": error.description or "请求失败"}}),
            error.code or 500,
        )

    @app.errorhandler(Exception)
    def _handle_unexpected_error(error: Exception):
        """兜底未预期异常，记录日志但不把堆栈暴露给客户端。"""
        logger.exception("unhandled error on %s %s", request.method, request.path)
        return (
            jsonify({"error": {"code": "INTERNAL_ERROR", "message": "服务器内部错误"}}),
            500,
        )
