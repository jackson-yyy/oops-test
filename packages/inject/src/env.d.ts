import type { Action, Case } from '@oops-test/engine/types'

type StartRecordParams = {
  context: string
  page: string
  url: string
}

declare global {
  interface Window {
    // 给inject模块使用
    __oopsTest_isRecording(): Promise<boolean>
    __oopsTest_recordAction(action: Action): Promise<void>
    __oopsTest_createCase(caseInfo: Pick<Case, 'name' | 'saveMock'>): Promise<'success' | 'exist' | 'fail'>
    __oopsTest_exit(): Promise<void>
    __oopsTest_startRecord(params: StartRecordParams): Promise<void>
    __oopsTest_finishRecord(params: { context: string }): Promise<void>
    __oopsTest_reloadPage(): void
    __oopsTest_contextId: string
    __oopsTest_pageId: string

    // 给engine模块使用
    __oopsTest_syncStatus(isRecording: boolean): void
    __oopsTest_toggleShowToolbar(visible: boolean): void
  }
}
