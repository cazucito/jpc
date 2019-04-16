function init() {
  setupCanvas();
}
function setupCanvas() {
  var containerCanvas = document.getElementById("containerCanvas");
  var divHeight = containerCanvas.clientHeight;
  var divWidth = containerCanvas.clientWidth;
  if (divHeight < 500) {
    divHeight = 600;
  }

  var body = document.body,
          html = document.documentElement;

  var height = Math.max(body.scrollHeight, body.offsetHeight,
          html.clientHeight, html.scrollHeight, html.offsetHeight);
  console.log(height);
  containerCanvas.style.height = height;
  containerCanvas.style.width = divWidth;
  console.log(JSON.stringify(divHeight));
  console.log(JSON.stringify(divWidth));
  var canvas = document.getElementById("jpcanvas");
  canvas.width = divWidth;
  canvas.height = divHeight;
  var ctx = canvas.getContext("2d");
  var marco = 10;
  ctx.rect(marco, marco, canvas.width - marco, canvas.height - marco);
  ctx.stroke();



}
