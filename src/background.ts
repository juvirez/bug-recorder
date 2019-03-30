import { VideoRecorder } from "./videoRecorder";
import { DevToolsRecorder } from "./devToolsRecorder";
import { saveAs } from "file-saver";
import * as JSZip from "jszip";

class BugRecorder {
  private videoRecorder: VideoRecorder | null;
  private devToolsRecorder: DevToolsRecorder | null;

  constructor() {
    chrome.runtime.onMessage.addListener(
      (
        request: Request,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: any) => void
      ) => {
        switch (request.action) {
          case RequestAction.Start: {
            this.videoRecorder = new VideoRecorder();
            this.devToolsRecorder = new DevToolsRecorder(request.tab);
            this.videoRecorder.start();
            this.devToolsRecorder.start();
            chrome.tabs.reload(request.tab.id as number);
            break;
          }
          case RequestAction.Stop: {
            if (this.videoRecorder == null || this.devToolsRecorder == null) {
              break;
            }
            const zip = new JSZip();
            this.devToolsRecorder.stop(zip);
            this.videoRecorder.stop(zip).then(() => {
              zip.generateAsync({ type: "blob" }).then(blob => {
                saveAs(blob, "bug.zip");
              });
            });
            this.devToolsRecorder = null;
            this.videoRecorder = null;
            break;
          }
          case RequestAction.GetStatus: {
            if (this.videoRecorder != null && this.devToolsRecorder != null) {
              sendResponse(Status.Recording);
            } else {
              sendResponse(Status.Waiting);
            }
            break;
          }
        }
      }
    );
  }
}

export const bugRecorder = new BugRecorder();

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
