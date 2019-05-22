
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


var userName;
var usersInMatch;

var socket = io();


socket.on('connect', async function () {
    console.log("Connected to server.");
    userName = await inputUserName();
    console.log("Logged in with: " + userName);
    sceneManager.showScene(Menu);
});

socket.on('disconnect', () => {
    console.log("Disconnected to server, trying to reconnect...");
    //alert("Disconnected from server. Reloading page...");
    location.reload();
});

socket.on('start_match', (data) => {
    usersInMatch = [...data.users];
    sceneManager.showScene(Match);
});



async function inputUserName() {

    var name;

    while (true) {
        name = prompt("Please enter your username", "alan");
        if (name == null)
            continue;
        var success = await new Promise(function (resolve, reject) {
            socket.emit('log_in', { name: name }, success => {
                if (success)
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


    if (userName !== undefined) {
        fill(100);
        textSize(20);
        textAlign(LEFT, TOP);
        text("Username: " + userName, 20, 20);
    }

    if (gameState === GameState.lobbyMenu) {

        //shows ready button

    }

    if (gameState === GameState.match) {
    }

    /*
      stroke(255);
      if (mouseIsPressed === true) {
        line(mouseX, mouseY, pmouseX, pmouseY);
      }
      */

    fill(50);
    textSize(20);
    textAlign(LEFT, TOP);
    text("Game state: " + gameState, 20, 40);
    //console.log(gameState);
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
        readyButton = new Button(100, 100, 300, 50);
        readyButton.onPressed = () => {
            ready = !ready;
            socket.emit('ready_state', ready);
        };
    }

    this.draw = function () {
        background(0);

        noStroke();
        textSize(30);
        readyButton.textColor = color(255);
        readyButton.color = ready ? color(10, 255, 0) : color(255, 50, 0);
        readyButton.text = "I am " + (ready ? "" : "not ") + "ready";
        readyButton.show();
    }

    this.mousePressed = function () {
        readyButton.mousePressed();
    }
}

function Match() {

    this.draw = function () {
        background(0);

        if (usersInMatch !== undefined) {
            textAlign(LEFT, TOP);
            for (var i in usersInMatch) {
                text(usersInMatch[i], 10, i * 30 + 50);
            }
        }
    }
}