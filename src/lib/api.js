let sseHasBeenDisconnected = false;

/**
 * fetches canvas data
 * @returns {Promise}
 */
async function getCanvasData() {
  const r = await fetch("/api/canvas");
  if (!r.ok) {
    throw r;
  }
  return r.json();
}

/**
 * send a pixel color update
 * @returns {Promise}
 */
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

/**
 * subscribe to server sent events to get real time pixel updates
 * @param {function} callback function called when a pixel is updated
 * @param {function} reconnectedCallback function called when reconnected to SSE after a connection loss
 * @returns {void}
 */
function subscribe(callback, reconnectedCallback) {
  const evtSource = new EventSource("/api/canvas/sub");
  evtSource.onmessage = e => {
    callback(JSON.parse(e.data));
  };
  evtSource.onopen = e => {
    if (sseHasBeenDisconnected) {
      sseHasBeenDisconnected = false;
      if (reconnectedCallback) {
        reconnectedCallback();
      }
    }
  };
  evtSource.onerror = e => {
    sseHasBeenDisconnected = true;
  };
  return evtSource;
}

module.exports = {
  getCanvasData,
  setPixel,
  subscribe
};
