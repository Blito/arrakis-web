export default class Arrakis {

    constructor() {
        /* member declaration */
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
        this.rendering_cycle_id = true;

        // these contain the objects being rendered
        this.players = {};
        this.arrows = {};
        this.powerups = {};

        /* constructor */
        this.initTwoJS();
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

                // TODO: Get rendering out of onMessage!!
                var frame = JSON.parse(evt.data);

                frame.players.forEach(function(player) {
                    if (self.players['id'+player.id] == undefined) {
                        self.createPlayer(player);
                    } else {
                        self.drawPlayer(player);
                    }
                    self.markAsRendered(self.players['id'+player.id]);
                });
                // iterate over all stored players and delete the ones that haven't been rendered this frame (because they were deleted)
                for (var key in self.players) {
                    // skip loop if the property is from prototype
                    if (!self.players.hasOwnProperty(key)) continue;

                    if (!self.hasBeenRendered(self.players[key])) {
                        self.twoJS.remove(self.players[key].actor);
                        delete self.players[key];
                    }
                }

                // TODO: This behavior should be isolated in a single place, players, arrows and powerups work in the same way.
            // RENDER ARROWS
                // iterate over all incoming arrows and mark the stored ones as rendered
                frame.arrows.forEach(function(arrow) {
                    if (self.arrows['id'+arrow.id] == undefined) {
                        self.createArrow(arrow);
                    } else {
                        self.drawArrow(arrow);
                    }
                    self.markAsRendered(self.arrows['id'+arrow.id]);
                });
                // iterate over all stored arrows and delete the ones that haven't been rendered this frame (because they were deleted)
                for (var key in self.arrows) {
                    // skip loop if the property is from prototype
                    if (!self.arrows.hasOwnProperty(key)) continue;

                    console.log(self.arrows[key]);

                    if (!self.hasBeenRendered(self.arrows[key])) {
                        self.twoJS.remove(self.arrows[key].actor);
                        delete self.arrows[key];
                    }
                }

            // RENDER POWERUPS
                frame.powerups.forEach(function(powerup) {
                    if (self.powerups['id'+powerup.id] == undefined) {
                        self.createPowerUp(powerup);
                    } else {
                        self.drawPowerUp(powerup);
                    }
                    self.markAsRendered(self.powerups['id'+powerup.id]);
                });
                // iterate over all stored arrows and delete the ones that haven't been rendered this frame (because they were deleted)
                for (var key in self.powerups) {
                    // skip loop if the property is from prototype
                    if (!self.powerups.hasOwnProperty(key)) continue;

                    console.log(self.powerups[key]);

                    if (!self.hasBeenRendered(self.powerups[key])) {
                        self.twoJS.remove(self.powerups[key].actor);
                        delete self.powerups[key];
                    }
                }

                self.rendering_cycle_id = !self.rendering_cycle_id;
                self.twoJS.update();
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

    markAsRendered(obj) {
        obj['rendered'] = this.rendering_cycle_id;
    }

    hasBeenRendered(obj) {
        return obj['rendered'] === this.rendering_cycle_id;
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

// DRAWING : PLAYER
    createPlayer(player) {
        var playerHeight = 20.0;
        var playerWidth = 20.0;

        // new player, add it to hash
        if (this.players['id'+player.id] == undefined) {
            this.players['id'+player.id] = player;

            var path = this.twoJS.makePath(player.x, player.y,
                                           player.x + playerWidth/2.0, player.y + playerHeight/2.0,
                                           player.x, player.y + playerHeight,
                                           player.x - playerWidth/2.0, player.y + playerHeight/2.0, false);
            console.log(path);
            path.fill = '#FF8000';
            path.stroke = 'orangered'; // Accepts all valid css color
            path.linewidth = 5;

            this.players['id'+player.id]['actor'] = path;
        }
    }

    drawPlayer(player) {

        var playerHeight = 20.0;
        var playerWidth = 20.0;

        var stored_player = this.players['id' + player.id];
        var dx = player.x - stored_player.x;
        var dy = parseFloat(player.y) - stored_player.y;

        var path = stored_player['actor'];

        // head
        path._vertices[0]._x = player.x;
        path._vertices[0]._y = this.twoJS.height - player.y - 30.0 - playerHeight - 2.0 * dy;

        // left
        if (dy > 0.0) dy *= 3.0;
        var hand_height = this.twoJS.height - player.y - 30.0 - playerHeight * 0.5 - 2.0 * dy;
        path._vertices[1]._x = player.x + playerWidth * 0.5;
        path._vertices[1]._y = hand_height;

        // right
        path._vertices[3]._x = player.x - playerWidth * 0.5;
        path._vertices[3]._y = hand_height;

        // feet
        path._vertices[2]._x = player.x;
        path._vertices[2]._y = this.twoJS.height - player.y - 30.0;

        this.players['id' + player.id].x = player.x;
        this.players['id' + player.id].y = player.y;
    }

// DRAWING : ARROW
    createArrow(arrow) {
        var arrowRadius = 5.0;

        this.arrows['id'+arrow.id] = arrow;

        var circle = this.twoJS.makeCircle(arrow.x, arrow.y, arrowRadius);
        console.log(arrow);
        //console.log(circle);
        circle.fill = 'rgba(0, 200, 255, 0.75)';
        circle.stroke = '#1C75BC';
        circle.linewidth = 2;

        this.arrows['id'+arrow.id]['actor'] = circle;
    }

    drawArrow(arrow) {
        this.arrows['id'+arrow.id]['actor'].translation.set(arrow.x, this.twoJS.height - arrow.y);
    }

// DRAWING : POWERUP
    createPowerUp(powerup) {
        var polygonSize = 5.0;

        this.powerups['id'+powerup.id] = powerup;

        var triangle = this.twoJS.makePolygon(powerup.x, this.twoJS.height - powerup.y, polygonSize);
        triangle.fill = 'rgba(0, 200, 255, 0.75)';
        triangle.stroke = '#1C75BC';
        triangle.linewidth = 2;

        this.powerups['id'+powerup.id]['actor'] = triangle;
    }

    drawPowerUp(powerup) {
        this.powerups['id'+powerup.id]['actor'].rotation += 0.01;
    }

} // end arrakis
