import { Signal } from './../types'
import { Assertion } from './assertion'

export type Action =
  | Assertion
  | NewContext
  | CloseContext
  | NewPage
  | ClosePage
  | ClickAction
  | MousemoveAction
  | ErrorAction

export interface BaseAction {
  action: ActionType
  context?: string
  page?: string
  params?: Record<string, any>
  signals?: Signal[]
}

export type ActionType = HtmlType | ContextType | PageType | CustomType | ErrorType

export type HtmlType = 'click' | 'dbClick' | 'press' | 'hover' | 'mousemove'
export type PageType = 'newPage' | 'closePage'
export type ContextType = 'newContext' | 'closeContext'
export type CustomType = 'assertion'
export type ErrorType = 'initScriptError'

export interface NewContext extends BaseAction {
  action: 'newContext'
  params: {
    id: string
  }
}

export interface CloseContext extends BaseAction {
  action: 'closeContext'
  params: {
    id: string
  }
}
export interface NewPage extends BaseAction {
  action: 'newPage'
  context: string
  params: {
    id: string
    url: string
  }
}
export interface ClosePage extends BaseAction {
  action: 'closePage'
  context: string
  params: {
    id: string
  }
}

export interface ClickAction extends BaseAction {
  action: 'click' | 'dbClick'
  context: string
  page: string
  params: {
    selector: string
  }
}

export interface MousemoveAction extends BaseAction {
  action: 'mousemove'
  context: string
  page: string
  params: {
    x: number
    y: number
  }
}

export interface ErrorAction extends BaseAction {
  action: ErrorType
}
