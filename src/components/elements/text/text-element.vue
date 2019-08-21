<template>
  <div
    class="editor-element"
    :style="cssStyle"
    :class="[
      'editor-element-' + element.type
    ]"
  >
    <div
      class="element-inner"
      :style="{
        textAlign: element.textAlign,
        lineHeight: element.lineHeight
      }"
    >
      <template v-if="hasEffects">
        <div
          v-for="(effect, index) in effectedTextEffects"
          :key="index"
          class="elment-inner-content"
        >
          <div
            ref="textNode"
            class="element-main"
            :style="effectStyles[index]"
            v-html="contentsHTML"
          />
        </div>
      </template>
      <div
        v-else
        class="elment-inner-content"
      >
        <div
          ref="textNode"
          class="element-main"
          :style="textStyle"
          v-html="contentsHTML"
        />
      </div>
    </div>
  </div>
</template>

<script>
import utils from '@/static/js/utils'
import fontList from '../../../assets/fontList.json'
import baseElement from '@/components/elements/baseElement'
const _ = require('lodash')
const tinycolor = require('tinycolor2')
export default {
  name: 'TextElement',
  extends: baseElement,
  props: {
    element: {
      type: Object,
      required: true
    }
  },
  computed: {
    effectStyles() {
      var _this = this
      return this.effectedTextEffects.map(function(effect) {
        var effectStyle = _this.getEffectStyle(effect)
        return Object.assign({}, _this.textStyle, effectStyle)
      })
    },
    effectedTextEffects() {
      var result = this.element.textEffects.filter(function(effect) {
        return effect.enable !== false
      })
      result = result.reduce(function(newResult, effect) {
        var valid = effect.stroke && effect.enable !== false && effect.stroke.type === 'outer'
        if (!valid) {
          newResult.push(effect)
        } else {
          effect = _.cloneDeep(effect)
          var nextEffect = _.merge({}, effect, {
            filling: this.element.textEffect.filling,
            stroke: {
              enable: true,
              type: 'center',
              color: effect.stroke.color,
              width: effect.stroke.width * 2
            }
          })
          effect.stroke.enable = false
          effect.shadow.enable = false
          newResult.push(effect)
          newResult.push(nextEffect)
        }
        return newResult
      }, [])
      result.reverse()
      return result
    },
    hasEffects() {
      return this.element.textEffects && this.effectedTextEffects.length
    },
    fontFamily() {
      const font = this.getCloseFont()
      var fallbackFonts = 'Arial'
      return '"' + font.name + '", "' + font.family + ', "' + (fallbackFonts ? ',' + fallbackFonts : '')
    },
    color() {
      return this.element.color && tinycolor(this.element.color).toString('rgb')
    },
    fontSize() {
      return this.element.fontSize
    },
    fontSizeScale() {
      return Math.min(1, this.fontSize / this.minFontSize)
    },
    letterSpacingScale() {
      return this.fontSizeScale < 1 ? this.minFontSize / this.model.fontSize : 1
    },
    transformOrigin() {
      var origin = [0, 0]
      var align = this.element.verticalAlign

      if (!this.isVertical) {
        origin[0] = 0
        origin[1] = { top: 0, middle: '50%', bottom: '100%' }[align]
      } else {
        origin[0] = { top: '100%', middle: '50%', bottom: 0 }[align]
        origin[1] = 0
      }

      return origin.join(' ')
    },
    mainTransform() {
      var fontSizeScale = this.fontSizeScale

      return fontSizeScale < 1 ? 'scale(' + fontSizeScale + ')' : null
    },
    mainMinHeight() {
      if (!this.isVertical) {
        return this.fontSize * this.element.lineHeight * this.fontSizeScale + 'px'
      } else {
        return 'initial'
      }
    },
    mainWidth() {
      var fontSizeScale = this.fontSizeScale
      var width = 100 / fontSizeScale

      if (this.isVertical) {
        return 'auto'
      } else {
        return width + '%'
      }
    },
    mainHeight() {
      var fontSizeScale = this.fontSizeScale
      var height = 100 / fontSizeScale

      if (!this.isVertical) {
        return 'auto'
      } else {
        return height + '%'
      }
    },
    textStyle() {
      return {
        fontFamily: this.fontFamily,
        fontSize: this.fontSize + 'px',
        letterSpacing: this.letterSpacingScale * this.element.letterSpacing + 'px',
        verticalAlign: this.element.verticalAlign,
        color: this.color,
        transform: this.mainTransform,
        transformOrigin: this.transformOrigin,
        minWidth: this.mainMinWdith,
        minHeight: this.mainMinHeight,
        width: this.mainWidth,
        height: this.mainHeight
      }
    },
    contentsHTML() {
      var _this = this
      var contents = this.element.contents.map(function(item) {
        if (item && item.fontFamily) {
          var font = _this.getCloseFont(item.fontFamily)
          return Object.assign({}, item, font ? {
            fontFamily: '"' + font.name + '","' + font.family + '"'
          } : null)
        }
        return item
      })
      return utils.fromHTML(contents)
    }
  },
  created() {
    this.element.contents = [{
      color: this.element.color,
      fontFamily: this.element.fontFamily,
      fontStyle: this.element.fontStyle || 'normal',
      fontSize: this.element.fontSize,
      fontWeight: this.element.fontWeight || 400,
      textDecoration: this.element.textDecoration || 'none',
      content: this.element.content
    }]
  },
  methods: {
    getEffectStyle(effect) {
      var style = {}
      if (effect.offset) {
        if (effect.offset.x) {
          style.left = effect.offset.x + 'px'
        }

        if (effect.offset.y) {
          style.top = effect.offset.y + 'px'
        }
      }
      if (effect.stroke && effect.stroke.enable !== false && effect.stroke.type !== 'outer') {
        if (effect.stroke && effect.stroke.width) {
          style['textStroke'] = effect.stroke.width + 'px ' + effect.stroke.color
        }
      }
      if (effect.shadow && effect.shadow.enable !== false) {
        var shadow = effect.shadow
        style.textShadow = shadow.offsetX + 'px ' + shadow.offsetY + 'px ' + shadow.blur + 'px ' + shadow.color
      }
      if (effect.skew && effect.skew.enable !== false) {
        if (effect.skew.x || effect.skew.y) {
          style.transform = 'skew(' + effect.skew.x + 'deg, ' + effect.skew.y + 'deg)'
        }
      }
      if (effect.filling && effect.filling.enable !== false) {
        var filling = effect.filling
        if (filling.type === 0) {
          style.webkitTextFillColor = filling.color
        }
        if (filling.type === 1 && filling.imageContent && filling.imageContent.image) {
          var imageContent = filling.imageContent
          style.webkitBackgroundClip = 'text'
          style.webkitTextFillColor = 'transparent'
          style.backgroundImage = 'url(' + imageContent.image + ')'
          style.backgroundRepeat = ['no-repeat', 'repeat'][imageContent.repeat || 0]
          var width = imageContent.width
          var height = imageContent.height
          var scaleX = imageContent.scaleX
          var scaleY = imageContent.scaleY
          if (width && height) {
            style.backgroundSize = width * scaleX + 'px ' + height * scaleY + 'px'
          }
        }
        if (filling.type === 2) {
          style.webkitBackgroundClip = 'text'
          style.webkitTextFillColor = 'transparent'
          var result = []
          var gradient = filling.gradient
          result.push(90 - gradient.angle + 'deg')
          gradient.stops.forEach(function(item) {
            result.push(item.color + ' ' + item.offset * 100 + '%')
          })
          var gradientString = result.join(',')
          style.backgroundImage = 'linear-gradient(' + gradientString + ')'
        }
      }
      return style
    },
    getCloseFont() {
      var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ''
      var fontsMap = fontList.reduceRight(function(ret, item) {
        ret[item.name] = item
        if (item.family) {
          ret[item.family] = item
        }
        return ret
      }, {})
      if (!name) {
        name = this.element.fontFamily
      }
      return fontsMap[name]
    }
  }
}
</script>
