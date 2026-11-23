"""请求体字段校验。收集全部字段错误后一次性抛 400，details 按字段返回。"""

from __future__ import annotations

import re
from datetime import date
from typing import Any, Sequence

from errors import ApiError

# 约定：颜色只能来自固定色板，前后端共用这 8 个值。
PALETTE = (
    "#5B8FF9",
    "#61DDAA",
    "#65789B",
    "#F6BD16",
    "#7262FD",
    "#78D3F8",
    "#9661BC",
    "#F6903D",
)

# 约定：任务状态只有四态，不设「已取消」。
TASK_STATUSES = ("todo", "doing", "blocked", "done")

_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_MISSING = object()


class Payload:
    """在一份 JSON 对象上做字段级校验，最后统一抛错。"""

    def __init__(self, data: dict[str, Any]) -> None:
        """保存待校验的 JSON 对象并初始化错误表。"""
        self.data = data
        self.errors: dict[str, str] = {}

    def _lookup(self, key: str, default: Any) -> Any:
        """读取原始字段，缺省时返回默认值或 MISSING 哨兵。"""
        if key not in self.data:
            return _MISSING if default is _MISSING else default
        return self.data[key]

    def text(
        self,
        key: str,
        label: str,
        *,
        min_len: int = 1,
        max_len: int = 30,
        default: Any = _MISSING,
        strip: bool = True,
    ) -> str:
        """校验并返回文本字段。"""
        value = self._lookup(key, default)
        if value is _MISSING:
            self.errors[key] = f"缺少「{label}」字段" if min_len == 0 else f"{label}不能为空"
            return ""
        if value is None:
            if default is not _MISSING:
                return default
            self.errors[key] = f"{label}不能为空"
            return ""
        if not isinstance(value, str):
            self.errors[key] = f"{label}必须是文本"
            return ""
        if strip:
            value = value.strip()
        if len(value) < min_len:
            self.errors[key] = (
                f"{label}不能为空" if min_len <= 1 else f"{label}至少 {min_len} 个字符"
            )
            return value
        if len(value) > max_len:
            self.errors[key] = f"{label}不能超过 {max_len} 个字符"
        return value

    def secret(self, key: str, label: str, *, min_len: int = 1, max_len: int = 128) -> str:
        """校验并返回密码类字段（不 trim，避免悄悄改动用户输入）。"""
        value = self._lookup(key, _MISSING)
        if value is _MISSING or value is None or not isinstance(value, str) or value == "":
            self.errors[key] = f"{label}不能为空"
            return ""
        if len(value) < min_len:
            self.errors[key] = f"{label}至少 {min_len} 个字符"
            return ""
        if len(value) > max_len:
            self.errors[key] = f"{label}不能超过 {max_len} 个字符"
            return ""
        return value

    def integer(self, key: str, label: str) -> int:
        """校验并返回整数字段。"""
        value = self._lookup(key, _MISSING)
        if value is _MISSING or value is None:
            self.errors[key] = f"{label}不能为空"
            return 0
        # JSON 里的 true/false 在 Python 里也是 int，需要单独排除。
        if isinstance(value, bool) or not isinstance(value, int):
            self.errors[key] = f"{label}必须是整数"
            return 0
        return value

    def choice(self, key: str, label: str, options: Sequence[str]) -> str:
        """校验并返回枚举字段。"""
        value = self._lookup(key, _MISSING)
        if value is _MISSING or value is None:
            self.errors[key] = f"{label}不能为空"
            return options[0]
        if not isinstance(value, str) or value not in options:
            self.errors[key] = f"{label}取值不合法"
            return options[0]
        return value

    def color(self, key: str = "color", label: str = "颜色") -> str:
        """校验并返回色板内的颜色值。"""
        value = self.text(key, label, min_len=1, max_len=32)
        if key not in self.errors and value not in PALETTE:
            self.errors[key] = f"{label}必须来自预设色板"
        return value

    def date(self, key: str, label: str) -> str | None:
        """校验并返回 YYYY-MM-DD 日期，允许 null。"""
        value = self._lookup(key, _MISSING)
        if value is _MISSING:
            # 约定：任务 PUT 要求七个字段全部出现，日期允许显式传 null。
            self.errors[key] = f"缺少「{label}」字段"
            return None
        if value is None:
            return None
        if not isinstance(value, str) or not _DATE_RE.match(value):
            self.errors[key] = f"{label}格式应为 YYYY-MM-DD"
            return None
        try:
            date.fromisoformat(value)
        except ValueError:
            # 格式对但日期不存在，例如 2026-02-30。
            self.errors[key] = f"{label}不是有效日期"
            return None
        return value

    def finish(self) -> None:
        """有字段错误时一次性抛出，没有则正常返回。"""
        if self.errors:
            raise ApiError(400, "VALIDATION_FAILED", "字段校验失败", details=self.errors)
