"""一次性拉取全量状态的接口。"""

from __future__ import annotations

from flask import Blueprint, jsonify

import db
from security import require_auth
from serializers import person_dict, project_dict, task_dict

bp = Blueprint("state", __name__)

# 约定：任务一次最多返回 2000 条，矩阵/列表在前端本地分组与筛选。
TASK_LIMIT = 2000


@bp.get("/api/state")
@require_auth
def get_state():
    """返回全部人员、项目与任务。"""
    conn = db.get_db()
    # 人员和项目都包含已归档数据：设置页需要展示归档分组。
    people = [
        person_dict(row)
        for row in conn.execute("SELECT * FROM people ORDER BY sort_order, id")
    ]
    projects = [
        project_dict(row)
        for row in conn.execute("SELECT * FROM projects ORDER BY sort_order, id")
    ]
    tasks = [
        task_dict(row)
        for row in conn.execute(
            "SELECT * FROM tasks ORDER BY created_at, id LIMIT ?", (TASK_LIMIT,)
        )
    ]
    return jsonify({"people": people, "projects": projects, "tasks": tasks})
