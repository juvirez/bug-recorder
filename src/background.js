import { harFromMessages } from 'chrome-har'
import { saveAs } from 'file-saver';

let harEvents = []
let logEntries = []

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.action) {
		case 'start': {
			const debuggee = {tabId: request.tab.id}
			chrome.debugger.attach(debuggee, "1.2", () => {
				if (chrome.runtime.lastError) return
				chrome.debugger.sendCommand(debuggee, 'Page.enable', {})
				chrome.debugger.sendCommand(debuggee, 'Network.enable', {})
				chrome.debugger.sendCommand(debuggee, 'Runtime.enable', {})
			})
			break
		}
		case 'stop': {
			const har = harFromMessages(harEvents)
			harEvents = []
			logEntries = []
			const file = new File([JSON.stringify(har)], "har.har", {type: "text/plain;charset=utf-8"})
			saveAs(file)
			console.log(logEntries)
			break
		}
	}
})

chrome.debugger.onEvent.addListener((_source, method, params) => {
	if (method === 'Runtime.consoleAPICalled') {
		logEntries.push(params)
	} else {
		harEvents.push({method, params})
	}
})