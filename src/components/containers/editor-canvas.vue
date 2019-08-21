<template>
  <div class="editor-canvas">
    <EditorLayout
      :layout="layouts[0]"
    />
  </div>
</template>

<script>
import EditorLayout from '@/components/containers/editor-layout'

export default {
  name: 'EditorCanvas',
  components: {
    EditorLayout
  },
  props: {
    layouts: {
      type: Array,
      required: true
    }
  }
}
</script>
