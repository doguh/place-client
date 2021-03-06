const Api = require("./api");
const getMousePos = require("../helpers/getCanvasMousePosition");
const rgbToHex = require("../helpers/rgbToHex");
const ZoomableCanvas = require("./zoomableCanvas");

let image;
let zoomableCanvas;
let uiElement;

let COLORS, WIDTH, HEIGHT;
let selectedColor = 1;

let refreshing = false;
let pendingEvents;

async function init(parentElement) {
  const canvasData = await Api.getCanvasData();
  COLORS = canvasData.colors;
  HEIGHT = canvasData.height;
  WIDTH = canvasData.width;

  image = await createImage(canvasData.data);

  zoomableCanvas = createCanvasElement();
  parentElement.appendChild(zoomableCanvas.canvas);
  window.addEventListener("resize", onResize);
  zoomableCanvas.onClick(onClickCanvas);
  Api.subscribe(updatePixel, refresh);

  selectedColor = parseInt(window.localStorage.getItem("lastcolor") || 1, 10);
  uiElement = createUI();
  parentElement.appendChild(uiElement);
  zoomableCanvas.alignImage(uiElement.clientHeight);
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
  return new Promise((resolve, reject) => {
    const el = document.createElement("canvas");
    el.width = WIDTH;
    el.height = HEIGHT;
    const context = el.getContext("2d");
    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0);
      resolve(context);
    };
    image.src = data;
  });
}

function createUI() {
  const ui = document.createElement("div");
  ui.id = "ui";
  COLORS.map((color, index) => {
    const colorButton = document.createElement("div");
    colorButton.className = "color-button";
    colorButton.style.backgroundColor = color;
    colorButton.addEventListener("click", () => {
      const list = ui.getElementsByClassName("color-button");
      for (let i = 0; i < list.length; i++) {
        const elem = list[i];
        elem.classList.remove("selected");
      }
      colorButton.classList.add("selected");
      selectedColor = index;
      window.localStorage.setItem("lastcolor", selectedColor);
    });
    if (index === selectedColor) {
      colorButton.classList.add("selected");
    }
    ui.appendChild(colorButton);
  });
  return ui;
}

function onClickCanvas(event) {
  const pos = getMousePos(zoomableCanvas.canvas, event);
  const pt = zoomableCanvas.context.transformedPoint(pos.x, pos.y);
  if (pt.x >= 0 && pt.y >= 0 && pt.x <= WIDTH && pt.y <= HEIGHT) {
    // get current pixel color
    const pix = image.getImageData(pt.x, pt.y, 1, 1).data;
    const hex = "#" + ("000000" + rgbToHex(pix[0], pix[1], pix[2])).slice(-6);
    // if new color != existing pixel color, send update
    if (hex !== COLORS[selectedColor]) {
      Api.setPixel(Math.floor(pt.x), Math.floor(pt.y), selectedColor);
    }
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
  zoomableCanvas.alignImage(uiElement.clientHeight);
  redraw();
}

function updatePixel({ x, y, color }) {
  if (refreshing) {
    pendingEvents.push({ x, y, color });
  } else {
    image.fillStyle = color;
    image.fillRect(x, y, 1, 1);
    redraw();
  }
}

async function refresh() {
  if (!refreshing) {
    refreshing = true;
    pendingEvents = [];
    const canvasData = await Api.getCanvasData();
    COLORS = canvasData.colors;
    HEIGHT = canvasData.height;
    WIDTH = canvasData.width;

    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        image.drawImage(img, 0, 0);
        resolve();
      };
      img.src = canvasData.data;
    });
    redraw();

    pendingEvents.map(updatePixel);
    refreshing = false;
    pendingEvents = null;
  }
}

module.exports = init;
