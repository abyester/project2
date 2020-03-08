
  document.addEventListener('DOMContentLoaded', () => {

    // Start by checking for username
    var username = localStorage.getItem('username');
    // If no username, draw on no-username template below
      if (username === null) {
        document.querySelector('.username').innerHTML =
        document.querySelector('.no_username').innerHTML;
      } else {
        document.querySelector('.username').innerHTML =
        Handlebars.compile(document.querySelector('.yes_username').innerHTML);
      }
    });
