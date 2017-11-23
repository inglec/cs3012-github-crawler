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

            var html = '<table class="table">';
            for (var i in data) {
                html += '<tr>';
                html += '<td><a href=' + data[i].html_url + '>' + data[i].name + '</a></td>';
                html += '</tr>';
            }
            html += '</table>'

            $("#results").html(html);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if (jqXHR.status === 401) {
                alert("Unauthorized!\nPlease sign in!");
                sessionStorage.clear();
                location.href = "index.html";
            }
            else {
                console.log(errorThrown);
            }
        }
    });
}

function showUserData() {
    var html = '<h1><img src=' + userData.avatar_url + ' style="width:60px; height:60px"></img> '+ username + '</h1>';
    html += '<table class="table">';
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
