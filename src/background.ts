import { VideoRecorder } from "./videoRecorder";
import { DevToolsRecorder } from "./devToolsRecorder";
import { saveAs } from "file-saver";
import * as JSZip from "jszip";
import { Request, RequestAction, Status } from "./api";

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
            this.startRecordingTimer(request.tab);
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
            sendResponse(this.getStatus());
            break;
          }
        }
      }
    );
  }

  getStatus = (): Status => {
    if (this.videoRecorder != null && this.devToolsRecorder != null) {
      return Status.Recording;
    }
    return Status.Waiting;
  };

  cancelRecording = () => {
    if (this.videoRecorder != null) {
      this.videoRecorder.stop();
      this.videoRecorder = null;
    }
    if (this.devToolsRecorder != null) {
      this.devToolsRecorder.stop();
      this.devToolsRecorder = null;
    }
  };

  startRecordingTimer = (tab: chrome.tabs.Tab) => {
    const startTime = new Date().getTime();
    const timerId = setInterval(() => {
      let text: string = "";
      if (this.getStatus() === Status.Recording) {
        const diff = new Date().getTime() - startTime;
        if (diff >= 10 * 60 * 1000) {
          this.cancelRecording();
        }
        const minutes = Math.floor(diff / (60 * 1000));
        const seconds = `00${Math.floor((diff / 1000) % 60)}`.slice(-2);
        text = `${minutes}:${seconds}`;
      } else {
        clearInterval(timerId);
      }
      const badgeTextDetails: chrome.browserAction.BadgeTextDetails = {
        text,
        tabId: tab.id
      };
      chrome.browserAction.setBadgeText(badgeTextDetails);
    }, 1000);
  };
}

export const bugRecorder = new BugRecorder();
