import Vue, { VueConstructor, h, ref } from 'vue'

export function mount<V extends VueConstructor>(
  Component: V,
  propsData?: Record<string, any>,
  listeners?: Record<string, any>,
  options?: Record<string, any>
) {
  const props = ref(propsData ?? {})

  function updateProps(newProps: Record<string, any>) {
    props.value = {
      ...props.value,
      ...newProps,
    }
  }

  const root = new Vue({
    ...options,
    render() {
      return h(Component, {
        ref: 'comp',
        props: props.value,
        on: listeners,
      })
    },
  }).$mount()

  return {
    vm: root.$refs.comp as InstanceType<V>,
    updateProps,
  }
}
