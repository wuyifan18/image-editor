var _ = require('lodash')
const tinycolor = require('tinycolor2')
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
  },
  fromHTML(contentModel) {
    var styleMap = reverseSetMap({
      'color': 'color',
      'text-decoration': 'textDecoration',
      'text-decoration-line': 'textDecoration',
      'font-size': 'fontSize',
      'font-family': 'fontFamily',
      'font-weight': 'fontWeight',
      'font-style': 'fontStyle'
    })
    var styleValueMap = {
      'color': function color(value) {
        return value && tinycolor(value).toString('rgb')
      },
      'font-size': function fontSize(value) {
        return isNaN(value - 0) ? value : value + 'px'
      },
      'fontSize': function fontSize(value) {
        return parseFloat(value)
      },
      'font-weight': function resetFontWeightValue(value) {
        var map = {
          '700': 700,
          'bold': 700,
          'true': 700
        }
        return map[value] || 400
      },
      'fontWeight': function resetFontWeightValue(value) {
        var map = {
          '700': 700,
          'bold': 700,
          'true': 700
        }
        return map[value] || 400
      },
      'fontFamily': function fontFamily(value) {
        return value.replace(/"/g, '').split(',')[0]
      },
      'textDecoration': function textDecoration(value) {
        return value === null || value === 'null' ? 'none' : value
      },
      'text-decoration': function textDecoration(value) {
        return value === null || value === 'null' ? 'none' : value
      },
      'fontStyle': function fontStyle(value) {
        return value === null || value === 'null' ? 'normal' : value
      },
      'font-style': function fontStyle(value) {
        return value === null || value === 'null' ? 'normal' : value
      }
    }
    var rBr = /<br\s*\/?>/ig
    var rBreakLine = /\r?\n/gm
    var rTwoSpace = /\s\s/g
    var CUSTOMIZE_MARK = 'data-customize'
    function reverseSetMap(map) {
      Object.keys(map).forEach(function(name) {
        map[map[name]] = name
      })
      return map
    }
    function _getStyleString(style) {
      var result = ''
      Object.keys(style).forEach(function(name) {
        var value = style[name]
        name = styleMap[name]

        if (name) {
          result += name + ': ' + (styleValueMap[name] ? styleValueMap[name](value) : value) + ';'
        }
      })
      return result
    }
    var _this = this
    var zoom = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1
    if (!_.isArray(contentModel)) throw new TypeError('contentModel must be a array')
    var result = ''
    contentModel.forEach(function(node) {
      if (node && node.content) {
        var style = {}
        Object.keys(node).forEach(function(name) {
          if (styleMap[name]) {
            style[name] = name === 'fontSize' ? node[name] * zoom : node[name]
          }
        })
        style = _getStyleString(style)
        var content = node.content.replace(rBr, '\n')
        content = _.escape(_.unescape(content)).replace(rBreakLine, '<br>').replace(rTwoSpace, ' &nbsp;')
        result += !style ? '<span ' + CUSTOMIZE_MARK + '="1">' + content + '</span>' : '<span ' + CUSTOMIZE_MARK + '="1" style=\'' + style + '\'>' + content + '</span>'
      }
    })
    return result
  },
  getBoundingClientRect() {
    var $els = this.$refs
    var transformEleRect = $els.transformEle.getBoundingClientRect()
    var rotatorHandleRect = $els.rotatorHandle.getBoundingClientRect()
    if (rotatorHandleRect.width === 0 || rotatorHandleRect.height === 0) {
      rotatorHandleRect = transformEleRect
    }
    var rect = {
      top: Math.min(transformEleRect.top, rotatorHandleRect.top),
      left: Math.min(transformEleRect.left, rotatorHandleRect.left),
      bottom: Math.max(transformEleRect.bottom, rotatorHandleRect.bottom),
      right: Math.max(transformEleRect.right, rotatorHandleRect.right),

      _transformEleRect: transformEleRect,
      _rotatorHandleRect: rotatorHandleRect
    }
    rect.width = rect.right - rect.left
    rect.height = rect.bottom - rect.top
    return rect
  },
  getBBox(rect, zoom) {
    var rectRotate = this.intLimit(rect.rotate, 360)
    var rectHeight = rect.height
    var rectWidth = rect.width
    var rotate = rectRotate > 90 && rectRotate < 180 || rectRotate > 270 && rectRotate < 360 ? 180 - rectRotate : rectRotate
    var rad = rotate * Math.PI / 180
    var height = Math.abs(Math.sin(rad) * rectWidth + Math.cos(rad) * rectHeight)
    var width = Math.abs(Math.sin(rad) * rectHeight + Math.cos(rad) * rectWidth)
    var dotX = rect.left + rectWidth / 2
    var dotY = rect.top + rectHeight / 2
    var left = dotX - width / 2
    var top = dotY - height / 2
    zoom = zoom || 1
    return {
      rotate: rotate,
      height: height * zoom,
      width: width * zoom,
      left: left * zoom,
      top: top * zoom
    }
  },
  getBBoxByElement(element, zoom) {
    var rect = this.getElementRect(element, zoom)
    return this.getBBox(rect)
  },
  getBBoxByElements(elements, zoom) {
    var self = this
    var top = Infinity
    var left = Infinity
    var right = -Infinity
    var bottom = -Infinity
    elements.forEach(function(element) {
      var bbox = self.getBBoxByElement(element, zoom)
      if (bbox.top < top) {
        top = bbox.top
      }
      if (bbox.left < left) {
        left = bbox.left
      }
      if (bbox.left + bbox.width > right) {
        right = bbox.left + bbox.width
      }
      if (bbox.top + bbox.height > bottom) {
        bottom = bbox.top + bbox.height
      }
    })
    return {
      rotate: 0,
      height: bottom - top,
      width: right - left,
      left: left,
      top: top
    }
  }
}
