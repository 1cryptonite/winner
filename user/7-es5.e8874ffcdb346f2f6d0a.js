(window.webpackJsonp=window.webpackJsonp||[]).push([[7],{fnxe:function(l,n,u){"use strict";u.d(n,"a",function(){return e}),u.d(n,"b",function(){return t});const t=(()=>{class l{static isString(l){return"string"==typeof l||l instanceof String}static caseInsensitiveSort(n,u){return l.isString(n)&&l.isString(u)?n.localeCompare(u):l.defaultCompare(n,u)}static defaultCompare(l,n){return l&&l instanceof Date&&(l=l.getTime()),n&&n instanceof Date&&(n=n.getTime()),l===n?0:null==l?1:null==n?-1:l>n?1:-1}static parseExpression(l){return(l=(l=l.replace(/\[(\w+)\]/g,".$1")).replace(/^\./,"")).split(".")}static getValue(l,n){for(let u=0,t=n.length;u<t;++u){if(!l)return;const t=n[u];if(!(t in l))return;l="function"==typeof l[t]?l[t]():l[t]}return l}static setValue(l,n,u){let t;for(t=0;t<u.length-1;t++)l=l[u[t]];l[u[t]]=n}transform(l,n,u,t=!1,e){return l?Array.isArray(n)?this.multiExpressionTransform(l,n,u,t,e):Array.isArray(l)?this.sortArray(l.slice(),n,u,t,e):"object"==typeof l?this.transformObject(Object.assign({},l),n,u,t,e):l:l}sortArray(n,u,t,e,i){const a=u&&-1!==u.indexOf(".");let c;a&&(u=l.parseExpression(u)),c=i&&"function"==typeof i?i:e?l.caseInsensitiveSort:l.defaultCompare;const s=n.sort((n,t)=>u?a?c(l.getValue(n,u),l.getValue(t,u)):n&&t?c(n[u],t[u]):c(n,t):c(n,t));return t?s.reverse():s}transformObject(n,u,t,e,i){const a=l.parseExpression(u);let c=a.pop(),s=l.getValue(n,a);return Array.isArray(s)||(a.push(c),c=null,s=l.getValue(n,a)),s?(l.setValue(n,this.transform(s,c,t,e),a),n):n}multiExpressionTransform(l,n,u,t=!1,e){return n.reverse().reduce((l,n)=>this.transform(l,n,u,t,e),l)}}return l})(),e=(()=>(class{}))()},vf6a:function(l,n,u){"use strict";u.r(n);var t=u("CcnG"),e=function(){return function(){}}(),i=u("pMnS"),a=u("Ip0R"),c=u("fnxe"),s=u("edkn"),r=u("snfY"),o=u("ZYCi"),m=u("qzsy"),p=u("hWNM"),b=u("3EpR"),d=u("ZYjt"),g=u("zuHl"),v=u("S+eF"),h=u("VfKn"),f=u("iXSS"),k=function(){function l(l,n,u,t,e,i,a,c){var s=this;this.SportService=l,this.matchService=n,this.router=u,this.matchModel=t,this.rightbar=e,this.route=i,this.match=a,this._rxjscommanService=c,this.eventTypeID=4,this.seriesID=0,this.sportListData=[],this.isActive=0,this.isClicked=!1,this.GetMatchData=[],this.route.queryParams.subscribe(function(l){s.eventTypeID=l.SportId,s.cupid=l.SportId,s.getMatchList()})}return l.prototype.ngOnInit=function(){this.loginUserData=JSON.parse(localStorage.getItem("UserLoginData")),null!=this.loginUserData&&(this.GetSoprtLists(),null==this.eventTypeID&&(this.eventTypeID=4),this.getMatchList()),this.testMatchdata={name:"Test",match_id:"-3",match_date:"2019-07-09T05:15:00.000Z",market_id:"0"},this.onedayMatchdata={name:"1 Day",match_id:"-2",match_date:"2019-07-09T05:15:00.000Z",market_id:null},this.twentyMatchdata={name:"20-20",match_id:"-1",match_date:"2019-07-09T05:15:00.000Z",market_id:"0"},this.andarBaharMatchdata={name:"Ander Bahar",match_id:"-7",match_date:"2019-07-09T05:15:00.000Z",market_id:"0"},this.pokerTwentyMatchdata={name:"20-20",match_id:"-4",match_date:"2019-07-09T05:15:00.000Z",market_id:"0"},this.pokerOnedayMatchdata={name:"1 Day",match_id:"-5",match_date:"2019-07-09T05:15:00.000Z",market_id:"0"},this.lucky7Matchdata={name:"Lucky 7",match_id:"-145",match_date:"2019-07-09T05:15:00.000Z",market_id:"0"}},l.prototype.getMatchList=function(){var l=this;"cup"===this.eventTypeID?this.matchService.getCups().subscribe(function(n){l.GetMatchData=n.data,console.log(l.GetMatchData),l.GetMatchDatalength=null!=l.GetMatchData?l.GetMatchData.length:0},function(n){n.code&&l.router.navigate(["login"])}):this.SportService.getUserFavouriteMatchLst({sport_id:""+this.eventTypeID,series_id:""+this.seriesID}).subscribe(function(n){l.GetMatchData=n.data,l.fetchMatchListTime=2,l.GetMatchDatalength=null!=l.GetMatchData?l.GetMatchData.length:0},function(l){console.log(l)},function(){"/dashmain/exchange"==l.router.url.split("?")[0]&&(l.timer=setTimeout(function(){return Object(v.resolve)(l.getMatchList())},1e3))})},l.prototype.gotoUserMatchOddsPage=function(l){localStorage.setItem("selectedMatch",JSON.stringify(l)),this.router.navigate(["main/exchange-details"],{queryParams:{eventType:4}})},l.prototype.TwentyLive=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"-1",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.OneTeenpattiLive=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"-2",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.testlive=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"-3",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.AnderBharLive=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"-7",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.UpDownLive=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"-145",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.OneTeenpatti=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"-151",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.CardCasinoLive=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"-158",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.TwentyonePoker=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"-5",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.Twentypoker=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"-4",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.AnderBharVirtual=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"--5",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.CardCasinoVirtual=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"-1001",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.OneTeenpattiVirtudal=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"-1002",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.TeenpattiVirtudal=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"-1003",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.UpDownVirtual=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"-1005",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.Card32ALive=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"-1012",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.Card32BLive=function(){localStorage.setItem("selectedMatch",JSON.stringify({match_id:"-1010",user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.DragonTigerLive=function(l){localStorage.setItem("selectedMatch",JSON.stringify({match_id:l,user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.InstantWorliLive=function(l){localStorage.setItem("selectedMatch",JSON.stringify({match_id:l,user_id:4314})),this._rxjscommanService.setChangeGame(!0),this.router.navigate(["main/exchange-details"])},l.prototype.commingSoon=function(l){},l.prototype.GetSoprtLists=function(){var l=this;this.sportListData=[],this.SportService.GetSoprtName({status:1}).subscribe(function(n){l.sportListData=n.data.list},function(l){console.log(l)})},l.prototype.ChangeSport=function(l,n){this.isActive=l,this.currentSportID=n.sport_id,this.eventTypeID=n.sport_id,this.isClicked=!0,this.getMatchList()},l.prototype.CallBackLay=function(l,n,u,t,e,i,a){this.arrayObj={selection_id:t,market_id:a.market_id,odds:l,stake:0,is_back:n,is_fancy:0,MatchName:a.name,placeName:u,isManual:0,is_session_fancy:"N"},this.matchModel.isbetslipshow=!0,localStorage.setItem("betList",JSON.stringify(this.arrayObj)),this.matchModel.setUser(this.arrayObj),this.rightbar.getBetSlipDataForOdds()},l.prototype.setfavourite=function(l){this.rightbar.setfavourite(l)},l.prototype.isExistLivegames=function(l,n){if(l.findIndex(function(l){return l.sport_id==n})>-1)return!0},l}(),_=t.tb({encapsulation:0,styles:[[".come-soon[_ngcontent-%COMP%]{position:absolute;background-color:#f9fbfd;top:-15px;right:-15px;color:#000;font-size:10px;width:50px;text-align:center;padding:15px 4px;border-radius:70px;height:50px}"]],data:{}});function x(l){return t.Ob(0,[(l()(),t.vb(0,0,null,null,1,"span",[["class","commonbtn"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.gotoUserMatchOddsPage(l.parent.context.$implicit.matchid,l.parent.context.$implicit.marketid,l.parent.context.$implicit.SportId)&&t),t},null,null)),(l()(),t.Mb(1,null,[""," Day "]))],null,function(l,n){l(n,1,0,n.parent.context.$implicit.day)})}function y(l){return t.Ob(0,[(l()(),t.vb(0,0,null,null,1,"span",[],null,null,null,null,null)),(l()(),t.vb(1,0,null,null,0,"img",[["alt","img"],["src","assets/images/greendot.png"]],null,null,null,null,null))],null,null)}function S(l){return t.Ob(0,[(l()(),t.vb(0,0,null,null,1,"span",[["style","font-weight: 900;"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["f"]))],null,null)}function M(l){return t.Ob(0,[(l()(),t.vb(0,0,null,null,0,"i",[["class","fa fa-play-circle"],["style","color: green;"]],null,null,null,null,null))],null,null)}function j(l){return t.Ob(0,[(l()(),t.vb(0,0,null,null,7,"span",[],null,null,null,null,null)),t.Jb(512,null,a.y,a.z,[t.v,t.w,t.n,t.J]),t.ub(2,278528,null,0,a.k,[a.y],{ngClass:[0,"ngClass"]},null),t.Hb(3,{"mat-stat":0,"css-suspend1":1}),(l()(),t.kb(16777216,null,null,1,null,M)),t.ub(5,16384,null,0,a.m,[t.U,t.R],{ngIf:[0,"ngIf"]},null),(l()(),t.vb(6,0,null,null,1,"p",[["class","suspendecp"]],null,null,null,null,null)),(l()(),t.Mb(7,null,["",""]))],function(l,n){var u=l(n,3,0,n.parent.parent.context.$implicit.inplay&&"OPEN"==n.parent.parent.context.$implicit.status,"SUSPENDED"==n.parent.parent.context.$implicit.status||"CLOSED"==n.parent.parent.context.$implicit.status);l(n,2,0,u),l(n,5,0,n.parent.parent.context.$implicit.inplay&&"OPEN"==n.parent.parent.context.$implicit.status)},function(l,n){l(n,7,0,"OPEN"==n.parent.parent.context.$implicit.status?n.parent.parent.context.$implicit.inplay?"In-Play":"":n.parent.parent.context.$implicit.status)})}function $(l){return t.Ob(0,[(l()(),t.vb(0,0,null,null,36,"td",[["class","mttd3"]],null,null,null,null,null)),(l()(),t.vb(1,0,null,null,35,"div",[["class","betright clearfix"]],null,null,null,null,null)),(l()(),t.vb(2,0,null,null,10,"div",[["class","betbox"]],null,null,null,null,null)),(l()(),t.vb(3,0,null,null,4,"a",[["class","td_btn blue_btn blue_bg"]],null,[[null,"click"]],function(l,n,u){var t=!0,e=l.component;return"click"===n&&(t=!1!==e.CallBackLay(l.parent.context.$implicit.runner_json[0].back[0].price,1,l.parent.context.$implicit.name,l.parent.context.$implicit.runner_json[0].selectionId,l.parent.context.$implicit.marketid,e.i,l.parent.context.$implicit)&&t),t},null,null)),t.Jb(512,null,a.y,a.z,[t.v,t.w,t.n,t.J]),t.ub(5,278528,null,0,a.k,[a.y],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),t.Hb(6,{callYlCss:0}),(l()(),t.Mb(7,null,[""," "])),(l()(),t.vb(8,0,null,null,4,"a",[["class","td_btn pink_btn pink_bg"],["href","javascript:void(0)"]],null,[[null,"click"]],function(l,n,u){var t=!0,e=l.component;return"click"===n&&(t=!1!==e.CallBackLay(l.parent.context.$implicit.runner_json[0].lay[0].price,0,l.parent.context.$implicit.name,l.parent.context.$implicit.runner_json[0].selectionId,l.parent.context.$implicit.marketid,e.i,l.parent.context.$implicit)&&t),t},null,null)),t.Jb(512,null,a.y,a.z,[t.v,t.w,t.n,t.J]),t.ub(10,278528,null,0,a.k,[a.y],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),t.Hb(11,{callCYanCss:0}),(l()(),t.Mb(12,null,[""," "])),(l()(),t.vb(13,0,null,null,10,"div",[["class","betbox"]],null,null,null,null,null)),(l()(),t.vb(14,0,null,null,4,"a",[["class","td_btn blue_btn blue_bg"],["data-toggle","collapse"],["href","javascript:void(0)"]],[[8,"target",0]],[[null,"click"]],function(l,n,u){var t=!0,e=l.component;return"click"===n&&(t=!1!==e.CallBackLay(l.parent.context.$implicit.runner_json[2].back[0].price,1,l.parent.context.$implicit.name,l.parent.context.$implicit.runner_json[2].selectionId,l.parent.context.$implicit.marketid,e.i,l.parent.context.$implicit)&&t),"click"===n&&(t=0!=(l.parent.context.$implicit.IsShow=!0)&&t),t},null,null)),t.Jb(512,null,a.y,a.z,[t.v,t.w,t.n,t.J]),t.ub(16,278528,null,0,a.k,[a.y],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),t.Hb(17,{callYlCss:0}),(l()(),t.Mb(18,null,[""," "])),(l()(),t.vb(19,0,null,null,4,"a",[["class","td_btn pink_btn pink_bg"],["data-toggle","collapse"],["href","javascript:void(0)"],["ng-init","SetCommonProperty(match.runner_json[2].id,match)"]],[[8,"target",0]],[[null,"click"]],function(l,n,u){var t=!0,e=l.component;return"click"===n&&(t=!1!==e.CallBackLay(l.parent.context.$implicit.runner_json[2].lay[0].price,0,l.parent.context.$implicit.name,l.parent.context.$implicit.runner_json[2].selectionId,l.parent.context.$implicit.marketid,e.i,l.parent.context.$implicit)&&t),t},null,null)),t.Jb(512,null,a.y,a.z,[t.v,t.w,t.n,t.J]),t.ub(21,278528,null,0,a.k,[a.y],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),t.Hb(22,{callCYanCss:0}),(l()(),t.Mb(23,null,[""," "])),(l()(),t.vb(24,0,null,null,10,"div",[["class","betbox"]],null,null,null,null,null)),(l()(),t.vb(25,0,null,null,4,"a",[["class","td_btn blue_btn blue_bg"],["href","javascript:void(0)"]],null,[[null,"click"]],function(l,n,u){var t=!0,e=l.component;return"click"===n&&(t=!1!==e.CallBackLay(l.parent.context.$implicit.runner_json[1].back[0].price,1,l.parent.context.$implicit.name,l.parent.context.$implicit.runner_json[1].selectionId,l.parent.context.$implicit.marketid,e.i,l.parent.context.$implicit)&&t),"click"===n&&(t=0!=(l.parent.context.$implicit.IsShow=!0)&&t),t},null,null)),t.Jb(512,null,a.y,a.z,[t.v,t.w,t.n,t.J]),t.ub(27,278528,null,0,a.k,[a.y],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),t.Hb(28,{callYlCss:0}),(l()(),t.Mb(29,null,[""," "])),(l()(),t.vb(30,0,null,null,4,"a",[["class","td_btn pink_btn pink_bg"],["href","javascript:void(0)"]],null,[[null,"click"]],function(l,n,u){var t=!0,e=l.component;return"click"===n&&(t=!1!==e.CallBackLay(l.parent.context.$implicit.runner_json[1].lay[0].price,0,l.parent.context.$implicit.name,l.parent.context.$implicit.runner_json[1].selectionId,l.parent.context.$implicit.marketid,e.i,l.parent.context.$implicit)&&t),t},null,null)),t.Jb(512,null,a.y,a.z,[t.v,t.w,t.n,t.J]),t.ub(32,278528,null,0,a.k,[a.y],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),t.Hb(33,{callCYanCss:0}),(l()(),t.Mb(34,null,["",""])),(l()(),t.kb(16777216,null,null,1,null,j)),t.ub(36,16384,null,0,a.m,[t.U,t.R],{ngIf:[0,"ngIf"]},null)],function(l,n){var u=l(n,6,0,null==n.parent.context.$implicit.runner_json[0]?"":n.parent.context.$implicit.runner_json[0].back[0].selected);l(n,5,0,"td_btn blue_btn blue_bg",u);var t=l(n,11,0,null==n.parent.context.$implicit.runner_json[0]?"":n.parent.context.$implicit.runner_json[0].lay[0].selected);l(n,10,0,"td_btn pink_btn pink_bg",t);var e=l(n,17,0,null==n.parent.context.$implicit.runner_json[2]?"":n.parent.context.$implicit.runner_json[2].back[0].selected);l(n,16,0,"td_btn blue_btn blue_bg",e);var i=l(n,22,0,null==n.parent.context.$implicit.runner_json[2]?"":n.parent.context.$implicit.runner_json[2].lay[0].selected);l(n,21,0,"td_btn pink_btn pink_bg",i);var a=l(n,28,0,null==n.parent.context.$implicit.runner_json[1]?"":n.parent.context.$implicit.runner_json[1].back[0].selected);l(n,27,0,"td_btn blue_btn blue_bg",a);var c=l(n,33,0,null==n.parent.context.$implicit.runner_json[1]?"":n.parent.context.$implicit.runner_json[1].lay[0].selected);l(n,32,0,"td_btn pink_btn pink_bg",c),l(n,36,0,"SUSPENDED"==n.parent.context.$implicit.status||"CLOSED"==n.parent.context.$implicit.status)},function(l,n){var u=n.component;l(n,7,0,null==n.parent.context.$implicit.runner_json[0]?0:n.parent.context.$implicit.runner_json[0].back[0].price),l(n,12,0,null==n.parent.context.$implicit.runner_json[0]?0:n.parent.context.$implicit.runner_json[0].lay[0].price),l(n,14,0,t.xb(1,"#demo",u.$index,"")),l(n,18,0,null==n.parent.context.$implicit.runner_json[2]?"--":n.parent.context.$implicit.runner_json[2].back[0].price),l(n,19,0,t.xb(1,"#demo",u.$index,"")),l(n,23,0,null==n.parent.context.$implicit.runner_json[2]?"--":n.parent.context.$implicit.runner_json[2].lay[0].price),l(n,29,0,null==n.parent.context.$implicit.runner_json[1].back[0].price?0:n.parent.context.$implicit.runner_json[1].back[0].price),l(n,34,0,null==n.parent.context.$implicit.runner_json[1].lay[0].price?0:n.parent.context.$implicit.runner_json[1].lay[0].price)})}function C(l){return t.Ob(0,[(l()(),t.vb(0,0,null,null,14,"tr",[],null,null,null,null,null)),(l()(),t.vb(1,0,null,null,6,"td",[["class","mttd1 "]],null,null,null,null,null)),(l()(),t.vb(2,0,null,null,2,"a",[["class","matchNameSky"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.gotoUserMatchOddsPage(l.context.$implicit)&&t),t},null,null)),(l()(),t.Mb(3,null,[""," / "," (IST)"])),t.Ib(4,2),(l()(),t.vb(5,0,null,null,2,"div",[["class","commainbtv"]],null,null,null,null,null)),(l()(),t.kb(16777216,null,null,1,null,x)),t.ub(7,16384,null,0,a.m,[t.U,t.R],{ngIf:[0,"ngIf"]},null),(l()(),t.vb(8,0,null,null,4,"td",[["class","mttd2"]],null,null,null,null,null)),(l()(),t.kb(16777216,null,null,1,null,y)),t.ub(10,16384,null,0,a.m,[t.U,t.R],{ngIf:[0,"ngIf"]},null),(l()(),t.kb(16777216,null,null,1,null,S)),t.ub(12,16384,null,0,a.m,[t.U,t.R],{ngIf:[0,"ngIf"]},null),(l()(),t.kb(16777216,null,null,1,null,$)),t.ub(14,16384,null,0,a.m,[t.U,t.R],{ngIf:[0,"ngIf"]},null)],function(l,n){var u=n.component;l(n,7,0,n.context.$implicit.day>1),l(n,10,0,n.context.$implicit.inplay),l(n,12,0,1==n.context.$implicit.is_fancy),l(n,14,0,"cup"!=u.cupid)},function(l,n){var u=n.context.$implicit.name,e=t.Nb(n,3,1,l(n,4,0,t.Fb(n.parent.parent,0),n.context.$implicit.match_date,"medium"));l(n,3,0,u,e)})}function I(l){return t.Ob(0,[(l()(),t.vb(0,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),t.Mb(-1,null,[" No Record Found "]))],null,null)}function D(l){return t.Ob(0,[(l()(),t.vb(0,0,null,null,21,"div",[["class","fancy-part"]],null,null,null,null,null)),(l()(),t.vb(1,0,null,null,20,"div",[["class","bet_tablearea table-responsive"]],null,null,null,null,null)),(l()(),t.vb(2,0,null,null,17,"table",[["border","0"],["cellpadding","0"],["cellspacing","0"],["class","table"],["width","100%"]],null,null,null,null,null)),(l()(),t.vb(3,0,null,null,12,"thead",[],null,null,null,null,null)),(l()(),t.vb(4,0,null,null,11,"tr",[],null,null,null,null,null)),(l()(),t.vb(5,0,null,null,1,"th",[["align","left"],["valign","middle"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["Game"])),(l()(),t.vb(7,0,null,null,0,"th",[["align","left"],["valign","middle"]],null,null,null,null,null)),(l()(),t.vb(8,0,null,null,7,"th",[["align","left"],["valign","middle"]],null,null,null,null,null)),(l()(),t.vb(9,0,null,null,6,"div",[["class","betrightbox clearfix"]],null,null,null,null,null)),(l()(),t.vb(10,0,null,null,1,"div",[["class","betbox"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["1"])),(l()(),t.vb(12,0,null,null,1,"div",[["class","betbox"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["x"])),(l()(),t.vb(14,0,null,null,1,"div",[["class","betbox"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["3"])),(l()(),t.vb(16,0,null,null,3,"tbody",[],null,null,null,null,null)),(l()(),t.kb(16777216,null,null,2,null,C)),t.ub(18,278528,null,0,a.l,[t.U,t.R,t.v],{ngForOf:[0,"ngForOf"]},null),t.Gb(0,c.b,[]),(l()(),t.kb(16777216,null,null,1,null,I)),t.ub(21,16384,null,0,a.m,[t.U,t.R],{ngIf:[0,"ngIf"]},null)],function(l,n){var u=n.component;l(n,18,0,t.Nb(n,18,0,t.Fb(n,19).transform(u.GetMatchData,"match_date"))),l(n,21,0,0==u.GetMatchData.length)},null)}function O(l){return t.Ob(0,[t.Gb(0,a.e,[t.x]),(l()(),t.vb(1,0,null,null,119,"div",[["class","mid-full-panel"]],null,null,null,null,null)),(l()(),t.kb(16777216,null,null,1,null,D)),t.ub(3,16384,null,0,a.m,[t.U,t.R],{ngIf:[0,"ngIf"]},null),(l()(),t.vb(4,0,null,null,116,"div",[["class","home-products-container"],["style","margin-top: 40px;"]],null,null,null,null,null)),(l()(),t.vb(5,0,null,null,115,"div",[["class","row row5"]],null,null,null,null,null)),(l()(),t.vb(6,0,null,null,114,"div",[["class","col-md-12"]],null,null,null,null,null)),(l()(),t.vb(7,0,null,null,4,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(8,0,null,null,3,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.Twentypoker()&&t),t},null,null)),(l()(),t.vb(9,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/poker.jpg"]],null,null,null,null,null)),(l()(),t.vb(10,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["20-20 Poker "])),(l()(),t.vb(12,0,null,null,4,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(13,0,null,null,3,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.TwentyonePoker()&&t),t},null,null)),(l()(),t.vb(14,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/poker.jpg"]],null,null,null,null,null)),(l()(),t.vb(15,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["1 Day Poker "])),(l()(),t.vb(17,0,null,null,4,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(18,0,null,null,3,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.TwentyLive()&&t),t},null,null)),(l()(),t.vb(19,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/teenpatti.jpg"]],null,null,null,null,null)),(l()(),t.vb(20,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["20-20 Teenpatti "])),(l()(),t.vb(22,0,null,null,4,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(23,0,null,null,3,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.OneTeenpattiLive()&&t),t},null,null)),(l()(),t.vb(24,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/teenpatti.jpg"]],null,null,null,null,null)),(l()(),t.vb(25,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["1 Day Teenpatti "])),(l()(),t.vb(27,0,null,null,4,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(28,0,null,null,3,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.testlive()&&t),t},null,null)),(l()(),t.vb(29,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/teenpatti.jpg"]],null,null,null,null,null)),(l()(),t.vb(30,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["Test Teenpatti "])),(l()(),t.vb(32,0,null,null,4,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(33,0,null,null,3,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.AnderBharLive()&&t),t},null,null)),(l()(),t.vb(34,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/andar-bahar.jpg"]],null,null,null,null,null)),(l()(),t.vb(35,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["Andar Bahar "])),(l()(),t.vb(37,0,null,null,4,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(38,0,null,null,3,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.UpDownLive()&&t),t},null,null)),(l()(),t.vb(39,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/lucky7.jpg"]],null,null,null,null,null)),(l()(),t.vb(40,0,null,null,1,"div",[["class","casino-name "],["style","padding: 7px;"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,[" Lucky 7 "])),(l()(),t.vb(42,0,null,null,4,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(43,0,null,null,3,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.Card32ALive()&&t),t},null,null)),(l()(),t.vb(44,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/32cardsA.jpg"]],null,null,null,null,null)),(l()(),t.vb(45,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["32 Cards A"])),(l()(),t.vb(47,0,null,null,4,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(48,0,null,null,3,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.Card32BLive()&&t),t},null,null)),(l()(),t.vb(49,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/32cardsB.jpg"]],null,null,null,null,null)),(l()(),t.vb(50,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["32 Cards B"])),(l()(),t.vb(52,0,null,null,4,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(53,0,null,null,3,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.DragonTigerLive("-1014")&&t),t},null,null)),(l()(),t.vb(54,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/dt.jpg"]],null,null,null,null,null)),(l()(),t.vb(55,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["Dragon Tiger "])),(l()(),t.vb(57,0,null,null,4,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(58,0,null,null,3,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.DragonTigerLive("-1011")&&t),t},null,null)),(l()(),t.vb(59,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/dt202.jpg"]],null,null,null,null,null)),(l()(),t.vb(60,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["Dragon Tiger 20-20 "])),(l()(),t.vb(62,0,null,null,4,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(63,0,null,null,3,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.InstantWorliLive("-1013")&&t),t},null,null)),(l()(),t.vb(64,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/worli.jpg"]],null,null,null,null,null)),(l()(),t.vb(65,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["worli.jpg "])),(l()(),t.vb(67,0,null,null,4,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(68,0,null,null,3,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.InstantWorliLive("-1015")&&t),t},null,null)),(l()(),t.vb(69,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/bollywood-casino.jpg"]],null,null,null,null,null)),(l()(),t.vb(70,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,[" Bollywood Casino "])),(l()(),t.vb(72,0,null,null,6,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(73,0,null,null,5,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.commingSoon("-1015")&&t),t},null,null)),(l()(),t.vb(74,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/aaa.jpg"]],null,null,null,null,null)),(l()(),t.vb(75,0,null,null,1,"p",[["class","come-soon"]],null,null,null,null,null)),(l()(),t.vb(76,0,null,null,0,"img",[["alt",""],["src","assets/images/images.png"]],null,null,null,null,null)),(l()(),t.vb(77,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["Amar Akbar Anthony "])),(l()(),t.vb(79,0,null,null,6,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(80,0,null,null,5,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.commingSoon("-1015")&&t),t},null,null)),(l()(),t.vb(81,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/cmeter.jpg"]],null,null,null,null,null)),(l()(),t.vb(82,0,null,null,1,"p",[["class","come-soon"]],null,null,null,null,null)),(l()(),t.vb(83,0,null,null,0,"img",[["alt",""],["src","assets/images/images.png"]],null,null,null,null,null)),(l()(),t.vb(84,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["Casino Meter "])),(l()(),t.vb(86,0,null,null,6,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(87,0,null,null,5,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.commingSoon("-1015")&&t),t},null,null)),(l()(),t.vb(88,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/war.jpg"]],null,null,null,null,null)),(l()(),t.vb(89,0,null,null,1,"p",[["class","come-soon"]],null,null,null,null,null)),(l()(),t.vb(90,0,null,null,0,"img",[["alt",""],["src","assets/images/images.png"]],null,null,null,null,null)),(l()(),t.vb(91,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["Casino WAR "])),(l()(),t.vb(93,0,null,null,6,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(94,0,null,null,5,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.commingSoon("-1015")&&t),t},null,null)),(l()(),t.vb(95,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/cricketv3.jpg"]],null,null,null,null,null)),(l()(),t.vb(96,0,null,null,1,"p",[["class","come-soon"]],null,null,null,null,null)),(l()(),t.vb(97,0,null,null,0,"img",[["alt",""],["src","assets/images/images.png"]],null,null,null,null,null)),(l()(),t.vb(98,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["Five Cricket "])),(l()(),t.vb(100,0,null,null,6,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(101,0,null,null,5,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.commingSoon("-1015")&&t),t},null,null)),(l()(),t.vb(102,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/3cardsJ.jpg"]],null,null,null,null,null)),(l()(),t.vb(103,0,null,null,1,"p",[["class","come-soon"]],null,null,null,null,null)),(l()(),t.vb(104,0,null,null,0,"img",[["alt",""],["src","assets/images/images.png"]],null,null,null,null,null)),(l()(),t.vb(105,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["3 card Jujment "])),(l()(),t.vb(107,0,null,null,6,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(108,0,null,null,5,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.commingSoon("-1015")&&t),t},null,null)),(l()(),t.vb(109,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/race20.png"]],null,null,null,null,null)),(l()(),t.vb(110,0,null,null,1,"p",[["class","come-soon"]],null,null,null,null,null)),(l()(),t.vb(111,0,null,null,0,"img",[["alt",""],["src","assets/images/images.png"]],null,null,null,null,null)),(l()(),t.vb(112,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["Race 20-20 "])),(l()(),t.vb(114,0,null,null,6,"a",[["class",""]],null,null,null,null,null)),(l()(),t.vb(115,0,null,null,5,"div",[["class","d-inline-block casinoicons"]],null,[[null,"click"]],function(l,n,u){var t=!0;return"click"===n&&(t=!1!==l.component.commingSoon("-1015")&&t),t},null,null)),(l()(),t.vb(116,0,null,null,0,"img",[["class","img-fluid"],["src","assets/games-icon/superover.jpg"]],null,null,null,null,null)),(l()(),t.vb(117,0,null,null,1,"p",[["class","come-soon"]],null,null,null,null,null)),(l()(),t.vb(118,0,null,null,0,"img",[["alt",""],["src","assets/images/images.png"]],null,null,null,null,null)),(l()(),t.vb(119,0,null,null,1,"div",[["class","casino-name"]],null,null,null,null,null)),(l()(),t.Mb(-1,null,["Super Over "]))],function(l,n){l(n,3,0,null!=n.component.GetMatchData)},null)}function L(l){return t.Ob(0,[(l()(),t.vb(0,0,null,null,2,"app-exchange",[],null,null,null,O,_)),t.Jb(512,null,s.a,s.a,[r.a,o.a,m.a,p.a,o.l,b.a,d.b,g.a]),t.ub(2,114688,null,0,k,[m.a,h.a,o.l,r.a,s.a,o.a,r.a,f.a],null,null)],function(l,n){l(n,2,0)},null)}var T=t.rb("app-exchange",k,L,{},{},[]),J=u("x0OW"),w=u("gIcY"),G=u("WYl0"),N=u("t/Na"),A=function(){return function(){}}();u.d(n,"ExchangeModuleNgFactory",function(){return U});var U=t.sb(e,[],function(l){return t.Cb([t.Db(512,t.l,t.fb,[[8,[i.a,T,J.a]],[3,t.l],t.A]),t.Db(4608,a.o,a.n,[t.x,[2,a.B]]),t.Db(4608,c.b,c.b,[]),t.Db(4608,w.v,w.v,[]),t.Db(4608,b.d,b.d,[]),t.Db(4608,b.a,b.a,[t.g,t.l,t.t,t.C,b.d]),t.Db(4608,G.a,G.a,[N.c]),t.Db(1073742336,a.c,a.c,[]),t.Db(1073742336,o.m,o.m,[[2,o.r],[2,o.l]]),t.Db(1073742336,A,A,[]),t.Db(1073742336,c.a,c.a,[]),t.Db(1073742336,b.b,b.b,[]),t.Db(1073742336,w.u,w.u,[]),t.Db(1073742336,w.g,w.g,[]),t.Db(1073742336,e,e,[]),t.Db(1024,o.j,function(){return[[{path:"",component:k}]]},[])])})}}]);