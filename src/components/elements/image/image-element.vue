<template>
  <div class="editor-element" :style="cssStyle">
    <img
      :src="element.url"
      :style="imgStyle"
    >
  </div>
</template>

<script>

import baseElement from '@/components/elements/baseElement'
export default {
  name: 'ImageElement',
  extends: baseElement,
  props: {
    element: {
      type: Object,
      required: true
    }
  },
  computed: {
    cssStyle: function() {
      return {
        height: this.element.height + this.element.padding[0] + this.element.padding[2] + 'px',
        width: this.element.width + this.element.padding[1] + this.element.padding[3] + 'px',
        transform: this.element.transform.toString(),
        left: this.element.left + 'px',
        top: this.element.top + 'px'
      }
    },
    imgStyle: function() {
      return {
        position: 'absolute',
        width: this.element.width + 'px',
        height: this.element.height + 'px',
        left: 0 + 'px',
        top: 0 + 'px'
      }
    }
  }
}
</script>
