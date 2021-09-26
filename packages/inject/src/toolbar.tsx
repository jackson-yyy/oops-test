import { defineComponent, computed } from 'vue'
import { useRecorder } from './hooks'

export default defineComponent({
  setup() {
    const { toolsStatus, resetToolsStatus } = useRecorder()
    const tools = computed(() => [
      {
        icon: '',
        text: 'Hover',
        active: toolsStatus.value.hovering,
        handler() {
          toolsStatus.value.hovering = !toolsStatus.value.hovering
        },
      },
      {
        icon: '',
        text: 'Assert',
        active: toolsStatus.value.asserting,
        handler() {
          toolsStatus.value.asserting = !toolsStatus.value.asserting
        },
      },
      {
        icon: '',
        text: 'finish',
        handler: window.__oopsTest_finish,
      },
    ])

    function toolHandlerWrapper(handler: () => void) {
      return () => {
        resetToolsStatus()
        handler()
      }
    }

    return () =>
      tools.value.map(tool => (
        <div
          class={['oops-test-toolbar__item', tool.active ? 'oops-test-toolbar__item--active' : '']}
          onClick={toolHandlerWrapper(tool.handler)}
        >
          {tool.text}
        </div>
      ))
  },
})
