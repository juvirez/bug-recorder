import { harFromMessages } from "chrome-har";
import * as JSZip from "jszip";
import { bugRecorder } from "./background";

export class DevToolsRecorder {
  private debuggee: chrome.debugger.Debuggee;
  private tab: chrome.tabs.Tab;
  private harEvents: Object[] = [];
  private logEntries: LogEntry[] = [];

  constructor(tab: chrome.tabs.Tab) {
    this.tab = tab;
    this.debuggee = { tabId: tab.id };
  }

  start() {
    chrome.debugger.onDetach.addListener(this.onDetach);
    chrome.debugger.onEvent.addListener(this.onEvent);
    chrome.debugger.attach(this.debuggee, "1.2", () => {
      chrome.debugger.sendCommand(this.debuggee, "Page.enable", {});
      chrome.debugger.sendCommand(this.debuggee, "Network.enable", {});
      chrome.debugger.sendCommand(this.debuggee, "Runtime.enable", {});
    });
  }

  stop(zip?: JSZip) {
    chrome.debugger.onEvent.removeListener(this.onEvent);
    chrome.debugger.detach(this.debuggee, () => {
      const lastError = chrome.runtime.lastError;
      if (lastError !== undefined) {
        console.log(lastError.message);
      }
    });
    const har = harFromMessages(this.harEvents);
    const log = this.logEntries
      .map(entry => {
        const value = entry.args.map((arg: LogEntryArg) => arg.value).join(" ");
        const timestamp = new Date(entry.timestamp).toISOString();
        return `${entry.type} ${timestamp} ${value}`;
      })
      .join("\n");

    this.harEvents = [];
    this.logEntries = [];

    if (zip !== undefined) {
      zip.file(`har.har`, JSON.stringify(har));
      zip.file("console.log", log);
    }
  }

  private onEvent = (
    source: chrome.debugger.Debuggee,
    method: string,
    params?: Object
  ) => {
    if (source.tabId !== this.tab.id) return;

    if (method === "Runtime.consoleAPICalled") {
      this.logEntries.push(params as LogEntry);
    } else {
      this.harEvents.push({ method, params });
    }
  };

  private onDetach = (source: chrome.debugger.Debuggee) => {
    if (source.tabId !== this.tab.id) return;

    bugRecorder.cancelRecording();
  };
}

interface LogEntry {
  args: LogEntryArg[];
  timestamp: number;
  type: string;
}

interface LogEntryArg {
  value: Object;
}
