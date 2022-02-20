import type { Assertion } from './assertion'
import type { Signal } from './signal'

export type Action = Assertion | BrowserAction | ManualAction

export type ManualAction = ClickAction | MousemoveAction | HoverAction | PressAction | InputAction | ScrollAction

export type BrowserAction = NewContext | CloseContext | NewPage | ClosePage | ErrorAction

export type Modifier = 'Shift' | 'Control' | 'Alt' | 'Meta'

export interface BaseAction {
  action: string
  params?: Record<string, any>
  signals?: Partial<Record<Signal['name'], Omit<Signal, 'name'>>>
}

// 浏览器行为
export interface BaseBrowserAction extends BaseAction {
  action: 'newContext' | 'closeContext' | 'newPage' | 'closePage'
  context?: string
  screenShot?: string
}

export interface BaseManualAction extends BaseAction {
  action: 'click' | 'dbClick' | 'hover' | 'press' | 'input' | 'mousemove' | 'scroll' | 'assertion'
  context: string
  page: string
  screenShot?: string
}
export interface NewContext extends BaseBrowserAction {
  action: 'newContext'
  params: {
    id: string
  }
}

export interface CloseContext extends BaseBrowserAction {
  action: 'closeContext'
  params: {
    id: string
  }
}
export interface NewPage extends BaseBrowserAction {
  action: 'newPage'
  context: string
  screenShot?: string
  params: {
    id: string
    url: string
  }
}
export interface ClosePage extends BaseBrowserAction {
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
    selector: string
    x: number
    y: number
  }
}

export interface ErrorAction extends BaseAction {
  action: 'error'
  msg: string
}
