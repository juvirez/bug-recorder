import chromeHar from 'chrome-har'

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.action) {
		case 'start': {
			const debuggee = {tabId: request.tab.id}
			chrome.debugger.attach(debuggee, "1.2", () => {
				if (chrome.runtime.lastError) return
				chrome.debugger.sendCommand(debuggee, "Page.enable", {})
				chrome.debugger.sendCommand(debuggee, "Network.enable", {})
			})
			break
		}
		case 'stop': {
			const har = chromeHar.harFromMessages(harEvents)
			console.log(har)
			break
		}
	}
})

const harEvents = []
chrome.debugger.onEvent.addListener((_source, method, params) => {
	harEvents.push({method, params})
})