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

@app.route("/user/<username>", methods=['POST'])
def check_username(username):
    print("Entering check whether " + username + " is in usernames")
    if username in usernames:
        print("Username already exists")
        return "invalid"
    else:
        print("Username does not already exist")
        usernames.append(username)
        return "valid"
