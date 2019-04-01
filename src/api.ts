export enum RequestAction {
  Start,
  Stop,
  GetStatus
}

export interface StartRequest {
  action: RequestAction.Start;
  tab: chrome.tabs.Tab;
}

export interface StopRequest {
  action: RequestAction.Stop;
}

export interface GetStatusRequest {
  action: RequestAction.GetStatus;
}

export type Request = StartRequest | StopRequest | GetStatusRequest;

export enum Status {
  Waiting,
  Recording
}
