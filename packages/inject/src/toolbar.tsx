import { defineComponent } from 'vue'
import { useToolbar } from './hooks'

export default defineComponent({
  setup() {
    const { tools, style } = useToolbar()

    return () => (
      <div style={style.value} class="oops-test-toolbar">
        {tools.value.map(tool => (
          <div
            class={['oops-test-toolbar__item', tool.active ? 'oops-test-toolbar__item--active' : '']}
            onClick={tool.handler}
          >
            {tool.text}
          </div>
        ))}
      </div>
    )
  },
})
