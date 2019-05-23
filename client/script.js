
/*
socket.on('words', (words) => {
    console.log("Received words:");
    for (var i in words) {
        console.log(words[i]);
    }
});

*/
class Loader {
    constructor() {
        this.angle = 0;
        this.speed = 0.2;
    }

    show(x, y, size) {
        this.rotate();

        if (this.angle >= TWO_PI * 2)
            this.angle -= TWO_PI * 2;

        if (this.angle < TWO_PI)
            arc(x, y, size, size, 0, this.angle, PIE);
        else
            arc(x, y, size, size, this.angle % TWO_PI, TWO_PI, PIE);
    }

    rotate() {
        this.angle += this.speed;
    }
}

class Button {
    constructor(x, y, w, h) {
        this.text = "";
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color(0);
        this.textColor = color(255);
        this.onPressed = () => { };
    }

    mousePressed() {
        if (this.isHovering()) {
            this.onPressed();
        }
    }

    isHovering() {
        return mouseX >= this.x &&
            mouseX < this.x + this.w &&
            mouseY >= this.y &&
            mouseY < this.y + this.h;
    }

    show() {
        fill(this.color);
        rect(this.x, this.y, this.w, this.h);
        fill(this.textColor);
        textAlign(CENTER, CENTER);
        text(this.text, this.x + this.w / 2, this.y + this.h / 2);
        if (this.isHovering()) {
            fill(255, 150);
            rect(this.x, this.y, this.w, this.h);
        }
    }
}

var sceneManager;


var thisUser = null;

var userList = [];

class Player {
    constructor(name) {
        this.ready = null;
        this.score = null;
        this.name = name;
    }
}

var socket = io();


socket.on('connect', async function () {
    console.log("Connected to server.");
    thisUser = new Player(await inputUserName());
    console.log("Logged in with: " + thisUser.name);
    sceneManager.showScene(Menu);
});

socket.on('disconnect', () => {
    console.log("Disconnected to server, trying to reconnect...");
    //alert("Disconnected from server. Reloading page...");
    location.reload();
});


socket.on('start_match', () => {
    sceneManager.showScene(Match);
});


socket.on('user_list_lobby', (users) => {
    userList = [];
    for (var i in users) {
        var p = new Player(users[i].name);
        p.ready = users[i].ready;
        userList.push(p);
    }
});

function findUserIndexByName(name) {
    return userList.findIndex(u => u.name == name);
}

socket.on('update_user_lobby', (user) => {
    var p = [...userList, thisUser].find(u => u.name == user.name);
    if (p !== undefined) {
        p.ready = user.ready;
    }
});

socket.on('update_user_match', (user) => {
    var p = [...userList, thisUser].find(u => u.name == user.name);
    if (p !== undefined) {
        p.score = user.score;
    }
});

socket.on('add_user_lobby', (user) => {
    var p = new Player(user.name);
    userList.push(p);
});

socket.on('sub_user_lobby', (user) => {
    var userIndex = findUserIndexByName(user.name);
    userList.splice(userIndex, 1);
});


async function inputUserName() {

    var name;

    while (true) {
        name = prompt("Please enter your username", "alan");
        if (name === null)
            continue;
        var success = await new Promise(function (resolve, reject) {
            socket.emit('log_in', { name: name }, success => {
                console.log("Tried loggin: " + success);
                resolve(success);
            });
        });
        if (success)
            return name;
    }

}

function setup() {
    createCanvas(710, 400);

    sceneManager = new SceneManager();
    sceneManager.wire();
}

function draw() {


    if (thisUser !== null) {
        fill(100);
        textSize(20);
        textAlign(LEFT, TOP);
        text("Username: " + thisUser.name, 20, 20);
    }
}

function mousePressed() {
    screenItems[gameState].forEach(i => {
        i.mousePressed();
    });
}

function Menu() {

    var ready;
    var readyButton;

    this.setup = function () {
        readyButton = new Button(10, 10, 250, 40);
        readyButton.onPressed = () => {
            ready = !ready;
            socket.emit('ready_state', ready);
        };
    }

    this.draw = function () {
        background(51);

        noStroke();
        textSize(30);
        readyButton.textColor = color(255);
        readyButton.color = ready ? color(10, 255, 0) : color(255, 50, 0);
        readyButton.text = "I am " + (ready ? "" : "not ") + "ready";
        readyButton.show();


        var y = 100;
        var x = 100;
        textAlign(LEFT, CENTER);
        {
            textSize(30);
            var textColor = thisUser.ready ? color(255) : color(150);
            fill(textColor);
            text(thisUser.name, x, y);
            y += 15;
        }

        var userSeparation = 20;

        fill(0, 150);
        rect(x, y, 200, userList.length * userSeparation, 10, 10, 10, 10);

        y += userSeparation / 2;
        x += userSeparation / 2;

        for (var i in userList) {
            var user = userList[i];

            textSize(18);

            stroke(0);
            strokeWeight(2);
            fill(user.ready ? color(0, 255, 0) : color(255, 0, 0));
            circle(x, y, 10);

            noStroke();
            fill(user.ready ? color(255) : color(150));
            text(user.name, x + 20, y);

            y += userSeparation;
        }
    }

    this.mousePressed = function () {
        readyButton.mousePressed();
    }
}

function Match() {

    this.draw = function () {
        background(51);


        var y = 200;
        var x = 200;

        var userSeparation = 45;

        fill(0, 150);
        rect(x, y, 200, (userList.length + 1) * userSeparation + 20, 10, 10, 10, 10);

        y += 10;
        x += userSeparation / 2;

        textAlign(LEFT, TOP);

        //console.log(userList);

        var allUsers = [thisUser, ...userList];
        allUsers.sort((a, b) => a.score > b.score ? -1 : 1);

        for (var i in allUsers) {
            var user = allUsers[i];

            textSize(30);
            fill(255);
            text(user.name, x, y);

            textSize(15);
            fill(150, 150, 0);
            text(user.score, x, y + 30);

            y += userSeparation;
        }
    }

    this.mousePressed = function () {
        socket.emit('score', 10);
    }
}