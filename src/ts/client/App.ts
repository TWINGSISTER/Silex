/**
 * @fileoverview
 * Defines the entry point of Silex client side application
 *
 */

import { detect } from 'detect-browser'

import { Config } from './ClientConfig'
import { LOADING } from './ui-store/types'
import { SilexNotification } from './components/Notification'
import { createWorkspace, initSingleSiteMode, preventQuit, warnIfWindowTooSmall } from './components/Workspace'
import { getUi, updateUi } from './ui-store/index'
import { getUiElements } from './ui-store/UiElements'
import { initObservers } from './store/observer'
import { openDashboardToLoadAWebsite } from './file'
import { resetDirty } from './dirty'

interface AppOptions {
  debug: boolean,
}

let initDone = false

// called when Silex has started
// hide loading and show the UI
function afterInit() {
  updateUi({
    ...getUi(),
    loading: LOADING.NONE,
  })
  resetDirty()
}

export function init() { console.warn('calling window.silex.init() is deprecated') }

// start Silex, called from host HTML page with window.silex.start()
export function start(options: AppOptions) {
  const { debug } = options || {}
  // make sure Silex is instanciated only once
  if (initDone) throw new Error('Silex has already been instanciated')
  initDone = true

  // the debug flag comes from index.jade or debug.jade
  Config.debug.debugMode = debug
  if (Config.debug.debugMode) {
    console.warn('Silex starting in debug mode.')
  }

  // warning when not ff or chrome
  const browser = detect()
  const isFirefox = browser && browser.name === 'firefox'
  const isChrome = browser && browser.name === 'chrome'

  if (!isFirefox && !isChrome) {
    SilexNotification.alert('Warning',
      `Your browser is not supported yet.
      <br><br>
      Considere using <a href="https://www.mozilla.org/firefox/" target="_blank">Firefox</a>
      or <a href="https://www.google.com/chrome/" target="_blank">chrome</a>.
      <br><br>
      <small>Note: I believe you use ${ browser ? browser.name : 'Unknown' }</small>
      `,
      () => {})
  }

  // create all the components of Silex app
  createWorkspace(getUiElements().workspace)

  // start observers
  initObservers()

  // the build type
  if (!Config.debug.debugMode) {
    // warn when closing window if changes are not saved yet
    preventQuit()

    // warning small screen size
    warnIfWindowTooSmall()
  }

  // application start, open a file
  if (Config.singleSiteMode) {
    initSingleSiteMode()
    .then(() => afterInit())
  } else {
    openDashboardToLoadAWebsite(() => afterInit(), () => afterInit())
  }
}
