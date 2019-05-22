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

class Player {
    constructor(socket) {
        this.socket = socket;
        this.logged = false;
        this.ready = false;
    }

    logIn(name) {
        this.name = name;
        this.logged = true;
        loggedInPlayers.push(this);
        console.log("Player " + this.name + " logged in.");
    }

    logOut() {
        if (!this.logged) {
            console.log("Player was already logged out");
            return;
        }
        this.name = undefined;
        this.logged = false;
        var index = loggedInPlayers.indexOf(this);
        if (index == -1) {
            console.log("Player not found on players list while trying to log out.");
            return;
        }
        console.log("Player logged out");
        loggedInPlayers.splice(index, 1);
    }

    setReady(state) {
        this.ready = state;
        console.log("Player " + this.name + " is " + (this.ready ? "" : "not ") + "ready!");
    }
}


io.on('connection', (socket) => {

    console.log("Client connected");
    var player = new Player(socket);

    socket.on('log_in', (data, ack) => {
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
        player.setReady(data);


        //TODO: change to start with at least 2 players
        if (loggedInPlayers.length > 0 && loggedInPlayers.every((p) => p.ready)) {
            console.log("All players ready, starting match...");
            io.sockets.emit('start_match', {
                users: loggedInPlayers.map(p => p.name),

            });
        }
    });

    socket.on('disconnect', () => {
        player.logOut();
        console.log("Client disconnected");
    })
});
