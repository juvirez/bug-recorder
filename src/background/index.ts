import { onMessage } from '@/lib/messaging'
import { clearState, getState, setState } from '@/lib/state'
import type { Status } from '@/types/messages'

const BADGE_ALARM = 'badge-tick'
const OFFSCREEN_URL = 'src/offscreen/index.html'

async function ensureOffscreen(): Promise<void> {
  if (await chrome.offscreen.hasDocument()) return
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification: 'Hosts MediaRecorder for tab screencast.',
  })
}

async function closeOffscreen(): Promise<void> {
  if (await chrome.offscreen.hasDocument()) {
    await chrome.offscreen.closeDocument()
  }
}

async function updateBadge(tabId: number): Promise<void> {
  const state = await getState()
  if (!state) {
    await chrome.action.setBadgeText({ text: '', tabId })
    return
  }
  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000)
  const minutes = Math.floor(elapsed / 60)
  const seconds = String(elapsed % 60).padStart(2, '0')
  await chrome.action.setBadgeText({ text: `${minutes}:${seconds}`, tabId })
  await chrome.action.setBadgeBackgroundColor({ color: '#ec235a', tabId })
}

async function start(tabId: number, originPattern: string): Promise<void> {
  await setState({ tabId, startedAt: Date.now(), originPattern })
  await ensureOffscreen()
  await chrome.alarms.create(BADGE_ALARM, { periodInMinutes: 1 / 60 })
  await updateBadge(tabId)
  console.log('[bug-recorder] start', { tabId, originPattern })
}

async function stop(): Promise<void> {
  const state = await getState()
  await clearState()
  await chrome.alarms.clear(BADGE_ALARM)
  if (state) {
    await chrome.action.setBadgeText({ text: '', tabId: state.tabId })
  }
  await closeOffscreen()
  console.log('[bug-recorder] stop')
}

onMessage(async msg => {
  switch (msg.type) {
    case 'START':
      await start(msg.tabId, msg.originPattern)
      return
    case 'STOP':
      await stop()
      return
    case 'GET_STATUS': {
      const state = await getState()
      const status: Status = state
        ? { recording: true, ...state }
        : { recording: false }
      return status
    }
  }
})

chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name !== BADGE_ALARM) return
  const state = await getState()
  if (!state) {
    await chrome.alarms.clear(BADGE_ALARM)
    return
  }
  await updateBadge(state.tabId)
})

chrome.tabs.onRemoved.addListener(async tabId => {
  const state = await getState()
  if (state && state.tabId === tabId) {
    console.log('[bug-recorder] tab closed during recording — cancelling')
    await stop()
  }
})

console.log('[bug-recorder] service worker loaded')
