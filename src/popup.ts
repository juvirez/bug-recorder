let startButton = document.getElementById("start");
let stopButton = document.getElementById("stop");

if (startButton && stopButton) {
  startButton.addEventListener("click", () => {
    const tabQueryInfo = { active: true, currentWindow: true };
    chrome.tabs.query(tabQueryInfo, (tabs: chrome.tabs.Tab[]) => {
      const currentTab = tabs.pop();
      if (currentTab != null) {
        chrome.runtime.sendMessage({ action: "start", tab: currentTab });
      }
    });
  });

  stopButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "stop" });
  });
}
