from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from .camera_manager import CameraManager

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

def create_app():

    socketio.init_app(app)

    # Instantiate and attach to app
    app.camera_manager = CameraManager()

    with app.app_context():
        from .routes import init_routes
        init_routes(app)

    return app
