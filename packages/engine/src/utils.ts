import { chromium, firefox, webkit } from 'playwright'
import { BrowserName } from './types'

let uuid = 1000
export function getUuid() {
  return (++uuid).toString()
}

export function getBrowser(browser: BrowserName) {
  return {
    chromium,
    firefox,
    webkit,
  }[browser]
}
