(window.webpackJsonp=window.webpackJsonp||[]).push([[35],{"6+ib":function(l,n,u){"use strict";u.d(n,"a",(function(){return t})),u.d(n,"b",(function(){return i}));var e=u("CcnG"),t=(u("gIcY"),Object(e.V)((function(){return t})),function(){function l(){this.size="medium",this.change=new e.m,this.color="rgb(100, 189, 99)",this.switchOffColor="",this.switchColor="#fff",this.defaultBgColor="#fff",this.defaultBoColor="#dfdfdf",this.labelOn="",this.labelOff="",this.onTouchedCallback=function(l){},this.onChangeCallback=function(l){}}return Object.defineProperty(l.prototype,"checked",{get:function(){return this._checked},set:function(l){this._checked=!1!==l},enumerable:!0,configurable:!0}),Object.defineProperty(l.prototype,"disabled",{get:function(){return this._disabled},set:function(l){this._disabled=!1!==l},enumerable:!0,configurable:!0}),Object.defineProperty(l.prototype,"reverse",{get:function(){return this._reverse},set:function(l){this._reverse=!1!==l},enumerable:!0,configurable:!0}),l.prototype.getColor=function(l){return void 0===l&&(l=""),"borderColor"===l?this.defaultBoColor:"switchColor"===l?this.reverse?this.checked&&this.switchOffColor||this.switchColor:this.checked?this.switchColor:this.switchOffColor||this.switchColor:this.reverse?this.checked?this.defaultBgColor:this.color:this.checked?this.color:this.defaultBgColor},l.prototype.onToggle=function(){this.disabled||(this.checked=!this.checked,this.change.emit(this.checked),this.onChangeCallback(this.checked),this.onTouchedCallback(this.checked))},l.prototype.writeValue=function(l){l!==this.checked&&(this.checked=!!l)},l.prototype.registerOnChange=function(l){this.onChangeCallback=l},l.prototype.registerOnTouched=function(l){this.onTouchedCallback=l},l.prototype.setDisabledState=function(l){this.disabled=l},l}()),i=function(){return function(){}}()},n5cA:function(l,n,u){"use strict";u.r(n);var e=u("CcnG"),t=function(){return function(){}}(),i=u("pMnS"),o=u("gIcY"),a=u("rSXa"),s=u("6+ib"),r=u("Ip0R"),c=u("rpvN"),b=u("cxbk"),d=function(){function l(l,n){this.sportservice=l,this.toastr=n,this.fileToUpload=null,this.fileToUpload1=null}return l.prototype.ngOnInit=function(){this.userDetails=JSON.parse(localStorage.getItem("AdminLoginData")),this.user_id=this.userDetails.user_id,this.getApiData()},l.prototype.handleFileInput1=function(l){this.fileToUpload1=l.item(0)},l.prototype.getApiData=function(){var l=this;this.sportservice.getApiData().subscribe((function(n){n.error||(l.gloabalData=n.data,l.version_code=l.gloabalData.apk_version,l.version_name=l.gloabalData.apk_name,l.update_message=l.gloabalData.message,l.apkUrl=b.a.APIEndpoint+"uploads/"+l.gloabalData.apk_url)}),(function(l){}))},l.prototype.updateApkVersion=function(){var l=this,n=new FormData;n.append("fileApk",this.fileToUpload1),n.append("apk_version",this.version_code),n.append("user_id",this.user_id),n.append("apk_name",this.version_name),n.append("message",this.update_message),n.append("is_active","1"==this.gloabalData.is_active?"0":"1"),this.sportservice.updateApkVersion(n).subscribe((function(n){l.message=n.message,l.getApiData(),l.toastr.successToastr(n.message)}),(function(l){console.log(l)}))},l.prototype.changeIsActiveStatus=function(){var l=this;this.sportservice.changeIsActiveStatus({is_active:"1"==this.gloabalData.is_active?"0":"1"}).subscribe((function(n){l.message=n.message,l.getApiData(),l.toastr.successToastr(n.message)}),(function(l){console.log(l)}))},l}(),p=u("3EpR"),g=e.ob({encapsulation:0,styles:[[""]],data:{}});function h(l){return e.Jb(0,[(l()(),e.qb(0,0,null,null,40,"div",[["class","change_passadmin"]],null,null,null,null,null)),(l()(),e.qb(1,0,null,null,10,"div",[["class","form-group  "]],null,null,null,null,null)),(l()(),e.qb(2,0,null,null,1,"label",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Version Code "])),(l()(),e.qb(4,0,null,null,7,"input",[["aria-invalid","true"],["class","input-box form-control"],["name","newpassword"],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"ngModelChange"],[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],(function(l,n,u){var t=!0,i=l.component;return"input"===n&&(t=!1!==e.Ab(l,5)._handleInput(u.target.value)&&t),"blur"===n&&(t=!1!==e.Ab(l,5).onTouched()&&t),"compositionstart"===n&&(t=!1!==e.Ab(l,5)._compositionStart()&&t),"compositionend"===n&&(t=!1!==e.Ab(l,5)._compositionEnd(u.target.value)&&t),"ngModelChange"===n&&(t=!1!==(i.version_code=u)&&t),t}),null,null)),e.pb(5,16384,null,0,o.d,[e.E,e.k,[2,o.a]],null,null),e.pb(6,16384,null,0,o.t,[],{required:[0,"required"]},null),e.Eb(1024,null,o.j,(function(l){return[l]}),[o.t]),e.Eb(1024,null,o.k,(function(l){return[l]}),[o.d]),e.pb(9,671744,null,0,o.p,[[8,null],[6,o.j],[8,null],[6,o.k]],{name:[0,"name"],model:[1,"model"]},{update:"ngModelChange"}),e.Eb(2048,null,o.l,null,[o.p]),e.pb(11,16384,null,0,o.m,[[4,o.l]],null,null),(l()(),e.qb(12,0,null,null,10,"div",[["class","form-group"]],null,null,null,null,null)),(l()(),e.qb(13,0,null,null,1,"label",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Version Name "])),(l()(),e.qb(15,0,null,null,7,"input",[["aria-invalid","true"],["class","input-box form-control"],["name","Renewpassword"],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"ngModelChange"],[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],(function(l,n,u){var t=!0,i=l.component;return"input"===n&&(t=!1!==e.Ab(l,16)._handleInput(u.target.value)&&t),"blur"===n&&(t=!1!==e.Ab(l,16).onTouched()&&t),"compositionstart"===n&&(t=!1!==e.Ab(l,16)._compositionStart()&&t),"compositionend"===n&&(t=!1!==e.Ab(l,16)._compositionEnd(u.target.value)&&t),"ngModelChange"===n&&(t=!1!==(i.version_name=u)&&t),t}),null,null)),e.pb(16,16384,null,0,o.d,[e.E,e.k,[2,o.a]],null,null),e.pb(17,16384,null,0,o.t,[],{required:[0,"required"]},null),e.Eb(1024,null,o.j,(function(l){return[l]}),[o.t]),e.Eb(1024,null,o.k,(function(l){return[l]}),[o.d]),e.pb(20,671744,null,0,o.p,[[8,null],[6,o.j],[8,null],[6,o.k]],{name:[0,"name"],model:[1,"model"]},{update:"ngModelChange"}),e.Eb(2048,null,o.l,null,[o.p]),e.pb(22,16384,null,0,o.m,[[4,o.l]],null,null),(l()(),e.qb(23,0,null,null,10,"div",[["class","form-group"]],null,null,null,null,null)),(l()(),e.qb(24,0,null,null,1,"label",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Update Message "])),(l()(),e.qb(26,0,null,null,7,"input",[["aria-invalid","true"],["class","input-box form-control"],["name","Renewpassword"],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"ngModelChange"],[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],(function(l,n,u){var t=!0,i=l.component;return"input"===n&&(t=!1!==e.Ab(l,27)._handleInput(u.target.value)&&t),"blur"===n&&(t=!1!==e.Ab(l,27).onTouched()&&t),"compositionstart"===n&&(t=!1!==e.Ab(l,27)._compositionStart()&&t),"compositionend"===n&&(t=!1!==e.Ab(l,27)._compositionEnd(u.target.value)&&t),"ngModelChange"===n&&(t=!1!==(i.update_message=u)&&t),t}),null,null)),e.pb(27,16384,null,0,o.d,[e.E,e.k,[2,o.a]],null,null),e.pb(28,16384,null,0,o.t,[],{required:[0,"required"]},null),e.Eb(1024,null,o.j,(function(l){return[l]}),[o.t]),e.Eb(1024,null,o.k,(function(l){return[l]}),[o.d]),e.pb(31,671744,null,0,o.p,[[8,null],[6,o.j],[8,null],[6,o.k]],{name:[0,"name"],model:[1,"model"]},{update:"ngModelChange"}),e.Eb(2048,null,o.l,null,[o.p]),e.pb(33,16384,null,0,o.m,[[4,o.l]],null,null),(l()(),e.qb(34,0,null,null,3,"div",[["class","form-group"]],null,null,null,null,null)),(l()(),e.qb(35,0,null,null,1,"label",[["for","file"]],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Apk "])),(l()(),e.qb(37,0,null,null,0,"input",[["id","file1"],["type","file"]],null,[[null,"change"]],(function(l,n,u){var e=!0;return"change"===n&&(e=!1!==l.component.handleFileInput1(u.target.files)&&e),e}),null,null)),(l()(),e.qb(38,0,null,null,2,"div",[["class","form-group text-right"]],null,null,null,null,null)),(l()(),e.qb(39,0,null,null,1,"button",[["class","btn btn-primary"],["type","submit"]],null,[[null,"click"]],(function(l,n,u){var e=!0;return"click"===n&&(e=!1!==l.component.updateApkVersion()&&e),e}),null,null)),(l()(),e.Hb(-1,null,["Submit"]))],(function(l,n){var u=n.component;l(n,6,0,""),l(n,9,0,"newpassword",u.version_code),l(n,17,0,""),l(n,20,0,"Renewpassword",u.version_name),l(n,28,0,""),l(n,31,0,"Renewpassword",u.update_message)}),(function(l,n){l(n,4,0,e.Ab(n,6).required?"":null,e.Ab(n,11).ngClassUntouched,e.Ab(n,11).ngClassTouched,e.Ab(n,11).ngClassPristine,e.Ab(n,11).ngClassDirty,e.Ab(n,11).ngClassValid,e.Ab(n,11).ngClassInvalid,e.Ab(n,11).ngClassPending),l(n,15,0,e.Ab(n,17).required?"":null,e.Ab(n,22).ngClassUntouched,e.Ab(n,22).ngClassTouched,e.Ab(n,22).ngClassPristine,e.Ab(n,22).ngClassDirty,e.Ab(n,22).ngClassValid,e.Ab(n,22).ngClassInvalid,e.Ab(n,22).ngClassPending),l(n,26,0,e.Ab(n,28).required?"":null,e.Ab(n,33).ngClassUntouched,e.Ab(n,33).ngClassTouched,e.Ab(n,33).ngClassPristine,e.Ab(n,33).ngClassDirty,e.Ab(n,33).ngClassValid,e.Ab(n,33).ngClassInvalid,e.Ab(n,33).ngClassPending)}))}function f(l){return e.Jb(0,[(l()(),e.qb(0,0,null,null,11,"div",[["class","right_bodyareainner"]],null,null,null,null,null)),(l()(),e.qb(1,0,null,null,6,"div",[["class","body_heading"]],null,null,null,null,null)),(l()(),e.qb(2,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),e.Hb(-1,null,["Apk Setting"])),(l()(),e.qb(4,0,null,null,3,"span",[["style","float: right; margin-top: -20px;\n"]],null,null,null,null,null)),(l()(),e.qb(5,0,null,null,2,"ui-switch",[["size","small"]],null,[[null,"click"]],(function(l,n,u){var t=!0,i=l.component;return"click"===n&&(t=!1!==e.Ab(l,7).onToggle()&&t),"click"===n&&(t=!1!==i.changeIsActiveStatus()&&t),t}),a.b,a.a)),e.Eb(5120,null,o.k,(function(l){return[l]}),[s.a]),e.pb(7,49152,null,0,s.a,[],{size:[0,"size"],checked:[1,"checked"]},null),(l()(),e.qb(8,0,null,null,3,"div",[["class","row"]],null,null,null,null,null)),(l()(),e.qb(9,0,null,null,2,"div",[["class","col-sm-12"]],null,null,null,null,null)),(l()(),e.hb(16777216,null,null,1,null,h)),e.pb(11,16384,null,0,r.o,[e.P,e.M],{ngIf:[0,"ngIf"]},null)],(function(l,n){var u=n.component;l(n,7,0,"small","1"==u.gloabalData.is_active),l(n,11,0,null!=u.gloabalData)}),null)}function m(l){return e.Jb(0,[(l()(),e.qb(0,0,null,null,2,"div",[["class","right_bodyarea old-data-form2 "]],null,null,null,null,null)),(l()(),e.hb(16777216,null,null,1,null,f)),e.pb(2,16384,null,0,r.o,[e.P,e.M],{ngIf:[0,"ngIf"]},null)],(function(l,n){l(n,2,0,null!=n.component.gloabalData)}),null)}function y(l){return e.Jb(0,[(l()(),e.qb(0,0,null,null,1,"app-apk-setting",[],null,null,null,m,g)),e.pb(1,114688,null,0,d,[c.a,p.a],null,null)],(function(l,n){l(n,1,0)}),null)}var v=e.mb("app-apk-setting",d,y,{},{},[]),C=u("atuK"),k=u("fnxe"),A=u("xkgV"),_=u("NJnL"),q=u("lqqz"),w=u("ARl4"),D=u("ZYCi"),I=function(){return function(){}}(),E=u("VQoA");u.d(n,"ApkSettingModuleNgFactory",(function(){return T}));var T=e.nb(t,[],(function(l){return e.xb([e.yb(512,e.j,e.cb,[[8,[i.a,v,C.b,C.c,C.d,C.a]],[3,e.j],e.x]),e.yb(4608,r.q,r.p,[e.u,[2,r.D]]),e.yb(4608,k.b,k.b,[]),e.yb(4608,o.z,o.z,[]),e.yb(4608,o.e,o.e,[]),e.yb(4608,A.e,A.e,[]),e.yb(4608,_.a,_.a,[e.F,e.B]),e.yb(4608,q.a,q.a,[e.j,e.z,e.q,_.a,e.g]),e.yb(4608,w.w,w.w,[]),e.yb(4608,w.y,w.y,[]),e.yb(4608,w.a,w.a,[]),e.yb(4608,w.e,w.e,[]),e.yb(4608,w.c,w.c,[]),e.yb(4608,w.f,w.f,[]),e.yb(4608,w.x,w.x,[w.y,w.f]),e.yb(4608,w.h,w.h,[]),e.yb(1073742336,r.c,r.c,[]),e.yb(1073742336,D.m,D.m,[[2,D.s],[2,D.k]]),e.yb(1073742336,I,I,[]),e.yb(1073742336,k.a,k.a,[]),e.yb(1073742336,o.w,o.w,[]),e.yb(1073742336,o.i,o.i,[]),e.yb(1073742336,o.s,o.s,[]),e.yb(1073742336,s.b,s.b,[]),e.yb(1073742336,A.a,A.a,[]),e.yb(1073742336,w.d,w.d,[]),e.yb(1073742336,w.i,w.i,[]),e.yb(1073742336,E.b,E.b,[]),e.yb(1073742336,E.h,E.h,[]),e.yb(1073742336,E.e,E.e,[]),e.yb(1073742336,E.c,E.c,[]),e.yb(1073742336,E.f,E.f,[]),e.yb(1073742336,E.d,E.d,[]),e.yb(1073742336,E.g,E.g,[]),e.yb(1073742336,t,t,[]),e.yb(1024,D.i,(function(){return[[{path:"",component:d}]]}),[])])}))}}]);