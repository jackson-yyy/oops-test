export interface ToolsStatus {
  recording: boolean
  hovering: boolean
  asserting: {
    elementScreenshot: boolean
    elementSnapshot: boolean
  }
}

export interface ToolInfo {
  icon?: string
  text?: string
  active: boolean
  disabled: boolean
  handler?: () => void | Promise<void>
  children?: ToolInfo[]
}
