import { render } from "react-dom";
import * as React from "react";

class Popup extends React.Component {
  start() {
    const tabQueryInfo = { active: true, currentWindow: true };
    chrome.tabs.query(tabQueryInfo, (tabs: chrome.tabs.Tab[]) => {
      const currentTab = tabs.pop();
      if (currentTab != null) {
        chrome.runtime.sendMessage({ action: "start", tab: currentTab });
      }
    });
  }

  stop() {
    chrome.runtime.sendMessage({ action: "stop" });
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
