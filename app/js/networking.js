export class Networking {
    initWebSocket(serverLocation) {
        try {
            if (typeof MozWebSocket == 'function') {
                WebSocket = MozWebSocket;
            }
            if (this.websocket && this.websocket.readyState == 1) {
                this.websocket.close();
            }
            this.websocket = new WebSocket(serverLocation);
            var self = this;
            this.websocket.onopen = function(evt) {
                self.debug("CONNECTED");
                var msg = JSON.stringify({
                    "new-client": "InputClient"
                });
                self.debug(msg);
                self.websocket.send(msg);
                msg = JSON.stringify({
                    "new-client": "OutputClient"
                });
                self.debug(msg);
                self.websocket.send(msg);
            };
            this.websocket.onclose = function(evt) {
                self.debug("DISCONNECTED");
            };
            this.websocket.onmessage = function(evt) {
                //console.log( "Message received :", evt.data );
                self.debug('// ' + evt.data);

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
            this.websocket.onerror = function(evt) {
                self.debug('ERROR: ' + evt.data);
            };
        } catch (exception) {
            this.debug('ERROR: ' + exception);
        }
    },
}
