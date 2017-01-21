import Arrakis from "js/arrakis.js";

let arrakis = new Arrakis();

document.body.onload = arrakis.resizeCanvas();
document.body.onresize = arrakis.resizeCanvas();

document.getElementById('connectButton').onclick = function() { arrakis.initWebSocket(document.getElementById('serverLocation').value); };
document.getElementById('disconnectButton').onclick = function() { arrakis.stopWebSocket(); };
document.getElementById('stateButton').onclick = function() { arrakis.checkSocket(); };

document.onkeyup = function(event) { arrakis.onKeyUp(event); };
document.onkeydown = function(event) { arrakis.onKeyDown(event); };
