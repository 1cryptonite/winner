(window.webpackJsonp=window.webpackJsonp||[]).push([[22],{Xhct:function(l,n,t){"use strict";t.r(n);var e=t("CcnG"),u=function(){return function(){}}(),i=t("pMnS"),r=t("gIcY"),s=t("abRS"),a=t("xkgV"),o=t("Ip0R"),c=t("rpvN"),g=function(){function l(l,n){this.sportservice=l,this.toastr=n}return l.prototype.ngOnInit=function(){this.sportByFliter=4,this.page=1,this.matchName="",this.marketName="",this.marketId="",this.getAllMatches(),this.getAllSports()},l.prototype.pageChange=function(l){this.page=l,this.getAllMatches()},l.prototype.trackByFn=function(l,n){return l},l.prototype.getAllSports=function(){var l=this;this.sportservice.getAllSports({status:1}).subscribe((function(n){l.loading=!1,n.error||(l.sportData=n.data.list)}),(function(n){l.loading=!1}))},l.prototype.getAllMatches=function(){var l=this;this.lastSportId=this.sportByFliter,this.sportservice.getdeclearedMarkets({sport_id:this.sportByFliter,pageno:this.page,matchName:this.matchName,marketName:this.marketName,marketId:this.marketId,limit:10}).subscribe((function(n){l.loading=!1,n.error||(l.declaredMarkets=n.data.list,1==l.page&&(l.totalrecored=n.data.total),l.config={currentPage:l.page,itemsPerPage:10,totalItems:l.totalrecored})}),(function(n){l.loading=!1}))},l.prototype.getMarketSelections=function(l){var n=this;this.sportservice.getMarketSelections(l).subscribe((function(l){n.loading=!1,l.error||(n.SelectionData=l.data)}),(function(l){n.loading=!1}))},l.prototype.rollBackMatch=function(l){var n=this;"1"==l.type&&"1"!=l.is_abandoned?this.sportservice.marketRollback({match_id:l.match_id,market_id:l.market_id,bet_result_id:l.bet_result_id}).subscribe((function(l){n.loading=!1,l.error?n.toastr.errorToastr(l.message):(n.message=l.message,n.toastr.successToastr(l.message),n.getAllMatches())}),(function(l){n.loading=!1})):"1"==l.type&&"1"==l.is_abandoned?this.sportservice.abandonedMarket({match_id:l.match_id,market_id:l.market_id,is_rollback:1}).subscribe((function(l){n.loading=!1,l.error?n.toastr.errorToastr(l.message):(n.getAllMatches(),n.message=l.message,n.toastr.successToastr(l.message))}),(function(l){n.loading=!1})):"0"==l.is_abandoned?this.fancyRollback(l):this.fancyRollbackAbondon(l)},l.prototype.fancyRollback=function(l){var n=this;this.sportservice.fancyRollback({fancy_id:l.market_id,match_id:l.match_id,bet_result_id:l.bet_result_id+""}).subscribe((function(l){n.loading=!1,l.error?n.toastr.errorToastr(l.message):(n.getAllMatches(),n.message=l.message,n.toastr.successToastr(l.message))}),(function(l){n.loading=!1}))},l.prototype.fancyRollbackAbondon=function(l){var n=this;this.sportservice.abandonedFancy({fancyID:l.market_id,is_rollback:1}).subscribe((function(l){n.loading=!1,l.error?n.toastr.errorToastr(l.message):(n.getAllMatches(),n.message=l.message,n.toastr.successToastr(l.message))}),(function(l){n.loading=!1}))},l}(),p=t("3EpR"),d=e.ob({encapsulation:0,styles:[[""]],data:{}});function b(l){return e.Jb(0,[(l()(),e.qb(0,0,null,null,3,"option",[],[[8,"selected",0]],null,null,null,null)),e.pb(1,147456,null,0,r.q,[e.k,e.E,[2,r.u]],{value:[0,"value"]},null),e.pb(2,147456,null,0,r.B,[e.k,e.E,[8,null]],{value:[0,"value"]},null),(l()(),e.Hb(3,null,[" "," "]))],(function(l,n){l(n,1,0,n.context.$implicit.sport_id),l(n,2,0,n.context.$implicit.sport_id)}),(function(l,n){l(n,0,0,n.context.$implicit.sport_id==n.component.sportByFliter),l(n,3,0,n.context.$implicit.name)}))}function h(l){return e.Jb(0,[(l()(),e.qb(0,0,null,null,21,"tr",[],null,null,null,null,null)),(l()(),e.qb(1,0,null,null,1,"td",[],null,null,null,null,null)),(l()(),e.Hb(2,null,["",""])),(l()(),e.qb(3,0,null,null,1,"td",[],null,null,null,null,null)),(l()(),e.Hb(4,null,["",""])),(l()(),e.qb(5,0,null,null,1,"td",[],null,null,null,null,null)),(l()(),e.Hb(6,null,["",""])),(l()(),e.qb(7,0,null,null,1,"td",[],null,null,null,null,null)),(l()(),e.Hb(8,null,["",""])),(l()(),e.qb(9,0,null,null,1,"td",[],null,null,null,null,null)),(l()(),e.Hb(10,null,["",""])),(l()(),e.qb(11,0,null,null,1,"td",[],null,null,null,null,null)),(l()(),e.Hb(12,null,["",""])),(l()(),e.qb(13,0,null,null,1,"td",[],null,null,null,null,null)),(l()(),e.Hb(14,null,["",""])),(l()(),e.qb(15,0,null,null,2,"td",[],null,null,null,null,null)),(l()(),e.Hb(16,null,["",""])),e.Db(17,2),(l()(),e.qb(18,0,null,null,3,"td",[],null,null,null,null,null)),(l()(),e.qb(19,0,null,null,2,"span",[["class","table_icon"]],null,null,null,null,null)),(l()(),e.qb(20,0,null,null,1,"button",[["class","btn-info"]],null,[[null,"click"]],(function(l,n,t){var e=!0;return"click"===n&&(e=!1!==l.component.rollBackMatch(l.context.$implicit)&&e),e}),null,null)),(l()(),e.Hb(-1,null,["Rollback"]))],null,(function(l,n){var t=n.component;l(n,2,0,(t.page-1)*t.config.itemsPerPage+n.context.index+1),l(n,4,0,n.context.$implicit.sport_name),l(n,6,0,n.context.$implicit.series_name),l(n,8,0,n.context.$implicit.match_name),l(n,10,0,n.context.$implicit.market_name),l(n,12,0,n.context.$implicit.market_id),l(n,14,0,n.context.$implicit.selection_name);var u=e.Ib(n,16,0,l(n,17,0,e.Ab(n.parent,0),1e3*n.context.$implicit.created_at,"medium"));l(n,16,0,u)}))}function m(l){return e.Jb(0,[(l()(),e.qb(0,0,null,null,2,null,null,null,null,null,null,null)),(l()(),e.qb(1,0,null,null,1,"pagination-controls",[["class","my-pagination"]],null,[[null,"pageChange"]],(function(l,n,t){var e=!0;return"pageChange"===n&&(e=!1!==l.component.pageChange(t)&&e),e}),s.b,s.a)),e.pb(2,49152,null,0,a.c,[],null,{pageChange:"pageChange"})],null,null)}function f(l){return e.Jb(0,[(l()(),e.qb(0,0,null,null,3,"div",[["class","row"]],null,null,null,null,null)),(l()(),e.qb(1,0,null,null,2,"div",[["class","col-sm-12"]],null,null,null,null,null)),(l()(),e.hb(16777216,null,null,1,null,m)),e.pb(3,16384,null,0,o.o,[e.P,e.M],{ngIf:[0,"ngIf"]},null)],(function(l,n){l(n,3,0,n.component.config.totalItems>10)}),null)}function y(l){return e.Jb(0,[(l()(),e.qb(0,0,null,null,1,"div",[["style","color: white"]],null,null,null,null,null)),(l()(),e.Hb(-1,null,[" No Record Found "]))],null,null)}function v(l){return e.Jb(0,[e.Bb(0,o.e,[e.u]),(l()(),e.qb(1,0,null,null,83,"div",[["class","right_bodyarea"]],null,null,null,null,null)),(l()(),e.qb(2,0,null,null,82,"div",[["class","right_bodyareainner"]],null,null,null,null,null)),(l()(),e.qb(3,0,null,null,2,"div",[["class","body_heading"]],null,null,null,null,null)),(l()(),e.qb(4,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Match Rollback"])),(l()(),e.qb(6,0,null,null,46,"div",[["class","row"]],null,null,null,null,null)),(l()(),e.qb(7,0,null,null,15,"div",[["class","col-lg-2 col-sm-4"]],null,null,null,null,null)),(l()(),e.qb(8,0,null,null,14,"div",[["class","form-group"]],null,null,null,null,null)),(l()(),e.qb(9,0,null,null,1,"label",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Sport Name"])),(l()(),e.qb(11,0,null,null,11,"select",[["class","form-control inputCrl"]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"ngModelChange"],[null,"change"],[null,"blur"]],(function(l,n,t){var u=!0,i=l.component;return"change"===n&&(u=!1!==e.Ab(l,12).onChange(t.target.value)&&u),"blur"===n&&(u=!1!==e.Ab(l,12).onTouched()&&u),"ngModelChange"===n&&(u=!1!==(i.sportByFliter=t)&&u),"change"===n&&(u=!1!==i.getAllMatches()&&u),u}),null,null)),e.pb(12,16384,null,0,r.u,[e.E,e.k],null,null),e.Eb(1024,null,r.k,(function(l){return[l]}),[r.u]),e.pb(14,671744,null,0,r.p,[[8,null],[8,null],[8,null],[6,r.k]],{model:[0,"model"]},{update:"ngModelChange"}),e.Eb(2048,null,r.l,null,[r.p]),e.pb(16,16384,null,0,r.m,[[4,r.l]],null,null),(l()(),e.qb(17,0,null,null,3,"option",[],null,null,null,null,null)),e.pb(18,147456,null,0,r.q,[e.k,e.E,[2,r.u]],null,null),e.pb(19,147456,null,0,r.B,[e.k,e.E,[8,null]],null,null),(l()(),e.Hb(-1,null,["Please Select Sport"])),(l()(),e.hb(16777216,null,null,1,null,b)),e.pb(22,278528,null,0,o.n,[e.P,e.M,e.s],{ngForOf:[0,"ngForOf"]},null),(l()(),e.qb(23,0,null,null,9,"div",[["class","col-lg-3 col-sm-6"]],null,null,null,null,null)),(l()(),e.qb(24,0,null,null,8,"div",[["class","form-group"]],null,null,null,null,null)),(l()(),e.qb(25,0,null,null,1,"label",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Match Name"])),(l()(),e.qb(27,0,null,null,5,"input",[["class","form-control"],["placeholder","Match Name"],["type","text"]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"ngModelChange"],[null,"keyup"],[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],(function(l,n,t){var u=!0,i=l.component;return"input"===n&&(u=!1!==e.Ab(l,28)._handleInput(t.target.value)&&u),"blur"===n&&(u=!1!==e.Ab(l,28).onTouched()&&u),"compositionstart"===n&&(u=!1!==e.Ab(l,28)._compositionStart()&&u),"compositionend"===n&&(u=!1!==e.Ab(l,28)._compositionEnd(t.target.value)&&u),"ngModelChange"===n&&(u=!1!==(i.matchName=t)&&u),"keyup"===n&&(u=!1!==i.getAllMatches()&&u),u}),null,null)),e.pb(28,16384,null,0,r.d,[e.E,e.k,[2,r.a]],null,null),e.Eb(1024,null,r.k,(function(l){return[l]}),[r.d]),e.pb(30,671744,null,0,r.p,[[8,null],[8,null],[8,null],[6,r.k]],{model:[0,"model"]},{update:"ngModelChange"}),e.Eb(2048,null,r.l,null,[r.p]),e.pb(32,16384,null,0,r.m,[[4,r.l]],null,null),(l()(),e.qb(33,0,null,null,9,"div",[["class","col-lg-3 col-sm-6"]],null,null,null,null,null)),(l()(),e.qb(34,0,null,null,8,"div",[["class","form-group"]],null,null,null,null,null)),(l()(),e.qb(35,0,null,null,1,"label",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Market Name"])),(l()(),e.qb(37,0,null,null,5,"input",[["class","form-control"],["placeholder","Market Name"],["type","text"]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"ngModelChange"],[null,"keyup"],[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],(function(l,n,t){var u=!0,i=l.component;return"input"===n&&(u=!1!==e.Ab(l,38)._handleInput(t.target.value)&&u),"blur"===n&&(u=!1!==e.Ab(l,38).onTouched()&&u),"compositionstart"===n&&(u=!1!==e.Ab(l,38)._compositionStart()&&u),"compositionend"===n&&(u=!1!==e.Ab(l,38)._compositionEnd(t.target.value)&&u),"ngModelChange"===n&&(u=!1!==(i.marketName=t)&&u),"keyup"===n&&(u=!1!==i.getAllMatches()&&u),u}),null,null)),e.pb(38,16384,null,0,r.d,[e.E,e.k,[2,r.a]],null,null),e.Eb(1024,null,r.k,(function(l){return[l]}),[r.d]),e.pb(40,671744,null,0,r.p,[[8,null],[8,null],[8,null],[6,r.k]],{model:[0,"model"]},{update:"ngModelChange"}),e.Eb(2048,null,r.l,null,[r.p]),e.pb(42,16384,null,0,r.m,[[4,r.l]],null,null),(l()(),e.qb(43,0,null,null,9,"div",[["class","col-lg-3 col-sm-6"]],null,null,null,null,null)),(l()(),e.qb(44,0,null,null,8,"div",[["class","form-group"]],null,null,null,null,null)),(l()(),e.qb(45,0,null,null,1,"label",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Market Id"])),(l()(),e.qb(47,0,null,null,5,"input",[["class","form-control"],["placeholder","Market Id"],["type","text"]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"ngModelChange"],[null,"keyup"],[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],(function(l,n,t){var u=!0,i=l.component;return"input"===n&&(u=!1!==e.Ab(l,48)._handleInput(t.target.value)&&u),"blur"===n&&(u=!1!==e.Ab(l,48).onTouched()&&u),"compositionstart"===n&&(u=!1!==e.Ab(l,48)._compositionStart()&&u),"compositionend"===n&&(u=!1!==e.Ab(l,48)._compositionEnd(t.target.value)&&u),"ngModelChange"===n&&(u=!1!==(i.marketId=t)&&u),"keyup"===n&&(u=!1!==i.getAllMatches()&&u),u}),null,null)),e.pb(48,16384,null,0,r.d,[e.E,e.k,[2,r.a]],null,null),e.Eb(1024,null,r.k,(function(l){return[l]}),[r.d]),e.pb(50,671744,null,0,r.p,[[8,null],[8,null],[8,null],[6,r.k]],{model:[0,"model"]},{update:"ngModelChange"}),e.Eb(2048,null,r.l,null,[r.p]),e.pb(52,16384,null,0,r.m,[[4,r.l]],null,null),(l()(),e.qb(53,0,null,null,27,"div",[["class","row"]],null,null,null,null,null)),(l()(),e.qb(54,0,null,null,26,"div",[["class","col-sm-12"]],null,null,null,null,null)),(l()(),e.qb(55,0,null,null,25,"div",[["class","usertable_area"]],null,null,null,null,null)),(l()(),e.qb(56,0,null,null,24,"div",[["class","table-responsive"]],null,null,null,null,null)),(l()(),e.qb(57,0,null,null,23,"table",[["class","table"]],null,null,null,null,null)),(l()(),e.qb(58,0,null,null,22,"tbody",[],null,null,null,null,null)),(l()(),e.qb(59,0,null,null,18,"tr",[],null,null,null,null,null)),(l()(),e.qb(60,0,null,null,1,"th",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["S No."])),(l()(),e.qb(62,0,null,null,1,"th",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Sport Name"])),(l()(),e.qb(64,0,null,null,1,"th",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Series Name"])),(l()(),e.qb(66,0,null,null,1,"th",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Match Name"])),(l()(),e.qb(68,0,null,null,1,"th",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Market Name"])),(l()(),e.qb(70,0,null,null,1,"th",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Market Id"])),(l()(),e.qb(72,0,null,null,1,"th",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Selection Name"])),(l()(),e.qb(74,0,null,null,1,"th",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Date"])),(l()(),e.qb(76,0,null,null,1,"th",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Action"])),(l()(),e.hb(16777216,null,null,2,null,h)),e.pb(79,278528,null,0,o.n,[e.P,e.M,e.s],{ngForOf:[0,"ngForOf"],ngForTrackBy:[1,"ngForTrackBy"]},null),e.Bb(0,a.b,[a.e]),(l()(),e.hb(16777216,null,null,1,null,f)),e.pb(82,16384,null,0,o.o,[e.P,e.M],{ngIf:[0,"ngIf"]},null),(l()(),e.hb(16777216,null,null,1,null,y)),e.pb(84,16384,null,0,o.o,[e.P,e.M],{ngIf:[0,"ngIf"]},null)],(function(l,n){var t=n.component;l(n,14,0,t.sportByFliter),l(n,22,0,t.sportData),l(n,30,0,t.matchName),l(n,40,0,t.marketName),l(n,50,0,t.marketId),l(n,79,0,e.Ib(n,79,0,e.Ab(n,80).transform(t.declaredMarkets,t.config)),t.trackByFn),l(n,82,0,null!=t.declaredMarkets),l(n,84,0,""==t.declaredMarkets)}),(function(l,n){l(n,11,0,e.Ab(n,16).ngClassUntouched,e.Ab(n,16).ngClassTouched,e.Ab(n,16).ngClassPristine,e.Ab(n,16).ngClassDirty,e.Ab(n,16).ngClassValid,e.Ab(n,16).ngClassInvalid,e.Ab(n,16).ngClassPending),l(n,27,0,e.Ab(n,32).ngClassUntouched,e.Ab(n,32).ngClassTouched,e.Ab(n,32).ngClassPristine,e.Ab(n,32).ngClassDirty,e.Ab(n,32).ngClassValid,e.Ab(n,32).ngClassInvalid,e.Ab(n,32).ngClassPending),l(n,37,0,e.Ab(n,42).ngClassUntouched,e.Ab(n,42).ngClassTouched,e.Ab(n,42).ngClassPristine,e.Ab(n,42).ngClassDirty,e.Ab(n,42).ngClassValid,e.Ab(n,42).ngClassInvalid,e.Ab(n,42).ngClassPending),l(n,47,0,e.Ab(n,52).ngClassUntouched,e.Ab(n,52).ngClassTouched,e.Ab(n,52).ngClassPristine,e.Ab(n,52).ngClassDirty,e.Ab(n,52).ngClassValid,e.Ab(n,52).ngClassInvalid,e.Ab(n,52).ngClassPending)}))}function k(l){return e.Jb(0,[(l()(),e.qb(0,0,null,null,1,"app-match-rollback",[],null,null,null,v,d)),e.pb(1,114688,null,0,g,[c.a,p.a],null,null)],(function(l,n){l(n,1,0)}),null)}var A=e.mb("app-match-rollback",g,k,{},{},[]),P=t("fnxe"),C=t("ZYCi"),I=function(){return function(){}}();t.d(n,"MatchRollbackModuleNgFactory",(function(){return _}));var _=e.nb(u,[],(function(l){return e.xb([e.yb(512,e.j,e.cb,[[8,[i.a,A]],[3,e.j],e.x]),e.yb(4608,o.q,o.p,[e.u,[2,o.D]]),e.yb(4608,P.b,P.b,[]),e.yb(4608,a.e,a.e,[]),e.yb(4608,r.z,r.z,[]),e.yb(4608,r.e,r.e,[]),e.yb(1073742336,o.c,o.c,[]),e.yb(1073742336,C.m,C.m,[[2,C.s],[2,C.k]]),e.yb(1073742336,I,I,[]),e.yb(1073742336,P.a,P.a,[]),e.yb(1073742336,a.a,a.a,[]),e.yb(1073742336,r.w,r.w,[]),e.yb(1073742336,r.i,r.i,[]),e.yb(1073742336,r.s,r.s,[]),e.yb(1073742336,u,u,[]),e.yb(1024,C.i,(function(){return[[{path:"",component:g}]]}),[])])}))},fnxe:function(l,n,t){"use strict";t.d(n,"a",(function(){return u})),t.d(n,"b",(function(){return e}));class e{static isString(l){return"string"==typeof l||l instanceof String}static caseInsensitiveSort(l,n){return e.isString(l)&&e.isString(n)?l.localeCompare(n):e.defaultCompare(l,n)}static defaultCompare(l,n){return l&&l instanceof Date&&(l=l.getTime()),n&&n instanceof Date&&(n=n.getTime()),l===n?0:null==l?1:null==n?-1:l>n?1:-1}static parseExpression(l){return(l=(l=l.replace(/\[(\w+)\]/g,".$1")).replace(/^\./,"")).split(".")}static getValue(l,n){for(let t=0,e=n.length;t<e;++t){if(!l)return;const e=n[t];if(!(e in l))return;l="function"==typeof l[e]?l[e]():l[e]}return l}static setValue(l,n,t){let e;for(e=0;e<t.length-1;e++)l=l[t[e]];l[t[e]]=n}transform(l,n,t,e=!1,u){return l?Array.isArray(n)?this.multiExpressionTransform(l,n,t,e,u):Array.isArray(l)?this.sortArray(l.slice(),n,t,e,u):"object"==typeof l?this.transformObject(Object.assign({},l),n,t,e,u):l:l}sortArray(l,n,t,u,i){const r=n&&-1!==n.indexOf(".");let s;r&&(n=e.parseExpression(n)),s=i&&"function"==typeof i?i:u?e.caseInsensitiveSort:e.defaultCompare;const a=l.sort((l,t)=>n?r?s(e.getValue(l,n),e.getValue(t,n)):l&&t?s(l[n],t[n]):s(l,t):s(l,t));return t?a.reverse():a}transformObject(l,n,t,u,i){const r=e.parseExpression(n);let s=r.pop(),a=e.getValue(l,r);return Array.isArray(a)||(r.push(s),s=null,a=e.getValue(l,r)),a?(e.setValue(l,this.transform(a,s,t,u),r),l):l}multiExpressionTransform(l,n,t,e=!1,u){return n.reverse().reduce((l,n)=>this.transform(l,n,t,e,u),l)}}class u{}},xkgV:function(l,n,t){"use strict";t.d(n,"a",(function(){return c})),t.d(n,"e",(function(){return u})),t.d(n,"c",(function(){return a})),t.d(n,"d",(function(){return o})),t.d(n,"b",(function(){return r}));var e=t("CcnG"),u=function(){function l(){this.change=new e.m,this.instances={},this.DEFAULT_ID="DEFAULT_PAGINATION_ID"}return l.prototype.defaultId=function(){return this.DEFAULT_ID},l.prototype.register=function(l){null==l.id&&(l.id=this.DEFAULT_ID),this.instances[l.id]?this.updateInstance(l)&&this.change.emit(l.id):(this.instances[l.id]=l,this.change.emit(l.id))},l.prototype.updateInstance=function(l){var n=!1;for(var t in this.instances[l.id])l[t]!==this.instances[l.id][t]&&(this.instances[l.id][t]=l[t],n=!0);return n},l.prototype.getCurrentPage=function(l){if(this.instances[l])return this.instances[l].currentPage},l.prototype.setCurrentPage=function(l,n){if(this.instances[l]){var t=this.instances[l];n<=Math.ceil(t.totalItems/t.itemsPerPage)&&1<=n&&(this.instances[l].currentPage=n,this.change.emit(l))}},l.prototype.setTotalItems=function(l,n){this.instances[l]&&0<=n&&(this.instances[l].totalItems=n,this.change.emit(l))},l.prototype.setItemsPerPage=function(l,n){this.instances[l]&&(this.instances[l].itemsPerPage=n,this.change.emit(l))},l.prototype.getInstance=function(l){return void 0===l&&(l=this.DEFAULT_ID),this.instances[l]?this.clone(this.instances[l]):{}},l.prototype.clone=function(l){var n={};for(var t in l)l.hasOwnProperty(t)&&(n[t]=l[t]);return n},l}(),i=Number.MAX_SAFE_INTEGER,r=function(){function l(l){this.service=l,this.state={}}return l.prototype.transform=function(l,n){if(!(l instanceof Array)){var t=n.id||this.service.defaultId();return this.state[t]?this.state[t].slice:l}var e,u,r=n.totalItems&&n.totalItems!==l.length,s=this.createInstance(l,n),a=s.id,o=s.itemsPerPage;if(this.service.register(s),!r&&l instanceof Array){if(this.stateIsIdentical(a,l,e=(s.currentPage-1)*(o=+o||i),u=e+o))return this.state[a].slice;var c=l.slice(e,u);return this.saveState(a,l,c,e,u),this.service.change.emit(a),c}return this.saveState(a,l,l,e,u),l},l.prototype.createInstance=function(l,n){return this.checkConfig(n),{id:null!=n.id?n.id:this.service.defaultId(),itemsPerPage:+n.itemsPerPage||0,currentPage:+n.currentPage||1,totalItems:+n.totalItems||l.length}},l.prototype.checkConfig=function(l){var n=["itemsPerPage","currentPage"].filter((function(n){return!(n in l)}));if(0<n.length)throw new Error("PaginatePipe: Argument is missing the following required properties: "+n.join(", "))},l.prototype.saveState=function(l,n,t,e,u){this.state[l]={collection:n,size:n.length,slice:t,start:e,end:u}},l.prototype.stateIsIdentical=function(l,n,t,e){var u=this.state[l];return!!u&&!(u.size!==n.length||u.start!==t||u.end!==e)&&u.slice.every((function(l,e){return l===n[t+e]}))},l}();function s(l){return!!l&&"false"!==l}var a=function(){function l(){this.maxSize=7,this.previousLabel="Previous",this.nextLabel="Next",this.screenReaderPaginationLabel="Pagination",this.screenReaderPageLabel="page",this.screenReaderCurrentLabel="You're on page",this.pageChange=new e.m,this._directionLinks=!0,this._autoHide=!1,this._responsive=!1}return Object.defineProperty(l.prototype,"directionLinks",{get:function(){return this._directionLinks},set:function(l){this._directionLinks=s(l)},enumerable:!0,configurable:!0}),Object.defineProperty(l.prototype,"autoHide",{get:function(){return this._autoHide},set:function(l){this._autoHide=s(l)},enumerable:!0,configurable:!0}),Object.defineProperty(l.prototype,"responsive",{get:function(){return this._responsive},set:function(l){this._responsive=s(l)},enumerable:!0,configurable:!0}),l}(),o=function(){function l(l,n){var t=this;this.service=l,this.changeDetectorRef=n,this.maxSize=7,this.pageChange=new e.m,this.pages=[],this.changeSub=this.service.change.subscribe((function(l){t.id===l&&(t.updatePageLinks(),t.changeDetectorRef.markForCheck(),t.changeDetectorRef.detectChanges())}))}return l.prototype.ngOnInit=function(){void 0===this.id&&(this.id=this.service.defaultId()),this.updatePageLinks()},l.prototype.ngOnChanges=function(l){this.updatePageLinks()},l.prototype.ngOnDestroy=function(){this.changeSub.unsubscribe()},l.prototype.previous=function(){this.checkValidId(),this.setCurrent(this.getCurrent()-1)},l.prototype.next=function(){this.checkValidId(),this.setCurrent(this.getCurrent()+1)},l.prototype.isFirstPage=function(){return 1===this.getCurrent()},l.prototype.isLastPage=function(){return this.getLastPage()===this.getCurrent()},l.prototype.setCurrent=function(l){this.pageChange.emit(l)},l.prototype.getCurrent=function(){return this.service.getCurrentPage(this.id)},l.prototype.getLastPage=function(){var l=this.service.getInstance(this.id);return l.totalItems<1?1:Math.ceil(l.totalItems/l.itemsPerPage)},l.prototype.getTotalItems=function(){return this.service.getInstance(this.id).totalItems},l.prototype.checkValidId=function(){null==this.service.getInstance(this.id).id&&console.warn('PaginationControlsDirective: the specified id "'+this.id+'" does not match any registered PaginationInstance')},l.prototype.updatePageLinks=function(){var l=this,n=this.service.getInstance(this.id),t=this.outOfBoundCorrection(n);t!==n.currentPage?setTimeout((function(){l.setCurrent(t),l.pages=l.createPageArray(n.currentPage,n.itemsPerPage,n.totalItems,l.maxSize)})):this.pages=this.createPageArray(n.currentPage,n.itemsPerPage,n.totalItems,this.maxSize)},l.prototype.outOfBoundCorrection=function(l){var n=Math.ceil(l.totalItems/l.itemsPerPage);return n<l.currentPage&&0<n?n:l.currentPage<1?1:l.currentPage},l.prototype.createPageArray=function(l,n,t,e){e=+e;for(var u=[],i=Math.ceil(t/n),r=Math.ceil(e/2),s=l<=r,a=i-r<l,o=!s&&!a,c=e<i,g=1;g<=i&&g<=e;){var p=this.calculatePageNumber(g,l,e,i);u.push({label:c&&(2===g&&(o||a)||g===e-1&&(o||s))?"...":p,value:p}),g++}return u},l.prototype.calculatePageNumber=function(l,n,t,e){var u=Math.ceil(t/2);return l===t?e:1===l?l:t<e?e-u<n?e-t+l:u<n?n-u+l:l:l},l}(),c=function(){return function(){}}()}}]);