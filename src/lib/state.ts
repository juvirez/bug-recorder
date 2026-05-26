export type RecordingState = {
  tabId: number
  startedAt: number
  originPattern: string
}

const KEY = 'recordingState'

export async function getState(): Promise<RecordingState | null> {
  const result = await chrome.storage.session.get(KEY)
  return (result[KEY] as RecordingState | undefined) ?? null
}

export async function setState(state: RecordingState): Promise<void> {
  await chrome.storage.session.set({ [KEY]: state })
}

export async function clearState(): Promise<void> {
  await chrome.storage.session.remove(KEY)
}
