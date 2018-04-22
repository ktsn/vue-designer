<script lang="ts">
import Vue, { VNode } from 'vue'

export default Vue.extend({
  name: 'Resizable',

  props: {
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    },
    offsetWeight: {
      type: Number,
      default: 1
    }
  },

  data() {
    return {
      /**
       * Starting position / size when a drag is started.
       */
      base: {
        width: 0,
        height: 0,
        x: 0,
        y: 0
      },

      /**
       * The direction that the delta of dragging position affects.
       * It only have a value of -1, 0 or 1, and is set when a drag
       * is started. The value will be multiplied with dragging offset
       * to tweak resize behavior.
       *
       * e.g.
       * If the user drags the north corner of the resizable element,
       * we want the element to be larger when the offset goes the minus.
       * In that case, set `direction.y = -1` so that the calculated height
       * will be expected since the direction value reverse the minus sign.
       */
      direction: {
        x: 0,
        y: 0
      },

      dragging: false
    }
  },

  computed: {
    style(): Record<string, string> {
      return {
        width: this.width + 'px',
        height: this.height + 'px'
      }
    }
  },

  methods: {
    onDragStart(event: PointerEvent): void {
      const el = event.currentTarget as HTMLElement
      el.setPointerCapture(event.pointerId)

      this.dragging = true

      this.base = {
        width: this.width,
        height: this.height,
        x: event.clientX,
        y: event.clientY
      }
    },

    onDrag(event: PointerEvent): void {
      if (!this.dragging) return

      const { width, height, x, y } = this.base
      const dir = this.direction

      const offsetX = dir.x * this.offsetWeight * (event.clientX - x)
      const offsetY = dir.y * this.offsetWeight * (event.clientY - y)

      this.$emit('resize', {
        width: width + offsetX,
        height: height + offsetY
      })
    },

    onDragEnd(): void {
      this.dragging = false
    }
  },

  render(h): VNode {
    const handlers = [
      { type: 'n', x: 0, y: -1 },
      { type: 's', x: 0, y: 1 },
      { type: 'w', x: -1, y: 0 },
      { type: 'e', x: 1, y: 0 },
      { type: 'nw', x: -1, y: -1 },
      { type: 'ne', x: 1, y: -1 },
      { type: 'sw', x: -1, y: 1 },
      { type: 'se', x: 1, y: 1 }
    ]

    return h(
      'div',
      {
        class: 'resizable',
        style: this.style
      },
      [
        this.$slots.default,

        // Resize handlers which are listening user's drag event
        handlers.map(({ type, x, y }) => {
          return h('div', {
            class: `resizable-handler resizable-handler-${type}`,
            attrs: { draggable: 'true' },
            on: {
              pointerdown: (event: PointerEvent) => {
                this.direction.x = x
                this.direction.y = y
                this.onDragStart(event)
              },
              pointermove: this.onDrag,
              pointerup: this.onDragEnd,
              pointercancel: this.onDragEnd
            }
          })
        })
      ]
    )
  }
})
</script>

<style lang="scss" scoped>
.resizable {
  --handler-size: 10px;
  --handler-offset: calc(var(--handler-size) / 2);
  --handler-offset-negative: calc(-1 * var(--handler-offset));
  position: relative;
}

.resizable-handler {
  position: absolute;
}

.resizable-handler-n,
.resizable-handler-s {
  left: var(--handler-offset);
  right: var(--handler-offset);
  height: var(--handler-size);
  cursor: ns-resize;
}

.resizable-handler-e,
.resizable-handler-w {
  top: var(--handler-offset);
  bottom: var(--handler-offset);
  width: var(--handler-size);
  cursor: ew-resize;
}

.resizable-handler-nw,
.resizable-handler-ne,
.resizable-handler-sw,
.resizable-handler-se {
  width: var(--handler-size);
  height: var(--handler-size);
}

.resizable-handler-n {
  top: var(--handler-offset-negative);
}

.resizable-handler-s {
  bottom: var(--handler-offset-negative);
}

.resizable-handler-w {
  left: var(--handler-offset-negative);
}

.resizable-handler-e {
  right: var(--handler-offset-negative);
}

.resizable-handler-nw {
  top: var(--handler-offset-negative);
  left: var(--handler-offset-negative);
  cursor: nwse-resize;
}

.resizable-handler-ne {
  top: var(--handler-offset-negative);
  right: var(--handler-offset-negative);
  cursor: nesw-resize;
}

.resizable-handler-sw {
  bottom: var(--handler-offset-negative);
  left: var(--handler-offset-negative);
  cursor: nesw-resize;
}

.resizable-handler-se {
  bottom: var(--handler-offset-negative);
  right: var(--handler-offset-negative);
  cursor: nwse-resize;
}
</style>

