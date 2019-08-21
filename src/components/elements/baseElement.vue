<script>
const doc = $(document)
import utils from '../../static/js/utils'
export default {
  name: 'BaseElement',
  created() {
    this.element.transform = utils.parseTransform(this.element.transform)
    this.element.rotate = 0
  }
}
</script>
