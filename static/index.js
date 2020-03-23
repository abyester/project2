
//start by setting username and channel in global scope (so that these can be accessed from all functions; also set room active flag to false)
var username = localStorage.getItem('username');
var channel = localStorage.getItem('channel');
var roomactive = false;

document.addEventListener('DOMContentLoaded', () => {

  //Set up handlebars templates
  const templatemessages = Handlebars.compile(document.querySelector('#channel_messages').innerHTML);
  const templatechannels = Handlebars.compile(document.querySelector('#channel_dropdown').innerHTML);
  const template_newchannels = Handlebars.compile(document.querySelector('#channel_enter').innerHTML);
  const template_footer = Handlebars.compile(document.querySelector('#footer_enterbox').innerHTML);


  //event handler for key entry (keyup) and submit buttons
  document.addEventListener("keyup", event => validateInput(event));
  document.addEventListener("submit", event => { submitInput(event) });

  //switch socket on and connect
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
  socket.on('connect', () => {
    }
  );

  // If no username stored, draw on no-username template below
  // Otherwise load tempate for that user
  if (username === null) {
    noUser()
  } else {
    loadUp();
  };

  function loadUp() {
    // once username exists and accepted load username elements
    loadUser(username);

    //once username is loaded, load channels  
    loadchannels();


    //If channel name stored, load it
    if (channel !== null) {
      loadchannel(channel)
    };

    //Listen for messages and enact function to receive messages when received
    socket.on('json', jsondata => receivemessage(jsondata));
  };

  //functions below

  function noUser() {
    //insert form that allows you to fill in username (template in html page)
    document.querySelector('.username').innerHTML = document.querySelector('#no_username').innerHTML;
  };

  function checkUsername(username) {
    //contact serve to check that username submitted not already in use (serve responds valid or not valid)
    const request = new XMLHttpRequest();
    request.open('POST', `users/${username}`);
    request.onload = () => {
      const valid_username = request.responseText;
      console.log("Server response: " + valid_username);
      if (valid_username == "valid") {
        return loadUp();
      } else {
        return noUser();
      };

    }

    request.send();
  };

  function validateInput(event) {
    //identify field in which text was entered
    field = event.target;
    //identify submit button (next element along)
    submit = field.nextElementSibling;

    //check field is actually valid (e.g. may not exist yet if being dynamically created)
    if ((field !== undefined) && (field !== null)) {
      //only allow submit box to be enabled if there is text in the field
      if (field.value.length > 0) {
        submit.disabled = false;
      } else {
        submit.disabled = true;
      }
    }
  };

  function submitInput(event) {
    // depending on which submit button was selected different actions are trigged
    field = event.target.id;
    switch (field) {
      //username form submitted
      case 'username_form':
        username = document.querySelector('#username_input').value;
        checkUsername(username);
        break;
      //channel drop down form submitted
      case 'channeldropdown_form':
        console.log("Submit logged in " + field);
        //leave existing room before new channel is set
        if (roomactive === true) leavechannel(channel);
        channel = document.querySelector('#dropdown_input').value;
        loadchannel(channel);
        break;
      //channel free text form submitted
      case 'channelenter_form':
        console.log("Submit logged in " + field);
        //leave existing room before new channel is set
        if (roomactive === true) leavechannel(channel);
        channel = document.querySelector('#channel_input').value;
        loadchannel(channel);
        break;
      //messages text box form submitted
      case 'textinput_form':
        console.log("Submit logged in " + field);
        message = document.querySelector('#text_input').value;
        sendmessage(message);
        break;
      default:
        console.log("Something went wrong!");
        break;
    }
    //prevent the form actually submitting (and triggering a page refresh)
    event.preventDefault();
  };

  function loadUser(username) {
    //load "Welcome, user!" part of dom and set the username in local storage  
    const templateyesusername = Handlebars.compile(document.querySelector('#yes_username').innerHTML);
    const yesusername = templateyesusername({ 'username': username });
    document.querySelector('.username').innerHTML = yesusername;
    localStorage.setItem('username', username);

    //enter newchannel form submission (done here so it's only done once, not repeatedly)
    const newchannels = template_newchannels();
    document.querySelector('.enter-channel').innerHTML = newchannels;
  };

  function loadchannels() {
    //load current list of channels from serve and add it to the drop down channel selection box
    const request = new XMLHttpRequest();
    request.open('POST', "/channellist", false);
    request.onload = () => {
      const channels = JSON.parse(request.responseText);
      if (channels.length > 0) {
        console.log("Channels list is" + channels)

        //add channels to drop down list in the dom
        const channelslist = templatechannels({ 'channels': channels });
        document.querySelector('.choose-channel').innerHTML = channelslist;
      }
    }
    request.send();
  };

  function leavechannel(channel) {
    //clear any previous channel messages
    document.querySelector('#messages').innerHTML = '';

    //leave room in socket.io
    socket.emit('leave', { 'username': username, 'room': channel });

    //reset room active to false (momentarily)
    roomactive = false;
  };

  function loadchannel(channel) {
    //set channel name in memory
    localStorage.setItem('channel', channel);
    //reset channel selection textbox
    document.querySelector('#channel_input').value = '';
    //open messages stored on server
    const request = new XMLHttpRequest();
    request.open('POST', `users/${username}/${channel}`);
    request.onload = () => {
      const messages = JSON.parse(request.responseText);

      if (messages.length > 0) {
        for (var i = 0; i < messages.length; i++) {
          const messageTime = messages[i][0];
          const messageUser = messages[i][1];
          const messageBody = messages[i][2];

          addMessage(messageTime, messageUser, messageBody);
        }
      }
    }

    request.send();

    joinchannel(channel);
  };

  function joinchannel(channel) {
    //set template footer (this is where user enters messages)
    const templatefooter = template_footer({ 'username': username, 'channel': channel });
    document.querySelector('#footer').innerHTML = templatefooter;


    //join the selected channel in socket.io
    socket.emit('join', { 'username': username, 'room': channel });
    roomactive = true;

    //load refreshed channel list in the dropdown
    loadchannels();

  };

  function sendmessage(message) {
    //get timestamp that will be sent with message
    const today = new Date();
    const timestamp = today.toLocaleTimeString();

    //create the javascript array that will be sent to the server (and json it)
    const messagearray = [timestamp, username, message, channel];
    const jsondata = JSON.stringify(messagearray);

    //send the data
    socket.emit('json', jsondata, channel);
    document.querySelector('#text_input').value = ''
  };

  // when a new message is received, add to the page
  function receivemessage(jsondata) {
    const message = JSON.parse(jsondata);
    //break message into constituent parts
    const messageTime = message[0];
    const messageUser = message[1];
    const messageBody = message[2];

    addMessage(messageTime, messageUser, messageBody);
  };

  function addMessage(messageTime, messageUser, messageBody) {
    //take message elements and display them in the DOM
    //if message is from the current user, format the message different (red 'danger' as opposed to normal 'info')
    var messageClass = '';
    if (messageUser === username) {
      messageClass = "danger";
    } else {
      messageClass = "info";
    };
    //add message to the DOM
    const newmessage = templatemessages({ 'time': messageTime, 'user': messageUser, 'body': messageBody, 'messageclass': messageClass });
    document.querySelector('#messages').innerHTML += newmessage;
    //ensure the last message is visible
    document.querySelector('#messages').lastElementChild.scrollIntoView();
  };

});


