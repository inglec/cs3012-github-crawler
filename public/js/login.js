function signIn() {
    console.log("Attempting to sign in...");
    var provider = new firebase.auth.GithubAuthProvider();
    provider.addScope('repo'); // Request access to user's repos
    provider.setCustomParameters({
      'allow_signup': false
    });

    firebase.auth().signInWithPopup(provider).then(function(result) {
        var username = result.additionalUserInfo.username;
        var token = result.credential.accessToken;
        console.log("Successfully signed in with user " + username + ".");

        // Store data in session and redirect to main page.
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('token', token);
        location.href = "github-insite.html";
    }).catch(function(error) {
        console.log(error);
    });
}

function signOut() {
    console.log("Attempting to sign out...");
    firebase.auth().signOut().then(function() {
        console.log("Sign out successful.");

        // Clear session & redirect user back to login page.
        sessionStorage.clear();
        location.href = "index.html";
    }).catch(function(error) {
        console.log(error);
    });
}
