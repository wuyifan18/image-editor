<template>
  <div
    class="editor-element"
    :class="[
      'editor-element-' + element.type
    ]"
    :style="cssStyle"
  >
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
