		this._leadingflag=document.createElement('div');
		this._leadingflag__text=document.createElement('div');
		this._leadingflag.className='ggskin ggskin_textdiv';
		this._leadingflag.ggTextDiv=this._leadingflag__text;
		this._leadingflag.ggId="LeadingFlag";
		this._leadingflag.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		this._leadingflag.ggVisible=true;
		this._leadingflag.className='ggskin ggskin_text ';
		this._leadingflag.ggType='text';
		hs ='';
		hs+='height : 52px;';
		hs+='left : -98px;';
		hs+='position : absolute;';
		hs+='top : 6px;';
		hs+='visibility : inherit;';
		hs+='width : 91px;';
		this._leadingflag.setAttribute('style',hs);
		this._leadingflag.style[domTransform + 'Origin']='50% 50%';
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
		this._leadingflag__text.innerHTML="Leading";
		this._leadingflag.appendChild(this._leadingflag__text);
		me._leadingflag.ggIsActive=function() {
			if ((this.parentNode) && (this.parentNode.ggIsActive)) {
				return this.parentNode.ggIsActive();
			}
			return false;
		}
		me._leadingflag.ggElementNodeId=function() {
			if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
				return this.parentNode.ggElementNodeId();
			}
			return me.player.getCurrentNode();
		}
		this._leadingflag.onmouseover=function () {
			me.elementMouseOver['leadingflag']=true;
		}
		this._leadingflag.onmouseout=function () {
			me.elementMouseOver['leadingflag']=false;
		}
		this._leadingflag.ontouchend=function () {
			me.elementMouseOver['leadingflag']=false;
		}
		this._leadingflag.ggActivate=function () {
			me._leadingflag.style[domTransition]='none';
			me._leadingflag.style.visibility=(Number(me._leadingflag.style.opacity)>0||!me._leadingflag.style.opacity)?'inherit':'hidden';
			me._leadingflag.ggVisible=true;
		}
		this._leadingflag.ggUpdatePosition=function () {
		}
		this._controller.appendChild(this._leadingflag);
