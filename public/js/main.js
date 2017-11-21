var username;
var token;

window.onload = function() {
    signOut();
}

function signIn() {
    console.log("Attempting to sign in to GitHub...");
    var provider = new firebase.auth.GithubAuthProvider();
    provider.addScope('repo'); // Request access to user's repos
    provider.setCustomParameters({
      'allow_signup': 'false'
    });

    firebase.auth().signInWithPopup(provider).then(function(result) {
        username = result.additionalUserInfo.username;
        token = result.credential.accessToken;
        console.log("Successfully signed in with user " + username + ".");
        $("#welcome").hide();
        $('#welcome-user').show();
        $("#navbar").show();
    }).catch(function(error) {
        console.log(error);
    });
}

function signOut() {
    console.log("Attempting to sign out from GitHub...");
    firebase.auth().signOut().then(function() {
        console.log("Sign out successful.");
        $("#welcome").show();
        $("#navbar").hide();
    }).catch(function(error) {
        console.log(error);
    });
}

function getUser() {
    $.ajax({
        url: "https://api.github.com/users/" + username,
        method: "GET",
        success: function(data, textStatus, jqXHR) {
            console.log("Successfully fetched user data:");
            console.log(data);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
        }
    });
}

function getRepos() {
    $.ajax({
        url: "https://api.github.com/user/repos",
        method: "GET",
        data: {
            "access_token": token
        },
        success: function(data, textStatus, jqXHR) {
            console.log("Successfully fetched user repos:");
            console.log(data);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
        }
    });
}
