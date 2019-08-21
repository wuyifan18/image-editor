<template>
  <div class="editor-layout" :style="layoutStyle">
    <component
      :is="getConponent(element.type)"
      v-for="(element,index) in layout.elements"
      :key="index"
      :element="element"
    />
  </div>
</template>

<script>
import ImageElement from '@/components/elements/image/image-element'
import TextElement from '@/components/elements/text/text-element'

export default {
  name: 'EditorLayout',
  props: {
    layout: {
      type: Object,
      required: true
    }
  },
  computed: {
    layoutStyle: function() {
      return {
        height: this.layout.height + 'px',
        width: this.layout.width + 'px'
      }
    }
  },
  methods: {
    getConponent(type) {
      let curConponent
      if (type === 'image') {
        curConponent = ImageElement
      } else if (type === 'text') {
        curConponent = TextElement
      }
      return curConponent
    }
  }
}
</script>
