"""
Automated Interview Slot Scheduler — AI Engine
Flask application entry point.
Run: python app.py
"""
import os
from flask import Flask
from flask_cors import CORS
from api.routes import bp as api_bp

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173', 'http://localhost:3001'])

# Register blueprints
app.register_blueprint(api_bp, url_prefix='/api')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('DEBUG', 'true').lower() == 'true'
    print(f"🤖 AI Engine running on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
