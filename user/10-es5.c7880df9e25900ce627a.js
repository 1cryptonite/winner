(window.webpackJsonp=window.webpackJsonp||[]).push([[10],{"38yd":function(e,t,r){"use strict";r.r(t);var n=r("CcnG"),a=function(){return function(){}}(),s=r("pMnS"),i=r("x0OW"),o=r("Ip0R"),u=r("fnxe"),c=r("3EpR"),l=r("VfKn"),f=r("t/Na"),p=r("hWNM"),b=r("PtJW"),g=r("ZYCi"),d=function(){return function(){}}();r.d(t,"DashmainModuleNgFactory",function(){return h});var h=n.sb(a,[],function(e){return n.Cb([n.Db(512,n.l,n.fb,[[8,[s.a,i.a]],[3,n.l],n.A]),n.Db(4608,o.o,o.n,[n.x,[2,o.B]]),n.Db(4608,u.b,u.b,[]),n.Db(4608,c.d,c.d,[]),n.Db(4608,c.a,c.a,[n.g,n.l,n.t,n.C,c.d]),n.Db(4608,l.a,l.a,[f.c,p.a,b.a]),n.Db(1073742336,o.c,o.c,[]),n.Db(1073742336,g.m,g.m,[[2,g.r],[2,g.l]]),n.Db(1073742336,d,d,[]),n.Db(1073742336,u.a,u.a,[]),n.Db(1073742336,c.b,c.b,[]),n.Db(1073742336,a,a,[]),n.Db(1024,g.j,function(){return[[{path:"exchange",loadChildren:"src/app/Views/Pages/exchange/exchange.module#ExchangeModule"},{path:"brino-casino",loadChildren:"src/app/Views/Pages/virtual-games/virtual-games.module#VirtualGamesModule"},{path:"",redirectTo:"/exchange",pathMatch:"full"}]]},[])])})},fnxe:function(e,t,r){"use strict";r.d(t,"a",function(){return a}),r.d(t,"b",function(){return n});const n=(()=>{class e{static isString(e){return"string"==typeof e||e instanceof String}static caseInsensitiveSort(t,r){return e.isString(t)&&e.isString(r)?t.localeCompare(r):e.defaultCompare(t,r)}static defaultCompare(e,t){return e&&e instanceof Date&&(e=e.getTime()),t&&t instanceof Date&&(t=t.getTime()),e===t?0:null==e?1:null==t?-1:e>t?1:-1}static parseExpression(e){return(e=(e=e.replace(/\[(\w+)\]/g,".$1")).replace(/^\./,"")).split(".")}static getValue(e,t){for(let r=0,n=t.length;r<n;++r){if(!e)return;const n=t[r];if(!(n in e))return;e="function"==typeof e[n]?e[n]():e[n]}return e}static setValue(e,t,r){let n;for(n=0;n<r.length-1;n++)e=e[r[n]];e[r[n]]=t}transform(e,t,r,n=!1,a){return e?Array.isArray(t)?this.multiExpressionTransform(e,t,r,n,a):Array.isArray(e)?this.sortArray(e.slice(),t,r,n,a):"object"==typeof e?this.transformObject(Object.assign({},e),t,r,n,a):e:e}sortArray(t,r,n,a,s){const i=r&&-1!==r.indexOf(".");let o;i&&(r=e.parseExpression(r)),o=s&&"function"==typeof s?s:a?e.caseInsensitiveSort:e.defaultCompare;const u=t.sort((t,n)=>r?i?o(e.getValue(t,r),e.getValue(n,r)):t&&n?o(t[r],n[r]):o(t,n):o(t,n));return n?u.reverse():u}transformObject(t,r,n,a,s){const i=e.parseExpression(r);let o=i.pop(),u=e.getValue(t,i);return Array.isArray(u)||(i.push(o),o=null,u=e.getValue(t,i)),u?(e.setValue(t,this.transform(u,o,n,a),i),t):t}multiExpressionTransform(e,t,r,n=!1,a){return t.reverse().reduce((e,t)=>this.transform(e,t,r,n,a),e)}}return e})(),a=(()=>(class{}))()}}]);