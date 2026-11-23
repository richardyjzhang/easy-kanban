"""SQLite 行到 API JSON 对象的转换。"""

from __future__ import annotations

import sqlite3


def person_dict(row: sqlite3.Row) -> dict:
    """把人员行转成接口返回对象。"""
    return {
        "id": row["id"],
        "name": row["name"],
        "color": row["color"],
        "sort_order": row["sort_order"],
        "archived_at": row["archived_at"],
        "is_system": bool(row["is_system"]),
        "created_at": row["created_at"],
    }


def project_dict(row: sqlite3.Row) -> dict:
    """把项目行转成接口返回对象。"""
    return {
        "id": row["id"],
        "name": row["name"],
        "color": row["color"],
        "description": row["description"],
        "sort_order": row["sort_order"],
        "archived_at": row["archived_at"],
        "created_at": row["created_at"],
    }


def task_dict(row: sqlite3.Row) -> dict:
    """把任务行转成接口返回对象。"""
    return {
        "id": row["id"],
        "title": row["title"],
        "person_id": row["person_id"],
        "project_id": row["project_id"],
        "start_date": row["start_date"],
        "end_date": row["end_date"],
        "status": row["status"],
        "note": row["note"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }
