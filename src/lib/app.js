const Api = require("./api");
const getMousePos = require("../helpers/getCanvasMousePosition");
const zoomableCanvas = require("../helpers/zoomableCanvas");

let image;
let canvasElement;
let ctx;

let COLORS, WIDTH, HEIGHT;

async function init(parentElement) {
  const canvasData = await Api.getCanvasData();
  COLORS = canvasData.colors;
  HEIGHT = canvasData.height;
  WIDTH = canvasData.width;
  canvasElement = createCanvasElement();
  image = createImage(canvasData.data);
  ctx = canvasElement.getContext("2d");
  console.log(ctx);
  parentElement.appendChild(canvasElement);
  window.addEventListener("resize", onResize);
  canvasElement.addEventListener("mousedown", onClickCanvas);
  Api.subscribe(updatePixel);
  redraw();

  zoomableCanvas(canvasElement, image.canvas);
}

function createCanvasElement() {
  const el = document.createElement("canvas");
  el.width = window.innerWidth;
  el.height = window.innerHeight;
  el.style.imageRendering = "optimizeSpeed";
  el.style.imageRendering = "-moz-crisp-edges";
  el.style.imageRendering = "-webkit-optimize-contrast";
  el.style.imageRendering = "optimize-contrast";
  el.style.imageRendering = "pixelated";
  el.style.msInterpolationMode = "nearest-neighbor";
  return el;
}

function createImage(data) {
  const el = document.createElement("canvas");
  el.width = WIDTH;
  el.height = HEIGHT;
  const context = el.getContext("2d");
  const d = Buffer.from(data, "base64");
  for (let i = 0; i < d.length; i++) {
    const color = d[i];
    const x = i % WIDTH;
    const y = Math.floor(i / HEIGHT);
    context.fillStyle = COLORS[color];
    context.fillRect(x, y, 1, 1);
  }
  return context;
}

function onClickCanvas(event) {
  const pos = getMousePos(canvasElement, event);
  const pt = ctx.transformedPoint(pos.x, pos.y);
  Api.setPixel(Math.floor(pt.x), Math.floor(pt.y), 1);
}

function redraw() {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image.canvas, 0, 0);
}

function onResize(event) {
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
  redraw();
}

function updatePixel({ x, y, color }) {
  image.fillStyle = COLORS[color];
  image.fillRect(x, y, 1, 1);
  redraw();
}

module.exports = init;
