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
		var hitten = me.player.getHotspot(id);
		console.log(hitten);
		if (typeof hitten == 'undefined') return false;

		// early in the sequence, cause I wanted to debug without needing puser subscr
		var remoteAttr = hitten.div.getAttribute('data-remote'); // I think it returns null
		if (typeof remoteAttr == 'undefined') {hitten.div.setAttribute('data-remote','nope');}
		if (remoteAttr == '1') return false; // will this fail if remoteAttr is null?
		switch (hitten.div.ggId) {
			case "ht_node" :return false; // ht_image, image_popup, hide_template
			case "ht_url":
			case "hotspot": return false; //this.__div.ggId="hotspot";
			case "ht_image" : // just fall through to true
			case "ht_info" :
		}
		hitten.div.setAttribute('data-remote','once');
		return true;
	}
	this.hotspotProxyClick=function(id) {
// looks like the cave people have written in their own proxy handler without calling the existing.. hmm
// I need to be calling the parent prototype!
// need to avoid double call if (hotspot.skinid=='hotspot')
// that is, readUrl is called, as well as this proxy for those.

		if (player.bj_recent_opened != "") {
			console.log(player.bj_recent_opened + ' already handled');
			player.bj_recent_opened = "";
			return;
		}

		console.log('click'+id); // looks like 'Point89' or similar

		if (!proceedWithHotspotProxy(id)) return;

// find hitten's parents child that has ggId="image_popup". add an event listener to the click function to grab the closing click
// and transmit that, say with 'event':'close-click'.
// this might be best to do outside in the controll.js ?? Becasue to receive the close-click from pusher, now where do I find the popup?

		// need to detect echo(s) from the broadcast somehow
		if ((typeof channel !== 'undefined') && (channel.subscribed)) {
			console.log("sending the proxy click");
			channel.trigger('client-hotspot',{'event':'click','id':id});
		}
	}
	this.hotspotProxyOver=function(id) {
		console.log('over');
		console.log(id);
		if (!proceedWithHotspotProxy(id)) return;
		if ((typeof channel !== 'undefined') && (channel.subscribed)) {
			console.log("sendign the proxy over");
			channel.trigger('client-hotspot',{'event':'over','id':id});
		}
	}
	this.hotspotProxyOut=function(id) {
		console.log('out');
		console.log(id);
		if (!proceedWithHotspotProxy(id)) return;
		if ((typeof channel !== 'undefined') && (channel.subscribed)) {
			console.log("sendingthe proxy out");
			channel.trigger('client-hotspot',{'event':'out','id':id});
		}
	}
	// now I can attach my lead/follow and other chat to the current skin
	this.addFlag=function() {
		this._leadingflag=document.createElement('div');
		this._leadingflag__text=document.createElement('div');
		this._leadingflag.className='ggskin ggskin_textdiv';
		this._leadingflag.ggTextDiv=this._leadingflag__text;
		this._leadingflag.ggId="LeadingFlag";
		this._leadingflag.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		this._leadingflag.ggVisible=true;
		this._leadingflag.className='ggskin ggskin_text ';
		this._leadingflag.ggType='text';
		this._leadingflag.setAttribute('id','bj-lead-follow');
		hs ='';
		hs+='height : 52px;';
		hs+='bottom : 5px;';
		hs+='position : absolute;';
		hs+='margin : 5px;';
		hs+='visibility : inherit;';
		hs+='width : 91px;';
		this._leadingflag.setAttribute('style',hs);
		// domTransform was defined in this object, so added this. here.
		this._leadingflag.style[this.domTransform + 'Origin']='50% 50%';
		hs ='position:absolute;';
		hs+='left: 0px;';
		hs+='top:  0px;';
		hs+='width: 91px;';
		hs+='height: 52px;';
		hs+='background: #ffffff;';
		hs+='border: 1px solid #000000;';
		hs+='color: #000000;';
		hs+='text-align: center;';
		hs+='white-space: nowrap;';
		hs+='padding: 0px 1px 0px 1px;';
		hs+='overflow: hidden;';
		hs+='overflow-y: auto;';
		this._leadingflag__text.setAttribute('style',hs);
		this._leadingflag__text.innerHTML="Lead/Follow";
		this._leadingflag.appendChild(this._leadingflag__text);
		// changed me to thisfor these
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
		this._leadingflag.ggUpdatePosition=function () {
		}
/** testing the getHotspot and onclick fuctions :
		this._leadingflag.onclick=function ( ) {
			var hitten = me.player.getHotspot("Point09");
			console.log(hitten); // ah HA.
			if (typeof hitten !== "undefined" ) hitten.div.onclick();
		}
**/
// _controller not found when using the cave people. 
// better  to attach to the skin div 
		this.divSkin.appendChild(this._leadingflag);
	}
	this.addFlag();
}
extend(pano2vrSkin,MySkin);

