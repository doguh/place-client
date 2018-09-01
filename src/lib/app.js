const Api = require("./api");
const getMousePos = require("../helpers/getCanvasMousePosition");
const ZoomableCanvas = require("./zoomableCanvas");

let image;
let zoomableCanvas;

let COLORS, WIDTH, HEIGHT;

async function init(parentElement) {
  const canvasData = await Api.getCanvasData();
  COLORS = canvasData.colors;
  HEIGHT = canvasData.height;
  WIDTH = canvasData.width;

  image = createImage(canvasData.data);

  zoomableCanvas = createCanvasElement();
  parentElement.appendChild(zoomableCanvas.canvas);
  window.addEventListener("resize", onResize);
  zoomableCanvas.onClick(onClickCanvas);
  Api.subscribe(updatePixel);
  redraw();
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
  return new ZoomableCanvas(el, image.canvas);
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
  const pos = getMousePos(zoomableCanvas.canvas, event);
  const pt = zoomableCanvas.context.transformedPoint(pos.x, pos.y);
  if (pt.x >= 0 && pt.y >= 0 && pt.x <= WIDTH && pt.y <= HEIGHT) {
    Api.setPixel(Math.floor(pt.x), Math.floor(pt.y), 1);
  }
}

function redraw() {
  zoomableCanvas.context.imageSmoothingEnabled = false;
  zoomableCanvas.redraw();
}

function onResize(event) {
  zoomableCanvas.canvas.width = window.innerWidth;
  zoomableCanvas.canvas.height = window.innerHeight;
  zoomableCanvas.onResize();
  redraw();
}

function updatePixel({ x, y, color }) {
  image.fillStyle = COLORS[color];
  image.fillRect(x, y, 1, 1);
  redraw();
}

module.exports = init;
