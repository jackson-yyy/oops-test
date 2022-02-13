export interface ToolsStatus {
  recording: boolean
  hovering: boolean
  asserting: {
    screenshot: boolean
    snapshot: boolean
  }
}
