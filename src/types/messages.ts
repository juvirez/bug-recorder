export type StartRequest = {
  type: 'START'
  tabId: number
  originPattern: string
}

export type StopRequest = {
  type: 'STOP'
}

export type GetStatusRequest = {
  type: 'GET_STATUS'
}

export type Request = StartRequest | StopRequest | GetStatusRequest

export type Status =
  | { recording: false }
  | { recording: true; tabId: number; startedAt: number; originPattern: string }
