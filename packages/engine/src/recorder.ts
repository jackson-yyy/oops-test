import { existsSync } from 'fs'
import Debug from 'debug'
import { merge } from 'lodash'
import path, { join } from 'path'
import { BrowserContext, Browser, Page } from 'playwright'
import { EventEmitter } from 'stream'
import { BrowserName, Action, Signal, Case, EngineApis, Assertion } from './types'
import { getBrowser, getSnapshot, screenshot } from './utils/common'
import { getUuid } from './utils/uuid'
import { appendFile, createDir, writeJson } from './utils/fs'
import { ScreenshotAssertion, SnapshotAssertion } from '../engine'

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
    const caseDir = join(this.options.output, this.case.name)
    return {
      rootDir: this.options.output,
      caseDir,
      screenshotDir: join(caseDir, 'screenshots'),
      snapshotFile: join(caseDir, 'snapshots.snap'),
      caseFile: join(caseDir, 'case.json'),
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

    await context.exposeFunction(
      '__oopsTest_isRecording',
      (() => this.recording) as EngineApis['__oopsTest_isRecording'],
    )

    await context.exposeBinding('__oopsTest_recordAction', ({ page }, action: Action) => {
      this.recordAction(action)

      if (action.action === 'assertion') {
        this.handleAssertion(action, page)
      }
    })

    await context.exposeFunction(
      '__oopsTest_createCase',
      this.createCase.bind(this) as EngineApis['__oopsTest_createCase'],
    )

    await context.exposeFunction(
      '__oopsTest_startRecord',
      this.startRecord.bind(this) as EngineApis['__oopsTest_startRecord'],
    )
    await context.exposeFunction(
      '__oopsTest_finishRecord',
      this.finishRecord.bind(this) as EngineApis['__oopsTest_finishRecord'],
    )
    await context.exposeFunction('__oopsTest_exit', this.exit.bind(this) as EngineApis['__oopsTest_exit'])

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

  private handleAssertion(action: Assertion, page: Page) {
    switch (action.params.type) {
      case 'url':
        break
      case 'snapshot':
        this.handleSnapshotAssertion(action as SnapshotAssertion, page)
        break
      case 'screenshot':
        this.handleScreenshotAssertion(action as ScreenshotAssertion, page)
        break
    }
  }

  private async handleScreenshotAssertion(action: ScreenshotAssertion, page: Page) {
    // TODO:这里后期要重构，不要指定__oopsTest_toggleShowToolbar这种api
    await page.evaluate('window.__oopsTest_toggleShowToolbar(false)')

    await screenshot(page, {
      path: join(this.output.screenshotDir, action.params.name),
      selector: action.params.selector,
    })

    await page.evaluate('window.__oopsTest_toggleShowToolbar(true)')
  }

  private async handleSnapshotAssertion(action: SnapshotAssertion, page: Page) {
    const snapshot = await getSnapshot(page, {
      selector: action.params.selector,
      // TODO:补充读取配置功能
      filter: (snapshot: string) => snapshot,
    })
    appendFile(this.output.snapshotFile, `exports[\`${action.params.name}\`] = \`${snapshot}\`\n\n`)
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

  private createCase(caseInfo: Pick<Case, 'name' | 'saveMock'>): 'success' | 'exist' | 'fail' {
    const caseDir = join(this.output.rootDir, caseInfo.name)
    if (existsSync(caseDir)) {
      return 'exist'
    }

    try {
      createDir(caseDir)
    } catch (error) {
      console.error(error)
      return 'fail'
    }

    merge(this.case, caseInfo)

    return 'success'
  }

  // TODO:这里拆出来一个判断case是否存在的函数
  private startRecord({
    context,
    page,
    url,
  }: {
    context: string
    page: string
    url: string
    caseInfo: {
      name: string
      saveMock: boolean
    }
  }): void {
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
  }

  private async finishRecord({ context }: { context: string }) {
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
