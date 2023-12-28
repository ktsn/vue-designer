import { createApp, h, ref, Plugin } from 'vue'

export function mount<V extends new () => any>(
  Component: V,
  propsData?: Record<string, any>,
  plugins: Plugin[] = []
) {
  const props = ref(propsData ?? {})

  function updateProps(newProps: Record<string, any>) {
    props.value = {
      ...props.value,
      ...newProps,
    }
  }

  const app = createApp({
    render() {
      return h(Component, {
        ref: 'comp',
        ...props.value,
      })
    },
  })

  for (const plugin of plugins) {
    app.use(plugin)
  }

  const el = document.createElement('div')
  const root = app.mount(el)

  return {
    vm: root.$refs.comp as InstanceType<V>,
    updateProps,
  }
}
