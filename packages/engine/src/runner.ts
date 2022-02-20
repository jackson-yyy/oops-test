import { Assertor } from './assertor'
import { CaseManger } from './caseManager'
import Debug from 'debug'
import { merge } from 'lodash'
import { LaunchOptions } from 'playwright'
import { BrowserName, BrowserAction, ManualAction } from './types'
import { EventEmitter } from 'stream'
import { BrowserManger } from './browserManager'

const debug = Debug('oops-test:runner')
interface RunnerOptions {
  browser: BrowserName
  browserLaunchOptions: LaunchOptions
  snapshotFilter?: (snap: string) => string
}

interface MultiRunnerOptions {
  browsers: BrowserName[]
  browserLaunchOptions?: LaunchOptions
}

function getDefaultRunnerOptions() {
  return {
    browser: 'chromium',
    browserLaunchOptions: {
      headless: false,
      slowMo: 1000,
    },
  }
}

class MultiRunner {
  private runners: Runner[] = []
  private options: MultiRunnerOptions = {
    browsers: ['chromium'],
    ...getDefaultRunnerOptions(),
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
  private options!: RunnerOptions
  private browserManager!: BrowserManger

  constructor(options?: Partial<RunnerOptions>) {
    super()
    this.options = merge(getDefaultRunnerOptions(), options)
  }

  async runCase(caseDir: string) {
    if (!this.browserManager) {
      this.browserManager = new BrowserManger()
      await this.browserManager.launch(this.options.browser, this.options.browserLaunchOptions)
    }
    const caseManager = new CaseManger(caseDir)
    const assertor = new Assertor({
      ...caseManager.pathResolve,
      snapshotFilter: this.options.snapshotFilter,
    })

    caseManager.load()
    assertor.loadSnapshots()

    for (const action of caseManager.case.actions) {
      if (action.action === 'assertion') {
        await assertor.runAssertion(action, this.browserManager.getPage(action.context, action.page))
      } else {
        await this.runAction(action)
      }
    }
  }

  private async runAction(action: ManualAction | BrowserAction) {
    if (action.action === 'newContext') {
      await this.browserManager.newContext(action.params.id)
      return
    }

    if (action.action === 'closeContext') {
      const {
        params: { id },
      } = action
      await this.browserManager.getContext(id).close()
      return
    }

    if (action.action === 'newPage') {
      const {
        context: cxtId,
        params: { id: pageId, url },
      } = action
      const context = this.browserManager.getContext(cxtId)
      const page = await context.newPage()
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      this.browserManager.setPage(page, cxtId, pageId)
      return
    }

    if (action.action === 'closePage') {
      const {
        context: cxtId,
        params: { id: pageId },
      } = action
      await this.browserManager.getPage(cxtId, pageId).close()
      return
    }

    if (action.action === 'error') {
      debug(`Action: action '${action.action}' is invalid.`)
      return
    }

    await this.runManualAction(action)
  }

  private async runManualAction(action: ManualAction) {
    const { context: cxtId, page: pageId, signals = {} } = action
    const page = this.browserManager.getPage(cxtId, pageId)

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

    if (signals.popup) {
      const [popupPage] = await Promise.all([page.waitForEvent('popup'), actionPromise()])
      this.browserManager.setPage(popupPage, cxtId, signals.popup.pageId)
    } else {
      await actionPromise()
    }
  }

  finish() {
    this.browserManager?.close()
  }
}

export { Runner, MultiRunner }
