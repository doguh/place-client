const Api = require("./api");
const getMousePos = require("../helpers/getCanvasMousePosition");

let canvasElement;
let ctx;

let COLORS, WIDTH, HEIGHT;

async function init(parentElement) {
  const canvasData = await Api.getCanvasData();
  COLORS = canvasData.colors;
  HEIGHT = canvasData.height;
  WIDTH = canvasData.width;
  canvasElement = createCanvasElement(WIDTH, HEIGHT);
  ctx = canvasElement.getContext("2d");
  fillCanvasWithData(canvasData.data);
  parentElement.appendChild(canvasElement);
  canvasElement.addEventListener("mousedown", onClickCanvas);
  Api.subscribe(updatePixel);
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

function fillCanvasWithData(data) {
  const d = Buffer.from(data, "base64");
  for (let i = 0; i < d.length; i++) {
    const color = d[i];
    const x = i % WIDTH;
    const y = Math.floor(i / HEIGHT);
    ctx.fillStyle = COLORS[color];
    ctx.fillRect(x, y, 1, 1);
  }
}

function onClickCanvas(event) {
  const pos = getMousePos(canvasElement, event);
  Api.setPixel(Math.floor(pos.x), Math.floor(pos.y), 1);
}

function updatePixel({ x, y, color }) {
  ctx.fillStyle = COLORS[color];
  ctx.fillRect(x, y, 1, 1);
}

module.exports = init;
