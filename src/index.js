const Api = require("./lib/api");

console.log("Hello there");

Api.getCanvasData().then(data => {
  const el = document.createElement("canvas");
  el.setAttribute("width", data.width);
  el.setAttribute("height", data.height);
  el.style.imageRendering = "optimizeSpeed";
  el.style.imageRendering = "-moz-crisp-edges";
  el.style.imageRendering = "-webkit-optimize-contrast";
  el.style.imageRendering = "optimize-contrast";
  el.style.imageRendering = "pixelated";
  el.style.msInterpolationMode = "nearest-neighbor";
  document.body.appendChild(el);
  console.log(el);
  const d = Buffer.from(data.data, "base64");
  console.log(d);
  const ctx = el.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < d.length; i++) {
    const color = d[i];
    const x = i % data.width;
    const y = Math.floor(i / data.height);
    ctx.fillStyle = data.colors[color];
    ctx.fillRect(x, y, 1, 1);
  }
});
