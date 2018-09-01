// CODE MOSTLY STOLEN FROM: http://phrogz.net/tmp/canvas_zoom_to_cursor.html

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
    this.redraw();
    var lastX = canvas.width / 2,
      lastY = canvas.height / 2;
    var dragStart, dragged;
    canvas.addEventListener(
      "mousedown",
      evt => {
        document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect =
          "none";
        lastX = evt.offsetX || evt.pageX - canvas.offsetLeft;
        lastY = evt.offsetY || evt.pageY - canvas.offsetTop;
        dragStart = this.context.transformedPoint(lastX, lastY);
        dragged = false;
      },
      false
    );
    canvas.addEventListener(
      "mousemove",
      evt => {
        lastX = evt.offsetX || evt.pageX - canvas.offsetLeft;
        lastY = evt.offsetY || evt.pageY - canvas.offsetTop;
        dragged = true;
        if (dragStart) {
          var pt = this.context.transformedPoint(lastX, lastY);
          this.context.translate(pt.x - dragStart.x, pt.y - dragStart.y);
          this.redraw();
        }
      },
      false
    );
    canvas.addEventListener(
      "mouseup",
      evt => {
        dragStart = null;
        if (!dragged && this._onClick) this._onClick(evt);
      },
      false
    );
    var scaleFactor = 1.1;
    var zoom = clicks => {
      var pt = this.context.transformedPoint(lastX, lastY);
      this.context.translate(pt.x, pt.y);
      var factor = Math.pow(scaleFactor, clicks);
      this.context.scale(factor, factor);
      this.context.translate(-pt.x, -pt.y);
      this.redraw();
    };
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
  }

  /**
   * registers a callback function that will be called when the canvas is clicked
   * @param {function} callback the function
   */
  onClick(callback) {
    this._onClick = callback;
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