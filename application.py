import os

from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

usernames = []

@app.route("/", methods=['GET'])
def index():
    return render_template('index.html')

@app.route("/user/<username>")
def check_username(username):
    if username in usernames:
        return "invalid"
    else:
        currentuser = username
        usernames.append(username)
        return "valid"
