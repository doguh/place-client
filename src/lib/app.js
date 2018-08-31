const Api = require("./api");

let canvasElement;
let ctx;

async function init(parentElement) {
  const canvasData = await Api.getCanvasData();
  canvasElement = createCanvasElement(canvasData.width, canvasData.height);
  ctx = canvasElement.getContext("2d");
  fillCanvasWithData(canvasData);
  parentElement.appendChild(canvasElement);
}

function createCanvasElement(width, height) {
  const el = document.createElement("canvas");
  el.setAttribute("width", width);
  el.setAttribute("height", height);
  el.style.imageRendering = "optimizeSpeed";
  el.style.imageRendering = "-moz-crisp-edges";
  el.style.imageRendering = "-webkit-optimize-contrast";
  el.style.imageRendering = "optimize-contrast";
  el.style.imageRendering = "pixelated";
  el.style.msInterpolationMode = "nearest-neighbor";
  return el;
}

function fillCanvasWithData(canvasData) {
  const d = Buffer.from(canvasData.data, "base64");
  for (let i = 0; i < d.length; i++) {
    const color = d[i];
    const x = i % canvasData.width;
    const y = Math.floor(i / canvasData.height);
    ctx.fillStyle = canvasData.colors[color];
    ctx.fillRect(x, y, 1, 1);
  }
}

module.exports = init;
