import { defineComponent, computed } from 'vue'
import { useRecorder } from './hooks'

export default defineComponent({
  setup() {
    const { toolsStatus } = useRecorder()
    const tools = computed(() => [
      {
        icon: '',
        text: 'Hover',
        active: toolsStatus.value.hovering,
        handler() {
          toolsStatus.value.hovering = true
        },
      },
      {
        icon: '',
        text: 'Assert',
        active: toolsStatus.value.asserting,
        handler() {
          toolsStatus.value.asserting = true
        },
      },
      {
        icon: '',
        text: 'finish',
        handler: window.__oopsTest_finish,
      },
    ])

    return () =>
      tools.value.map(tool => (
        <div
          class={['oops-test-toolbar__item', tool.active ? 'oops-test-toolbar__item--active' : '']}
          onClick={tool.handler}
        >
          {tool.text}
        </div>
      ))
  },
})
