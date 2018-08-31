async function getCanvasData() {
  const r = await fetch("/api/canvas");
  if (!r.ok) {
    throw r;
  }
  return r.json();
}

async function setPixel(x, y, color) {
  const r = await fetch("/api/canvas", {
    method: "post",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ x, y, color })
  });
  if (!r.ok) {
    throw r;
  }
  return r.json();
}

module.exports = {
  getCanvasData,
  setPixel
};
