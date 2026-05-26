import { useEffect, useState } from 'react'
import { sendMessage } from '@/lib/messaging'
import {
  isRecordableUrl,
  originPattern,
  requestRecorderPermissions,
} from '@/lib/permissions'
import type { Status } from '@/types/messages'

type UiState =
  | { kind: 'loading' }
  | { kind: 'unsupported'; reason: string }
  | { kind: 'idle'; tab: chrome.tabs.Tab; deniedOnce: boolean }
  | { kind: 'recording' }

export default function App() {
  const [ui, setUi] = useState<UiState>({ kind: 'loading' })

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    const status = await sendMessage<Status>({ type: 'GET_STATUS' })
    if (status?.recording) {
      setUi({ kind: 'recording' })
      return
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab || !isRecordableUrl(tab.url)) {
      setUi({
        kind: 'unsupported',
        reason: 'Open a regular http(s) page to record.',
      })
      return
    }
    setUi({ kind: 'idle', tab, deniedOnce: false })
  }

  async function start(tab: chrome.tabs.Tab) {
    if (!tab.id || !tab.url) return
    const pattern = originPattern(tab.url)
    const granted = await requestRecorderPermissions(pattern)
    if (!granted) {
      setUi({ kind: 'idle', tab, deniedOnce: true })
      return
    }
    await sendMessage({
      type: 'START',
      tabId: tab.id,
      originPattern: pattern,
    })
    window.close()
  }

  async function stop() {
    await sendMessage({ type: 'STOP' })
    window.close()
  }

  if (ui.kind === 'loading') {
    return (
      <div className="popup">
        <p className="caption">Loading…</p>
      </div>
    )
  }

  if (ui.kind === 'unsupported') {
    return (
      <div className="popup">
        <h1>Bug Recorder</h1>
        <p className="caption">{ui.reason}</p>
      </div>
    )
  }

  if (ui.kind === 'recording') {
    return (
      <div className="popup">
        <button className="btn btn-stop" onClick={stop}>
          Stop recording
        </button>
        <p className="caption">Click when you have reproduced the bug.</p>
      </div>
    )
  }

  return (
    <div className="popup">
      <button className="btn btn-start" onClick={() => start(ui.tab)}>
        Start recording
      </button>
      <p className="caption">
        {ui.deniedOnce
          ? 'Permissions are required to record. Click Start again.'
          : 'This will reload the page and start recording.'}
      </p>
    </div>
  )
}
