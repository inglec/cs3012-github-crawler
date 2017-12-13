// Object to represent the logged in user.
var user = {
    username: sessionStorage.getItem('username'),
    userdata: null,
    repos: null,
    contributors: []
}

var maxDepth = 3; // max depth for collaborator search
var maxContributors = 3;

window.onload = function() {
    showHome();
    getMyUserData();

    $('#dropdown').text(user.username);
}

function getMyUserData() {
    console.log("Getting user data...");
    $.ajax({
        url: "https://api.github.com/users/" + user.username,
        method: "GET",
        data: {
            "access_token": sessionStorage.getItem('token')
        },
        success: function(data, textStatus, jqXHR) {
            console.log("Successfully fetched user data.");

            $('#user-github-link').attr("href", data.html_url);

            user.userdata = data;
            getMyRepos();
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
        }
    });
}

function getMyRepos() {
    console.log("Getting repos...");
    $.ajax({
        url: "https://api.github.com/user/repos",
        method: "GET",
        data: {
            "access_token": sessionStorage.getItem('token')
        },
        success: function(data, textStatus, jqXHR) {
            console.log("Successfully fetched user repos.");

            user.repos = data;
            getMyContributors();
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

function getMyContributors() {
    console.log("Getting contributors...");

    getContributors(user, 0);   // Begin crawl for contributors.
}

function Repos() {
    var html =  '<h1>My Repositories</h1>';
    html +=     '<table class="table table-striped">';
    for (var i in user.repos) {
        html += '<tr>';
        html += '<td><a href="' + user.repos[i].html_url + '">' + user.repos[i].name + '</a>';
        if (user.repos[i].owner.login !== user.username)
            html += ' <span class="badge badge-pill badge-secondary">' + user.repos[i].owner.login + '</span>';
        if (user.repos[i].private)
            html += ' <span class="badge badge-pill badge-info">Private</span>';
        html += '</td>';
        html += '</tr>';
    }
    html += '</table>';

    var windowWidth = $("#results").width();
    html += '<h3>My most commited to repositories:</h3>'
    html += '<svg width="' + windowWidth + '" height="' + 3*(windowWidth/5) + '"></svg>';

    $("#results").html(html);

    drawCommitsPieChart([{repo: null, commits: 1}]);  // Create default pie chart while waiting for data.

    // Get number of commits to each repo.
    var reposCommits = [];
    for (var i in user.repos) {
        reposCommits.push({"repo": user.repos[i].name, "commits": 0});
        setCommitCount(reposCommits, user.repos[i].url, reposCommits[i], i == user.repos.length-1); // update number of commits
    }
}

function setCommitCount(reposCommits, url, object, isLastCallback) {
    $.ajax({
        url: url + '/commits',
        method: "GET",
        data: {
            "access_token": sessionStorage.getItem('token')
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

function UserData() {
    var html =  '<div class="media">';
    html +=         '<img class="mr-3" src="' + user.userdata.avatar_url + '" alt="user image" width=50 height=50>';
    html +=         '<div class="media-body">';
    html +=             '<h1 class="mt-0">' + sessionStorage.getItem('username') + '</h1>';
    html +=         '</div>';
    html +=     '</div>';

    html += '<table class="table table-striped">';
    $.each(user.userdata, function(key, value){
        html += '<tr>';
        html += '<td>' + key + '</td>';
        html += '<td>' + value + '</td>';
        html += '</tr>';
    });
    html += '</table>';

    $("#results").html(html);
}

function showMyContributors() {
    var windowWidth = $("#results").width();
    var html = '<h1>My contributors:</h1>'
    html += '<svg width="' + windowWidth + '" height="' + windowWidth + '"></svg>';

    $("#results").html(html);

    var json = {
        nodes: [{name: user.username, group: 1}],
        links: []
    };

    for (var i in user.contributors)
        addContributorsToJSON(json, 0, user.contributors[i]);

    console.log(json);

    drawContributorGraph(json);
}

function addContributorsToJSON(json, prevIndex, u) {
    var index = getIndexOfNode(json, u);
    if (index == -1) {
        json.nodes.push({name: u.username, group: 1});
        index = json.nodes.length-1;
    }

    json.links.push({source: prevIndex, target: index, value: 1});

    for (var i in u.contributors)
        if (u.contributors.length > 0)
            addContributorsToJSON(json, index, u.contributors[i]);
}

function getIndexOfNode(json, u) {
    for (var i = 0; i < json.nodes.length; i++)
        if (json.nodes[i].name == u.username)
            return i;
    return -1;
}

function showHome() {
    var html = '<h1 id="welcome-user" class="display-3">Welcome, ' + sessionStorage.getItem('username') + '!</img></h1>';
    html += '<p class="lead">Use the tabs above to display various analytics about your GitHub account.</p>';

    $('#results').html(html);
}























function getReposAndContributors(u, depth) {
    if (depth < maxDepth) {
        // Get repos
        console.log("Getting repos for " + u.username + "...");
        $.ajax({
            url: "https://api.github.com/users/" + u.username + "/repos",
            method: "GET",
            data: {
                "access_token": sessionStorage.getItem('token')
            },
            success: function(data, textStatus, jqXHR) {
                console.log("Successfully fetched repos.")
                u.repos = data;

                getContributors(u, depth);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                 console.log(errorThrown);
            }
        });
    }
}

function getContributors(u, depth) {
    var contributors = 0;

    if (depth < maxDepth) {
        // Add each collaborator from each repo to user object.
        console.log("Getting contributors for user " + u.username + "...");
        for (var i in u.repos) {
            // Get contributors for repo.
            console.log("Getting contributors for repository " + u.repos[i].name);
            $.ajax({
                url: u.repos[i].contributors_url,
                method: "GET",
                data: {
                    "access_token": sessionStorage.getItem('token')
                },
                success: function(data, textStatus, jqXHR) {
                    console.log("Successfully fetched contributors.")
                    // Ignore repos with no other contributors.
                    if (data != null && data.length > 1)
                        for (var j in data)
                            if (data[j].login != u.username && isNewCollaborator(data[j].login, u.contributors)) {
                                // Add new user object as collaborator of current user and get their repos.
                                var newUser = {
                                    username: data[j].login,
                                    repos: null,
                                    contributors: []
                                };
                                u.contributors.push(newUser);


                                if (contributors < maxContributors) {
                                    getReposAndContributors(newUser, depth+1);
                                    contributors++;
                                }
                            }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                     console.log(errorThrown);
                }
            });
        }
    }
}

function isNewCollaborator(username, contributors) {
    for (var i in contributors) {
        if (username === contributors[i].username)
            return false;
    }
    return true;
}
