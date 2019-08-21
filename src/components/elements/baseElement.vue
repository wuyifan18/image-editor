<script>
const doc = $(document)
import utils from '../../static/js/utils'
export default {
  name: 'BaseElement',
  computed: {
    cssStyle: function() {
      return {
        height: this.element.height + this.element.padding[0] + this.element.padding[2] + 'px',
        width: this.element.width + this.element.padding[1] + this.element.padding[3] + 'px',
        transform: this.element.transform.toString(),
        left: this.element.left + 'px',
        top: this.element.top + 'px'
      }
    }
  },
  created() {
    this.element.transform = utils.parseTransform(this.element.transform)
    this.element.rotate = 0
  }
}
</script>
