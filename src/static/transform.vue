<template>
  <div class="editor-transform-wrap">
    <div
      v-if="element"
      class="editor-transform"
      :class="[octant,isMultiple ? 'editor-transform-multiple' : '']"
      :style="transformStyle"
    >
      <i
        v-for="dir in ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se']"
        :key="dir"
        :class="[
          'editor-grip',
          'editor-grip-' + dir,
          (!currentResizeDir || currentResizeDir === dir) ? '' : 'editor-grip-fadeout'
        ]"
        :style="{
          padding: gripPadding + 'px',
        }"
        :data-dir="dir"
        @mousedown.stop="initResize($event, dir)"
      >
        <b
          :style="getGripSizeStyle(dir)"
        />
      </i>
      <i
        ref="rotatorHandle"
        class="editor-rotator"
        :class="{
          'editor-rotator-fadeout': currentResizeDir
        }"
        @mousedown.stop="initRotaor($event)"
      >
        <b>
          <span
            v-show="rotateReady"
          >{{ element.rotate | angle }}</span>
        </b>
      </i>
    </div>
  </div>
</template>

<script>
var doc = $(document)
import utils from '@/static/js/utils'
export default {
  name: 'Transform',
  filters: {
    angle: function angle(_angle) {
      _angle = Math.round(_angle) % 360
      _angle = _angle >= 180 ? _angle - 360 : _angle
      return _angle + '°'
    }
  },
  props: {
    element: {
      type: Object,
      required: true
    }
  },
  data: function() {
    return {
      rotateReady: false,
      currentResizeDir: null,
      dragger: {
        pageX: 0,
        pageY: 0,
        left: 0,
        top: 0,
        dx: 0,
        dy: 0
      },
      selectDrag: []
    }
  },
  computed: {
    octant: function octant() {
      var rotate = this.element.rotate
      return 'octant' + Math.floor((rotate + 22.5) / 45)
    },
    isMultiple: function isMultiple() {
      return this.element && ['$selector', 'group'].includes(this.element.type)
    },
    minSize() {
      var element = this.element
      var width = element.width
      var height = element.height
      return Math.min(width, height)
    },
    gripPadding() {
      var paddingSize = 0
      if (this.minSize > 50) {
        paddingSize = (this.minSize - 50) / 5
      }
      return Math.round(Math.min(paddingSize, 8))
    },
    transform() {
      const _model2 = this.element
      const transform = _model2.transform
      const scaleX = _model2.scaleX
      const scaleY = _model2.scaleY
      const _transform$toJSON = transform.toJSON()
      let a = _transform$toJSON.a
      let b = _transform$toJSON.b
      let c = _transform$toJSON.c
      let d = _transform$toJSON.d
      const tx = _transform$toJSON.tx
      const ty = _transform$toJSON.ty
      if (scaleX < 0) {
        a = -a
        b = -b
      }
      if (scaleY < 0) {
        c = -c
        d = -d
      }
      return 'matrix(' + a + ',' + b + ',' + c + ',' + d + ',' + tx + ',' + ty + ')'
    },
    transformStyle() {
      return {
        height: this.element.height + 'px',
        width: this.element.width + 'px',
        left: this.element.left + 'px',
        top: this.element.top + 'px',
        transform: this.transform
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      const events = this.$options.events
      for (const key in events) {
        this.$on(key, events[key])
      }
      const element = $(this.$el)
      this.initDragger(element)
    })
  },
  methods: {
    initDragger: function initDragger(element) {
      const self = this
      const dragger = this.dragger
      let selectDrag = this.selectDrag
      const handles = {
        init: function init(e) {
          const element = self.element
          if (element.type === '$selector') {
            selectDrag = []
            for (let i = 0; i < element.elements.length; i++) {
              selectDrag.push({
                left: element.elements[i].left,
                top: element.elements[i].top
              })
            }
          }
          dragger.left = element.left
          dragger.top = element.top
          dragger.pageX = e.pageX
          dragger.pageY = e.pageY
          doc.on('mousemove', handles.move)
          doc.one('mouseup', handles.cancel)
        },
        move: function move(e) {
          const element = self.element
          if (!element) {
            return
          }
          e.preventDefault()
          dragger.dx = e.pageX - dragger.pageX
          dragger.dy = e.pageY - dragger.pageY
          const dOffsetMin = 3
          if (!element.$draging && (Math.abs(dragger.dx) >= dOffsetMin || Math.abs(dragger.dy) >= dOffsetMin)) {
            element.$draging = true
          }
          if (element.$draging) {
            self.$emit('base.dragMove', dragger, selectDrag, element, e)
          }
        },
        cancel: function cancel() {
          doc.off('mousemove', handles.move)
          const element = self.element
          if (element && element.$draging) {
            element.$draging = false
          }
        }
      }
      element.on('mousedown.editor-dragger', handles.init)
      this.$on('destroy', function() {
        element.off('.editor-dragger')
      })
    },
    initResize: function initResize(e, dir) {
      var self = this
      var element = this.element
      if (e.button !== 0 || element.$draging) {
        return
      }
      this.currentResizeDir = dir
      var drag = this.drag = {
        dir: dir,
        rotate: element.rotate,
        height: element.height,
        width: element.width,
        left: element.left,
        top: element.top,
        pageX: e.pageX,
        pageY: e.pageY,
        points: utils.getRectPoints(element),
        minHeight: 0,
        minWidth: 0,
        minLeft: 0,
        minTop: 0,
        maxLeft: 0,
        maxTop: 0,
        resizeDrag: [],
        dxdyDrag: [],
        move: function move(e) {
          e.preventDefault()
          var dx = e.pageX - drag.pageX
          var dy = e.pageY - drag.pageY
          var dir = drag.dir
          var dxy = utils.getDxyByAngle(dx, dy, drag.rotate) // 获取图片的缩放量
          dxy.dx = Math.round(dxy.dx)
          dxy.dy = Math.round(dxy.dy)
          if (!/[ew]/.test(dir)) {
            dxy.dx = 0
          }
          if (!/[ns]/.test(dir)) {
            dxy.dy = 0
          }
          if (dir.length > 1 && !e.shiftKey) {
            var ratio = drag.height / drag.width || 1
            if (dir === 'ne' || dir === 'sw') {
              ratio *= -1
            }
            dxy.dy = dxy.dx * ratio
          }
          drag.dx = dxy.dx
          drag.dy = dxy.dy
          if (!drag.draging) {
            drag.draging = true
          }
          if (element.type === '$selector') {
            drag.dxdyDrag = []
            for (let i = 0; i < element.elements.length; i++) {
              if (dir.length > 1 && !e.shiftKey) {
                var ratio1 = drag.height / drag.width || 1
                if (dir === 'ne' || dir === 'sw') {
                  ratio1 *= -1
                }
                dxy.dy = dxy.dx * ratio1
              }
              drag.dxdyDrag.push({ dx: dxy.dx, dy: dxy.dy })
            }
          }
          self.$emit('element.transformResize', drag, element, e)
        },
        cancel: function cancel() {
          doc.off('mousemove', drag.move)
          self.currentResizeDir = null
          self.drag = null
          element.$draging = false
          if (drag.draging) {
            drag.draging = false
          }
        }
      }
      element.$draging = true
      if (element.type === '$selector') {
        drag.resizeDrag = []
        for (let i = 0; i < element.elements.length; i++) {
          drag.resizeDrag.push({
            rotate: element.elements[i].rotate,
            height: element.elements[i].height,
            width: element.elements[i].width,
            left: element.elements[i].left,
            top: element.elements[i].top,
            points: utils.getRectPoints(element.elements[i])
          })
        }
      }
      doc.on('mousemove', drag.move)
      doc.one('mouseup', drag.cancel)
    },
    initRotaor: function initRotaor(e) {
      var self = this
      var element = this.element
      if (e.button !== 0 || element.$draging) {
        return
      }
      this.rotateReady = true
      var drag = this.drag = {
        dotX: 0,
        dotY: 0,
        pageX: 0,
        pageY: 0,
        rotate: 0,
        move: function move(e) {
          e.preventDefault()
          var rotate = utils.getAngle(e.pageX, e.pageY, drag.dotX, drag.dotY, 90)
          if (e.shiftKey) {
            rotate = Math.round(rotate / 10) * 10
          }
          if (!e.ctrlKey) {
            [{ angle: 30, edge: 2 }, { angle: 45, edge: 3 }].some(function(item) {
              var angle = item.angle
              var edge = item.edge
              var closest = Math.round(rotate / angle) * angle
              if (Math.abs(closest - rotate) < edge) {
                rotate = closest
                return true
              }
            })
          }
          drag.rotate = rotate
          if (!drag.draging) {
            drag.draging = true
          }
          self.$emit('element.transformRotate', drag, element)
        },
        cancel: function cancel() {
          doc.off('mousemove', drag.move)
          self.drag = null
          element.$draging = false
          if (drag.draging) {
            drag.draging = false
          }
          self.rotateReady = false
        }
      }
      var model = $(e.currentTarget || e.target)
      var shell = model.closest('.editor-shell')
      var shellOffset = shell.offset()
      var height = element.height
      var width = element.width
      var left = element.left
      var top = element.top
      drag.dotX = shellOffset.left + left + width / 2
      drag.dotY = shellOffset.top + top + height / 2
      drag.pageX = e.pageX
      drag.pageY = e.pageY
      element.$draging = true
      doc.on('mousemove', drag.move)
      doc.one('mouseup', drag.cancel)
    },
    getGripSize(imageSize) {
      let size = 10
      if (imageSize > 30) {
        size = imageSize / 3
      }
      return Math.round(Math.min(size, 14))
    },
    getGripSizeStyle(dir) {
      if (dir === 'w' || dir === 'e') {
        var height = this.getGripSize(this.minSize)
        return {
          height: height + 'px'
        }
      } else if (dir === 'n' || dir === 's') {
        var width = this.getGripSize(this.minSize)
        return {
          width: width + 'px'
        }
      }
      return {}
    }
  },
  events: {
    'base.dragMove': function baseDragMove(drag, selectDrag, element) {
      if (element !== this.element) {
        return false
      }
      const left = drag.left + drag.dx
      const top = drag.top + drag.dy
      if (element.type === '$selector') {
        for (let i = 0; i < element.elements.length; i++) {
          element.elements[i].left = selectDrag[i].left + drag.dx
          element.elements[i].top = selectDrag[i].top + drag.dy
        }
      }
      element.left = left
      element.top = top
    },
    'element.transformResize': function elementTransformResize(drag, element) { // drag拖拽前的元素信息
      var dir = drag.dir
      var preWidth = drag.width
      var preHeight = drag.height
      var preLeft = drag.left
      var preTop = drag.top
      if (dir.indexOf('w') > -1) {
        drag.dx *= -1
      }
      if (dir.indexOf('n') > -1) {
        drag.dy *= -1
      }
      // 计算拖拽后图片的宽高
      var width = Number(preWidth) + drag.dx
      var height = Number(preHeight) + drag.dy
      var widthTo = width
      var heightTo = height
      var limit = void 0
      var minWidth = 0
      var minHeight = 0
      var isCommonMinSize = minWidth <= 1 || minHeight <= 1
      if (isCommonMinSize) {
        if (drag.width < drag.height) {
          minHeight = drag.height / drag.width
        } else {
          minWidth = drag.width / drag.height
        }
      }
      var maxWidth = preWidth * 2
      var maxHeight = preHeight * 2
      width = Math.min(Math.max(1, minWidth, width), maxWidth)
      height = Math.min(Math.max(1, minHeight, height), maxHeight)
      if (limit && dir.length > 1) {
        if (width !== widthTo) {
          height = Math.max(limit.minHeight, heightTo * width / widthTo)
        }
        if (height !== heightTo) {
          width = widthTo * height / heightTo
        }
      }
      element.width = width
      element.height = height;
      (function() {
        var points = utils.getRectPoints({
          left: preLeft, // 拖拽前的left
          top: preTop, // 拖拽前的top
          width: width, // 拖拽后图片宽度
          height: height, // 拖拽后图片高度
          rotate: element.rotate
        })
        var diagonal = {
          nw: 'se',
          ne: 'sw',
          n: 'sw',
          w: 'se',
          sw: 'ne',
          se: 'nw',
          s: 'ne',
          e: 'nw'
        }[dir]
        var newPoint = points[diagonal]// 以左上角为顶点进行相应的变换
        var prePoint = drag.points[diagonal]// 拖拽前对角坐标
        element.left = preLeft - (newPoint.x - prePoint.x)
        element.top = preTop - (newPoint.y - prePoint.y)
      })()
      if (element.type === '$selector') {
        for (let i = 0; i < element.elements.length; i++) {
          var preWidth1 = drag.resizeDrag[i].width
          var preHeight1 = drag.resizeDrag[i].height
          var preLeft1 = drag.resizeDrag[i].left
          var preTop1 = drag.resizeDrag[i].top
          if (dir.indexOf('w') > -1) {
            drag.dxdyDrag[i].dx *= -1
          }
          if (dir.indexOf('n') > -1) {
            drag.dxdyDrag[i].dy *= -1
          }
          // 计算拖拽后图片的宽高
          var width1 = Number(preWidth1) + drag.dxdyDrag[i].dx
          var height1 = Number(preHeight1) + drag.dxdyDrag[i].dy
          var widthTo1 = width1
          var heightTo1 = height1
          var limit1 = void 0
          var minWidth1 = 0
          var minHeight1 = 0
          var isCommonMinSize1 = minWidth1 <= 1 || minHeight1 <= 1
          if (isCommonMinSize1) {
            if (drag.resizeDrag[i].width < drag.resizeDrag[i].height) {
              minHeight1 = drag.resizeDrag[i].height / drag.resizeDrag[i].width
            } else {
              minWidth1 = drag.resizeDrag[i].width / drag.resizeDrag[i].height
            }
          }
          var maxWidth1 = preWidth1 * 2
          var maxHeight1 = preHeight1 * 2
          width1 = Math.min(Math.max(1, minWidth1, width1), maxWidth1)
          height1 = Math.min(Math.max(1, minHeight1, height1), maxHeight1)
          if (limit1 && dir.length > 1) {
            if (width1 !== widthTo1) {
              height1 = Math.max(limit1.minHeight, heightTo1 * width1 / widthTo1)
            }
            if (height1 !== heightTo1) {
              width1 = widthTo1 * height1 / heightTo1
            }
          }
          element.elements[i].width = width1
          element.elements[i].height = height1;
          (function() {
            var points = utils.getRectPoints({
              left: preLeft1, // 拖拽前的left
              top: preTop1, // 拖拽前的top
              width: width1, // 拖拽后图片宽度
              height: height1, // 拖拽后图片高度
              rotate: element.elements[i].rotate
            })
            var diagonal = {
              nw: 'se',
              ne: 'sw',
              n: 'sw',
              w: 'se',
              sw: 'ne',
              se: 'nw',
              s: 'ne',
              e: 'nw'
            }[dir]
            var newPoint = points[diagonal]// 以左上角为顶点进行相应的变换
            var prePoint = drag.resizeDrag[i].points[diagonal]// 拖拽前对角坐标
            element.elements[i].left = preLeft1 - (newPoint.x - prePoint.x)
            element.elements[i].top = preTop1 - (newPoint.y - prePoint.y)
          })()
        }
      }
    },
    'element.transformRotate': function elementTransformRotate(drag, element) {
      if (element.type === '$selector') {
        for (let i = 0; i < element.elements.length; i++) {
          element.elements[i].rotate = drag.rotate
          element.elements[i].transform.rotation = drag.rotate * Math.PI / 180
        }
      }
      element.rotate = drag.rotate
      element.transform.rotation = drag.rotate * Math.PI / 180
    }
  }
}
</script>
