var username;
var token;
var userData;

window.onload = function() {
    username = sessionStorage.getItem('username');
    token = sessionStorage.getItem('token');

    showHome();
    $('#dropdown').text(username);

    userData = getUserData();
}

function getUserData() {
    $.ajax({
        url: "https://api.github.com/users/" + username,
        method: "GET",
        data: {
            "access_token": token
        },
        success: function(data, textStatus, jqXHR) {
            console.log("Successfully fetched user data:");
            console.log(data);

            $('#user-github-link').attr("href", data.html_url);

            userData = data;
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
        }
    });
}

function showRepos() {
    $.ajax({
        url: "https://api.github.com/user/repos",
        method: "GET",
        data: {
            "access_token": token
        },
        success: function(data, textStatus, jqXHR) {
            console.log("Successfully fetched user repos:");
            console.log(data);

            var html =  '<h1>My Repositories</h1>';
            html +=     '<table class="table table-striped">';
            for (var i in data) {
                html += '<tr>';
                html += '<td><a href="' + data[i].html_url + '">' + data[i].name + '</a>';
                if (data[i].owner.login !== username)
                    html += ' <span class="badge badge-pill badge-secondary">' + data[i].owner.login + '</span>';
                if (data[i].private)
                    html += ' <span class="badge badge-pill badge-info">Private</span>';
                html += '</td>';
                html += '</tr>';
            }
            html += '</table>';

            html += '<p>Repository size (number of commits):</p>'
            html += '<svg width="960" height="500"></svg>';

            $("#results").html(html);

            drawCommitsPieChart([{repo: "Repo commits", commits: 1}]);

            var reposCommits = [];
            for (var i in data) {
                reposCommits.push({
                    "repo": data[i].name,
                    "commits": 0
                });
                setCommitCount(reposCommits, data[i].url, reposCommits[i], i == data.length-1); // update number of commits
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if (jqXHR.status === 401) {
                alert("Unauthorized!\nPlease sign in!");
                sessionStorage.clear();
                location.href = "index.html";
            }
            else console.log(errorThrown);
        }
    });
}

function setCommitCount(reposCommits, url, object, isLastCallback) {
    $.ajax({
        url: url + '/commits',
        method: "GET",
        data: {
            "access_token": token
        },
        success: function(data, textStatus, jqXHR) {
            object.commits = data.length;

            if (isLastCallback)
                drawCommitsPieChart(reposCommits);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if (jqXHR.status === 401) {
                alert("Unauthorized!\nPlease sign in!");
                sessionStorage.clear();
                location.href = "index.html";
            }
            else console.log(errorThrown);
        }
    });
}

function showUserData() {
    var html =  '<div class="media">';
    html +=         '<img class="mr-3" src="' + userData.avatar_url + '" alt="user image" width=50 height=50>';
    html +=         '<div class="media-body">';
    html +=             '<h1 class="mt-0">' + username + '</h1>';
    html +=         '</div>';
    html +=     '</div>';

    html += '<table class="table table-striped">';
    $.each(userData, function(key, value){
        html += '<tr>';
        html += '<td>' + key + '</td>';
        html += '<td>' + value + '</td>';
        html += '</tr>';
    });
    html += '</table>';

    $("#results").html(html);
}

function showHome() {
    var html = '<h1 id="welcome-user" class="display-3">Welcome, ' + username + '!</img></h1>';
    html += '<p class="lead">Use the tabs above to display various analytics about your GitHub account.</p>';

    $('#results').html(html);
}
