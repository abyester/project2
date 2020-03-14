
//start by setting username and channel in global scope (so that it can be accessed from all functions)
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
  document.addEventListener("submit", event => {submitInput(event)});

  //switch socket on and connect
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
  socket.on('connect', () => {
  console.log("Socket now connected");
  }
  );

  // If no username stored, draw on no-username template below
  // Otherwise load tempate for that user
  if (username === null) {
    console.log(`No user name found ${username}`);
    noUser() 
    } else {
      loadUp();
  };

  function loadUp() {
  // Once username accepted load username elements
  loadUser(username);

  //once username is loaded, load channels  
  loadchannels();


  //If channel name stored, load it
  if (channel !== null) {
    loadchannel(channel)
  };

  //Listen for messages and enact function when received
  socket.on('json', jsondata => receivemessage(jsondata));
};

  //functions below

  function noUser() {
    //insert form that allows you to fill in username (template below)
    console.log("Entering No User Function");
    //insert html that allows user to select username
    document.querySelector('.username').innerHTML = document.querySelector('#no_username').innerHTML;
  };

  function checkUsername(username) {
    console.log("Entering checkUsername function");
        console.log("Username " + username + " submitted");

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
    //identify submit button (always next element along)
    submit = field.nextElementSibling;
    
    console.log("field is " + field);
    //todo - validate that there isn't someother random area
    if (field !== undefined) {
     
      if (field.value.length > 0) {
        submit.disabled = false;
       } else {
        submit.disabled = true;
    }
  }
};

  function submitInput(event) {
    field = event.target.id;
    switch (field) {
      case 'username_form':
        console.log("Submit logged in " + field);
        username = document.querySelector('#username_input').value;
        checkUsername(field);
        break;
      case 'channeldropdown_form':
        console.log("Submit logged in " + field);
        //leave existing room before new channel is set
        if (roomactive = true) leavechannel(channel);
        channel = document.querySelector('#dropdown_input').value;
        loadchannel(channel);
        break;
      case 'channelenter_form':
        console.log("Submit logged in " + field);
        //leave existing room before new channel is set
        if (roomactive = true) leavechannel(channel);
        channel = document.querySelector('#channel_input').value;
        loadchannel(channel);
        break;
      case 'textinput_form':
        console.log("Submit logged in " + field);
        message = document.querySelector('#text_input').value;
        sendmessage(message);
        break;
      default:
        console.log("Default case initiated!");
        break;
     }
     event.preventDefault();
  };


  function loadUser(username) {

    console.log("Entered loadUser function");

    //load "Welcome, user!" part of dom and set the username in local storage  
    const templateyesusername = Handlebars.compile(document.querySelector('#yes_username').innerHTML);
    const yesusername = templateyesusername({ 'username': username });
    document.querySelector('.username').innerHTML = yesusername;
    localStorage.setItem('username', username);

  };

  function loadchannels() {
    console.log("Entered loadchannels function");
    const request = new XMLHttpRequest();
    request.open('POST', "/channellist", false);
    request.onload = () => {
      const channels = JSON.parse(request.responseText);
      if (channels.length > 0) {
        console.log("Channels list is" + channels)

        //add channels to drop down list in the dom
        const channelslist = templatechannels({ 'channels': channels });
        document.querySelector('.choose-channel').innerHTML = channelslist;

        //enter newchannel form submission
        const newchannels = template_newchannels();
        document.querySelector('.enter-channel').innerHTML = newchannels;
      }


    }


    request.send();
  };

  // function awaitchannelchange() {
  //   //add event listeners
  //   document.querySelector('#channel_submit').addEventListener('click', () => submitchannel("channel"));
  //   document.querySelector('#dropdown_submit').addEventListener('click', () => submitchannel("dropdown"));
  // }

  function leavechannel(channel) {
    //clear any previous channel messages
    document.querySelector('#messages').innerHTML = '';

    //leave room in socket.io
    socket.emit('leave', {'username': username, 'room': channel});

    //reset room active to false (momentarily)
    roomactive =false;

  }

  function loadchannel(channel) {
    

    console.log("Channel " + channel + " submitted");

    //set channel name in memory
    localStorage.setItem('channel', channel);
    //reset textbox
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

          console.log(messageTime + " " + messageUser + " " + messageBody)

          const newmessage = templatemessages({ 'time': messageTime, 'user': messageUser, 'body': messageBody });
          document.querySelector('#messages').innerHTML += newmessage;
        }
      }
    }

    request.send();

    joinchannel(channel);

  };

  function joinchannel(channel) {
    //set template footer (where user enters messages)
    const templatefooter = template_footer({ 'username': username, 'channel': channel });
    document.querySelector('#footer').innerHTML = templatefooter;


    //join the selected channel
    socket.emit('join', { 'username': username, 'room': channel });
    roomactive = true;

    //load refreshed channel list
    loadchannels();

    };

    function sendmessage(message) {
      
      //get timestamp that will be sent with message
      const today = new Date();
      const timestamp = today.toLocaleTimeString();
      
      //create the javascript array that will be sent to the server (and json it)
      const messagearray = [timestamp, username, message, channel];
      const jsondata = JSON.stringify(messagearray);
      
      console.log("jsondata sent is " + jsondata);
      
      //send the data
      socket.emit('json', jsondata, channel);
      document.querySelector('#text_input').value = ''
    };



    // when a new message is received, add to the page
    function receivemessage(jsondata) {
      console.log("jsondate received is " + jsondata);
      
      const message = JSON.parse(jsondata);
      //break message into constituent parts
      const messageTime = message[0];
      const messageUser = message[1];
      const messageBody = message[2];
      console.log(messageTime + " " + messageUser + " " + messageBody);
      
      //create a card with the message in it and add to the DOM
      const newmessage = templatemessages({ 'time': messageTime, 'user': messageUser, 'body': messageBody });
      document.querySelector('#messages').innerHTML += newmessage;
    };

    



  


});


