"use strict";

var arrakis = {

websocket: null,
is_pause_on: false,
debugTextArea: document.getElementById("debugTextArea"),

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
        this.debug("WebSocket state = " + websocket.readyState + " ( " + stateStr + " )");
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
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
},

drawScene: function drawScene() {
    // floor
    this.drawRect(0,30,500,30);

    // left wall
    this.drawRect(0,90,20,60);
},

drawRect: function drawRect(left_coord, top_coord, width, height) {
    //get a reference to the canvas
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");

    ctx.rect(left_coord,canvas.height-top_coord,width,height);
    ctx.fillStyle = 'black';
    ctx.fill();
},

drawCircle: function drawCircle(x, y) {
    //get a reference to the canvas
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");

    //draw a circle
    ctx.beginPath();
    ctx.arc(x, canvas.height - y, 10, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fillStyle = 'red';
    ctx.fill();
},

drawPlayer: function drawPlayer(player) {
    //get a reference to the canvas
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");

    //draw a circle
    ctx.beginPath();
    ctx.arc(player.x, canvas.height - player.y, 10, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fillStyle = this.status_to_color[player.status];
    ctx.fill();
},

drawArrow: function drawArrow(arrow) {
    //get a reference to the canvas
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");

    //draw a circle
    ctx.beginPath();
    ctx.arc(arrow.x, canvas.height - arrow.y, 4, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fillStyle = 'HotPink';
    ctx.fill();
},

drawPowerUp: function drawPowerUp(powerup) {
    //get a reference to the canvas
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");

    //draw a circle
    ctx.beginPath();
    ctx.arc(powerup.x, canvas.height - powerup.y, 10, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fillStyle = 'DarkGoldenRod';
    ctx.fill();
}

}; // end arrakis

document.onkeyup = arrakis.onKeyUp.bind(arrakis);
document.onkeydown = arrakis.onKeyDown.bind(arrakis);
