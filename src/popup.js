document.getElementById('start').addEventListener('click', () => {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		var currentTab = tabs[0];
		if (currentTab) {
			chrome.runtime.sendMessage({action: 'start', tab: currentTab});
		}
	  })
})

document.getElementById('stop').addEventListener('click', () => {
	chrome.runtime.sendMessage({action: 'stop'})
})