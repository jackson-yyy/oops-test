import { BrowserName } from '@oops-test/engine'
import { chromium, firefox, webkit, Browser, BrowserContext, Page, BrowserType, LaunchOptions } from 'playwright'

export function getBrowser(browser: BrowserName): BrowserType {
  return {
    chromium,
    firefox,
    webkit,
  }[browser]
}

export class BrowserManger {
  private browser?: Browser

  private contextIdMap: Map<string, BrowserContext> = new Map()
  private contextMap: Map<BrowserContext, Map<string, Page>> = new Map()

  async launch(browserName: BrowserName, launchOptions: LaunchOptions) {
    this.browser = await getBrowser(browserName).launch(launchOptions)
    return this
  }

  getContext(cxtId: string) {
    const context = this.contextIdMap.get(cxtId)
    if (!context) {
      throw new Error(`[BrowserManger] Context(${cxtId}) not found.`)
    }
    return context
  }

  async newContext(id: string) {
    const context = await this.browser?.newContext()
    context && this.contextIdMap.set(id, context)
  }

  getPage(cxtId: string, pageId: string) {
    const page = this.contextMap.get(this.getContext(cxtId))?.get(pageId)
    if (!page) {
      throw new Error(`Page(${pageId}) under Context(${cxtId}) not found.`)
    }
    return page
  }

  setPage(page: Page, cxtId: string, pageId: string) {
    const context = this.getContext(cxtId)
    const pageMap = this.contextMap.get(context) ?? new Map()
    pageMap.set(pageId, page)
    this.contextMap.set(context, pageMap)
  }

  close() {
    this.browser?.close()
  }
}
