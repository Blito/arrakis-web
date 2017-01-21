export default class Arrakis {

    constructor() {
        this.websocket = null;
        this.is_pause_on = false;
        this.debugTextArea = document.getElementById("debugTextArea");
        //this.canvas = document.getElementById("myCanvas");
        //this.ctx = document.getElementById("myCanvas").getContext("2d");
        this.rightPane = document.getElementById("rightPane");

        this.status_to_color = {
            "IDLE" : "red",
            "WALKING" : "blue",
            "AIRBORN" : "green",
            "DUCKING" : "black"
        };

        this.twoJS = null;
        this.initTwoJS();

        this.players = {};
    }

    debug(message) {
        this.debugTextArea.value += message + "\n";
        this.debugTextArea.scrollTop = this.debugTextArea.scrollHeight;
    }

    resizeCanvas() {
        /*this.canvas.height = window.innerHeight - 16;
        this.canvas.width = this.canvas.height * 4 / 3;

        this.rightPane.style.height = this.canvas.height + "px";
        this.rightPane.style.width = this.canvas.width + "px";*/

        this.debug("RESIZING");
    }

// NETWORKING

    initWebSocket(serverLocation) {
        try {
            if (typeof MozWebSocket == 'function') {
                WebSocket = MozWebSocket;
            }
            if ( this.websocket && this.websocket.readyState == 1 ) {
                this.websocket.close();
            }
            this.websocket = new WebSocket( serverLocation );
            var self = this;
            this.websocket.onopen = function (evt) {
                self.debug("CONNECTED");
                var msg = JSON.stringify({"new-client":"InputClient"}); self.debug(msg);
                self.websocket.send(msg);
                msg = JSON.stringify({"new-client":"OutputClient"}); self.debug(msg);
                self.websocket.send(msg);

                // This was moved to index.js, since I couldn't fix it fast
                //document.onkeyup = arrakis.onKeyUp.bind(self);
                //document.onkeydown = arrakis.onKeyDown.bind(self);
            };
            this.websocket.onclose = function (evt) {
                self.debug("DISCONNECTED");
            };
            this.websocket.onmessage = function (evt) {
                //console.log( "Message received :", evt.data );
                self.debug( '// ' + evt.data );

                //self.clearCanvas();

                //self.drawScene();

                var frame = JSON.parse(evt.data);
                frame.players.forEach(function(player) {
                    self.drawPlayer(player);
                });

                frame.arrows.forEach(function(arrow) {
                    //self.drawArrow(arrow);
                });

                frame.powerups.forEach(function(powerup) {
                    //self.drawPowerUp(powerup);
                });

            };
            this.websocket.onerror = function (evt) {
                self.debug('ERROR: ' + evt.data);
            };
        } catch (exception) {
            this.debug('ERROR: ' + exception);
        }
    }

    stopWebSocket() {
        if (this.websocket) {
            this.websocket.close();
        }
    }

    checkSocket() {
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
    }

    onKeyDown(event) {
        var char = event.which || event.keyCode;
        console.log("Key Down");
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
    }

    onKeyUp(event) {
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
    }

    clearCanvas() {
        //get a reference to the canvas
        //this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

// DRAWING

    initTwoJS() {
        var params = {
          height: window.innerHeight - 16,
          weight: (window.innerHeight - 16) * 4 / 3,
          type: Two.Types.canvas,
          autostart: true };
        this.twoJS = new Two(params).appendTo(this.rightPane);
        console.log(this.twoJS);
    }

    drawScene() {
        // floor
        this.drawRect(0,30,500,30);

        // left wall
        this.drawRect(0,90,20,60);
    }

    drawRect(left_coord, top_coord, width, height) {
        this.ctx.rect(left_coord,this.canvas.height-top_coord,width,height);
        this.ctx.fillStyle = 'black';
        this.ctx.fill();
    }

    drawPlayer(player) {
        //draw a circle
        console.log(player);

        // new player
        if (this.players['id'+player.id] == undefined) {
          this.players['id'+player.id] = player;

          var circle = this.twoJS.makeCircle(player.x, player.y, 15);
          circle.fill = '#FF8000';
          circle.stroke = 'orangered'; // Accepts all valid css color
          circle.linewidth = 5;

          this.players['id'+player.id]['actor'] = circle;
        }
        // existing player
        else {
          this.players['id'+player.id]['actor'].translation.set(player.x, player.y);
        }

        this.twoJS.update();
    }

    drawArrow(arrow) {
        //draw a circle
        this.ctx.beginPath();
        this.ctx.arc(arrow.x, this.canvas.height - arrow.y, 4, 0, Math.PI*2, true);
        this.ctx.closePath();
        this.ctx.fillStyle = 'HotPink';
        this.ctx.fill();
    }

    drawPowerUp(powerup) {
        //draw a circle
        this.ctx.beginPath();
        this.ctx.arc(powerup.x, this.canvas.height - powerup.y, 10, 0, Math.PI*2, true);
        this.ctx.closePath();
        this.ctx.fillStyle = 'DarkGoldenRod';
        this.ctx.fill();
    }

} // end arrakis
