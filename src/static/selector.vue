<template>
  <div class="editor-selector">
    <div
      v-if="maskActived"
      class="editor-selector-mask"
      :style="{
        height: mask.height + 'px',
        width: mask.width + 'px',
        left: mask.left + 'px',
        top: mask.top + 'px'
      }"
    />
  </div>
</template>

<script>
import utils from './js/utils'
const _ = require('lodash')
export default {
  name: 'Selector',
  props: ['currentElement'],
  data: function() {
    return {
      maskActived: false,
      mask: {
        height: 0,
        width: 0,
        left: 0,
        top: 0
      },
      selector: null
    }
  },
  computed: {
    editor: function editor() {
      return this.$parent
    },
    currentLayout: function currentLayout() {
      return this.editor.currentLayout
    },
    elements: function elements() {
      var layout = this.currentLayout
      return layout ? layout.elements : []
    },
    selectedElements: function selectedElements() {
      var elements = this.elements
      elements = elements.filter(function(element) {
        return element.$selected
      })
      var currElement = this.currentElement
      if (currElement && elements.indexOf(currElement) < 0) {
        elements.push(currElement)
      }
      return elements
    }
  },
  watch: {
    currentElement: function currentElement(element) {
      if (!this.maskActived && element !== this.selector) {
        this.hideSelector()
      }
    }
  },
  mounted() {
    var _this2 = this
    const events = this.$options.events
    for (const key in events) {
      this.$on(key, events[key])
    }
    this.$on('mask.active', function(e) {
      if (!e.shiftKey && !e.metaKey) {
        _this2.clearSelectedElements()
      }
      var currentElement = _this2.currentElement
      if (currentElement) {
        if (e.shiftKey || e.metaKey) {
          _this2.add(currentElement)
        }
        _this2.focusElement(null)
      }
      var keepElementsCache = _this2.keepElementsCache = {}
      var selectedElements = _this2.selectedElements
      if (selectedElements.length > 0) {
        selectedElements.forEach(function(element) {
          keepElementsCache[element.$id] = true
        })
      }
      _this2.maskActived = true
    })
    this.$on('mask.inactive', function() {
      _this2.maskActived = false
      _this2.showSelector()
    })
    this.$on('mask.moving', function(e, drag) {
      var mask = _this2.mask
      var dx = drag.dx
      var dy = drag.dy
      mask.top = dy > 0 ? drag.startY : drag.startY + dy
      mask.left = dx > 0 ? drag.startX : drag.startX + dx
      mask.height = Math.abs(dy)
      mask.width = Math.abs(dx)
      _this2.checkElements(drag)
    })
  },
  methods: {
    add: function add(element) {
      if (element && !element.$selected) {
        element.$selected = true
      }
    },
    remove: function remove(element) {
      if (element && element.$selected) {
        element.$selected = false
      }
    },
    activeMask: function activeMask(e) {
      var self = this
      var doc = $(document)
      var drag = this.drag = {
        pageX: e.pageX,
        pageY: e.pageY,
        startX: e.pageX,
        startY: e.pageY,
        bboxList: null,
        draging: false,
        append: false,
        cancel: function cancel(e) {
          doc.off('mousemove.editor-selector', drag.move)
          if (drag.draging) {
            drag.draging = false
            self.drag = null
            self.$emit('mask.inactive', e, drag)
          }
        },
        move: function move(e) {
          e.preventDefault()
          drag.dx = e.pageX - drag.pageX
          drag.dy = e.pageY - drag.pageY
          var dOffsetMin = 3
          if (!drag.draging && (Math.abs(drag.dx) >= dOffsetMin || Math.abs(drag.dy) >= dOffsetMin)) {
            drag.draging = true
            self.$emit('mask.active', e, drag)
          }
          if (drag.draging) {
            self.$emit('mask.moving', e, drag)
          }
        }
      }
      doc.on('mousemove.editor-selector', drag.move)
      doc.one('mouseup.editor-selector', drag.cancel)
    },
    checkElements: function checkElements() {
      var self = this
      var mask = this.mask
      var editor = this.editor
      var shellRect = editor.shellRect
      var zoom = editor.zoom
      var maskRect = {
        left: (mask.left - shellRect.left) / zoom,
        top: (mask.top - shellRect.top) / zoom - self.currentLayout.top,
        height: mask.height / zoom,
        width: mask.width / zoom,
        rotate: 0
      }
      var keepElementsCache = this.keepElementsCache
      var elements = this.elements
      elements.forEach((element) => {
        if (keepElementsCache[element.$id]) {
          return
        }
        var intersection = utils.getRectIntersection(maskRect, element)
        if (intersection) {
          self.add(element)
        } else {
          self.remove(element)
        }
      })
    },
    getElement: function getElement(id, options) {
      options = _.defaults({
        queryCurrntElement: true,
        deep: false
      }, options)
      if (id === undefined && options.queryCurrntElement) {
        return this.currentElement
      }
      if (!id) {
        return null
      }
      if (id && id.$id) {
        return id
      }
      var layout = options.layout || this.currentLayout
      var elements = layout && layout.elements || []
      var ret = null
      _.forEach(elements, function(element) {
        if (element.$id === id) {
          ret = element
          return false
        }
      })
      return ret
    },
    showSelector: function showSelector() {
      var editor = this.editor
      var elements = this.selectedElements
      if (!elements.length) {
        return
      }
      if (elements.length === 1) {
        editor.focusElement(elements[0])
        return
      }
      var bbox = utils.getBBoxByElements(elements, 1)
      var selector = this.createElement({
        type: '$selector',
        rotatable: true,
        resize: 1,
        height: bbox.height,
        width: bbox.width,
        left: bbox.left,
        top: bbox.top,
        elements: elements,
        $guider: { show: false, snapTo: false }
      })
      this.focusElement(selector)
      this.selector = selector
    },
    clearSelectedElements: function clearSelectedElements() {
      var selectedElements = this.selectedElements
      if (selectedElements.length) {
        selectedElements.forEach(function(element) {
          element.$selected = false
        })
      }
    },
    hideSelector: function hideSelector() {
      this.clearSelectedElements()
      this.selector = null
    },
    createElement: function createElement(data, layout) {
      var _this = this
      var type = data && data.type
      if (!type) {
        throw new Error('No type to create element:' + JSON.stringify(data))
      }
      var element = data
      if (!layout) {
        layout = this.currentLayout
      }
      if (layout && _.isUndefined(data.left)) {
        element.left = Math.max(0, (layout.width - element.width) / 2)
      }
      if (layout && _.isUndefined(data.top)) {
        element.top = Math.max(0, (layout.height - element.height) / 2)
      }
      return element
    },
    focusElement: function focusElement(element) {
      element = this.getElement(element, {
        queryCurrntElement: false
      })
      if (element !== this.currentElement) {
        this.editor.currentElement = element
      }
    }
  },
  events: {
    'base.mouseDown': function baseMouseDown(e) {
      var ignoreElements = ['.editor-element', '.editor-transform-wrap', '.editor-toolbar-wrap', '.editor-hover'].join(',')
      var isEditorElement = $(e.target).closest(ignoreElements).length > 0
      if (e.ctrlKey || e.button !== 0 || e.isDefaultPrevented() || isEditorElement && !e.altKey) {
        return
      }
      this.activeMask(e)
    }
  }
}
</script>
