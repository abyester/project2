import os

from flask import Flask, jsonify, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

usernames = []
channels = ["javascript", "babes"]
messages = {}
messages["javascript"] = [("18.42", "george", "Howzit in there"), ("19.45", "adam", "I don't know how to programme")]


@app.route("/", methods=['GET'])
def index():
    return render_template('index.html')

@app.route("/users/<username>", methods=['POST'])
def check_username(username):
    print("Entering check whether " + username + " is in usernames")
    if username in usernames:
        print("Username already exists")
        return "invalid"
    else:
        print("Username does not already exist")
        usernames.append(username)
        return "valid"

@app.route("/users/<username>/<channel>", methods=['POST'])
def open_channel(username, channel):
    if channel not in channels:
       channels.append(channel)
    
    return jsonify(messages[channel])

@app.route("/channellist", methods=['POST'])
def list_channels():
    return jsonify(channels)