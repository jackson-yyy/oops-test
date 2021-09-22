import type { Action } from '@oops-test/engine/types'

declare global {
  interface Window {
    __oopsTest_recordAction: (action: Action) => void
    __oopsTest_finish: () => void
    __oopsTest_contextId: string
    __oopsTest_pageId: string
  }
}
