import { Signal, SignalType } from './../types'
import { Assertion } from './assertion'

export type Action = Assertion | NewContext | CloseContext | NewPage | ClosePage | ErrorAction | ManualAction

export type ManualAction = ClickAction | MousemoveAction | HoverAction

export interface BaseAction {
  action: ActionType
  context?: string
  page?: string
  params?: Record<string, any>
  signals?: Record<SignalType, Omit<Signal, 'name'>>
}

export type ActionType = HtmlType | ContextType | PageType | CustomType | 'error'

export type HtmlType = 'click' | 'dbClick' | 'press' | 'hover' | 'mousemove'
export type PageType = 'newPage' | 'closePage'
export type ContextType = 'newContext' | 'closeContext'
export type CustomType = 'assertion'

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

export interface HoverAction extends BaseAction {
  action: 'hover'
  context: string
  page: string
  params: {
    selector: string
  }
}

export interface ErrorAction extends BaseAction {
  action: 'error'
  msg: string
}
