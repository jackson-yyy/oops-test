import Debug from 'debug'
import { merge } from 'lodash'
import { LaunchOptions, Browser, BrowserContext, Page } from 'playwright'
import { BrowserName, Action, Assertion, ManualAction, Case } from './types'
import { formatSignals, getBrowser, readJson } from './utils'
import expect from 'expect'
import { EventEmitter } from 'stream'
import { join, resolve } from 'path'
import odiff from 'odiff-bin'
import chalk from 'chalk'

const debug = Debug('oops-test:runner')
interface RunnerOptions {
  browser?: BrowserName
  browserLaunchOptions?: LaunchOptions
}

interface MultiRunnerOptions {
  browsers: BrowserName[]
  browserLaunchOptions?: LaunchOptions
}

const DefaultRunnerOptions = {
  browserLaunchOptions: {
    headless: false,
    slowMo: 1000,
  },
}

class MultiRunner {
  private runners: Runner[] = []
  private options: MultiRunnerOptions = {
    browsers: ['chromium'],
    ...DefaultRunnerOptions,
  }

  constructor(options?: MultiRunnerOptions) {
    merge(this.options, options)
    for (const browser of this.options.browsers) {
      this.runners.push(
        new Runner({
          browser,
          browserLaunchOptions: this.options.browserLaunchOptions,
        }),
      )
    }
  }

  runCase(caseDir: string) {
    this.runners.forEach(runner => runner.runCase(caseDir))
  }

  finish() {
    this.runners.forEach(runner => runner.finish())
  }
}

class Runner extends EventEmitter {
  private options: Required<RunnerOptions> = {
    browser: 'chromium',
    ...DefaultRunnerOptions,
  }

  private browser?: Browser

  private contextIdMap: Map<string, BrowserContext> = new Map()
  private contextMap: Map<BrowserContext, Map<string, Page>> = new Map()

  private caseDir = ''

  constructor(options?: RunnerOptions) {
    super()
    merge(this.options, options)
  }

  async runCase(caseDir: string) {
    if (!this.browser) {
      await this.initBrowser()
    }

    this.caseDir = caseDir

    const cas = readJson<Case>(join(caseDir, 'case.json'))
    for (const action of cas.actions) {
      await this.runAction(action)
    }
  }

  private async runAction(action: Action) {
    if (!this.browser) {
      debug(`Action: browser not found.`)
      return
    }
    if (action.action === 'assertion') {
      await this.runAssertion(action)
      return
    }
    if (action.action === 'newContext') {
      const {
        params: { id },
      } = action
      const context = await this.browser.newContext()
      this.contextIdMap.set(id, context)
      return
    }

    if (action.action === 'closeContext') {
      const {
        params: { id },
      } = action
      await this.getContext(id).close()
      return
    }

    if (action.action === 'newPage') {
      const {
        context: cxtId,
        params: { id: pageId, url },
      } = action
      const context = this.getContext(cxtId)
      const page = await context.newPage()
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      this.setPage(page, cxtId, pageId)
      return
    }

    if (action.action === 'closePage') {
      const {
        context: cxtId,
        params: { id: pageId },
      } = action
      await this.getPage(cxtId, pageId).close()
      return
    }

    if (action.action === 'error') {
      debug(`Action: action '${action.action}' is invalid.`)
      return
    }

    await this.runManualAction(action)
  }

  private async runManualAction(action: ManualAction) {
    const { context: cxtId, page: pageId, signals = [] } = action
    const page = this.getPage(cxtId, pageId)
    const signalsFormatted = formatSignals(signals)

    let actionPromise = () => Promise.resolve()

    if (action.action === 'click') {
      actionPromise = () => page.click(action.params.selector)
    }
    if (action.action === 'hover') {
      actionPromise = () => page.hover(action.params.selector)
    }
    if (action.action === 'input') {
      actionPromise = () => page.fill(action.params.selector, action.params.content)
    }
    if (action.action === 'scroll') {
      actionPromise = async () => {
        await page.evaluate(`window.scrollTo(${action.params.x}, ${action.params.y})`)
        await page.waitForTimeout(1000)
      }
    }

    if (signalsFormatted.popup) {
      const [popupPage] = await Promise.all([page.waitForEvent('popup'), actionPromise()])
      this.setPage(popupPage, cxtId, signalsFormatted.popup.pageId)
    } else {
      await actionPromise()
    }
  }

  private async runAssertion(action: Assertion) {
    const page = this.getPage(action.context, action.page)

    try {
      switch (action.params.type) {
        case 'url':
          expect(action.params.url).toBe(await page.evaluate('location.href'))
          break
        // case 'innerText':
        //   expect(await page.textContent(action.params.selector)).toBe(action.params.content)
        //   break
        case 'screenshot': {
          const page = this.getPage(action.context, action.page)
          const runtimeDir = resolve(this.caseDir, 'runtime', 'screenshots')
          await page.waitForLoadState('networkidle')

          // FIXME:odiff暂时不支持buffer对比和输出，官方近期会开始支持，这里先简单处理
          await this.getPage(action.context, action.page)?.screenshot({
            path: join(runtimeDir, action.params.name),
          })
          const { match } = await odiff.compare(
            resolve(this.caseDir, 'screenshots', action.params.name),
            join(runtimeDir, action.params.name),
            join(runtimeDir, `diff_${action.params.name}`),
          )

          if (!match) throw new Error(chalk.red(`screenshot ${action.params.name} compare fail!`))
        }
      }
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  private async initBrowser() {
    if (!this.browser) {
      this.browser = await getBrowser(this.options.browser).launch(this.options.browserLaunchOptions)
    }
  }

  private getContext(cxtId: string) {
    const context = this.contextIdMap.get(cxtId.toString())
    if (!context) {
      throw new Error(`Context(${cxtId}) not found.`)
    }
    return context
  }

  private getPage(cxtId: string, pageId: string) {
    const page = this.contextMap.get(this.getContext(cxtId))?.get(pageId)
    if (!page) {
      throw new Error(`Page(${pageId}) under Context(${cxtId}) not found.`)
    }
    return page
  }

  private setPage(page: Page, cxtId: string, pageId: string) {
    const context = this.getContext(cxtId)
    const pageMap = this.contextMap.get(context) ?? new Map()
    pageMap.set(pageId, page)
    this.contextMap.set(context, pageMap)
  }

  finish() {
    this.browser?.close()
  }
}

export { Runner, MultiRunner }
