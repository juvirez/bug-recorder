let startButton = document.getElementById('start')
let stopButton = document.getElementById('stop')

if (startButton && stopButton) {
	startButton.addEventListener('click', () => {
		chrome.tabs.query({active: true, currentWindow: true}, (tabs: chrome.tabs.Tab[]) => {
			let currentTab = tabs.pop();
			if (currentTab != null) {
				chrome.runtime.sendMessage({action: 'start', tab: currentTab});
			}
		  })
	})

	stopButton.addEventListener('click', () => {
		chrome.runtime.sendMessage({action: 'stop'})
	})
}