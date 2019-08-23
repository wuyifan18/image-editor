<template>
  <div
    ref="container"
    class="editor-container"
  >
    <div
      class="editor-shell-wrap"
      :style="{
        width: width + 'px',
        height: height + 'px',
      }"
    >
      <div
        class="editor-shell"
        :style="{
          height: height + 'px',
          width: width + 'px',
        }"
      >
        <p>{{ layouts[0].elements[15] }}</p>
        <EditorCanvas
          ref="canvas"
          :layouts.sync="layouts"
          :style="{
            width: width + 'px',
            height: height + 'px'
          }"
        />
        <Transform
          v-if="currentElement"
          ref="transform"
          :element.sync="currentElement"
        />
      </div>
    </div>
    <selector
      ref="selector"
      :current-element.sync="currentElement"
    />
  </div>
</template>

<script>
import template from './assets/template.json'
import EditorCanvas from './components/containers/editor-canvas'
import Transform from './static/transform'
import selector from './static/selector'
import utils from './static/js/utils'
const _ = require('lodash')
let _uuid = 0
export default {
  name: 'App',
  components: {
    EditorCanvas,
    Transform,
    selector
  },
  data: function() {
    return {
      template: { layouts: null },
      layouts: null,
      currentLayout: null,
      currentElement: null,
      selectedElements: [],
      hasMove: null,
      zoom: null,
      shellRect: {
        height: 0,
        width: 0,
        left: 0,
        top: 0
      }
    }
  },
  computed: {
    height: function() {
      return this.currentLayout.height
    },
    width: function() {
      return this.currentLayout.width
    }
  },
  created() {
    template.layouts[0].elements.map(element => {
      element.$selected = false
      element.$id = ++_uuid
    })
    this.template = template
    this.layouts = this.template.layouts
    this.currentLayout = this.layouts[0]
    this.zoom = this.template.global.zoom
  },
  mounted: function() {
    this.$nextTick(() => {
      this.shellRect = this.updateShellRect()
      var hasMove = false // 全局标识，初始化标识元素没有发生mousemove
      var x = null
      var y = null
      $(document).on('mousedown', (e) => {
        x = e.pageX
        y = e.pageY
        hasMove = false
        this.$refs.selector.$emit('base.mouseDown', e)
      })
      $(document).on('mouseup', (e) => {
        if (!hasMove) {
          const left = $('div.editor-shell-wrap').offset().left
          const top = $('div.editor-shell-wrap').offset().top
          this.currentElement = this.getElementsByPoint(e.pageX - left, e.pageY - top)[0]
        }
        hasMove = false
      })
      $(document).on('mousemove', (e) => {
        if (Math.abs(x - e.pageX) > 0 || (y - e.pageY) > 0) { hasMove = true }
      })
    })
  },
  methods: {
    updateShellRect() {
      var shellRect = this.shellRect
      var shell = $('.editor-shell', this.$el)
      if (shell.length) {
        var rect = shell[0].getBoundingClientRect()
        _.assign(shellRect, {
          height: rect.height,
          width: rect.width,
          top: rect.top,
          left: rect.left
        })
      }

      return shellRect
    },
    getElementsByPoint: function getElementsByPoint(x, y) {
      const layout = this.currentLayout
      const retElems = []
      const elems = layout && layout.elements || []
      if (!elems || !elems.length) {
        return retElems
      }
      x -= layout.left || 0
      y -= layout.top || 0
      if (x < 0 || y < 0 || x > layout.width || y > layout.height) {
        return retElems
      }
      _.forEachRight(elems, function(elem) {
        const rect = utils.getElementRect(elem, 1)
        if (utils.pointInRect(x, y, rect)) {
          retElems.push(elem)
        }
      })
      return retElems
    }
  }
}
</script>
