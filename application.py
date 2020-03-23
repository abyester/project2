import os

from flask import Flask, json, jsonify, render_template
from flask_socketio import SocketIO, emit, send, join_room, leave_room
from collections import deque

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

usernames = []
channels = ["javascript"]
messages = {}
messages["javascript"] = deque([("18.42", "george", "Howzit in there"), ("19.45", "adam", "I don't know how to programme")], 100)


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
       # each block of messages is a deque - a special double ended class - with a length of 100
       # when 100 items is reached, the earliest item will automatically pop off the bottom 
       messages[channel] = deque([], 100)
    # need to convert the deque into a list so that it can be jsonified
    return jsonify(list(messages[channel]))

@app.route("/channellist", methods=['POST'])
def list_channels():
    return jsonify(channels)

@socketio.on('join')
def on_join(data):
    username = data['username']
    room = data['room']
    join_room(room)
    print(username + ' has entered the room' + room)

@socketio.on('leave')
def on_leave(data):
    username = data['username']
    room = data['room']
    leave_room(room)
    print(username + ' has left the room' + room)

@socketio.on('json')
def handle_json(data, channel):
    decoded = json.loads(data)
    channel = decoded[3]
    message = (decoded[0], decoded[1], decoded[2])
    messages[channel].append(message)
    send(data, json=True, room = channel)