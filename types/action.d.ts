export interface Action {
  action: ActionType
  params?: Record<string, any>
}

export type ActionType = HtmlActions | ContextActions | PageActions | CustomActions | ErrorActions

export type HtmlActions = 'click' | 'dbClick' | 'press' | 'hover'
export type PageActions = 'newPage' | 'closePage'
export type ContextActions = 'newContext' | 'closeContext'
export type CustomActions = 'assertion'
export type ErrorActions = 'initScriptError'
