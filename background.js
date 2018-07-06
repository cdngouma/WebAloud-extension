var browser = browser || chrome;
var autoLang = true;
var state = true;
var has_contextMenu = true;

var voiceIndex = 0;

browser.runtime.onInstalled.addListener(function(){
	createContextMenu();
});

browser.contextMenus.onClicked.addListener(function(info, tabs){
	if(tabs){
		browser.tabs.sendMessage(tabs.id, {query:'read-selected', data:{voiceIndex:autoLang ? -1 : voiceIndex}}, function(response){
			if(response.err){
				alert("no text selected");
			}
		});
	}
});

function createContextMenu(){
	browser.contextMenus.create({
		id:'wld_read_select',
		title:'Read aloud selected text',
		type:'normal',
		contexts:['selection']
	});
	has_contextMenu = true;
}

function getUpdatedPopup(){
	return {state:this.state, autoLang:this.autoLang};
}

function updateState(state){
	this.state = state;
	if(!state){
		chrome.browserAction.setBadgeText({text: 'off'});
		chrome.browserAction.setBadgeBackgroundColor({color:'#ff0000'});
		browser.contextMenus.removeAll();
		has_contextMenu = false;
	}else if(!has_contextMenu){
		createContextMenu();
		chrome.browserAction.setBadgeText({text: ''});
	}
}

function updateAutoLang(b){
	this.autoLang = b;
}

function setVoiceIndex(obj){
	this.voiceIndex = obj.index;
}