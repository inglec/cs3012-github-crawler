// Object to represent the logged in user.
var user = {
    username: sessionStorage.getItem('username'),
    userdata: null,
    repos: null,
    contributors: []
}

var nodeCount = 1;
var maxNodes = 100;

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

    addContributorsFromRepo(user, 0);   // Begin crawl for contributors.
}

function showMyRepos() {
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

function showMyUserData() {
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

    for (var i = 0; i < user.contributors.length; i++)
        addContributorsToJSON(json, 0, user.contributors[i]);

    // console.log(json);

    drawContributorGraph(json);
}

function addContributorsToJSON(json, prevIndex, u) {
    var index = getIndexOfNode(json, u);
    if (index == -1) {
        json.nodes.push({name: u.username, group: 1});
        index = json.nodes.length-1;
    }

    json.links.push({source: prevIndex, target: index, value: 1});

    for (var i = 0; i < u.contributors.length; i++)
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























function getRepos(contributors, index) {
    var u = contributors[index];

    if (u == null) return;  // user has no contributors

    // Get repos
    // console.log("Getting repos for " + u.username + "...");
    $.ajax({
        url: "https://api.github.com/users/" + u.username + "/repos",
        method: "GET",
        data: {
            "access_token": sessionStorage.getItem('token')
        },
        success: function(data, textStatus, jqXHR) {
            u.repos = data;

            if (index+1 < contributors.length)
                getRepos(contributors, index+1);
            else { // Finished getting repos for each contributor
                // Get contributors of each contributor
                for (var i = 0; i < contributors.length; i++)
                    addContributorsFromRepo(contributors[i], 0);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
             console.log(errorThrown);
        }
    });

}

function addContributorsFromRepo(u, index) {
    var repo = u.repos[index];

    if (repo == null) return;   // user has no repos

    // Get contributors for repo.
    // console.log("Getting contributors for repository " + repo.name);
    $.ajax({
        url: repo.contributors_url,
        method: "GET",
        data: {
            "access_token": sessionStorage.getItem('token')
        },
        success: function(data, textStatus, jqXHR) {
            if (data != null) {
                var contributors = data;

                for (var i = 0; (i < contributors.length) && (nodeCount < maxNodes); i++) {
                    if (u.username != contributors[i].login && isNewContributor(contributors[i].login, u.contributors)) {
                        var newUser = {
                            username: contributors[i].login,
                            repos: null,
                            contributors: []
                        }

                        u.contributors.push(newUser);
                        nodeCount++;
                    }
                }
            }

            if (nodeCount < maxNodes) {
                if (index+1 < u.repos.length)
                    addContributorsFromRepo(u, index+1); // Add contributors from next repo.
                else // finished adding contributors for this user.
                    getRepos(u.contributors, 0)
            }
            else console.log("NODE COUNT EXCEEDED!");
        },
        error: function(jqXHR, textStatus, errorThrown) {
             console.log(errorThrown);
        }
    });

}

function isNewContributor(username, contributors) {
    for (var i = 0; i < contributors.length; i++) {
        if (username === contributors[i].username)
            return false;
    }
    return true;
}
