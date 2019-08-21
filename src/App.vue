<template>
  <!--  <div id="app">-->
  <!--    <img alt="Vue logo" src="./assets/logo.png">-->
  <!--    <HelloWorld msg="Welcome to Your Vue.js App"/>-->
  <!--  </div>-->
  <div
    ref="container"
    class="editor-container"
  >
    <!-- Shell -->
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
        <EditorCanvas
          ref="canvas"
          :layouts="layouts"
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
      <!--    </div>-->
      <!--    &lt;!&ndash; 框选 &ndash;&gt;-->
      <!--    <selector-->
      <!--      v-if="editable && currentLayout && !(currentLayout.$backgroundEditing && currentLayout.backgroundImageInfo)"-->
      <!--      ref="selector"-->
      <!--      :current-element="currentElement"-->
      <!--      :layout="currentLayout"-->
      <!--    />-->
      <!--  </div>-->
    </div>
  </div>
</template>

<script>
import template from './assets/template.json'
import EditorCanvas from '@/components/containers/editor-canvas'
import Transform from '@/static/transform'
import utils from '@/static/js/utils'

const _ = require('lodash')
export default {
  name: 'App',
  components: {
    EditorCanvas,
    Transform
  },
  data: function() {
    return {
      template: { layouts: null },
      layouts: null,
      currentElement: null,
      hasMove: null
    }
  },
  computed: {
    height: function() {
      return this.template.layouts[0].height
    },
    width: function() {
      return this.template.layouts[0].width
    }
  },
  created() {
    this.template = template
    this.layouts = this.template.layouts
  },
  mounted: function() {
    this.$nextTick(() => {
      var hasMove = false // 全局标识，初始化标识元素没有发生mousemove
      $(document).on('mousedown', () => {
        hasMove = false
      })
      $(document).on('mouseup', (e) => {
        if (!hasMove) {
          const left = $('div.editor-shell-wrap').offset().left
          const top = $('div.editor-shell-wrap').offset().top
          this.currentElement = this.getElementsByPoint(e.pageX - left, e.pageY - top)[0]
        }
        hasMove = false
      })
      $(document).on('mousemove', () => {
        hasMove = true //
      })
    })
  },
  methods: {
    getElementsByPoint: function getElementsByPoint(x, y) {
      const layout = this.layouts[0]
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
