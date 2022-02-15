import { existsSync } from 'fs'
import Debug from 'debug'
import { merge } from 'lodash'
import path, { join } from 'path'
import { BrowserContext, Browser, Page } from 'playwright'
import { EventEmitter } from 'stream'
import { BrowserName, Action, Signal, Case } from './types'
import { getUuid, getBrowser, createDir, writeJson } from './utils'

const debug = Debug('oops-test:runner')
interface RecorderOptions {
  output: string
  caseName: string
}

function getInitCase(): Case {
  return {
    name: '',
    saveMock: true,
    skip: false,
    actions: [],
  }
}

class Recorder extends EventEmitter {
  private browser?: Browser

  private options: RecorderOptions = {
    output: process.cwd(),
    caseName: '',
  }

  private lastAction: Action | null = null

  private recording = false

  private get output() {
    const rootDir = join(this.options.output, this.case.name)
    return {
      rootDir: join(this.options.output, this.case.name),
      screenshotDir: join(rootDir, 'screenshots'),
      caseFile: join(rootDir, 'case.json'),
    }
  }

  case: Case = getInitCase()

  constructor(options?: Partial<RecorderOptions>) {
    super()
    merge(this.options, options)
  }

  private async prepareContext(context: BrowserContext, ctxId = getUuid()) {
    context.on('page', page => {
      this.onPage(page, ctxId)
    })

    await context.addInitScript({
      path: path.join(__dirname, '../inject/index.js'),
    })

    await context.exposeFunction('__oopsTest_isRecording', () => this.recording)

    await context.exposeBinding('__oopsTest_recordAction', async ({ page }, action: Action) => {
      this.recordAction(action)
      await this.handleScreenshotAssert(action, page)
    })

    await context.exposeBinding('__oopsTest_startRecord', (_, params) => {
      return this.startRecord(params)
    })
    await context.exposeBinding('__oopsTest_finishRecord', (_, params) => {
      this.finishRecord(params)
    })
    await context.exposeBinding('__oopsTest_exit', () => {
      this.exit()
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

    page.on('load', () => {
      page.evaluate(`window.__oopsTest_contextId = '${ctxId}'`)
      page.evaluate(`window.__oopsTest_pageId = '${pageId}'`)
    })
  }

  private async recordAction(action: Action) {
    if (!this.recording) return
    this.lastAction = action
    this.case.actions.push(action)
  }

  private setSignal(signal: Signal) {
    if (!this.lastAction) return
    const { name, ...params } = signal

    if (!this.lastAction.signals) {
      this.lastAction.signals = {}
    }
    this.lastAction.signals[name] = params
  }

  private async handleScreenshotAssert(action: Action, page: Page) {
    if (action.action === 'assertion' && action.params.type === 'screenshot') {
      await page.evaluate('window.__oopsTest_toggleShowToolbar(false)')
      await page.screenshot({
        path: join(this.output.screenshotDir, action.params.name),
      })
      await page.evaluate('window.__oopsTest_toggleShowToolbar(true)')
    }
  }

  async start({ url = 'http://localhost:8080', browser = 'chromium' }: { url: string; browser?: BrowserName }) {
    this.browser = await getBrowser(browser).launch({ headless: false })
    this.browser.on('disconnected', this.exit)

    const contextId = getUuid()
    const context = await this.browser.newContext()
    await this.prepareContext(context, contextId)

    const page = await context.newPage()
    await page.goto(url)
  }

  // TODO:这里拆出来一个判断case是否存在的函数
  startRecord({
    context,
    page,
    url,
    name,
    saveMock,
  }: {
    context: string
    page: string
    url: string
    name: string
    saveMock: boolean
  }): 'success' | 'exist' | 'fail' {
    this.case.name = name
    this.case.saveMock = saveMock
    if (existsSync(this.output.rootDir)) {
      this.case = getInitCase()
      return 'exist'
    }

    try {
      createDir([this.output.rootDir, this.output.screenshotDir])
    } catch (error) {
      console.error(error)
      return 'fail'
    }

    this.recording = true

    this.recordAction({
      action: 'newContext',
      params: {
        id: context,
      },
    })
    this.recordAction({
      action: 'newPage',
      context,
      params: {
        id: page,
        url,
      },
    })

    this.syncStatus()

    return 'success'
  }

  async finishRecord({ context }: { context: string }) {
    this.recordAction({
      action: 'closeContext',
      params: {
        id: context,
      },
    })
    this.recording = false
    writeJson(this.case, this.output.caseFile)
    this.case = getInitCase()
    this.syncStatus()
  }

  private async exit() {
    await Promise.all(this.browser?.contexts().map(ctx => ctx.close()) ?? [])
    this.browser?.close()
    this.emit('exit')
  }

  private syncStatus() {
    this.browser?.contexts().forEach(cxt => {
      cxt.pages().forEach(page => {
        page.evaluate(`window.__oopsTest_syncStatus(${this.recording})`)
      })
    })
  }
}

export { Recorder }
