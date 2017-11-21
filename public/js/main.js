window.onload = function() {
    var provider = new firebase.auth.GithubAuthProvider();
    provider.addScope('repo'); // Request access to user's repos
    provider.setCustomParameters({
      'allow_signup': 'false'
    });

    firebase.auth().signInWithPopup(provider).then(function(result) {
        console.log("Successfully signed in with user " + result.additionalUserInfo.username + ".");
        var token = result.credential.accessToken;
        var user = result.user;
    }).catch(function(error) {
        console.log(error);
    });
}

function signOut() {
    firebase.auth().signOut().then(function() {
        console.log("Sign out successful!");
    }).catch(function(error) {
        console.log(error);
    });
}
