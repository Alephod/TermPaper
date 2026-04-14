import os

from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate

from config import config
from app.models import db


migrate = Migrate()


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'default')

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    from app.routes.words import words_bp
    from app.routes.decks import decks_bp
    from app.routes.training import training_bp
    from app.routes.uploads import uploads_bp

    app.register_blueprint(words_bp, url_prefix='/api/words')
    app.register_blueprint(decks_bp, url_prefix='/api/decks')
    app.register_blueprint(training_bp, url_prefix='/api/training-sessions')
    app.register_blueprint(uploads_bp, url_prefix='/uploads')

    from app.seed import register_seed_command
    register_seed_command(app)

    return app
