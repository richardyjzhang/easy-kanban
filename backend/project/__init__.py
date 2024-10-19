import os
import json
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

current_dir = os.path.dirname(__file__)
with open(os.path.join(current_dir, 'config.json'), 'r') as config_file:
    config = json.load(config_file)

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    app.config["JSON_AS_ASCII"] = False
    app.config["SECRET_KEY"] = 'easy-kanban'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.init_app(app)

    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(str(user_id))

    from .blueprints.auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    # 一开始手动建立用户时候用，后面都注释上
    # from .blueprints.user import user as user_blueprint
    # app.register_blueprint(user_blueprint)

    return app
