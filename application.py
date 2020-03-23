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
# function checks username - making sure it doesn't already exist (to avoid duplicates)
# if it doesn't already exist it is appended to the list of usernames for next comparison
def check_username(username):
    if username in usernames:
        return "invalid"
    else:
        usernames.append(username)
        return "valid"

@app.route("/users/<username>/<channel>", methods=['POST'])
# function checks whether channel already exists; if it doesn't, it creates it
# either way it returns all the messages in the channel (none obvs if it is new) 
def open_channel(username, channel):
    if channel not in channels:
       channels.append(channel)
       # each block of messages is a deque - a special double ended class - with a length of 100
       # when 100 items is reached, the earliest item will automatically pop off the bottom 
       messages[channel] = deque([], 100)
    # need to convert the deque into a list so that it can be jsonified
    return jsonify(list(messages[channel]))

@app.route("/channellist", methods=['POST'])
#returns a list of the channels (to populate dropdown in each users browser)
def list_channels():
    return jsonify(channels)

@socketio.on('join')
#each channel is a room in socketio - this function joins room
def on_join(data):
    username = data['username']
    room = data['room']
    join_room(room)
    print(username + ' has entered the room' + room)

@socketio.on('leave')
#each channel is a room in socketio - this function leaves room
def on_leave(data):
    username = data['username']
    room = data['room']
    leave_room(room)
    print(username + ' has left the room' + room)

@socketio.on('json')
#when message is sent from any user - it is broken down into its constituent elements
#last element in list is channel to which message should be sent; the other elments are the message elements
#that are then stored in the message deque store
def handle_json(data, channel):
    decoded = json.loads(data)
    ## each message is sent with channel to which it should be transmitted
    channel = decoded[3]
    ## elements are timestamp; username; and message body
    message = (decoded[0], decoded[1], decoded[2])
    messages[channel].append(message)
    send(data, json=True, room = channel)