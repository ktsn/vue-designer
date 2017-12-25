import Vue from 'vue'

export default Vue.extend({
  mounted() {
    const parent = this.$el.parentElement
    const shadowEl = ((this as any).shadowEl = document.createElement('div'))
    const shadow = shadowEl.attachShadow({ mode: 'open' })

    if (parent) {
      parent.insertBefore(shadowEl, this.$el)
    }
    this.$el.remove()
    shadow.appendChild(this.$el)
  },

  beforeDestroy() {
    const shadowEl: HTMLElement = (this as any).shadowEl
    const parent = shadowEl.parentElement

    if (parent) {
      parent.removeChild(shadowEl)
    }
    shadowEl.removeChild(this.$el)
  }
})
