function init() {
    setupCanvas();
}
function setupCanvas() {
    var containerCanvas = document.getElementById("containerCanvas");
    var divHeight = containerCanvas.clientHeight;
    var divWidth = containerCanvas.clientWidth;
    var body = document.body, html = document.documentElement;
    var height = Math.max(body.scrollHeight, body.offsetHeight,
            html.clientHeight, html.scrollHeight, html.offsetHeight);
    divHeight = height;
//    containerCanvas.style.height = height;
//    containerCanvas.style.width = divWidth;
    var canvas = document.getElementById("jpcanvas");
    var marco = 60;
    canvas.width = divWidth - marco;
    canvas.height = divHeight - marco;
    var ctx = canvas.getContext("2d");

    //ctx.rect(0, 0, canvas.width - marco, canvas.height);

    ctx.stroke();



}
function drawLine01(_canvas, _widthLine, _colorLine, _origCoord, _targetCoord) {
    localCtx = _canvas.getContext("2d");
    localCtx.beginPath();
    localCtx.lineWidth = _widthLine;
    localCtx.strokeStyle = _colorLine; // Green path
    localCtx.moveTo(_origCoord.x, _origCoord.y);
    localCtx.lineTo(_targetCoord.x, _targetCoord.y);
    localCtx.stroke();
}
function createPainting01(_canvas, _howManyLines) {
    for (i = 0; i < _howManyLines; i++) {
        orig = {
            x: getRandomInt(0, _canvas.width),
            y: getRandomInt(0, _canvas.height)
        };
        target = {
            x: getRandomInt(0, _canvas.width),
            y: getRandomInt(0, _canvas.height)
        };
        drawLine01(_canvas, 2, getRandomColor(), orig, target);
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
var colors = ["black", "white", "red"];
function getRandomColor() {
    return colors[Math.floor(Math.random() * (colors.length + 1 - 0)) + 0];
}