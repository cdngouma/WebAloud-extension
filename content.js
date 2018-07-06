var browser = browser || chrome;
var synth =  window.speechSynthesis;

console.log("content.js loaded");

browser.runtime.onMessage.addListener(function(request, sender, sendResponse){

	if(request.query === 'read-selected'){
		if(!readSelectedText(request.data.voiceIndex)){
			sendResponse({err:true});
		}
	}
});

function readSelectedText(i){
	var text = getText();
	if(text == null || !window.speechSynthesis)
		return false;

	browser.i18n.detectLanguage(text, function(langInfo){
		for(a of langInfo.languages){
			if(a.percentage == 100){
				lang = a.language;
				break;
			}
		}

		var voices = synth.getVoices();

		if(i >= 0){
			if(voices[i].lang.includes(lang)){
				play(voices[i], text);
			}else{
				/*TODO: Translate before reading */
			/*	var from = voices[i].lang.substr(0,1);
				var transText = google.language.translate(text, from, lang);
				var newVoice = matchVoice(voices, lang);
				play(newVoice, transText);*/
				play(voices[i], text);
			}
		}else{
			var voice = matchVoice(voices, lang);
			play(voice, text);
		}
	});

	return true;
}

function play(voice, text){
	if(synth.speaking)
		synth.cancel();
	var utterance = new SpeechSynthesisUtterance(text);
	console.log(voice.lang);
	utterance.voice = voice;
	utterance.lang = voice.lang;

	synth.speak(utterance);
	console.log("text: " + text);
}

function matchVoice(voices, lang){
	for(v of voices){
		if(v.lang.includes(lang)){
			return v;
		}
	}
	return voices[0]; //return default
}

function getText(){
	return text = window.getSelection().toString();
}