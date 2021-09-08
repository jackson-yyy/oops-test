import path from 'path'
import { chromium, firefox, webkit, BrowserContext, Browser, BrowserType } from 'playwright'
import { EventEmitter } from 'stream'
import { BrowserName, Action } from './types'
import { getUuid } from './utils'

const browserMap: Record<BrowserName, BrowserType> = {
  chromium,
  firefox,
  webkit,
}

class Recorder extends EventEmitter {
  private browser?: Browser
  private context?: BrowserContext
  private contextId?: string
  private actionsRecord: Action[] = []

  get actions() {
    return this.actionsRecord
  }

  private async initContext() {
    this.context = await this.browser!.newContext()
    this.contextId = getUuid()

    this.addAction({
      action: 'newContext',
      context: this.contextId!,
      params: {
        id: this.contextId!,
      },
    })

    this.context?.on('close', () => {
      this.addAction({
        action: 'closeContext',
        context: this.contextId!,
        params: {
          id: this.contextId!,
        },
      })
      this.finish()
    })
  }

  private async initPage(url: string) {
    const page = await this.context!.newPage()
    const pageId = getUuid()

    page.on('close', () => {
      this.addAction({
        action: 'closePage',
        page: pageId,
        context: this.contextId!,
        params: {
          id: pageId,
        },
      })
    })

    await page.addInitScript({
      path: path.join(__dirname, '../node_modules/@oops-test/inject/dist/index.global.js'),
    })

    await page.exposeBinding('_oopsTestRecordAction', (_source, action: Action) => {
      this.addAction({
        ...action,
        page: pageId,
        context: this.contextId!,
      })
    })

    await page.goto(url, { waitUntil: 'domcontentloaded' })

    await page.evaluate(`window._oopsTestInject._oopsTestInitScript()`)

    this.addAction({
      action: 'newPage',
      page: pageId,
      context: this.contextId!,
      params: {
        url,
        id: pageId,
      },
    })
  }

  private addAction(action: Action) {
    this.actionsRecord.push(action)
  }

  async start({ url = 'http://localhost:8080', browser = 'chromium' }: { url: string; browser?: BrowserName }) {
    this.browser = await browserMap[browser].launch({ headless: false })
    this.browser.on('disconnected', this.finish)

    await this.initContext()
    await this.initPage(url)

    console.log('start')
  }

  private finish() {
    console.log('finish')
    this.browser?.close()
    this.emit('recordFinish')
  }
}

export { Recorder }
