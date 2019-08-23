<template>
  <div
    class="editor-element"
    :class="[
      'editor-element-' + element.type,
      element.$selected ? 'editor-element-selected' : '',
    ]"
    :style="cssStyle"
  >
    <p>{{element.$selected}}</p>
    <div
      draggable="false"
      class="element-main"
    >
      <img
        :src="element.url"
        :style="imgStyle"
      >
    </div>
    <i class="border-before" :style="{zoom: 1}" />
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
