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

function subscribe(callback) {
  const evtSource = new EventSource("/api/canvas/sub");
  evtSource.onmessage = function(e) {
    callback(JSON.parse(e.data));
  };
  return evtSource;
}

module.exports = {
  getCanvasData,
  setPixel,
  subscribe
};
