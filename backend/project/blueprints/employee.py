from flask import Blueprint, request, jsonify, Response
from flask_login import login_required
from sqlalchemy import text
from werkzeug.exceptions import BadRequest

from .. import db
from ..models import Employee
from ..utils import new_id

employee = Blueprint('employee', __name__)


# 创建人员
@employee.route('/employees', methods=['POST'])
@login_required
def create_employee():

    request_body = request.get_json()

    try:
        name = request_body["name"]
    except KeyError:
        raise BadRequest

    # 禁止添加同名人员
    exists = Employee.query.filter_by(name=name).first()
    if exists != None:
        raise BadRequest

    new_employee = Employee(id=new_id(), name=name)
    db.session.add(new_employee)
    db.session.commit()

    return jsonify(new_employee), 201


# 获取所有人员
@employee.route('/employees', methods=['GET'])
@login_required
def list_employees():
    employees = Employee.query.all()
    return employees, 200


# 删除某个人员
@employee.route('/employees/<id>', methods=['DELETE'])
@login_required
def delete_employee(id):
    exists = Employee.query.filter_by(id=id).first()
    if exists != None:
        db.session.delete(exists)
        # 同时删除项目中的人员
        db.session.execute(
            text(f"DELETE FROM project_employee WHERE employeeId = '{id}' "))
        db.session.commit()
    return Response(status=204)


# 修改某个人员
@employee.route('/employees/<id>', methods=['PUT'])
@login_required
def modify_employee(id):
    request_body = request.get_json()

    try:
        name = request_body["name"]
    except KeyError:
        raise BadRequest

    # 禁止添加同名人员
    exists = Employee.query.filter_by(name=name).first()
    if exists != None:
        raise BadRequest

    # 对已有人员进行修改
    exists = db.get_or_404(Employee, id)
    exists.name = name

    exists.verified = True
    db.session.commit()

    return jsonify(exists), 200
