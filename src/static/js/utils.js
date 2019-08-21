var _ = require('lodash')
import { Transform, Matrix } from './transform'
var Vector = function Vector() {
  var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0
  var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0

  this.x = x
  this.y = y
}

Vector.prototype = {
  getMagnitude: function getMagnitude() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
  },
  subtract: function subtract(vector) {
    var v = new Vector()
    v.x = this.x - vector.x
    v.y = this.y - vector.y
    return v
  },
  dotProduct: function dotProduct(vector) {
    return this.x * vector.x + this.y * vector.y
  },
  edge: function edge(vector) {
    return this.subtract(vector)
  },
  perpendicular: function perpendicular() {
    var v = new Vector()
    v.x = this.y
    v.y = 0 - this.x
    return v
  },
  normalize: function normalize() {
    var v = new Vector(0, 0)
    var m = this.getMagnitude()
    if (m !== 0) {
      v.x = this.x / m
      v.y = this.y / m
    }
    return v
  },
  normal: function normal() {
    var p = this.perpendicular()
    return p.normalize()
  }
}
var Projection = function Projection(min, max) {
  this.min = min
  this.max = max
}
Projection.prototype = {
  overlaps: function overlaps(projection) {
    return this.max > projection.min && projection.max > this.min
  }
}
function project(axis, points) {
  var scalars = []
  var v = new Vector()

  points = _.values(points)
  points.forEach(function(point) {
    v.x = point.x
    v.y = point.y
    scalars.push(v.dotProduct(axis))
  })
  return new Projection(Math.min.apply(Math, scalars), Math.max.apply(Math, scalars))
}
function getAxes(points) {
  var v1 = new Vector()
  var v2 = new Vector()
  var axes = []

  points = _.values(points)
  for (var i = 0, len = points.length - 1; i < len; i++) {
    v1.x = points[i].x
    v1.y = points[i].y
    v2.x = points[i + 1].x
    v2.y = points[i + 1].y
    axes.push(v1.edge(v2).normal())
  }
  v1.x = points[points.length - 1].x
  v1.y = points[points.length - 1].y

  v2.x = points[0].x
  v2.y = points[0].y
  axes.push(v1.edge(v2).normal())
  return axes
}
function getRotationPoint(point, radian) {
  var x = point.x
  var y = point.y
  var sin = Math.sin(radian)
  var cos = Math.cos(radian)
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos
  }
}
export default {
  getPointPosition(point, pivot) {
    var angle = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0
    var points = [].concat(point)
    var radian = -angle / 180 * Math.PI// 转为弧度数
    var pivotX = pivot.x
    var pivotY = pivot.y
    points = points.map(function(point) {
      var dx = point.x - pivotX
      var dy = -(point.y - pivotY)
      point = getRotationPoint({ x: dx, y: dy }, radian) // 经过旋转后的坐标（通过极坐标计算）

      return {
        x: pivotX + point.x,
        y: pivotY - point.y
      }
    })
    return points
  },
  getRectPoints(rect) {
    var left = rect.left
    var top = rect.top
    var width = rect.width
    var height = rect.height
    var rotate = rect.rotate
    var pivot = {
      x: left + width / 2,
      y: top + height / 2
    }
    var points = [{ x: left, y: top }, { x: left + width, y: top }, { x: left + width, y: top + height }, { x: left, y: top + height }]
    points = this.getPointPosition(points, pivot, rotate) // 计算旋转后的点
    return { nw: points[0], ne: points[1], se: points[2], sw: points[3] }
  },
  getRectIntersection(rectA, rectB) {
    var pointsA = this.getRectPoints(rectA)
    var pointsB = this.getRectPoints(rectB)
    if ((rectB.rotate === 0 || rectB.rotate === 360) && rectB.skewX === 0 && rectB.skewY === 0) {
      if (rectA.left < rectB.left + rectB.width && rectA.left + rectA.width > rectB.left && rectA.top < rectB.top + rectB.height && rectA.height + rectA.top > rectB.top) {
        return true
      } else {
        return false
      }
    }

    var polygonsCollide = function polygonsCollide(polygon1, polygon2) {
      var axes = void 0
      var projection1 = void 0
      var projection2 = void 0

      axes = getAxes(polygon1).concat(getAxes(polygon2))
      var _iteratorNormalCompletion = true
      var _didIteratorError = false

      try {
        for (var _iterator = axes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var axis = _step.value

          projection1 = project(axis, polygon1)
          projection2 = project(axis, polygon2)

          if (!projection1.overlaps(projection2)) return false
        }
      } catch (err) {
        _didIteratorError = true
      } finally {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return()
        }
      }

      return true
    }
    return polygonsCollide(pointsA, pointsB)
  },
  pointInRect(x, y, rect) {
    var pointRect = {
      height: 1,
      width: 1,
      top: y,
      left: x,
      padding: [0, 0, 0, 0],
      rotate: 0,
      skewX: 0,
      skewY: 0,
      clip: { bottom: 0, right: 0, left: 0, top: 0 }
    }
    return this.getRectIntersection(pointRect, rect)
  },
  getElementRect(element, zoom) {
    if (!zoom) {
      zoom = 1
    }
    var rect = {
      padding: [0, 0, 0, 0],
      height: zoom * element.height,
      width: zoom * element.width,
      left: zoom * element.left,
      top: zoom * element.top,
      clip: {
        bottom: 0,
        right: 0,
        left: 0,
        top: 0
      }
    }
    if (element.padding) {
      _.forEach(element.padding, function(val, i) {
        rect.padding[i] = zoom * val
      })
    }
    if (element.clip) {
      _.forEach(element.clip, function(val, k) {
        rect.clip[k] = zoom * val
      })
    }
    rect.rotate = element.rotate
    rect.skewX = element.skewX
    rect.skewY = element.skewY
    return rect
  },
  getRadius(dx, dy) {
    return Math.sqrt(dx * dx + dy * dy)
  },
  getDxyByAngle(dx, dy, angle) {
    var dis = this.getRadius(dx, dy)
    var theta = Math.atan2(dy, dx) - angle * Math.PI / 180
    return {
      dx: dis * Math.cos(theta),
      dy: dis * Math.sin(theta)
    }
  },
  intLimit(int, circle) {
    return (int % circle + circle) % circle
  },
  getAngle(x2, y2, x1, y1, degOffset) {
    var rad = Math.atan2(y2 - y1, x2 - x1)
    var deg = rad * 180 / Math.PI
    deg -= degOffset
    return this.intLimit(deg, 360)
  },
  parseTransform(matrixData) {
    var transform = new Transform()
    if (matrixData) {
      if (matrixData.localTransform) {
        transform = _.cloneDeep(matrixData)
      } else {
        var matrix = new Matrix()
        matrix.copy.call(matrixData, matrix)
        matrix.decompose(transform)
      }
    }
    return transform
  }
}
