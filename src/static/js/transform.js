var _ = require('lodash')
var _createClass = (function() { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor) } } return function(Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor } }())
var _classCallCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function') } }
var Point = (function() {
  function Point() {
    var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0
    var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0

    _classCallCheck(this, Point)

    this.x = x
    this.y = y
  }

  _createClass(Point, [{
    key: 'clone',
    value: function clone() {
      return new Point(this.x, this.y)
    }
  }, {
    key: 'copy',
    value: function copy(p) {
      this.set(p.x, p.y)
    }
  }, {
    key: 'equals',
    value: function equals(p) {
      return p.x === this.x && p.y === this.y
    }
  }, {
    key: 'set',
    value: function set(x, y) {
      this.x = x || 0
      this.y = y || (y !== 0 ? this.x : 0)
    }
  }])

  return Point
}())

export var Matrix = (function() {
  function Matrix() {
    var a = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1
    var b = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0
    var c = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0
    var d = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1
    var tx = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0
    var ty = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0

    _classCallCheck(this, Matrix)

    this.a = a

    this.b = b

    this.c = c

    this.d = d

    this.tx = tx

    this.ty = ty
    this.array = null
  }

  _createClass(Matrix, [{
    key: 'fromArray',
    value: function fromArray(array) {
      this.a = array[0]
      this.b = array[1]
      this.c = array[3]
      this.d = array[4]
      this.tx = array[2]
      this.ty = array[5]
    }
  }, {
    key: 'set',
    value: function set(a, b, c, d, tx, ty) {
      this.a = a
      this.b = b
      this.c = c
      this.d = d
      this.tx = tx
      this.ty = ty
      return this
    }
  }, {
    key: 'toArray',
    value: function toArray(transpose, out) {
      if (!this.array) {
        this.array = new Float32Array(9)
      }
      var array = out || this.array
      if (transpose) {
        array[0] = this.a
        array[1] = this.b
        array[2] = 0
        array[3] = this.c
        array[4] = this.d
        array[5] = 0
        array[6] = this.tx
        array[7] = this.ty
        array[8] = 1
      } else {
        array[0] = this.a
        array[1] = this.c
        array[2] = this.tx
        array[3] = this.b
        array[4] = this.d
        array[5] = this.ty
        array[6] = 0
        array[7] = 0
        array[8] = 1
      }
      return array
    }
  }, {
    key: 'apply',
    value: function apply(pos, newPos) {
      // newPos = newPos
      var x = pos.x
      var y = pos.y
      newPos.x = this.a * x + this.c * y + this.tx
      newPos.y = this.b * x + this.d * y + this.ty
      return newPos
    }
  }, {
    key: 'applyInverse',
    value: function applyInverse(pos, newPos) {
      // newPos = newPos || point
      var id = 1 / (this.a * this.d + this.c * -this.b)
      var x = pos.x
      var y = pos.y
      newPos.x = this.d * id * x + -this.c * id * y + (this.ty * this.c - this.tx * this.d) * id
      newPos.y = this.a * id * y + -this.b * id * x + (-this.ty * this.a + this.tx * this.b) * id
      return newPos
    }
  }, {
    key: 'translate',
    value: function translate(x, y) {
      this.tx += x
      this.ty += y
      return this
    }
  }, {
    key: 'scale',
    value: function scale(x, y) {
      this.a *= x
      this.d *= y
      this.c *= x
      this.b *= y
      this.tx *= x
      this.ty *= y
      return this
    }
  }, {
    key: 'rotate',
    value: function rotate(angle) {
      var cos = Math.cos(angle)
      var sin = Math.sin(angle)
      var a1 = this.a
      var c1 = this.c
      var tx1 = this.tx
      this.a = a1 * cos - this.b * sin
      this.b = a1 * sin + this.b * cos
      this.c = c1 * cos - this.d * sin
      this.d = c1 * sin + this.d * cos
      this.tx = tx1 * cos - this.ty * sin
      this.ty = tx1 * sin + this.ty * cos
      return this
    }
  }, {
    key: 'append',
    value: function append(matrix) {
      var a1 = this.a
      var b1 = this.b
      var c1 = this.c
      var d1 = this.d
      this.a = matrix.a * a1 + matrix.b * c1
      this.b = matrix.a * b1 + matrix.b * d1
      this.c = matrix.c * a1 + matrix.d * c1
      this.d = matrix.c * b1 + matrix.d * d1
      this.tx = matrix.tx * a1 + matrix.ty * c1 + this.tx
      this.ty = matrix.tx * b1 + matrix.ty * d1 + this.ty
      return this
    }
  }, {
    key: 'setTransform',
    value: function setTransform(x, y, pivotX, pivotY, scaleX, scaleY, rotation, skewX, skewY) {
      var sr = Math.sin(rotation)
      var cr = Math.cos(rotation)
      var cy = Math.cos(skewY)
      var sy = Math.sin(skewY)
      var nsx = -Math.sin(skewX)
      var cx = Math.cos(skewX)
      var a = cr * scaleX
      var b = sr * scaleX
      var c = -sr * scaleY
      var d = cr * scaleY
      this.a = cy * a + sy * c
      this.b = cy * b + sy * d
      this.c = nsx * a + cx * c
      this.d = nsx * b + cx * d
      this.tx = x + (pivotX * a + pivotY * c)
      this.ty = y + (pivotX * b + pivotY * d)
      return this
    }
  }, {
    key: 'prepend',
    value: function prepend(matrix) {
      var tx1 = this.tx
      if (matrix.a !== 1 || matrix.b !== 0 || matrix.c !== 0 || matrix.d !== 1) {
        var a1 = this.a
        var c1 = this.c
        this.a = a1 * matrix.a + this.b * matrix.c
        this.b = a1 * matrix.b + this.b * matrix.d
        this.c = c1 * matrix.a + this.d * matrix.c
        this.d = c1 * matrix.b + this.d * matrix.d
      }
      this.tx = tx1 * matrix.a + this.ty * matrix.c + matrix.tx
      this.ty = tx1 * matrix.b + this.ty * matrix.d + matrix.ty
      return this
    }
  }, {
    key: 'decompose',
    value: function decompose(transform) {
      var pi = Math.PI
      var acos = Math.acos
      var atan = Math.atan
      var sqrt = Math.sqrt

      var a = this.a
      var b = this.b
      var c = this.c
      var d = this.d
      var rotation = 0
      var skew = { x: 0, y: 0 }
      var scale = { x: 1, y: 1 }

      var determ = a * d - b * c

      if (a || b) {
        var r = sqrt(a * a + b * b)

        rotation = b > 0 ? acos(a / r) : -acos(a / r)

        skew.x = atan((a * c + b * d) / (r * r))
        scale = { x: r, y: determ / r }
      } else if (c || d) {
        var s = sqrt(c * c + d * d)

        rotation = pi * 0.5 - (d > 0 ? acos(-c / s) : -acos(c / s))

        scale = { x: determ / s, y: s }
        skew.y = atan((a * c + b * d) / (s * s))
      } else {
        scale = { x: 0, y: 0 }
      }

      transform.rotation = rotation || 0
      transform.scale.x = scale.x
      transform.scale.y = scale.y
      transform.skew.x = skew.x
      transform.skew.y = skew.y

      transform.position.x = this.tx
      transform.position.y = this.ty
    }
  }, {
    key: 'invert',
    value: function invert() {
      var a1 = this.a
      var b1 = this.b
      var c1 = this.c
      var d1 = this.d
      var tx1 = this.tx
      var n = a1 * d1 - b1 * c1
      this.a = d1 / n
      this.b = -b1 / n
      this.c = -c1 / n
      this.d = a1 / n
      this.tx = (c1 * this.ty - d1 * tx1) / n
      this.ty = -(a1 * this.ty - b1 * tx1) / n
      return this
    }
  }, {
    key: 'identity',
    value: function identity() {
      this.a = 1
      this.b = 0
      this.c = 0
      this.d = 1
      this.tx = 0
      this.ty = 0
      return this
    }
  }, {
    key: 'clone',
    value: function clone() {
      var matrix = new Matrix()
      matrix.a = this.a
      matrix.b = this.b
      matrix.c = this.c
      matrix.d = this.d
      matrix.tx = this.tx
      matrix.ty = this.ty
      return matrix
    }
  }, {
    key: 'copy',
    value: function copy(matrix) {
      matrix.a = this.a
      matrix.b = this.b
      matrix.c = this.c
      matrix.d = this.d
      matrix.tx = this.tx
      matrix.ty = this.ty
      return matrix
    }
  }], [{
    key: 'IDENTITY',
    get: function get() {
      return new Matrix()
    }
  }, {
    key: 'TEMP_MATRIX',
    get: function get() {
      return new Matrix()
    }
  }])
  return Matrix
}())
function ObservablePoint(cb, scope, x, y) {
  this._x = x || 0
  this._y = y || 0

  this.cb = cb
  this.scope = scope
}

