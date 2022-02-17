import { defineComponent, ref, computed } from 'vue'
import { object } from 'vue-types'
import { useToolbar } from '../../logics/toolbar/useToolbar'
import { ToolInfo } from '../../types'
import './index.less'
// import { addEventListener } from '../../utils/dom'

function getToolCls(tool: ToolInfo): string[] {
  const basicCls = 'oops-test-toolbar__item'
  let result = [basicCls]
  if (tool.active) {
    result.push(`${basicCls}--active`)
  }
  if (tool.disabled) {
    result.push(`${basicCls}--disabled`)
  }
  return result
}

const Tool = defineComponent({
  props: {
    info: object<ToolInfo>().isRequired,
  },
  setup(props) {
    const cls = computed(() => getToolCls(props.info))

    return () => (
      <div class={cls.value} onClick={props.info.handler}>
        {props.info.text}
        <div class="oops-test-toolbar__item-fold">
          {props.info.children?.map(info => (
            <Tool info={info} />
          ))}
        </div>
      </div>
    )
  },
})

export default defineComponent({
  setup() {
    const { tools } = useToolbar()

    const toolbarVisible = ref(true)
    window.__oopsTest_toggleShowToolbar = (visible: boolean) => {
      toolbarVisible.value = visible
    }

    return () => (
      <div class="oops-test-toolbar" v-show={toolbarVisible.value}>
        {tools.value.map(tool => (
          <Tool info={tool} />
        ))}
      </div>
    )
  },
})
