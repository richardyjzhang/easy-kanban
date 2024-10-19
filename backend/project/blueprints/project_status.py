from flask import Blueprint, request, jsonify, Response
from flask_login import login_required
from sqlalchemy import text
from werkzeug.exceptions import BadRequest

from .. import db
from ..models import ProjectStatus
from ..utils import new_id

project_status = Blueprint('project_status', __name__)


# 创建项目阶段类型
@project_status.route('/project-status', methods=['POST'])
@login_required
def create_status():

    request_body = request.get_json()

    try:
        name = request_body["name"]
    except KeyError:
        raise BadRequest

    # 禁止添加同名项目阶段
    exists = ProjectStatus.query.filter_by(name=name).first()
    if exists != None:
        raise BadRequest

    new_status = ProjectStatus(id=new_id(), name=name)
    db.session.add(new_status)
    db.session.commit()

    return jsonify(new_status), 201


# 获取所有项目阶段类型
@project_status.route('/project-status', methods=['GET'])
@login_required
def list_status():
    status = ProjectStatus.query.all()
    return status, 200


# 删除某个项目阶段类型
@project_status.route('/project-status/<id>', methods=['DELETE'])
@login_required
def delete_status(id):
    exists = ProjectStatus.query.filter_by(id=id).first()
    if exists != None:
        db.session.delete(exists)
        db.session.commit()
    return Response(status=204)


# 修改某个项目阶段类型
@project_status.route('/project-status/<id>', methods=['PUT'])
@login_required
def modify_status(id):
    request_body = request.get_json()

    try:
        name = request_body["name"]
    except KeyError:
        raise BadRequest

    # 禁止添加同名人员
    exists = ProjectStatus.query.filter_by(name=name).first()
    if exists != None:
        raise BadRequest

    # 对已有人员进行修改
    exists = db.get_or_404(ProjectStatus, id)
    exists.name = name

    exists.verified = True
    db.session.commit()

    return jsonify(exists), 200
