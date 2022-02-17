import { Action, Case } from '.'

/**
 * engine提供给inject使用的api
 *
 * @export
 * @interface EngineApis
 */
export interface EngineApis {
  __oopsTest_contextId: string
  __oopsTest_pageId: string

  /**
   * 判断是否录制中
   *
   * @returns {*}  {boolean}
   * @memberof EngineApis
   */
  __oopsTest_isRecording(): boolean

  /**
   * 记录action
   *
   * @param {Action} action
   * @memberof EngineApis
   */
  __oopsTest_recordAction(action: Action): void

  /**
   * 创建用例
   *
   * @param {(Pick<Case, 'name' | 'saveMock'>)} caseInfo
   * @returns {*}  {('success' | 'exist' | 'fail')}
   * @memberof EngineApis
   */
  __oopsTest_createCase(caseInfo: Pick<Case, 'name' | 'saveMock'>): 'success' | 'exist' | 'fail'

  /**
   * 退出录制
   *
   * @memberof EngineApis
   */
  __oopsTest_exit(): void

  /**
   * 开始录制
   *
   * @param {{ context: string; page: string; url: string }} params
   * @memberof EngineApis
   */
  __oopsTest_startRecord(params: { context: string; page: string; url: string }): void

  /**
   * 停止录制
   *
   * @param {{ context: string }} params
   * @memberof EngineApis
   */
  __oopsTest_finishRecord(params: { context: string }): void
}

/**
 * engine调用inject的api，需要inject实现
 *
 * @export
 * @interface InjectApis
 */
export interface InjectApis {
  /**
   * 同步状态
   *
   * @param {boolean} isRecording
   * @memberof InjectApis
   */
  __oopsTest_syncStatus(isRecording: boolean): void

  /**
   * 显隐toolbar
   *
   * @param {boolean} visible
   * @memberof InjectApis
   */
  __oopsTest_toggleShowToolbar(visible: boolean): void

  /**
   * 展示消息
   *
   * @param {({
   *     type: 'error' | 'success' | 'info'
   *     title?: string
   *     content: string
   *     during?: number
   *   })} params
   * @memberof InjectApis
   */
  __oopsTest_notice(params: {
    type: 'error' | 'success' | 'info'
    title?: string
    content: string
    during?: number
  }): void
}
