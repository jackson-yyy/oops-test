import { Signal } from './../types'
import { Assertion } from './assertion'

export type Action = Assertion | NewContext | CloseContext | NewPage | ClosePage | ErrorAction | ManualAction

export type ManualAction = ClickAction | MousemoveAction | HoverAction | PressAction | InputAction | ScrollAction

export type Modifier = 'Shift' | 'Control' | 'Alt' | 'Meta'

export interface BaseAction {
  action: string
  params?: Record<string, any>
  signals?: Signal[]
}

// 浏览器行为
export interface BrowserAction extends BaseAction {
  action: 'newContext' | 'closeContext' | 'newPage' | 'closePage'
  context?: string
  screenShot?: string
}

export interface BaseManualAction extends BaseAction {
  action: 'click' | 'dbClick' | 'hover' | 'press' | 'input' | 'mousemove' | 'scroll' | 'assertion'
  context: string
  page: string
  screenShot?: string
  scroll?: {
    x: number
    y: number
  }
}
export interface NewContext extends BrowserAction {
  action: 'newContext'
  params: {
    id: string
  }
}

export interface CloseContext extends BrowserAction {
  action: 'closeContext'
  params: {
    id: string
  }
}
export interface NewPage extends BrowserAction {
  action: 'newPage'
  context: string
  params: {
    id: string
    url: string
  }
}
export interface ClosePage extends BrowserAction {
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
    modifier?: Modifier
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
