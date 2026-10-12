/* Charge le jeu complet dans Node et expose tout en global. Usage : require('./harness') */
const noop=()=>{};
function El(){return{style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
 appendChild:noop,remove:noop,set innerHTML(v){this._h=String(v)},get innerHTML(){return this._h||''},
 querySelectorAll:()=>[],querySelector:()=>null,dataset:{},addEventListener:noop,setAttribute:noop,
 getBoundingClientRect:()=>({left:0,top:0,width:10,height:10}),offsetWidth:1,textContent:'',value:'',children:[],firstChild:{remove:noop},className:''};}
global.document={addEventListener:noop,getElementById:()=>El(),createElement:()=>El(),
 documentElement:{style:{setProperty:noop}},head:{appendChild:noop},body:El(),readyState:'complete',
 querySelectorAll:()=>[],querySelector:()=>null,hidden:false};
global.window={addEventListener:noop};global.navigator={};global.Image=function(){};
global.URL={createObjectURL:()=>''};global.Blob=function(){};global.requestAnimationFrame=f=>0;
global.setTimeout=()=>0;global.setInterval=()=>0;global.clearInterval=noop;global.clearTimeout=noop;
const fs=require('fs'), vm=require('vm');
const ORDER=fs.readFileSync(__dirname+'/build.py','utf8').match(/ORDER = \[([\s\S]*?)\]/)[1]
  .split(',').map(x=>x.trim().replace(/'/g,'')).filter(Boolean);
/* on remplace let/const de premier niveau par var pour que tout atterrisse en global */
const code = ORDER.map(f=>fs.readFileSync(__dirname+'/src/'+f,'utf8')).join('\n')
  .replace(/^(let|const) /gm,'var ');
vm.runInThisContext(code);
S = newState();
module.exports = global;
