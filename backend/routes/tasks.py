"""任务接口：创建、全量更新与删除。"""

from __future__ import annotations

import sqlite3

from flask import Blueprint, jsonify

import db
from errors import ApiError, json_body
from security import require_auth
from serializers import task_dict
from validation import Payload, TASK_STATUSES

bp = Blueprint("tasks", __name__)


def _get_task(conn: sqlite3.Connection, task_id: int) -> sqlite3.Row:
    """按 id 取任务，不存在时抛 404。"""
    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if row is None:
        raise ApiError(404, "NOT_FOUND", "任务不存在")
    return row


def _parse_task_payload() -> dict:
    """校验并解析任务的可编辑字段。"""
    payload = Payload(json_body())
    title = payload.text("title", "任务标题", min_len=1, max_len=120)
    person_id = payload.integer("person_id", "人员")
    project_id = payload.integer("project_id", "项目")
    start_date = payload.date("start_date", "开始日")
    end_date = payload.date("end_date", "截止日")
    status = payload.choice("status", "状态", TASK_STATUSES)
    note = payload.text("note", "备注", min_len=0, max_len=500)
    payload.finish()

    # 约定：日期都可为空；都填时开始日不得晚于截止日。
    if start_date and end_date and start_date > end_date:
        raise ApiError(
            400,
            "VALIDATION_FAILED",
            "字段校验失败",
            details={"end_date": "截止日不能早于开始日"},
        )

    return {
        "title": title,
        "person_id": person_id,
        "project_id": project_id,
        "start_date": start_date,
        "end_date": end_date,
        "status": status,
        "note": note,
    }


def _check_references(conn: sqlite3.Connection, person_id: int, project_id: int) -> None:
    """校验任务引用的人员和项目存在且未归档。"""
    person = conn.execute(
        "SELECT id, archived_at FROM people WHERE id = ?", (person_id,)
    ).fetchone()
    if person is None:
        raise ApiError(
            400, "VALIDATION_FAILED", "人员不存在", details={"person_id": "人员不存在"}
        )
    # 约定：任务只能挂到在册人员/项目上；归档对象不可再被指派。
    if person["archived_at"]:
        raise ApiError(409, "ARCHIVED", "该人员已归档，无法分配任务")

    project = conn.execute(
        "SELECT id, archived_at FROM projects WHERE id = ?", (project_id,)
    ).fetchone()
    if project is None:
        raise ApiError(
            400, "VALIDATION_FAILED", "项目不存在", details={"project_id": "项目不存在"}
        )
    if project["archived_at"]:
        raise ApiError(409, "ARCHIVED", "该项目已归档，无法分配任务")


@bp.post("/api/tasks")
@require_auth
def create_task():
    """新建任务。"""
    fields = _parse_task_payload()
    conn = db.get_db()
    _check_references(conn, fields["person_id"], fields["project_id"])

    now = db.now_ts()
    with db.transaction() as tx:
        cursor = tx.execute(
            "INSERT INTO tasks "
            "(title, person_id, project_id, start_date, end_date, status, note, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                fields["title"],
                fields["person_id"],
                fields["project_id"],
                fields["start_date"],
                fields["end_date"],
                fields["status"],
                fields["note"],
                now,
                now,
            ),
        )
        task_id = int(cursor.lastrowid)

    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return jsonify(task_dict(row)), 201


@bp.put("/api/tasks/<int:task_id>")
@require_auth
def update_task(task_id: int):
    """全量更新任务；状态切换与改归属也走这里。"""
    conn = db.get_db()
    _get_task(conn, task_id)

    fields = _parse_task_payload()
    _check_references(conn, fields["person_id"], fields["project_id"])

    with db.transaction() as tx:
        tx.execute(
            "UPDATE tasks SET title = ?, person_id = ?, project_id = ?, start_date = ?, "
            "end_date = ?, status = ?, note = ?, updated_at = ? WHERE id = ?",
            (
                fields["title"],
                fields["person_id"],
                fields["project_id"],
                fields["start_date"],
                fields["end_date"],
                fields["status"],
                fields["note"],
                db.now_ts(),
                task_id,
            ),
        )

    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return jsonify(task_dict(row))


@bp.delete("/api/tasks/<int:task_id>")
@require_auth
def delete_task(task_id: int):
    """删除任务。"""
    conn = db.get_db()
    _get_task(conn, task_id)
    with db.transaction() as tx:
        tx.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    return "", 204
