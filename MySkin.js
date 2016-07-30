// MySkin.js 
// depends on MyPano2vrPlayer.js
// depends on skin.js or definition of pano2vrSkin
// extends pano2vrSkin
// Roberta Jane Bennett 5/22/16

/*** EXPECTED IN MyPlayer or prior:
function surrogateCtor() {}
function extend(base,sub) {
	surrogateCtor.prototype = base.prototype;
	sub.prototype = new surrogateCtor();
	sub.prototype.constructor = sub;
}
***/

			
function MySkin( player, base ) {
	pano2vrSkin.apply(this,arguments);
	me = this;
	var proceedWithHotspotProxy = function(id) {
		var tester;
		var hitten = me.player.getHotspot(id);
		if (bjDebug) console.log(hitten);
		if (typeof hitten == 'undefined') return false;

		// early in the sequence, cause I wanted to debug without needing puser subscr
		if (typeof hitten.div == 'undefined') {
			console.log('no div to this guy'); // {id:"Poly01",'pan':0,tilt:0}
			hitten.remote = "once"; // does this -work- ?? will it set the hotspot object???
			tester = me.player.getHotspot(id);
			console.log(tester);
			return false;
		}
		var remoteAttr = hitten.div.getAttribute('data-remote'); // I think it returns null
		if (typeof remoteAttr == 'undefined') {hitten.div.setAttribute('data-remote','nope');}
		if (bjDebug) console.log(hitten.div.ggId);
		if (remoteAttr == '1') { // ummm. the remote should only be set by, yknow, remote..
			console.log("this div has its data-remote attribute set. No further action, please");
			return false; // will this fail if remoteAttr is null?
		}
		switch (hitten.div.ggId) { // ht_image, image_popup, hide_template
			case "ht_node" :
			case "ht_url":
			case "hotspot": return false; 
			// Those guys get handled by MyPano2vrPlayer in the openUrl function.
			case "ht_image" : // just fall through to true
			case "ht_info" : // to handle image/info box opening. Close is done elsewhere.
		}
		hitten.div.setAttribute('data-remote','once'); // a debug move, to see what & how it sets the attr
		return true;
	}
	this.hotspotProxyClick=function(id) {
// looks like the cave people have written in their own proxy handler without calling the existing.. hmm
// I need to be calling the parent prototype!
// need to avoid double call if (hotspot.skinid=='hotspot')
// that is, readUrl is called, as well as this proxy for those.

		if (player.bj_recent_opened != "") {
			if (bjDebug) console.log(player.bj_recent_opened + ' already handled');
			player.bj_recent_opened = "";
			return;
		}

		if (bjDebug) console.log('click'+id); // looks like 'Point89' or similar

		if (!proceedWithHotspotProxy(id)) return;

		// Might need to detect echo(s) from the broadcast somehow.
		// For now, trust the client receiving the broadcast click knows not to send it back.
		if ((typeof channel !== 'undefined') && (channel.subscribed)) {
			if (bjDebug) console.log("sending the proxy click");
			channel.trigger('client-hotspot',{'event':'click','id':id});
		}
		if (bjDebug) console.log("hotspotProxyClick returning normally");
	}
	this.hotspotProxyOver=function(id) {
		if (bjDebug) console.log('over');
		if (bjDebug) console.log(id);
		if (!proceedWithHotspotProxy(id)) return;
		if ((typeof channel !== 'undefined') && (channel.subscribed)) {
			if (bjDebug) console.log("sendign the proxy over");
			channel.trigger('client-hotspot',{'event':'over','id':id});
		}
		if (bjDebug) console.log("hotspotProxyOver returning normally");
	}
	this.hotspotProxyOut=function(id) {
		if (bjDebug) console.log('out');
		if (bjDebug) console.log(id);
		if (!proceedWithHotspotProxy(id)) return;
		if ((typeof channel !== 'undefined') && (channel.subscribed)) {
			if (bjDebug) console.log("sendingthe proxy out");
			channel.trigger('client-hotspot',{'event':'out','id':id});
		}
		if (bjDebug) console.log("hotspotProxyOut returning normally");
	}
	// now I can attach my lead/follow and other chat to the current skin

	this.addFlag=function(ggid,idattr,innerText,styleAdditions) {
		// note this abandons any prior _leadingFlag, but should leave 'em in the dom
		this._leadingflag=document.createElement('div');
		this._leadingflag__text=document.createElement('div');
		this._leadingflag.className='ggskin ggskin_textdiv';
		this._leadingflag.ggTextDiv=this._leadingflag__text;
		this._leadingflag.ggId=ggid;
		this._leadingflag.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		this._leadingflag.ggVisible=true;
		this._leadingflag.className='ggskin ggskin_text ';
		this._leadingflag.ggType='text';
		this._leadingflag.setAttribute('id',idattr);
		hs = 'position : absolute; margin : 5px; border: 2px solid #000000; visibility : inherit;'+styleAdditions;
		this._leadingflag.setAttribute('style',hs);
		// domTransform was defined in this object, so added this. here.
		this._leadingflag.style[this.domTransform + 'Origin']='50% 50%';
		hs ='left: 0px;top:  0px;padding: 0px 1px 0px 1px;';
		hs+='background: rgba(255,255,255,0);color: #000000;text-align: center;white-space: nowrap;';
		hs+='overflow: hidden; overflow-y: auto;';
		this._leadingflag__text.setAttribute('style',hs);
		this._leadingflag__text.innerHTML=innerText;
		this._leadingflag.appendChild(this._leadingflag__text);
		// changed me to this for these
		this._leadingflag.ggIsActive=function() {
			if ((this.parentNode) && (this.parentNode.ggIsActive)) {
				return this.parentNode.ggIsActive();
			}
			return false;
		}
		this._leadingflag.ggElementNodeId=function() {
			if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
				return this.parentNode.ggElementNodeId();
			}
			return me.player.getCurrentNode();
		}
		this._leadingflag.ggUpdatePosition=function () {}
		this.divSkin.appendChild(this._leadingflag);
	}

	this.addFlag('LeadingFlag','bj-lead-follow','Lead/Follow','height:25px;width:204px;bottom:35px;');
	this.addFlag('ReportStatus','bj-report-status','STATUS','height:35px;min-width:204px;bottom:67px;');
	this.addFlag('ChatText','bj-chat-text','CHAT','height:152px;width:204px;bottom:100px;');

}
extend(pano2vrSkin,MySkin);


