from dataclasses import dataclass
from flask_login import UserMixin
from sqlalchemy.orm import Mapped, mapped_column

from . import db


# 封装SQLAlchemy的Model
class Base:

    def to_dict(self):
        model_dict = dict(self.__dict__)
        del model_dict['_sa_instance_state']
        return model_dict


# 用户类，用于登录
class User(UserMixin, db.Model, Base):
    id = db.Column(db.String(255), primary_key=True)
    name = db.Column(db.String(255))
    password = db.Column(db.String(255))


# 人员类，系统中出现的各种人员
@dataclass
class Employee(db.Model, Base):
    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()


# 项目类
@dataclass
class Project(db.Model, Base):
    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()
    client: Mapped[str] = mapped_column()
    leaderId: Mapped[str] = mapped_column()
    status: Mapped[str] = mapped_column()
    delayed: Mapped[bool] = mapped_column()


# 项目状态
@dataclass
class ProjectStatus(db.Model, Base):
    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()


# 项目历程
@dataclass
class ProjectLog(db.Model, Base):
    id: Mapped[str] = mapped_column(primary_key=True)
    time: Mapped[str] = mapped_column()
    content: Mapped[str] = mapped_column()
    remark: Mapped[str] = mapped_column()


# 项目与参与人关系
@dataclass
class ProjectEmployee(db.Model, Base):
    projectId: Mapped[str] = mapped_column(primary_key=True)
    employeeId: Mapped[str] = mapped_column(primary_key=True)
