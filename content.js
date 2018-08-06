var browser = browser || chrome;
var synth =  window.speechSynthesis;

console.log("content.js loaded");

browser.runtime.onMessage.addListener(function(request, sender, sendResponse){

	if(request.query === 'read-selected'){
		if(!readSelectedText(request.voiceInfo)){
			sendResponse({err:true});
		}
	}
});

function readSelectedText(obj){
	let i = obj.index;
	let text = getText(i);
	let pace = obj.pace ? 1 : 0.40;		// 1: default	0.40: slower
	if(text == null || !window.speechSynthesis)
		return false;

	browser.i18n.detectLanguage(text[0], function(langInfo){
		for(a of langInfo.languages){
			if(a.percentage == 100){
				lang = a.language;
				break;
			}
		}

		let voices = synth.getVoices();

		if(i >= 0){
			if(voices[i].lang.includes(lang)){
				play(voices[i], pace, text);
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
			play(voice, pace, text);
		}
	});

	return true;
}

function matchVoice(voices, lang){
	for(v of voices){
		if(v.lang.includes(lang)){
			return v;
		}
	}
	return voices[0]; //returns default
}

function play(voice, pace, text){
	if(synth.speaking)
		synth.cancel();
	console.log(voice.lang);
	// TODO: make switch between utterances smooth
	// Currently makes unexpected pauses
	for(let i=0; i<text.length; i++){
		var utterance = new SpeechSynthesisUtterance(text[i]);
		utterance.voice = voice;
		utterance.lang = voice.lang;
		utterance.rate = pace;
		synth.speak(utterance);
	}
}

/*function getText(){
	var str = window.getSelection().toString();
	var text = str.split(RegExp('^.{200}'));
	return str;
}*/

function getText(i){
//	console.log(i);
	var str = window.getSelection().toString();
//	console.log("length:"+str.length);
	const MAX = 193;	// max number of characters read (except for default);
	var limit = i === -1 ? 2456 : MAX;		// 2456 estimated limit for default voice

	if(str < limit)
		return [str];

	var arr = [];

	var beg = 0;
	for(let pos=limit-1; pos < str.length; pos++){
		for(let i=pos; i > beg; i--){
			if(str.charAt(i) == ' '){
				let s = str.slice(beg, pos);
				arr.push(s);
				str = str.slice(pos, str.length);
				beg = 0;
				pos = limit-1;
				break;
			}
			pos--;
			i--; 
		}
	}

	if(str.length > 0)
		arr.push(str);
//	console.log(limit);
//	console.log("resulted:"+arr.length);
	return arr;
}

function KeyPress(e) {
      var evtobj = window.event? event : e
      if (evtobj.keyCode == 16 && evtobj.ctrlKey && synth.speaking)
      	synth.cancel();
}

document.onkeydown = KeyPress;