Object.defineProperties(ObservablePoint.prototype, {

  x: {
    get: function get() {
      return this._x
    },
    set: function set(value) {
      if (this._x !== value) {
        this._x = value
        this.cb.call(this.scope)
      }
    }
  },

  y: {
    get: function get() {
      return this._y
    },
    set: function set(value) {
      if (this._y !== value) {
        this._y = value
        this.cb.call(this.scope)
      }
    }
  }
})

ObservablePoint.prototype.set = function(x, y) {
  var _x = x || 0
  var _y = y || (y !== 0 ? _x : 0)
  if (this._x !== _x || this._y !== _y) {
    this._x = _x
    this._y = _y
    this.cb.call(this.scope)
  }
}

ObservablePoint.prototype.copy = function(point) {
  if (this._x !== point.x || this._y !== point.y) {
    this._x = point.x
    this._y = point.y
    this.cb.call(this.scope)
  }
}

function Transform() {
  this._worldID = 0
  this.localTransform = new Matrix()
  this.position = new Point(0.0)
  this.scale = new Point(1, 1)
  this.skew = new ObservablePoint(this.updateSkew, this, 0, 0)
  this.pivot = new Point(0.0)
  this._rotation = 0
  this._sr = Math.sin(0)
  this._cr = Math.cos(0)
  this._cy = Math.cos(0)
  this._sy = Math.sin(0)
  this._nsx = Math.sin(0)
  this._cx = Math.cos(0)
}

