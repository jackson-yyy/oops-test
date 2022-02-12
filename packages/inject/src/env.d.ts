import type { Action, Case } from '@oops-test/engine/types'

type StartRecordParams = {
  context: string
  page: string
  url: string
} & Pick<Case, 'name' | 'saveMock'>

declare global {
  interface Window {
    __oopsTest_recordAction: (action: Action) => Promise<void>
    __oopsTest_exit: () => Promise<void>
    __oopsTest_startRecord: (params: StartRecordParams) => Promise<'success' | 'exist' | 'fail'>
    __oopsTest_finishRecord: (params: { context: string }) => Promise<void>
    __oopsTest_contextId: string
    __oopsTest_pageId: string
    __oopsTest_resetToolbar: () => Promise<void>
  }
}
