var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static('client'));

//Get the words list
var words = [
    "casa",
    "piso",
    "techo",
    "ventana",
    "puerta",
    "picaporte",
    "flor",
];

//Starts the server
server.listen(8080, function () {
    console.log('Server running on http://localhost:8080');
});

var loggedInPlayers = [];
var matchStarted = false;

class Player {
    constructor(socket) {
        this.socket = socket;
        this.logged = false;
        this._ready = false;
        this._score = 0;
    }

    logIn(name) {
        this.name = name;
        this.logged = true;

        //tells clients that a user joined
        io.sockets.emit('add_user_lobby', { name: this.name });

        //sends to this client all the users and their ready states
        this.socket.emit('user_list_lobby', loggedInPlayers.map(p => {
            return { name: p.name, ready: p.ready };
        }));

        //adds user to the logged list
        loggedInPlayers.push(this);

        console.log("Player " + this.name + " logged in.");
    }

    logOut() {
        if (!this.logged) {
            console.log("Player was already logged out");
            return;
        }

        this.logged = false;

        //tells clients that a user left
        io.sockets.emit('sub_user_lobby', { name: this.name });

        //remove player from logged list
        var index = loggedInPlayers.indexOf(this);
        if (index == -1) {
            console.log("Player not found on players list while trying to log out.");
            return;
        }

        console.log("Player logged out");
        loggedInPlayers.splice(index, 1);
    }

    set score(points) {
        this._score = points;

        io.sockets.emit('update_user_match', { name: this.name, score: this.score });
        console.log("Player " + this.name + " has " + this.score + " points!");
    }
    get score() {
        return this._score;
    }

    set ready(state) {
        this._ready = state;

        io.sockets.emit('update_user_lobby', { name: this.name, ready: this.ready });
        console.log("Player " + this.name + " is " + (this.ready ? "" : "not ") + "ready!");
    }
    get ready() {
        return this._ready;
    }


}

io.on('connection', (socket) => {

    console.log("Client connected");
    var player = new Player(socket);

    socket.on('log_in', (data, ack) => {
        if (matchStarted) {
            ack(false);
            return;
        }
        var userName = data.name;
        if (loggedInPlayers.some(p => p.name == userName)) {
            console.log("Player with name " + userName + " already exists");
            ack(false);
            return;
        }

        player.logIn(data.name);
        ack(true);

    });

    socket.on('log_out', () => {
        player.logOut();
    });

    socket.on('ready_state', (data) => {
        player.ready = data;

        io.sockets.emit('user_update_lobby', { name: player.name, ready: player.ready });

        //TODO: change to start with at least 2 players
        if (loggedInPlayers.length > 0 && loggedInPlayers.every((p) => p.ready)) {
            console.log("All players ready, starting match...");
            for (var i in loggedInPlayers) {
                var p = loggedInPlayers[i];
                io.sockets.emit('update_user_match', { name: p.name, score: p.score })
            }
            matchStarted = true;
            io.sockets.emit('start_match');
        }
    });

    socket.on('score', (points) => {
        player.score += points;
    });

    socket.on('disconnect', () => {
        player.logOut();
        console.log("Client disconnected");
    })
});