Transform.prototype.updateSkew = function() {
  this._nsx = Math.tan(this.skew.x)
  this._sy = Math.tan(this.skew.y)
}

Transform.prototype.updateLocalTransform = function() {
  var lt = this.localTransform
  var a = void 0
  var b = void 0
  var c = void 0
  var d = void 0

  a = this._cr * this.scale.x
  b = this._sr * this.scale.x
  c = -this._sr * this.scale.y
  d = this._cr * this.scale.y

  lt.a = this._cy * a + this._sy * c
  lt.b = this._cy * b + this._sy * d
  lt.c = this._nsx * a + this._cx * c
  lt.d = this._nsx * b + this._cx * d

  lt.tx = this.position.x
  lt.ty = this.position.y
}

Transform.prototype.updateTransform = function() { }

Transform.prototype.setFromMatrix = function(matrix) {
  matrix.decompose(this)
}

Object.defineProperties(Transform.prototype, {
  rotation: {
    get: function get() {
      return this._rotation
    },
    set: function set(value) {
      this._rotation = value
      this._sr = Math.sin(value)
      this._cr = Math.cos(value)
    }
  }
})
Transform.prototype.toJSON = function() {
  this.updateLocalTransform()
  return _.pick(this.localTransform, ['a', 'b', 'c', 'd', 'tx', 'ty'])
}

Transform.prototype.toArray = function() {
  this.updateLocalTransform()

  var localTransform = this.localTransform
  return [localTransform.a, localTransform.b, localTransform.c, localTransform.d, localTransform.tx, localTransform.ty]
}

Transform.prototype.toString = function() {
  var rZeroEnd = /\.?0+$/
  var arr = this.toArray()

  arr = arr.map(function(n) {
    n = n.toFixed(20)

    return n.replace(rZeroEnd, '')
  })

  return 'matrix(' + arr.join(', ') + ')'
}
export {
  Transform
}
