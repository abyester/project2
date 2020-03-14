
//start by setting username and channel in global scope (so that it can be accessed from all functions)
var username = localStorage.getItem('username');
var channel = localStorage.getItem('channel');

document.addEventListener('DOMContentLoaded', () => {

  //Set up handlebars templates
  const templatemessages = Handlebars.compile(document.querySelector('#channel_messages').innerHTML);
  const templatechannels = Handlebars.compile(document.querySelector('#channel_dropdown').innerHTML);
  const template_newchannels = Handlebars.compile(document.querySelector('#channel_enter').innerHTML);
  const template_footer = Handlebars.compile(document.querySelector('#footer_enterbox').innerHTML);


  //event handler for key entry
  document.addEventListener("keyup", inputValid(event));

  // If no username stored, draw on no-username template below
  // Otherwise load tempate for that user
  if (username === undefined) {
    console.log("No user name found " + username);
    noUser()
  };

  // Once username accepted load username elements
  loadUser(username);

  //once username is loaded, load channels  
  loadchannels();

  //switch socket on and connect
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
  socket.on('connect', () => {
    console.log("Socket now connected");
  }
  );

  //If channel name stored, load it
  if (!(channel === undefined)) loadchannel(channel);

  //set up event listeners for channel change    
  awaitchannelchange();


  function noUser() {
    //insert form that allows you to fill in username (template below)
    console.log("Entering No User Function");
    //insert html that allows user to select username
    document.querySelector('.username').innerHTML = document.querySelector('#no_username').innerHTML;

    if (document.querySelector('#username_form')) {
      document.querySelector('#username_form').onsubmit = () => {

        username = document.querySelector('#username_input').value;

        console.log("Username " + username + " submitted");

        const request = new XMLHttpRequest();
        request.open('POST', `users/${username}`);
        request.onload = () => {
          const valid_username = request.responseText;
          console.log("Server response: " + valid_username);
          if (valid_username == "valid") {
            return;
          } else {
            return noUser();
          };

        }
      }

      request.send();
      return false;
    }
  }

  function inputValid(event) {
    idfield = event.target.id;
    //todo - validate that there isn't someother random area
    //submit button is always in the next element along
    if (idfield !== undefined) {
      submit = field.nextElementSibling;
      console.log(`Testing key strokes against #${idfield} and sibling #${submit}`);

      if (document.querySelector(`#${idField}`).value.length > 0)
        document.querySelector(`#${submit}`).disabled = false;
      else
        document.querySelector(`#${submit}`).disabled = true;
    }
  }

  //clear fields after submit
  //document.querySelector(`#${idField}_input`).value = '';
  //document.querySelector(`#${idField}_submit`).disabled = true;
  //}


  function loadUser(username) {

    console.log("Entered loadUser function");

    //load "Welcome, user!" part of dom and set the username in local storage  
    const templateyesusername = Handlebars.compile(document.querySelector('#yes_username').innerHTML);
    const yesusername = templateyesusername({ 'username': username });
    document.querySelector('.username').innerHTML = yesusername;
    localStorage.setItem('username', username);

  }

  function loadchannels() {
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
  }

  function awaitchannelchange() {
    //add event listeners
    document.querySelector('#channel_submit').addEventListener('click', () => submitchannel("channel"));
    document.querySelector('#dropdown_submit').addEventListener('click', () => submitchannel("dropdown"));
  }


  function submitchannel(entered) {
    //clear any previous channel messages
    document.querySelector('#messages').innerHTML = '';

    //check what channel was selected by the user (either by dropdown or textbox route)


    console.log("Channel " + channel + " submitted");

    //set channel name in memory
    localStorage.setItem('channel', channel);
    //reset textbox
    document.querySelector('#channel_input').value = '';
    //load refreshed channel list
    loadchannels();
    //disconnect previous chat session

    loadchannel(channel);

  }

  function loadchannel(channel) {

    //open messages stored on server
    const request = new XMLHttpRequest();
    request.open('POST', `users/${username}/${channel}`);
    request.onload = () => {
      const messages = JSON.parse(request.responseText);
      console.table(messages)
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

  }

  function joinchannel(channel) {
    //set template footer (where user enters messages)
    const templatefooter = template_footer({ 'username': username, 'channel': channel });
    document.querySelector('#footer').innerHTML = templatefooter;


    //join the selected channel
    socket.emit('join', { 'username': username, 'room': channel });



    //get message
    document.querySelector('#text_submit').onclick = () => {
      //send chat messages to that channel
      const message = document.querySelector('#text_input').value;
      const today = new Date();
      const timestamp = today.toLocaleTimeString();
      const messagearray = [timestamp, username, message, channel];
      const jsondata = JSON.stringify(messagearray);
      console.log("jsondata sent is " + jsondata);
      socket.emit('json', jsondata, channel);
      document.querySelector('#text_input').value = ''
    };



    // when a new message is received, add to the page
    socket.on('json', jsondata => {
      console.log("jsondate received is " + jsondata);
      const message = JSON.parse(jsondata);
      const messageTime = message[0];
      const messageUser = message[1];
      const messageBody = message[2];
      console.log(messageTime + " " + messageUser + " " + messageBody);
      const newmessage = templatemessages({ 'time': messageTime, 'user': messageUser, 'body': messageBody });
      console.log(newmessage);
      document.querySelector('#messages').innerHTML += newmessage;
    }

    );



  }


});


