# Project 2

## Web Programming with Python and JavaScript

**Display Name: When a user visits your web application for the first time, they should be prompted to type in a display name that will eventually be associated with every message the user sends. If a user closes the page and returns to your app later, the display name should still be remembered.**

    Done. On opening the page, javascript checks whether a username is in localstorage; if so it loads that username.  If not, it dynamically loads a form to allow you to enter a username (function noUser()). That username is sent to the server to check that no other user with the same username exist (function checkUsername(username)).  If username is valid, the other page elments are then loaded - funciton loadUp() which calls other functions e.g. fuction loadUser(username) which dynamically adjusts the page to welcome the user and function loadchannels() which queries the serve to populate the dropdown channel list) 

**Channel Creation: Any user should be able to create a new channel, so long as its name doesn’t conflict with the name of an existing channel.**

    Done. When the new user is loaded - function loadUser(username) - a channel text box is also dynamically loaded into the header.  When channel name is entered, function loadchannel(channel) checks the server to get any messages already stored on the server. These are then dynamically added to the dom (using function addMessage(messageTime, messageUser, messageBody))

**Channel List: Users should be able to see a list of all current channels, and selecting one should allow the user to view the channel. We leave it to you to decide how to display such a list.**

    Done. Function loadchannels() (which is called everytime the user selects a new channel) queries the serve for an up to date list of channels.  They can then be selected from a dropdown.

**Messages View: Once a channel is selected, the user should see any messages that have already been sent in that channel, up to a maximum of 100 messages. Your app should only store the 100 most recent messages per channel in server-side memory.**

    Done. Function loadchannel(channel) queries the server for any existing messages (or if the channel doesn't exist creates it).  The messages are stored server side in a "deque" with a maximum length of 100. When the 101st message is added; the first message is automatically deleted.

**Sending Messages: Once in a channel, users should be able to send text messages to others the channel. When a user sends a message, their display name and the timestamp of the message should be associated with the message. All users in the channel should then see the new message (with display name and timestamp) appear on their channel page. Sending and receiving messages should NOT require reloading the page.**

    Done. When a user enters a message function sendmessage(message) is called which also creates a timestamp.  The message (timestamp, username and message body, along with the relevant channel) are then sent to the server.  As every channel is a socket.io room, the server then broadcasts that message to every user that has joined the room.  When that data is received from the server, function receivemessage(jsondata) then takes the constiuent efforts and adds them to the DOM using function addMessage (messageTime, messageUser, messageBody)

**Remembering the Channel: If a user is on a channel page, closes the web browser window, and goes back to your web application, your application should remember what channel the user was on previously and take the user back to that channel.**

    Done. When the user selects a new channel that channel is added to localstorage in the browser. On loading the page, loadUp() will check whether a channel already exists; if so it will be loaded through function loadchannel(channel)

**Personal Touch: Add at least one additional feature to your chat application of your choosing! Feel free to be creative, but if you’re looking for ideas, possibilities include: supporting deleting one’s own messages, supporting use attachments (file uploads) as messages, or supporting private messaging between two users.**

    Done. Two elements have been added in the add message function. First, the function checks whether the username associated with the message is the current user; if so the current users messages are coloured differently (using Bootstrap class properties).  In addition, the last message is automatically scrolled into view using scrollIntoView().

## In terms of each file - 

    * index.js - does most of the heavy lifting and includes all of the functions listed above

    * application.py - the server side is relatively short and consists of the following functions -
        * the default index function - which does returns index.html
        * the check_username(username) function - which just checks that the username doesn't already exist - returning "valid" or "invalid"
        * the open_channel(username, channel) function - which adds a new channel if it doesn't already exist; and returns any messages in that channel (if it did exist)
        * the list channels() function - which provides back an up to date channel list;
    
    * and the various socketio functions - 
        * on_join - adds the user to a particular room (i.e. channel), using socket io's room function;
        * on_leave - removes the user from a particular room (i.e. channel)
        * on('json') - handles incoming messages, adding them to the relevant channel message store (which is a deque with a dictionary; maxlength 100); and then emitting the message to all users in that room

    * index.css - does some formatting of page elments.  Most importantly ensuring the header - user/channel selection - and footer - message enter box - are always on top (z-index:1) and adding padding so that message elements don't sit on top of them. Bootstrap is used for most formatting.
