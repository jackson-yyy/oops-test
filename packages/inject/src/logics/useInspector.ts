/*
 * 高亮dom工具
 */

import { addEventListener } from '../utils/dom'
import { shallowRef } from 'vue'

export function useInspector() {
  const hoveringTarget = shallowRef<HTMLElement | null>(null)
  let removeListener = () => {}
  function stopInspecting() {
    removeListener()
    hoveringTarget.value = null
  }
  function inspect() {
    removeListener = addEventListener(
      document,
      'mouseover',
      event => {
        hoveringTarget.value = event.target as HTMLElement
        console.log(event.target)
      },
      true,
    )
  }
  return {
    hoveringTarget,
    stopInspecting,
    inspect,
  }
}
