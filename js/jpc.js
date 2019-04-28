function init() {
  setupCanvas();
  JPPainter.createPaintingA(document.getElementById('jpcanvas'), Default.howManyLines(), Default.colorSet());
}

function setupCanvas() {
  var containerCanvas = document.getElementById("containerCanvas");
  var divHeight = containerCanvas.clientHeight;
  var divWidth = containerCanvas.clientWidth;
  var body = document.body,
    html = document.documentElement;
  var height = Math.max(body.scrollHeight, body.offsetHeight,
    html.clientHeight, html.scrollHeight, html.offsetHeight);
  divHeight = height;
  containerCanvas.style.height = height;
  containerCanvas.style.width = divWidth;
  var canvas = document.getElementById("jpcanvas");
  var marco = 0;
  canvas.width = divWidth - marco;
  canvas.height = divHeight - 130;
}
//
class Default {
  static howManyLines(){
    return 20000;
  }
  static colorSet(){
    return "BWR";
  }
}
//
class JPPainter {
  constructor() {}
  static drawLine(_canvas, _widthLine, _colorLine, _origCoord, _targetCoord, _colorSet) {
    let localCtx = _canvas.getContext("2d");
    localCtx.beginPath();
    localCtx.lineWidth = _widthLine;
    localCtx.strokeStyle = _colorLine;
    localCtx.shadowOffsetX = 1;
    localCtx.shadowOffsetY = 1;
    localCtx.shadowBlur = 1;
    localCtx.shadowColor = "gray";
    localCtx.moveTo(_origCoord.x, _origCoord.y);
    localCtx.lineTo(_targetCoord.x, _targetCoord.y);
    localCtx.stroke();
  }

  static createPaintingA(_canvas, _howManyLines, _colorSet) {
          _canvas.getContext("2d").clearRect(0, 0, _canvas.width, _canvas.height);
    for (let i = 0; i < _howManyLines; i++) {
      let orig = {
        x: Util.getRandomInt(0, _canvas.width),
        y: Util.getRandomInt(0, _canvas.height)
      };
      let target = {
        x: Util.getRandomInt(0, _canvas.width),
        y: Util.getRandomInt(0, _canvas.height)
      };
      JPPainter.drawLine(_canvas, 2, ColorHandler.getRandomColor(_colorSet), orig, target, _colorSet);
      JPPainter.paintMainTitle(_colorSet);
    }
  }
  /** // TODO: Implements another algorithm **/
  static createPaintingB(_canvas, _howManyLines, _colorSet) {
    for (let i = 0; i < _howManyLines; i++) {
      let orig = {
        x: Util.getRandomInt(0, _canvas.width),
        y: Util.getRandomInt(0, _canvas.height)
      };
      let target = {
        x: Util.getRandomInt(0, _canvas.width),
        y: Util.getRandomInt(0, _canvas.height)
      };
      drawLine(_canvas, 2, ColorHandler.getRandomColor(_colorSet), orig, target, _colorSet);
    }
  }
  static paintMainTitle(_colorSet) {
    let mainTitle = document.getElementById("mainTitle");
    let newMainTitle = "";
    switch (_colorSet) {

      case "BWR":
        newMainTitle = "<strong>";
        newMainTitle += "<span class='black'>J</span>";
        newMainTitle += "<span class='white'>P</span>";
        newMainTitle += "<span class='red'>Canvas</span>";
        newMainTitle += "</strong>";
        break;
      case "BWR2":
        newMainTitle = "<strong>";
        newMainTitle += "<span class='blue'>J</span>";
        newMainTitle += "<span class='white'>P</span>";
        newMainTitle += "<span class='red'>Canvas</span>";
        newMainTitle += "</strong>";
        break;
      case "RGB":
        newMainTitle = "<strong>";
        newMainTitle += "<span class='red'>J</span>";
        newMainTitle += "<span class='green'>P</span>";
        newMainTitle += "<span class='blue'>Canvas</span>";
        newMainTitle += "</strong>";
        break;
      default:
        newMainTitle = "<strong>JPCanvas</strong>"
    }


    mainTitle.innerHTML = newMainTitle;
  }
}
//
class Util {
  static getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}
//
class ColorSet {

  constructor() {
    /*  this.colorSets = {
        "BWR": ["black", "white", "red"],
        "RGB": ["blue", "green", "blue"],
        "BWR": ["blue", "white", "red"]
      };*/
  }

  static getColorSet(_name) {
    let colorSets = {
      "BWR": ["black", "white", "red"],
      "RGB": ["red", "green", "blue"],
      "BWR2": ["blue", "white", "red"]
    };
    return colorSets[_name];
  }
}
class ColorHandler {
  constructor() {}

  static getRandomColor(_colorSet) {
    let colorSet = ColorSet.getColorSet(_colorSet);
    return colorSet[Math.floor(Math.random() * (colorSet.length + 1 - 0)) + 0];
  }

}
