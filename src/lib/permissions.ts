const RECORDER_PERMISSIONS = ['debugger', 'tabCapture'] as const

export function originPattern(url: string): string {
  const u = new URL(url)
  return `${u.protocol}//${u.hostname}/*`
}

export function isRecordableUrl(url: string | undefined): boolean {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function requestRecorderPermissions(origin: string): Promise<boolean> {
  return chrome.permissions.request({
    permissions: [...RECORDER_PERMISSIONS],
    origins: [origin],
  })
}

export function hasRecorderPermissions(origin: string): Promise<boolean> {
  return chrome.permissions.contains({
    permissions: [...RECORDER_PERMISSIONS],
    origins: [origin],
  })
}
