import { VideoRecorder } from "./videoRecorder";
import { DevToolsRecorder } from "./devToolsRecorder";
import { saveAs } from "file-saver";
import * as JSZip from "jszip";

class BugRecorder {
  private videoRecorder: VideoRecorder | null;
  private devToolsRecorder: DevToolsRecorder | null;

  constructor() {
    chrome.runtime.onMessage.addListener((request: Request) => {
      switch (request.action) {
        case RequestAction.Start: {
          this.videoRecorder = new VideoRecorder();
          this.devToolsRecorder = new DevToolsRecorder(request.tab);
          this.videoRecorder.start();
          this.devToolsRecorder.start();
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
      }
    });
  }
}

export const bugRecorder = new BugRecorder();

export enum RequestAction {
  Start,
  Stop
}

export interface StartRequest {
  action: RequestAction.Start;
  tab: chrome.tabs.Tab;
}

export interface StopRequest {
  action: RequestAction.Stop;
}

export type Request = StartRequest | StopRequest;
