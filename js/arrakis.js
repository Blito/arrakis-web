"use strict";

var arrakis = {

websocket: null,
is_pause_on: false,
debugTextArea: document.getElementById("debugTextArea"),
canvas: document.getElementById("myCanvas"),
ctx: document.getElementById("myCanvas").getContext("2d"),
rightPane: document.getElementById("rightPane"),

status_to_color: {
    "IDLE" : "red",
    "WALKING" : "blue",
    "AIRBORN" : "green",
    "DUCKING" : "black"
},

debug: function debug(message) {
    this.debugTextArea.value += message + "\n";
    this.debugTextArea.scrollTop = this.debugTextArea.scrollHeight;
},

resizeCanvas: function resizeCanvas() {
    this.canvas.height = window.innerHeight - 16;
    this.canvas.width = this.canvas.height * 4 / 3;

    this.rightPane.style.height = this.canvas.height + "px";
    this.rightPane.style.width = this.canvas.width + "px";

    this.debug("RESIZING");
},

sendMessage: function sendMessage() {
    var msg = document.getElementById("inputText").value;
    if ( this.websocket != null )
    {
        document.getElementById("inputText").value = "";
        this.websocket.send( msg );
        console.log( "string sent :", '"'+msg+'"' );
    }
},

initWebSocket: function initWebSocket() {
    try {
        if (typeof MozWebSocket == 'function') {
            WebSocket = MozWebSocket;
        }
        if ( this.websocket && this.websocket.readyState == 1 ) {
            this.websocket.close();
        }
        this.websocket = new WebSocket( document.getElementById("serverLocation").value );
        var self = this;
        this.websocket.onopen = function (evt) {
            self.debug("CONNECTED");
            var msg = JSON.stringify({"new-client":"InputClient"}); self.debug(msg);
            self.websocket.send(msg);
            msg = JSON.stringify({"new-client":"OutputClient"}); self.debug(msg);
            self.websocket.send(msg);
        };
        this.websocket.onclose = function (evt) {
            self.debug("DISCONNECTED");
        };
        this.websocket.onmessage = function (evt) {
            //console.log( "Message received :", evt.data );
            self.debug( '// ' + evt.data );

            self.clearCanvas();

            self.drawScene();

            var frame = JSON.parse(evt.data);
            frame.players.forEach(function(player) {
                self.drawPlayer(player);
            });

            frame.arrows.forEach(function(arrow) {
                self.drawArrow(arrow);
            });

            frame.powerups.forEach(function(powerup) {
                self.drawPowerUp(powerup);
            });
        };
        this.websocket.onerror = function (evt) {
            self.debug('ERROR: ' + evt.data);
        };
    } catch (exception) {
        this.debug('ERROR: ' + exception);
    }
},

stopWebSocket: function stopWebSocket() {
    if (this.websocket) {
        this.websocket.close();
    }
},

checkSocket: function checkSocket() {
    if (this.websocket != null) {
        var stateStr;
        switch (websocket.readyState) {
            case 0: {
                stateStr = "CONNECTING";
                break;
            }
            case 1: {
                stateStr = "OPEN";
                break;
            }
            case 2: {
                stateStr = "CLOSING";
                break;
            }
            case 3: {
                stateStr = "CLOSED";
                break;
            }
            default: {
                stateStr = "UNKNOWN";
                break;
            }
        }
        this.debug("WebSocket state = " + this.websocket.readyState + " ( " + stateStr + " )");
    } else {
        this.debug("WebSocket is null");
    }
},

onKeyDown: function onKeyDown(event) {
    var char = event.which || event.keyCode;

    if ( this.websocket != null )
    {
        var action_to_send;
        switch(char) {
            case 87:  // w
            action_to_send = "UP";
            break;
            case 83:  // s
            action_to_send = "DOWN";
            break;
            case 65:  // a
            action_to_send = "LEFT";
            break;
            case 68:  // d
            action_to_send = "RIGHT";
            break;
            case 74:  // j
            action_to_send = "AIM";
            break;
            case 75:  // k
            action_to_send = "JUMP";
            break;
            case 76:  // l
            action_to_send = "DASH";
            break;
        }
        if (action_to_send !== undefined) {
            this.websocket.send(JSON.stringify({action:action_to_send}));
        }
        if (char == 80 || char == 112) { // P
            action_to_send = "PAUSE";
            if (this.is_pause_on) {
                this.websocket.send(JSON.stringify({"action-stopped":action_to_send}));
                this.is_pause_on = false;
            } else {
                this.websocket.send(JSON.stringify({action:action_to_send}));
                this.is_pause_on = true;
            }
        }
    }
},

onKeyUp: function onKeyUp(event) {
    var char = event.which || event.keyCode;

    if ( this.websocket != null )
    {
        var action_to_send;
        switch(char) {
            case 87:  // w
            action_to_send = "UP";
            break;
            case 83:  // s
            action_to_send = "DOWN";
            break;
            case 65:  // a
            action_to_send = "LEFT";
            break;
            case 68:  // d
            action_to_send = "RIGHT";
            break;
            case 74:  // j
            action_to_send = "AIM";
            break;
            case 75:  // k
            action_to_send = "JUMP";
            break;
            case 76:  // l
            action_to_send = "DASH";
            break;
        }
        if (action_to_send !== undefined) {
            this.websocket.send(JSON.stringify({"action-stopped":action_to_send}));
        }
        console.log( "Key pressed.");
    }
},

clearCanvas: function clearCanvas() {
    //get a reference to the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
},

drawScene: function drawScene() {
    // floor
    this.drawRect(0,30,500,30);

    // left wall
    this.drawRect(0,90,20,60);
},

drawRect: function drawRect(left_coord, top_coord, width, height) {
    this.ctx.rect(left_coord,this.canvas.height-top_coord,width,height);
    this.ctx.fillStyle = 'black';
    this.ctx.fill();
},

drawCircle: function drawCircle(x, y) {
    //draw a circle
    this.ctx.beginPath();
    this.ctx.arc(x, this.canvas.height - y, 10, 0, Math.PI*2, true);
    this.ctx.closePath();
    this.ctx.fillStyle = 'red';
    this.ctx.fill();
},

drawPlayer: function drawPlayer(player) {
    //draw a circle
    this.ctx.beginPath();
    this.ctx.arc(player.x, this.canvas.height - player.y, 10, 0, Math.PI*2, true);
    this.ctx.closePath();
    this.ctx.fillStyle = this.status_to_color[player.status];
    this.ctx.fill();
},

drawArrow: function drawArrow(arrow) {
    //draw a circle
    this.ctx.beginPath();
    this.ctx.arc(arrow.x, this.canvas.height - arrow.y, 4, 0, Math.PI*2, true);
    this.ctx.closePath();
    this.ctx.fillStyle = 'HotPink';
    this.ctx.fill();
},

drawPowerUp: function drawPowerUp(powerup) {
    //draw a circle
    this.ctx.beginPath();
    this.ctx.arc(powerup.x, this.canvas.height - powerup.y, 10, 0, Math.PI*2, true);
    this.ctx.closePath();
    this.ctx.fillStyle = 'DarkGoldenRod';
    this.ctx.fill();
}

}; // end arrakis

document.onkeyup = arrakis.onKeyUp.bind(arrakis);
document.onkeydown = arrakis.onKeyDown.bind(arrakis);
