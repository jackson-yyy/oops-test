export interface ToolsStatus {
  recording: boolean
  hovering: boolean
  asserting: {
    elementScreenshot: boolean
    snapshot: boolean
  }
}

export type ToolInfo =
  | {
      icon?: string
      text?: string
      active: boolean
      disabled: boolean
      handler: () => void | Promise<void>
    }
  | {
      text: string
      active: boolean
      disabled: boolean
      children: ToolInfo[]
    }
