import { useInspector } from '../../logics/useInspector'
import { defineComponent, computed, watchEffect } from 'vue'
import { addEventListener } from '../../utils/dom'
import { object } from 'vue-types'
import { ToolsStatus } from '../../types'

export default defineComponent({
  props: {
    toolsStatus: object<ToolsStatus>().isRequired,
  },
  setup(props) {
    const { hoveringTarget, stopInspecting, inspect } = useInspector()

    const removeClickListener = addEventListener(document, 'click', () => {
      stopInspecting()
      removeClickListener()
    })

    // FIXME:这里不知道为啥没有生效
    const style = computed(() => {
      const rect = hoveringTarget.value?.getBoundingClientRect()

      return {
        position: 'fixed',
        left: rect?.left,
        right: rect?.right,
        top: rect?.top,
        bottom: rect?.bottom,
        width: rect?.width,
        height: rect?.height,
        backgroundColor: 'rgb(230, 185, 184, 0.8)',
        zIndex: 999,
      } as const
    })

    watchEffect(() => {
      if (
        props.toolsStatus.hovering ||
        props.toolsStatus.asserting.elementScreenshot ||
        props.toolsStatus.asserting.elementSnapshot
      ) {
        inspect()
      } else {
        stopInspecting()
        removeClickListener()
      }
    })

    return () => <div style={style.value}></div>
  },
})
