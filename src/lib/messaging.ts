import type { Request } from '@/types/messages'

export function sendMessage<R = unknown>(message: Request): Promise<R> {
  return chrome.runtime.sendMessage(message)
}

type Handler = (msg: Request) => Promise<unknown>

export function onMessage(handler: Handler): void {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    handler(msg as Request)
      .then(sendResponse)
      .catch(err => {
        console.error('[bug-recorder] message handler error', err)
        sendResponse(undefined)
      })
    return true
  })
}
