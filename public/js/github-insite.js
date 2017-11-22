var username;
var token;

window.onload = function() {
    username = sessionStorage.getItem('username');
    token = sessionStorage.getItem('token');

    $('#welcome-user').text("Welcome " + username + "!");
}

function getUser() {
    $.ajax({
        url: "https://api.github.com/users/" + username,
        method: "GET",
        success: function(data, textStatus, jqXHR) {
            console.log("Successfully fetched user data:");
            console.log(data);

            var html = '<h1><img src=' + data.avatar_url + ' style="width:60px; height:60px"></img> '+ username + '</h1>';
            html += '<table class="table">';
            $.each(data, function(key, value){
                html += '<tr>';
                html += '<td>' + key + '</td>';
                html += '<td>' + value + '</td>';
                html += '</tr>';
            });
            html += '</table>';

            $("#results").html(html);
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
