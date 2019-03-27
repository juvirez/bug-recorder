import { harFromMessages } from "chrome-har";
import { saveAs } from "file-saver";
import * as JSZip from "jszip";

let debuggee: chrome.debugger.Debuggee = {};
let harEvents: Object[] = [];
let logEntries: LogEntry[] = [];
let videoRecorder: MediaRecorder | null;
let videoChunks: Blob[] = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "start": {
      chrome.tabCapture.capture({ video: true }, stream => {
        if (stream == null) return;
        videoRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        videoRecorder.ondataavailable = e => {
          videoChunks.push(e.data);
        };
        videoRecorder.start();
      });

      debuggee = { tabId: request.tab.id };
      chrome.debugger.attach(debuggee, "1.2", () => {
        if (chrome.runtime.lastError) return;
        chrome.debugger.sendCommand(debuggee, "Page.enable", {});
        chrome.debugger.sendCommand(debuggee, "Network.enable", {});
        chrome.debugger.sendCommand(debuggee, "Runtime.enable", {});
      });
      break;
    }
    case "stop": {
      if (videoRecorder == null) {
        stop();
      } else {
        videoRecorder.stream.getTracks().forEach(track => track.stop());
        videoRecorder.onstop = () => {
          stop();
        };
        videoRecorder.stop();
      }
      break;
    }
  }
});

function stop() {
  const videoBlob = new Blob(videoChunks, { type: "video/webm" });
  chrome.debugger.detach(debuggee);
  const har = harFromMessages(harEvents);
  const log = logEntries
    .map(entry => {
      const value = entry.args.map((arg: LogEntryArg) => arg.value).join(" ");
      const timestamp = new Date(entry.timestamp).toISOString();
      return `${entry.type} ${timestamp} ${value}`;
    })
    .join("\n");
  harEvents = [];
  logEntries = [];
  videoChunks = [];

  const zip = new JSZip();
  zip.file("har.har", JSON.stringify(har));
  zip.file("console.log", log);
  zip.file("screencast.webm", videoBlob);
  zip.generateAsync({ type: "blob" }).then(blob => {
    saveAs(blob, "site.zip");
  });
}

chrome.debugger.onEvent.addListener((source, method, params) => {
  if (method === "Runtime.consoleAPICalled") {
    logEntries.push(params as LogEntry);
  } else {
    harEvents.push({ method, params });
  }
});

interface LogEntry {
  args: LogEntryArg[];
  timestamp: number;
  type: string;
}

interface LogEntryArg {
  value: Object;
}
