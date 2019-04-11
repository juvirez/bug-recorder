import { harFromMessages } from "chrome-har";
import * as JSZip from "jszip";
import { bugRecorder } from "./background";

export class DevToolsRecorder {
  private debuggee: chrome.debugger.Debuggee;
  private tab: chrome.tabs.Tab;
  private harEvents: Object[] = [];
  private logEntries: LogEntry[] = [];
  private exceptions: ExceptionThrownParams[] = [];
  private requestIdToResponseReceivedParams: Map<string, ResponseReceivedParams> = new Map();

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
        console.warn(lastError.message);
      }
    });

    const harOptions = {
      includeResourcesFromDiskCache: true,
      includeTextFromResponseBody: true
    };
    const har = harFromMessages(this.harEvents, harOptions);

    const log = this.logEntries
      .map(entry => {
        const value = entry.args.map((arg: LogEntryArg) => arg.value).join(" ");
        const timestamp = new Date(entry.timestamp).toISOString();
        return `${entry.type} ${timestamp} ${value}`;
      })
      .join("\n");

    const exceptionLogs = this.exceptions
      .map(exceptionParams => {
        const timestamp = new Date(exceptionParams.timestamp).toISOString();
        return `${timestamp} ${exceptionParams.exceptionDetails.exception.description}`;
      })
      .join("\n");

    if (zip !== undefined) {
      zip.file(`har.har`, JSON.stringify(har));
      zip.file("console.log", log);
      if (exceptionLogs.length > 0) {
        zip.file("exceptions.log", exceptionLogs);
      }
    }
  }

  private onEvent = (source: chrome.debugger.Debuggee, method: string, params?: Object) => {
    if (source.tabId !== this.tab.id) return;

    switch (method) {
      case "Runtime.consoleAPICalled":
        this.logEntries.push(params as LogEntry);
        break;

      case "Runtime.exceptionThrown":
        this.exceptions.push(params as ExceptionThrownParams);
        break;

      case "Network.loadingFinished":
        this.onLoadingFinished(params as NetworkLoadingFinishedParams);
        this.harEvents.push({ method, params });
        break;

      case "Network.responseReceived":
        const responseReceivedParams = params as ResponseReceivedParams;
        this.requestIdToResponseReceivedParams.set(responseReceivedParams.requestId, responseReceivedParams);
        this.harEvents.push({ method, params: responseReceivedParams });
        break;

      default:
        this.harEvents.push({ method, params });
        break;
    }
  };

  private onLoadingFinished = (params: NetworkLoadingFinishedParams) => {
    const responseReceivedParams: ResponseReceivedParams | undefined = this.requestIdToResponseReceivedParams.get(
      params.requestId
    );

    if (responseReceivedParams === undefined) {
      return;
    }

    const resourceType = responseReceivedParams.type;
    const mimeType = responseReceivedParams.response.mimeType;
    if (
      resourceType === "Image" ||
      resourceType === "Font" ||
      resourceType === "Media" ||
      mimeType.includes("image") ||
      mimeType.includes("video") ||
      mimeType.includes("audio")
    ) {
      return;
    }

    chrome.debugger.sendCommand(
      this.debuggee,
      "Network.getResponseBody",
      { requestId: params.requestId },
      this.onResponseBody(responseReceivedParams)
    );
  };

  private onResponseBody = (responseParams: ResponseReceivedParams) => (result?: Object) => {
    const responseBody = result as ResponseBody;
    const lastError = chrome.runtime.lastError;
    if (lastError !== undefined) {
      console.warn(lastError.message, responseParams);
      return;
    }

    responseParams.response = {
      ...responseParams.response,
      body: new Buffer(responseBody.body, responseBody.base64Encoded ? "base64" : undefined).toString()
    };
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

interface NetworkLoadingFinishedParams {
  requestId: string;
}

interface ResponseReceivedParams {
  requestId: string;
  response: ResponseBody;
  type: ResourceType;
}

interface ResponseBody {
  body: string;
  base64Encoded: boolean;
  status: number;
  mimeType: string[];
}

type ResourceType =
  | "Document"
  | "Stylesheet"
  | "Image"
  | "Media"
  | "Font"
  | "Script"
  | "TextTrack"
  | "XHR"
  | "Fetch"
  | "EventSource"
  | "WebSocket"
  | "Manifest"
  | "Other";

interface ExceptionThrownParams {
  timestamp: number;
  exceptionDetails: ExceptionDetails;
}

interface ExceptionDetails {
  exception: Exception;
}

interface Exception {
  description: string;
}
