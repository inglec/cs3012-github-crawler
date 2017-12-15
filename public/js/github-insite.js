// Object to represent the logged in user.
var user = {
    username: sessionStorage.getItem('username'),
    userdata: null,
    avatar_url: null,
    repos: null,
    contributors: []
}

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
            user.avatar_url = data.avatar_url;
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

            getContributors();
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
    html += '<svg id="pie-chart" width="' + windowWidth + '" height="' + 3*(windowWidth/5) + '"></svg>';

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
    var html = '<h1>My Contributors: <small class="text-muted">(Users Searched: '
        + MAX_CONTRIBUTORS + ', Limit Per User: ' + CONTRIBUTORS_PER_USER + ')</small></h1>';
    html += '<p>The graph will update as new data is received.</p>';
    html += '<svg id="graph" width="' + windowWidth + '" height="' + windowWidth + '"></svg>';
    $("#results").html(html);

    // Convert user object with contributor sub-objects to JSON for graphing.
    var json = {
        nodes: [{
            name: user.username,
            avatar_url: user.avatar_url,
            group: 1
        }],
        links: []
    }
    addContributorsToJSON(json, 0, user);

    drawContributorGraph(json);
}

const CONTRIBUTORS_PER_USER = 30; // Limit the number of connected users for each node

function addContributorsToJSON(json, source, u) {
    var target = getIndexOfNode(json, u);
    if (target == -1) { // New user
        var node = {
            name: u.username,
            avatar_url: u.avatar_url,
            group: 1
        }
        json.nodes.push(node);
        target = json.nodes.length-1;
    }

    var link = {
        source: source,
        target: target,
        value: 1
    }
    json.links.push(link);

    for (var i = 0; i < u.contributors.length && i < CONTRIBUTORS_PER_USER; i++)
        addContributorsToJSON(json, target, u.contributors[i]);
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






// Queues used for crawling contributors
var noRepos        = [];     // Queue containing users with no repos fetched.
var noContributors = [user]; // Queue containing users with no contributors fetched.

var contributorsProcessed = 0;
const MAX_CONTRIBUTORS = 20;

function getContributors() {
    while (noContributors.length > 0 && contributorsProcessed < MAX_CONTRIBUTORS) {
        // Get contributors for each user in queue (repos must have been fetched prior)
        var u = noContributors.shift(); // Dequeue user
        contributorsProcessed++;

        getUserContributors(u);
    }

    if (contributorsProcessed >= MAX_CONTRIBUTORS)
        console.log("Max node count exceeded.");
}

function getRepos() {
    while (noRepos.length > 0 && contributorsProcessed < MAX_CONTRIBUTORS) {
        // Get repos for each user in queue
        var u = noRepos.shift(); // Dequeue user
        getUserRepos(u);
    }
}

var reposSearched = 0;
var reposReceived = 0;

function getUserContributors(u) {
    for (var r = 0; r < u.repos.length; r++) {
        reposSearched++;
        var repo = u.repos[r];
        $.ajax({
            url: repo.contributors_url,
            method: "GET",
            data: {
                "access_token": sessionStorage.getItem('token')
            },
            success: function(contributors, textStatus, jqXHR) {
                reposReceived++;

                if (contributors == null)
                    return;

                for (var c = 0; c < contributors.length; c++) {
                    var newUser = {
                        username: contributors[c].login,
                        avatar_url: contributors[c].avatar_url,
                        repos: null,
                        contributors: []
                    }

                    if (newUser.username != u.username && isNewContributor(newUser.username, u.contributors)) {
                        u.contributors.push(newUser); // Add new user as contributor of current user.

                        if (contributorsProcessed < MAX_CONTRIBUTORS)
                            noRepos.push(newUser); // Add to queue of users needing repo requests.
                    }
                }

                // If SVG graph is on screen, update with new data.
                if (reposReceived == reposSearched && $('#graph').length > 0) {
                    showMyContributors();
                }

                getRepos(); // Process queue of users without repos.
            },
            error: function(jqXHR, textStatus, errorThrown) {
                 console.log(errorThrown);
            }
        });
    }
}

function isNewContributor(username, contributors) {
    for (var i = 0; i < contributors.length; i++)
        if (username === contributors[i].username)
            return false;
    return true;
}

function getUserRepos(u) {
    $.ajax({
        url: "https://api.github.com/users/" + u.username + "/repos",
        method: "GET",
        data: {
            "access_token": sessionStorage.getItem('token')
        },
        success: function(repos, textStatus, jqXHR) {
            u.repos = repos;

            if (contributorsProcessed < MAX_CONTRIBUTORS) {
                noContributors.push(u);
                getContributors(); // Process queue of users without contributors.
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
             console.log(errorThrown);
        }
    });
}
