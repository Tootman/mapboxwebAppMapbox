import firebase from "firebase";

export const User = function() {
  const email = document.getElementById("emailInput");
  const pw = document.getElementById("passwordInput");
  const msg = document.getElementById("Login-status-message");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginForm = document.getElementById("login-form");
  const auth = firebase.auth;

  function signIn() {
    auth()
      .signInWithEmailAndPassword(email.value, pw.value)
      .then(function(user) {
        console.log(user, "signed in!");
        userSignedIn();
      })
      .catch(function(error) {
        console.log("sorry couldn't sign in -  Error: " + error);
        alert("sorry couldn't sign in -  Error: " + error);
      });
  }

  function signOut() {
    firebase
      .auth()
      .signOut()
      .then(
        function() {
          // Sign-out successful.
          console.log("successfully signed out");
          userSignedOut();
        },
        function(error) {
          // An error happened.
          console.log("problem signing out - error: ", error);
        }
      );
  }

  function userSignedIn() {
    msg.innerHTML = "you are now signed in!";
    pw.innerHTML = null;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "block";
    loginForm.style.display = "none";
  }

  function userSignedOut() {
    msg.innerHTML = "Bye  - you have now signed out";
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
    loginForm.style.display = "block";
  }

  function testFunc() {
    console.log("testing only!");
    return "hello";
  }

  function testFunc2() {
    console.log("testing only - func2!");
  }

  const myOb = {
    myFunc: () => {
      const hello = () => "hello";
    }
  };

  function initLoginForm() {
    console.log("initLoginForm");
    if (firebase.auth().currentUser) {
      userSignedIn();
      console.log("user is logged in");
    } else {
      console.log("user is logged out");
      userSignedOut();
    }
  }

  return {
    btnLogin: signIn,
    btnLogout: signOut,
    testFunc: testFunc,
    initLoginForm: initLoginForm
  };
};
