"""项目接口：新建、全量更新、归档、恢复、删除与排序。"""

from __future__ import annotations

import sqlite3

from flask import Blueprint, jsonify, request

import db
from errors import ApiError, json_body
from security import require_auth
from serializers import project_dict
from validation import Payload

bp = Blueprint("projects", __name__)


def _get_project(conn: sqlite3.Connection, project_id: int) -> sqlite3.Row:
    """按 id 取项目，不存在时抛 404。"""
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if row is None:
        raise ApiError(404, "NOT_FOUND", "项目不存在")
    return row


def _active_task_count(conn: sqlite3.Connection, project_id: int) -> int:
    """统计该项目下未完成任务数。"""
    row = conn.execute(
        "SELECT COUNT(*) AS count FROM tasks WHERE project_id = ? AND status != 'done'",
        (project_id,),
    ).fetchone()
    return int(row["count"])


def _task_count(conn: sqlite3.Connection, project_id: int) -> int:
    """统计该项目下全部任务数（含已完成）。"""
    row = conn.execute(
        "SELECT COUNT(*) AS count FROM tasks WHERE project_id = ?", (project_id,)
    ).fetchone()
    return int(row["count"])


@bp.post("/api/projects")
@require_auth
def create_project():
    """新建项目，追加到列表末尾。"""
    payload = Payload(json_body())
    name = payload.text("name", "项目名称", min_len=1, max_len=50)
    color = payload.color()
    description = payload.text(
        "description", "项目描述", min_len=0, max_len=500, default=""
    )
    payload.finish()

    conn = db.get_db()
    try:
        with db.transaction() as tx:
            sort_order = db.next_sort_order(tx, "projects")
            cursor = tx.execute(
                "INSERT INTO projects (name, color, description, sort_order, archived_at, created_at) "
                "VALUES (?, ?, ?, ?, NULL, ?)",
                (name, color, description, sort_order, db.now_ts()),
            )
            project_id = int(cursor.lastrowid)
    except sqlite3.IntegrityError:
        raise ApiError(409, "NAME_CONFLICT", "项目名称已存在")

    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return jsonify(project_dict(row)), 201


@bp.put("/api/projects/<int:project_id>")
@require_auth
def update_project(project_id: int):
    """全量更新项目名称、颜色与描述。"""
    conn = db.get_db()
    _get_project(conn, project_id)

    payload = Payload(json_body())
    name = payload.text("name", "项目名称", min_len=1, max_len=50)
    color = payload.color()
    description = payload.text(
        "description", "项目描述", min_len=0, max_len=500, default=""
    )
    payload.finish()

    try:
        with db.transaction() as tx:
            tx.execute(
                "UPDATE projects SET name = ?, color = ?, description = ? WHERE id = ?",
                (name, color, description, project_id),
            )
    except sqlite3.IntegrityError:
        raise ApiError(409, "NAME_CONFLICT", "项目名称已存在")

    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return jsonify(project_dict(row))


@bp.post("/api/projects/<int:project_id>/archive")
@require_auth
def archive_project(project_id: int):
    """归档项目（不删数据，历史任务保留）。"""
    conn = db.get_db()
    project = _get_project(conn, project_id)
    if project["archived_at"]:
        raise ApiError(409, "ARCHIVED", "该项目已经归档")

    # 约定：项目下还有未完成任务时不允许归档。
    active_count = _active_task_count(conn, project_id)
    if active_count > 0:
        raise ApiError(
            409,
            "HAS_ACTIVE_TASKS",
            f"该项目还有 {active_count} 条未完成任务，无法归档",
            extra={"active_task_count": active_count},
        )

    archived_at = db.now_ts()
    with db.transaction() as tx:
        tx.execute("UPDATE projects SET archived_at = ? WHERE id = ?", (archived_at, project_id))
    return jsonify({"id": project_id, "archived_at": archived_at})


@bp.post("/api/projects/<int:project_id>/restore")
@require_auth
def restore_project(project_id: int):
    """从归档恢复项目。"""
    conn = db.get_db()
    project = _get_project(conn, project_id)
    if not project["archived_at"]:
        raise ApiError(409, "ARCHIVED", "该项目不在归档状态")

    try:
        with db.transaction() as tx:
            tx.execute("UPDATE projects SET archived_at = NULL WHERE id = ?", (project_id,))
    except sqlite3.IntegrityError:
        raise ApiError(409, "NAME_CONFLICT", "恢复失败：已存在同名项目，请先改名")

    return jsonify({"id": project_id, "archived_at": None})


@bp.delete("/api/projects/<int:project_id>")
@require_auth
def delete_project(project_id: int):
    """删除项目：需确认名称，且项目下不能有任何任务。"""
    conn = db.get_db()
    project = _get_project(conn, project_id)

    # 约定：删除项目必须回填与库里完全一致的名称，防止误删。
    confirm_name = request.args.get("confirm_name", "")
    if confirm_name != project["name"]:
        raise ApiError(
            400,
            "VALIDATION_FAILED",
            "字段校验失败",
            details={"confirm_name": "请输入与项目名称一致的确认名"},
        )

    task_count = _task_count(conn, project_id)
    if task_count > 0:
        raise ApiError(
            409,
            "HAS_TASKS",
            f"该项目下还有 {task_count} 条任务，请先删除任务或改用归档",
            extra={"task_count": task_count},
        )

    with db.transaction() as tx:
        tx.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    return "", 204


@bp.put("/api/projects/order")
@require_auth
def reorder_projects():
    """按传入顺序重写全部未归档项目的 sort_order。"""
    conn = db.get_db()
    data = json_body()
    ids = data.get("ids")
    if not isinstance(ids, list) or any(
        isinstance(item, bool) or not isinstance(item, int) for item in ids
    ):
        raise ApiError(
            400,
            "VALIDATION_FAILED",
            "字段校验失败",
            details={"ids": "ids 必须是整数数组"},
        )
    if len(ids) != len(set(ids)):
        raise ApiError(
            400,
            "VALIDATION_FAILED",
            "字段校验失败",
            details={"ids": "ids 中存在重复项"},
        )

    rows = conn.execute("SELECT id FROM projects WHERE archived_at IS NULL").fetchall()
    expected = {int(row["id"]) for row in rows}
    if set(ids) != expected:
        raise ApiError(
            400,
            "VALIDATION_FAILED",
            "字段校验失败",
            details={"ids": "ids 必须恰好包含全部未归档项目"},
        )

    with db.transaction() as tx:
        for index, project_id in enumerate(ids):
            tx.execute(
                "UPDATE projects SET sort_order = ? WHERE id = ?",
                ((index + 1) * 10, project_id),
            )
    return jsonify({"updated": len(ids)})
