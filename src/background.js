import { harFromMessages } from 'chrome-har'
import { saveAs } from 'file-saver';
import JSZip from "jszip";

let debuggee
let harEvents = []
let logEntries = []

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.action) {
		case 'start': {
			debuggee = {tabId: request.tab.id}
			chrome.debugger.attach(debuggee, "1.2", () => {
				if (chrome.runtime.lastError) return
				chrome.debugger.sendCommand(debuggee, 'Page.enable', {})
				chrome.debugger.sendCommand(debuggee, 'Network.enable', {})
				chrome.debugger.sendCommand(debuggee, 'Runtime.enable', {})
			})
			break
		}
		case 'stop': {
			chrome.debugger.detach(debuggee)
			const har = harFromMessages(harEvents)
			const log = logEntries.map(entry => {
				return entry.args.map(arg => arg.value).join(' ')
			}).join('\n')
			harEvents = []
			logEntries = []

			let zip = new JSZip()
			zip.file('har.har', JSON.stringify(har))
			zip.file('console.log', log)
			zip.generateAsync({type: 'blob'})
				.then((blob) => {
					saveAs(blob, 'site.zip')
				})
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