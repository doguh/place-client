// ------------------------------------------------------------
// CODE MOSTLY STOLEN FROM: http://phrogz.net/tmp/canvas_zoom_to_cursor.html
// AND: https://codepen.io/joe-l-bright/pen/Kfczw?editors=0010
// ------------------------------------------------------------
const Hammer = require("hammerjs");

/**
 * Creates a ZoomableCanvas
 * @param {HTMLCanvasElement} canvas canvas element
 * @param {CanvasImageSource} image CanvasImageSource instance that will be drawn into the canvas with drawImage
 */
class ZoomableCanvas {
  constructor(canvas, image) {
    /**
     * canvas element
     */
    this.canvas = canvas;
    /**
     * canvas 2d context
     */
    this.context = canvas.getContext("2d");
    /**
     * the image drawn in the canvas
     */
    this.image = image;

    trackTransforms(this.context);
    this.alignImage();
    this.redraw();

    var lastX = canvas.width / 2,
      lastY = canvas.height / 2;
    var dragStart, dragged;

    /**
     * on mouse up
     */
    const touchEnd = evt => {
      dragStart = null;
      if (!dragged && this._onClick) this._onClick(evt);
      dragged = false;
    };
    canvas.addEventListener("mouseup", touchEnd, false);

    /**
     * on mouse wheel
     */
    var handleScroll = evt => {
      var delta = evt.wheelDelta
        ? evt.wheelDelta / 40
        : evt.detail
          ? -evt.detail
          : 0;
      if (delta) zoom(delta);
      return evt.preventDefault() && false;
    };
    canvas.addEventListener("DOMMouseScroll", handleScroll, false);
    canvas.addEventListener("mousewheel", handleScroll, false);

    /**
     * zoom
     */
    var currentScale = 1;
    var scaleFactor = 1.1;
    var zoom = clicks => {
      var pt = this.context.transformedPoint(lastX, lastY);
      this.context.translate(pt.x, pt.y);
      var factor = Math.pow(scaleFactor, clicks);
      this.context.scale(factor, factor);
      this.context.translate(-pt.x, -pt.y);
      this.redraw();
    };

    const hammertime = new Hammer(canvas);

    /**
     * on drag
     */
    hammertime.get("pan").set({ enable: true });
    hammertime.on("panstart", event => {
      document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect =
        "none";
      lastX = event.center.x - canvas.offsetLeft;
      lastY = event.center.y - canvas.offsetTop;
      dragStart = this.context.transformedPoint(lastX, lastY);
      dragged = false;
    });
    hammertime.on("pan", event => {
      lastX = event.center.x - canvas.offsetLeft;
      lastY = event.center.y - canvas.offsetTop;
      dragged = true;
      var pt = this.context.transformedPoint(lastX, lastY);
      this.context.translate(pt.x - dragStart.x, pt.y - dragStart.y);
      this.redraw();
    });

    /**
     * on pinch zoom
     */
    hammertime.get("pinch").set({ enable: true });
    hammertime.on("pinch", event => {
      lastX = event.center.x - canvas.offsetLeft;
      lastY = event.center.y - canvas.offsetTop;
      var changeInScale = event.scale - currentScale;
      if (changeInScale != 0) {
        var pinchScaleFactor = 15;
        zoom(changeInScale * pinchScaleFactor);
        currentScale = event.scale;
      }
    });
    hammertime.on("pinchend", () => {
      currentScale = 1;
    });
    // very ugly hack so pinch and pan don't mess up together in chrome mobile
    hammertime.on("pinchstart", event => {
      hammertime.get("pan").set({ enable: false });
    });
    hammertime.on("pinchend", event => {
      setTimeout(() => hammertime.get("pan").set({ enable: true }), 100);
    });
  }

  /**
   * function that needs to be called when we want to redraw the canvas
   */
  redraw() {
    var p1 = this.context.transformedPoint(0, 0);
    var p2 = this.context.transformedPoint(
      this.canvas.width,
      this.canvas.height
    );
    this.context.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    this.context.drawImage(this.image, 0, 0);
  }

  /**
   * function that needs to be called when the canvas is resized
   */
  onResize() {
    trackTransforms(this.context);
    this.alignImage();
  }

  /**
   * registers a callback function that will be called when the canvas is clicked
   * @param {function} callback the function
   */
  onClick(callback) {
    this._onClick = callback;
  }

  alignImage() {
    var zeroPoint = this.context.transformedPoint(0, 0);
    var farPoint = this.context.transformedPoint(
      this.canvas.width,
      this.canvas.height
    );
    var dx = zeroPoint.x < 0 ? zeroPoint.x : 0;
    var dy = zeroPoint.y < 0 ? zeroPoint.y : 0;
    dx += farPoint.x > this.canvas.width ? farPoint.x - this.canvas.width : 0;
    dy += farPoint.y > this.canvas.height ? farPoint.y - this.canvas.height : 0;
    const xfactor = farPoint.x / this.image.width;
    const yfactor = farPoint.y / this.image.height;
    const factor = Math.min(xfactor, yfactor);

    if (this.image.width * factor < farPoint.x) {
      this.context.translate((farPoint.x - this.image.width * factor) / 2, 0);
    } else {
      this.context.translate(0, (farPoint.y - this.image.height * factor) / 2);
    }

    this.context.translate(dx, dy);
    this.context.scale(factor, factor);
    this.context.translate(-dx, -dy);
  }
}

function trackTransforms(ctx) {
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  var xform = svg.createSVGMatrix();
  ctx.getTransform = function() {
    return xform;
  };

  var savedTransforms = [];
  var save = ctx.save;
  ctx.save = function() {
    savedTransforms.push(xform.translate(0, 0));
    return save.call(ctx);
  };
  var restore = ctx.restore;
  ctx.restore = function() {
    xform = savedTransforms.pop();
    return restore.call(ctx);
  };

  var scale = ctx.scale;
  ctx.scale = function(sx, sy) {
    xform = xform.scaleNonUniform(sx, sy);
    return scale.call(ctx, sx, sy);
  };
  var rotate = ctx.rotate;
  ctx.rotate = function(radians) {
    xform = xform.rotate((radians * 180) / Math.PI);
    return rotate.call(ctx, radians);
  };
  var translate = ctx.translate;
  ctx.translate = function(dx, dy) {
    xform = xform.translate(dx, dy);
    return translate.call(ctx, dx, dy);
  };
  var transform = ctx.transform;
  ctx.transform = function(a, b, c, d, e, f) {
    var m2 = svg.createSVGMatrix();
    m2.a = a;
    m2.b = b;
    m2.c = c;
    m2.d = d;
    m2.e = e;
    m2.f = f;
    xform = xform.multiply(m2);
    return transform.call(ctx, a, b, c, d, e, f);
  };
  var setTransform = ctx.setTransform;
  ctx.setTransform = function(a, b, c, d, e, f) {
    xform.a = a;
    xform.b = b;
    xform.c = c;
    xform.d = d;
    xform.e = e;
    xform.f = f;
    return setTransform.call(ctx, a, b, c, d, e, f);
  };
  var pt = svg.createSVGPoint();
  ctx.transformedPoint = function(x, y) {
    pt.x = x;
    pt.y = y;
    return pt.matrixTransform(xform.inverse());
  };
}

module.exports = ZoomableCanvas;
