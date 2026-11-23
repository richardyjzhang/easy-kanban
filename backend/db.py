"""SQLite 连接、结构校验、内置数据补齐与事务辅助。

约定：
- 建表由部署者手动执行 `schema.sql` 完成，应用代码中**没有任何针对业务库的 DDL**。
- 应用启动（prepare_database）只校验库结构与 `schema.sql` 一致；
  不一致时抛 SchemaError，由启动入口直接失败。
- 启动过程中只有 DML：确保内置「待分配」与唯一账号存在。
"""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Iterator

from flask import Flask, current_app, g

SCHEMA_PATH = Path(__file__).with_name("schema.sql")
SCHEMA_SQL = SCHEMA_PATH.read_text(encoding="utf-8")

# 约定：内置人员「待分配」固定 sort_order 为 0，且不可改名/归档/删除。
SYSTEM_PERSON_NAME = "待分配"
SYSTEM_PERSON_COLOR = "#8C8C8C"

# 只有这两张表允许拼进 SQL（sort_order 相关辅助函数用）。
_ORDER_TABLES = {"people", "projects"}

_EXPECTED_SCHEMA: dict | None = None


class SchemaError(RuntimeError):
    """数据库结构与 schema.sql 不一致。"""


def now_ts() -> str:
    """返回服务器本地时间戳，格式与 DATETIME 约定一致。"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def connect(db_path: str) -> sqlite3.Connection:
    """打开一个 SQLite 连接并设置本项目的 PRAGMA。"""
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=15.0, isolation_level=None)
    conn.row_factory = sqlite3.Row
    # WAL 让读写互不阻塞；写事务由 transaction() 用 BEGIN IMMEDIATE 串行化。
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.execute("PRAGMA foreign_keys=OFF")  # 约定：不建外键，关系由服务层校验
    return conn


def get_db() -> sqlite3.Connection:
    """取得当前请求的连接（不存在则创建）。"""
    if "db" not in g:
        g.db = connect(current_app.config["DB_PATH"])
    return g.db


def close_db(_exc: BaseException | None = None) -> None:
    """请求结束时关闭连接。"""
    conn = g.pop("db", None)
    if conn is not None:
        conn.close()


def init_app(app: Flask) -> None:
    """把连接清理挂到应用的 teardown 上。"""
    app.teardown_appcontext(close_db)


@contextmanager
def transaction() -> Iterator[sqlite3.Connection]:
    """开启一个写事务；异常时回滚。

    单用户场景也可能有多个线程同时写（Flask 自带服务器是 threaded），
    BEGIN IMMEDIATE 会先拿到写锁，避免“先查后写”被并发打穿。
    """
    conn = get_db()
    if conn.in_transaction:
        # 实际上不应发生；真发生就复用外层事务，避免嵌套 BEGIN。
        yield conn
        return
    conn.execute("BEGIN IMMEDIATE")
    try:
        yield conn
        conn.commit()
    except BaseException:
        conn.rollback()
        raise


def next_sort_order(conn: sqlite3.Connection, table: str) -> int:
    """返回追加到末尾时应使用的 sort_order。"""
    if table not in _ORDER_TABLES:
        raise ValueError(f"unsupported table: {table}")
    # 约定：每次加 10，给将来插入留出空隙。
    row = conn.execute(f"SELECT COALESCE(MAX(sort_order), 0) AS value FROM {table}").fetchone()
    return int(row["value"]) + 10


def prepare_database(app: Flask) -> None:
    """应用启动检查：库必须已存在且结构一致，然后补齐内置数据。"""
    db_path = app.config["DB_PATH"]
    if not Path(db_path).is_file():
        raise SchemaError(
            f"数据库文件不存在：{db_path}\n"
            "请先手动执行 schema.sql 初始化数据库后再启动。"
        )

    conn = connect(db_path)
    try:
        verify_schema(conn)
        # 以下只是数据写入（DML），不涉及任何 DDL。
        _ensure_system_person(conn)
        _ensure_account(conn, app.config)
        conn.commit()
    finally:
        conn.close()


def verify_schema(conn: sqlite3.Connection) -> None:
    """比对库结构与 schema.sql，不一致时抛 SchemaError。"""
    expected = _expected_schema()
    actual = _snapshot(conn)
    problems = _diff_schema(expected, actual)
    if problems:
        raise SchemaError(
            "数据库结构与 schema.sql 不一致，已拒绝启动：\n- "
            + "\n- ".join(problems)
            + "\n请先备份数据并手动迁移；首次部署请手动执行 schema.sql 初始化。"
        )


def _expected_schema() -> dict:
    """在内存库里执行 schema.sql，得到期望的结构快照。"""
    global _EXPECTED_SCHEMA
    if _EXPECTED_SCHEMA is None:
        # 只动内存库，不碰用户数据库。
        memory = sqlite3.connect(":memory:")
        memory.row_factory = sqlite3.Row
        try:
            memory.executescript(SCHEMA_SQL)
            _EXPECTED_SCHEMA = _snapshot(memory)
        finally:
            memory.close()
    return _EXPECTED_SCHEMA


def _snapshot(conn: sqlite3.Connection) -> dict:
    """读取当前库的表、列、外键与索引结构。"""
    tables: dict[str, dict] = {}
    rows = conn.execute(
        "SELECT name FROM sqlite_master "
        "WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).fetchall()
    for row in rows:
        name = row["name"]
        quoted = _quote_identifier(name)
        columns = [
            (
                col["name"],
                (col["type"] or "").upper(),
                int(col["notnull"]),
                int(col["pk"]),
                col["dflt_value"],
            )
            for col in conn.execute(f"PRAGMA table_info({quoted})")
        ]
        foreign_keys = [
            tuple(fk) for fk in conn.execute(f"PRAGMA foreign_key_list({quoted})")
        ]
        tables[name] = {"columns": columns, "foreign_keys": foreign_keys}

    indexes: dict[str, dict] = {}
    for table in tables:
        quoted = _quote_identifier(table)
        for index in conn.execute(f"PRAGMA index_list({quoted})"):
            name = index["name"]
            if name.startswith("sqlite_autoindex_"):
                continue
            columns = [
                info["name"]
                for info in conn.execute(f"PRAGMA index_info({_quote_identifier(name)})")
            ]
            # partial 列在较新的 SQLite 才有；老版本按非部分索引处理。
            partial = bool(index["partial"]) if "partial" in index.keys() else False
            indexes[name] = {
                "table": table,
                "unique": bool(index["unique"]),
                "partial": partial,
                "columns": columns,
            }

    return {"tables": tables, "indexes": indexes}


def _diff_schema(expected: dict, actual: dict) -> list[str]:
    """对比两份结构快照，返回人类可读的差异列表。"""
    problems: list[str] = []

    expected_tables = set(expected["tables"])
    actual_tables = set(actual["tables"])
    for name in sorted(expected_tables - actual_tables):
        problems.append(f"缺少表：{name}")
    for name in sorted(actual_tables - expected_tables):
        problems.append(f"存在多余的表：{name}")

    for name in sorted(expected_tables & actual_tables):
        expected_table = expected["tables"][name]
        actual_table = actual["tables"][name]
        if expected_table["columns"] != actual_table["columns"]:
            problems.append(
                f"表 {name} 的列定义不一致"
                f"（期望 {_format_columns(expected_table['columns'])}；"
                f"实际 {_format_columns(actual_table['columns'])}）"
            )
        if expected_table["foreign_keys"] != actual_table["foreign_keys"]:
            problems.append(f"表 {name} 的外键定义不一致")

    expected_indexes = set(expected["indexes"])
    actual_indexes = set(actual["indexes"])
    for name in sorted(expected_indexes - actual_indexes):
        problems.append(f"缺少索引：{name}")
    for name in sorted(actual_indexes - expected_indexes):
        problems.append(f"存在多余的索引：{name}")
    for name in sorted(expected_indexes & actual_indexes):
        if expected["indexes"][name] != actual["indexes"][name]:
            problems.append(f"索引 {name} 的定义不一致")

    return problems


def _format_columns(columns: list[tuple]) -> str:
    """把列快照格式化成一行便于阅读的文本。"""
    parts = []
    for name, column_type, not_null, primary_key, default in columns:
        flags = []
        if primary_key:
            flags.append("PK")
        if not_null:
            flags.append("NOT NULL")
        if default is not None:
            flags.append(f"DEFAULT {default}")
        suffix = f" [{' '.join(flags)}]" if flags else ""
        parts.append(f"{name} {column_type}{suffix}")
    return ", ".join(parts) if parts else "（无列）"


def _quote_identifier(value: str) -> str:
    """把标识符安全地包进双引号，供 PRAGMA 使用。"""
    return '"' + value.replace('"', '""') + '"'


def _ensure_system_person(conn: sqlite3.Connection) -> None:
    """确保「待分配」系统人员存在（幂等，纯数据写入）。"""
    row = conn.execute("SELECT id FROM people WHERE is_system = 1").fetchone()
    if row is not None:
        return
    conn.execute(
        "INSERT INTO people (name, color, sort_order, archived_at, is_system, created_at) "
        "VALUES (?, ?, 0, NULL, 1, ?)",
        (SYSTEM_PERSON_NAME, SYSTEM_PERSON_COLOR, now_ts()),
    )


def _ensure_account(conn: sqlite3.Connection, config: dict) -> None:
    """users 表为空时按环境变量创建唯一账号，并校验单账号约束。"""
    # 延迟导入，避免 db <-> security 的循环依赖。
    from security import hash_password

    row = conn.execute("SELECT COUNT(*) AS count FROM users").fetchone()
    count = int(row["count"])
    if count > 1:
        raise RuntimeError("users 表中存在多行账号，本系统只支持单账号，请清理后重启。")
    if count == 1:
        # 已有账号时环境变量不再生效；密码只能通过设置页修改。
        return

    username = config.get("BOOTSTRAP_USERNAME", "")
    password = config.get("BOOTSTRAP_PASSWORD", "")
    if not username or not password:
        raise RuntimeError(
            "首次启动需要设置 EASY_KANBAN_USERNAME 与 EASY_KANBAN_PASSWORD，"
            "用于创建唯一账号（见 backend/.env.example）。"
        )
    if len(username) > 64:
        raise RuntimeError("EASY_KANBAN_USERNAME 不能超过 64 个字符。")
    if len(password) < 8:
        raise RuntimeError("EASY_KANBAN_PASSWORD 至少 8 个字符。")
    if len(password.encode("utf-8")) > 72:
        # bcrypt 只处理前 72 字节，超出部分会被静默忽略，所以直接拒绝。
        raise RuntimeError("EASY_KANBAN_PASSWORD 过长（bcrypt 最多 72 字节）。")

    conn.execute(
        "INSERT INTO users (id, username, password_hash, token_version, created_at) "
        "VALUES (1, ?, ?, 0, ?)",
        (username, hash_password(password), now_ts()),
    )
