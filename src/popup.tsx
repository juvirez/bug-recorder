import { render } from "react-dom";
import * as React from "react";
import { StartRequest, RequestAction, StopRequest } from "./background";

class Popup extends React.Component {
  start() {
    const tabQueryInfo = { active: true, currentWindow: true };
    chrome.tabs.query(tabQueryInfo, (tabs: chrome.tabs.Tab[]) => {
      const currentTab = tabs.pop();
      if (currentTab != null) {
        const request: StartRequest = {
          action: RequestAction.Start,
          tab: currentTab,
          recordVideo: true
        };
        chrome.runtime.sendMessage(request);
      }
    });
  }

  stop() {
    const request: StopRequest = { action: RequestAction.Stop };
    chrome.runtime.sendMessage(request);
  }

  render() {
    return (
      <div>
        <button onClick={this.start}>START</button>
        <button onClick={this.stop}>STOP</button>
      </div>
    );
  }
}

render(<Popup />, document.getElementById("root"));
