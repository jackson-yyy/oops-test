import Debug from 'debug'
import { merge } from 'lodash'
import path, { join } from 'path'
import { BrowserContext, Browser, Page } from 'playwright'
import { EventEmitter } from 'stream'
import { BrowserName, Action, Signal, Case } from './types'
import { getUuid, getBrowser, createDir, writeJson } from './utils'

const debug = Debug('oops-test:runner')
interface RecorderOptions {
  // 开启时，recorder会自动记录页面的所有请求数据，当做用例重跑时的数据源
  saveMock: boolean
  output: string
}

class Recorder extends EventEmitter {
  private browser?: Browser

  private options: RecorderOptions = {
    saveMock: false,
    output: process.cwd(),
  }

  private lastAction: Action | null = null

  private get output() {
    return {
      rootDir: this.options.output,
      screenshotDir: join(this.options.output, 'screenshots'),
      caseFile: join(this.options.output, 'case.json'),
    }
  }

  case: Case = {
    url: '',
    actions: [],
  }

  constructor(options?: Partial<RecorderOptions>) {
    super()
    merge(this.options, options)
    createDir([this.output.rootDir, this.output.screenshotDir])
  }

  private async prepareContext(context: BrowserContext, ctxId = getUuid()) {
    context.on('page', page => {
      this.onPage(page, ctxId)
    })

    await context.addInitScript({
      path: path.join(__dirname, '../inject/index.js'),
    })

    await context.exposeBinding('__oopsTest_recordAction', async ({ page }, action: Action) => {
      this.recordAction(action)
      await this.handleScreenshotAssert(action, page)
    })

    await context.exposeBinding('__oopsTest_finish', () => {
      this.finish()
    })

    context.on('close', () => {
      this.recordAction({
        action: 'closeContext',
        params: {
          id: ctxId,
        },
      })
    })
  }

  private async onPage(page: Page, ctxId: string, pageId = getUuid()) {
    this.preparePage(page, ctxId, pageId)

    if (await page.opener()) {
      this.setSignal({
        name: 'popup',
        pageId: pageId,
      })
    } else {
      await page.waitForEvent('domcontentloaded')
      this.recordAction({
        action: 'newPage',
        context: ctxId,
        params: {
          url: page.url(),
          id: pageId,
        },
      })
    }
  }

  private preparePage(page: Page, ctxId: string, pageId = getUuid()) {
    page.on('close', () => {
      this.recordAction({
        action: 'closePage',
        context: ctxId,
        params: {
          id: pageId,
        },
      })
    })

    page.on('requestfinished', debug)
    page.on('response', debug)

    page.on('domcontentloaded', async pg => {
      pg.evaluate(`window.__oopsTest_contextId = '${ctxId}'`)
      pg.evaluate(`window.__oopsTest_pageId = '${pageId}'`)
    })
  }

  private async recordAction(action: Action) {
    if (
      this.lastAction?.action === 'input' &&
      action.action === 'input' &&
      this.lastAction.params.selector === action.params.selector
    ) {
      this.case.actions.pop()
    }

    this.lastAction = action
    this.case.actions.push(action)
  }

  private setSignal(signal: Signal) {
    if (!this.lastAction) return

    if (!this.lastAction.signals) {
      this.lastAction.signals = []
    }

    const signalExistIdx = this.lastAction.signals.findIndex(item => item.name === signal.name)

    if (signalExistIdx >= 0) {
      this.lastAction.signals[signalExistIdx] = signal
    } else {
      this.lastAction.signals.push(signal)
    }
  }

  private async handleScreenshotAssert(action: Action, page: Page) {
    if (action.action === 'assertion' && action.params.type === 'screenshot') {
      await page.screenshot({
        path: join(this.output.screenshotDir, action.params.name),
      })
      await page.evaluate(`window.__oopsTest_resetToolbar()`)
    }
  }

  async start({ url = 'http://localhost:8080', browser = 'chromium' }: { url: string; browser?: BrowserName }) {
    this.case.url = url

    this.browser = await getBrowser(browser).launch({ headless: false })
    this.browser.on('disconnected', this.finish)

    const contextId = getUuid()
    const context = await this.browser.newContext()
    await this.prepareContext(context, contextId)

    this.recordAction({
      action: 'newContext',
      params: {
        id: contextId,
      },
    })

    const page = await context.newPage()
    await page.goto(url)
  }

  private async finish() {
    await Promise.all(this.browser?.contexts().map(ctx => ctx.close()) ?? [])
    this.browser?.close()
    writeJson(this.case, this.output.caseFile)
    this.emit('finish')
  }
}

export { Recorder }
