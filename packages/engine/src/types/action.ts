import { Signal, SignalType } from './../types'
import { Assertion } from './assertion'

export type Action = Assertion | NewContext | CloseContext | NewPage | ClosePage | ErrorAction | ManualAction

export type ManualAction = ClickAction | MousemoveAction | HoverAction | PressAction | InputAction | ScrollAction

export interface BaseAction {
  action: string
  context?: string
  page?: string
  params?: Record<string, any>
  screenShot?: string
  signals?: Record<SignalType, Omit<Signal, 'name'>>
}

export interface BaseManualAction extends BaseAction {
  context: string
  page: string
}

export type ActionType = HtmlType | ContextType | PageType | CustomType | 'error'

export type HtmlType = 'click' | 'dbClick' | 'press' | 'hover' | 'mousemove'
export type PageType = 'newPage' | 'closePage'
export type ContextType = 'newContext' | 'closeContext'
export type CustomType = 'assertion'

export type Modifier = 'Shift' | 'Control' | 'Alt' | 'Meta'

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

export interface ClickAction extends BaseManualAction {
  action: 'click' | 'dbClick'
  params: {
    selector: string
    modifier?: string
  }
}

export interface MousemoveAction extends BaseManualAction {
  action: 'mousemove'
  params: {
    x: number
    y: number
  }
}

export interface HoverAction extends BaseManualAction {
  action: 'hover'
  params: {
    selector: string
  }
}

export interface PressAction extends BaseManualAction {
  action: 'press'
  params: {
    selector: string
    key: string
    modifier?: Modifier
  }
}

export interface InputAction extends BaseManualAction {
  action: 'input'
  params: {
    selector: string
    content: string
  }
}

export interface ScrollAction extends BaseManualAction {
  action: 'scroll'
  params: {
    x: number
    y: number
  }
}

export interface ErrorAction extends BaseAction {
  action: 'error'
  msg: string
}
