import { defineComponent } from 'vue'

const toolList = [
  {
    icon: '',
    text: 'Hover',
    handler() {
      console.log('hover')
    },
  },
  {
    icon: '',
    text: 'Expect',
    handler() {},
  },
]

export default defineComponent({
  setup() {
    return () =>
      toolList.map(tool => (
        <div class="oops-test-toolbar__item" onClick={tool.handler}>
          {tool.text}
        </div>
      ))
  },
})
