"""人员接口：新建、全量更新、归档、恢复、删除与排序。"""

from __future__ import annotations

import sqlite3

from flask import Blueprint, jsonify

import db
from errors import ApiError, json_body
from security import require_auth
from serializers import person_dict
from validation import Payload

bp = Blueprint("people", __name__)


def _get_person(conn: sqlite3.Connection, person_id: int) -> sqlite3.Row:
    """按 id 取人员，不存在时抛 404。"""
    row = conn.execute("SELECT * FROM people WHERE id = ?", (person_id,)).fetchone()
    if row is None:
        raise ApiError(404, "NOT_FOUND", "人员不存在")
    return row


def _active_task_count(conn: sqlite3.Connection, person_id: int) -> int:
    """统计该人员名下未完成任务数。"""
    # 约定：未完成 = status != 'done'。
    row = conn.execute(
        "SELECT COUNT(*) AS count FROM tasks WHERE person_id = ? AND status != 'done'",
        (person_id,),
    ).fetchone()
    return int(row["count"])


def _task_count(conn: sqlite3.Connection, person_id: int) -> int:
    """统计该人员名下全部任务数（含已完成）。"""
    row = conn.execute(
        "SELECT COUNT(*) AS count FROM tasks WHERE person_id = ?", (person_id,)
    ).fetchone()
    return int(row["count"])


@bp.post("/api/people")
@require_auth
def create_person():
    """新建人员，追加到列表末尾。"""
    payload = Payload(json_body())
    name = payload.text("name", "姓名", min_len=1, max_len=30)
    color = payload.color()
    payload.finish()

    conn = db.get_db()
    try:
        with db.transaction() as tx:
            sort_order = db.next_sort_order(tx, "people")
            cursor = tx.execute(
                "INSERT INTO people (name, color, sort_order, archived_at, is_system, created_at) "
                "VALUES (?, ?, ?, NULL, 0, ?)",
                (name, color, sort_order, db.now_ts()),
            )
            person_id = int(cursor.lastrowid)
    except sqlite3.IntegrityError:
        # 约定：人员姓名只在未归档范围内唯一，由部分唯一索引兜底。
        raise ApiError(409, "NAME_CONFLICT", "人员姓名已存在")

    row = conn.execute("SELECT * FROM people WHERE id = ?", (person_id,)).fetchone()
    return jsonify(person_dict(row)), 201


@bp.put("/api/people/<int:person_id>")
@require_auth
def update_person(person_id: int):
    """全量更新人员姓名与颜色。"""
    conn = db.get_db()
    person = _get_person(conn, person_id)
    # 约定：「待分配」是系统人员，任何修改都返回 SYSTEM_ROW。
    if person["is_system"]:
        raise ApiError(409, "SYSTEM_ROW", "「待分配」是系统内置人员，不能编辑")

    payload = Payload(json_body())
    name = payload.text("name", "姓名", min_len=1, max_len=30)
    color = payload.color()
    payload.finish()

    try:
        with db.transaction() as tx:
            tx.execute(
                "UPDATE people SET name = ?, color = ? WHERE id = ?",
                (name, color, person_id),
            )
    except sqlite3.IntegrityError:
        raise ApiError(409, "NAME_CONFLICT", "人员姓名已存在")

    row = conn.execute("SELECT * FROM people WHERE id = ?", (person_id,)).fetchone()
    return jsonify(person_dict(row))


@bp.post("/api/people/<int:person_id>/archive")
@require_auth
def archive_person(person_id: int):
    """归档人员（不删数据，历史任务保留）。"""
    conn = db.get_db()
    person = _get_person(conn, person_id)
    if person["is_system"]:
        raise ApiError(409, "SYSTEM_ROW", "「待分配」是系统内置人员，不能归档")
    if person["archived_at"]:
        raise ApiError(409, "ARCHIVED", "该人员已经归档")

    # 约定：名下还有未完成任务时不允许归档，并返回数量供前端提示。
    active_count = _active_task_count(conn, person_id)
    if active_count > 0:
        raise ApiError(
            409,
            "HAS_ACTIVE_TASKS",
            f"该人员还有 {active_count} 条未完成任务，无法归档",
            extra={"active_task_count": active_count},
        )

    archived_at = db.now_ts()
    with db.transaction() as tx:
        tx.execute("UPDATE people SET archived_at = ? WHERE id = ?", (archived_at, person_id))
    return jsonify({"id": person_id, "archived_at": archived_at})


@bp.post("/api/people/<int:person_id>/restore")
@require_auth
def restore_person(person_id: int):
    """从归档恢复人员。"""
    conn = db.get_db()
    person = _get_person(conn, person_id)
    if person["is_system"]:
        raise ApiError(409, "SYSTEM_ROW", "「待分配」是系统内置人员，无需恢复")
    if not person["archived_at"]:
        raise ApiError(409, "ARCHIVED", "该人员不在归档状态")

    try:
        with db.transaction() as tx:
            tx.execute("UPDATE people SET archived_at = NULL WHERE id = ?", (person_id,))
    except sqlite3.IntegrityError:
        # 约定：归档期间名称可被他人复用，恢复撞名时要求先改名。
        raise ApiError(409, "NAME_CONFLICT", "恢复失败：已存在同名人员，请先改名")

    return jsonify({"id": person_id, "archived_at": None})


@bp.delete("/api/people/<int:person_id>")
@require_auth
def delete_person(person_id: int):
    """删除人员；名下有任何任务（含已完成）时拒绝。"""
    conn = db.get_db()
    person = _get_person(conn, person_id)
    if person["is_system"]:
        raise ApiError(409, "SYSTEM_ROW", "「待分配」是系统内置人员，不能删除")

    # 约定：删除是硬删除，只允许对完全空的人员执行；否则引导改用归档。
    task_count = _task_count(conn, person_id)
    if task_count > 0:
        raise ApiError(
            409,
            "HAS_TASKS",
            f"该人员名下还有 {task_count} 条任务，请先删除任务或改用归档",
            extra={"task_count": task_count},
        )

    with db.transaction() as tx:
        tx.execute("DELETE FROM people WHERE id = ?", (person_id,))
    return "", 204


@bp.put("/api/people/order")
@require_auth
def reorder_people():
    """按传入顺序重写全部未归档人员的 sort_order。"""
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

    # 约定：ids 必须恰好等于「未归档且非系统」的人员集合，防止前端漏人或夹带系统行。
    rows = conn.execute(
        "SELECT id FROM people WHERE archived_at IS NULL AND is_system = 0"
    ).fetchall()
    expected = {int(row["id"]) for row in rows}
    if set(ids) != expected:
        raise ApiError(
            400,
            "VALIDATION_FAILED",
            "字段校验失败",
            details={"ids": "ids 必须恰好包含全部未归档的非系统人员"},
        )

    with db.transaction() as tx:
        for index, person_id in enumerate(ids):
            # 重排后步长仍为 10，系统人员保持 sort_order = 0 不动。
            tx.execute(
                "UPDATE people SET sort_order = ? WHERE id = ?",
                ((index + 1) * 10, person_id),
            )
    return jsonify({"updated": len(ids)})
