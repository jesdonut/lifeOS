const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const MS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const HOURS=[]; const HLABELS=[];
for(let h=4;h<=23;h++){HOURS.push(h);HLABELS.push(h<12?h+'am':h===12?'12pm':(h-12)+'pm');}

const PALETTE=['#2d5a3d','#2c4a6e','#8b2c2c','#8b5e3c','#5a3c7a','#7a6830','#3c6b6b','#888888'];
function buildSwatches(inputId,selected){
  return '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px">'+
    PALETTE.map(function(c){
      return '<span onclick="selectSwatch(\''+c+'\',\''+inputId+'\')" data-swatch="'+inputId+'" data-color="'+c+'" style="display:inline-block;width:22px;height:22px;border-radius:50%;background:'+c+';cursor:pointer;outline:'+(c===selected?'2.5px solid var(--text)':'2px solid transparent')+';outline-offset:2px;transition:.1s"></span>';
    }).join('')+
    '<input type="hidden" id="'+inputId+'" value="'+(selected||PALETTE[0])+'">'+
  '</div>';
}
function selectSwatch(color,inputId){
  var inp=document.getElementById(inputId);if(inp)inp.value=color;
  document.querySelectorAll('[data-swatch="'+inputId+'"]').forEach(function(s){
    s.style.outline=s.dataset.color===color?'2.5px solid var(--text)':'2px solid transparent';
  });
}

const CATS=[
  {key:'food',label:'Food',color:'#a0697a'},
  {key:'transport',label:'Transport',color:'#2c4a6e'},
  {key:'health',label:'Health',color:'#8b2c2c'},
  {key:'shopping',label:'Shopping',color:'#8b5e3c'},
  {key:'entertainment',label:'Entertainment',color:'#5a3c7a'},
  {key:'utilities',label:'Utilities',color:'#a06e54'},
  {key:'education',label:'Education',color:'#5b7fa5'},
  {key:'other',label:'Other',color:'#888'},
];

const CURRENCIES=[
  {code:'JPY',flag:'🇯🇵',rate:1},{code:'IDR',flag:'🇮🇩',rate:0.0093},
  {code:'USD',flag:'🇺🇸',rate:149.5},{code:'GBP',flag:'🇬🇧',rate:189.2},
  {code:'CNY',flag:'🇨🇳',rate:20.7},{code:'KRW',flag:'🇰🇷',rate:0.109},
  {code:'MYR',flag:'🇲🇾',rate:32.1},{code:'EUR',flag:'🇪🇺',rate:161.3},
];

const today=new Date();
const MIN_YEAR=1995,MAX_YEAR=2095;
let view='day',stab='notes',cursor=new Date(today),multiYearStart=2026,focusDay=null;
let tgDragKey=null,tgDragStart=-1,tgDragEnd=-1,tgDragging=false;

// DATA MODEL
// events: "YYYY-MM-DD": [{id, text, color}]
// tasks:  "YYYY-MM-DD": [{id, text, done}]
// slots:  "YYYY-MM-DD": [{id, startH, startM, endH, endM, text}]
// spend:  "YYYY-MM-DD": {food:{raw,val}, transport:{raw,val},...}
// goals:  "YYYY-MM-N":  string
// notes:  [{id, text, date}]
// catLabels: {key: label}
// nisa: {tsumitateMonthly, lumpSumYearly, startYear, projectionYears}
// currencies: {code: amount}

let DATA={events:{},tasks:{},slots:{},spend:{},goals:{},notes:[],catLabels:{},catColors:{},countdowns:[],nisa:{tsumitateMonthly:60000,lumpSumByYear:{},startYear:2026,projectionYears:[2026,2027,2028,2030,2032,2035,2040,2045,2050,2055,2060]},currencies:{},currencyRates:{},baseCurrency:'JPY'};

const SEED_EVENTS=[
  {date:'2026-05-08',text:'Driving license exam',color:'#2c4a6e'},
  {date:'2026-05-21',text:'Driving camp ends',color:'#c2607a'},
  {date:'2026-08-01',text:'JLPT N1 registration opens',color:'#8b5e3c'},
  {date:'2026-12-06',text:'JLPT N1 exam',color:'#5a3c7a'},
];
const SEED_GOALS=[
  {key:'2026-5-0',val:'Pass driving license exam'},
  {key:'2026-7-0',val:'Decide on Cybernation offer'},
  {key:'2026-8-0',val:'Register for JLPT N1'},
  {key:'2026-12-0',val:'JLPT N1 exam'},
  {key:'2027-4-0',val:'Enroll in 日本語教師 course'},
  {key:'2028-6-0',val:'Target: 登録日本語教員 license'},
  {key:'2032-3-0',val:'10-yr residence → PR eligible'},
];

function seedData(){
  SEED_EVENTS.forEach(function(e){
    if(!DATA.events[e.date]) DATA.events[e.date]=[];
    DATA.events[e.date].push({id:uid(),text:e.text,color:e.color});
  });
  SEED_GOALS.forEach(function(g){ if(!DATA.goals[g.key]) DATA.goals[g.key]=g.val; });
}

// ── UTILS ─────────────────────────────────────────────────────────────
let _uid=0; function uid(){return 'id'+(++_uid)+Date.now();}
function fd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function isToday(d){return fd(d)===fd(today);}
function getMon(d){let day=d.getDay(),diff=day===0?-6:1-day,m=new Date(d);m.setDate(m.getDate()+diff);return m;}
function catLabel(k){return DATA.catLabels[k]||CATS.find(c=>c.key===k).label;}
function catColor(k){return(DATA.catColors&&DATA.catColors[k])||CATS.find(c=>c.key===k).color;}

function getRate(code){return(DATA.currencyRates&&DATA.currencyRates[code]!=null)?DATA.currencyRates[code]:CURRENCIES.find(function(c){return c.code===code;}).rate;}
function setRate(code,displayedVal){
  var v=parseFloat(displayedVal);if(!v||isNaN(v))return;
  if(!DATA.currencyRates)DATA.currencyRates={};
  DATA.currencyRates[code]=DATA.baseCurrency==='IDR'?v*getRate('IDR'):v;
  render();
}
function fmtSpend(jpyVal){
  if(DATA.baseCurrency==='IDR'){
    const idrRate=getRate('IDR');
    return 'Rp '+(idrRate>0?Math.round(jpyVal/idrRate):0).toLocaleString();
  }
  return '¥'+Math.round(jpyVal).toLocaleString();
}

// ── TIME GRID ─────────────────────────────────────────────────────────
const TG_ROWS=40,TG_ROW_H=28; // 4:00–23:30, 40 half-hour slots
function slotH(i){return 4+Math.floor(i/2);}
function slotM(i){return(i%2)*30;}
function pad2(n){return String(n).padStart(2,'0');}
function fmtT(h,m){
  if(h>=24)return'midnight';
  const p=h<12?'am':'pm',hd=h===0||h===12?12:h%12;
  return hd+(m?':'+pad2(m):'')+p;
}
function migrateSlots(){
  Object.keys(DATA.slots).forEach(function(key){
    const v=DATA.slots[key];
    if(v&&!Array.isArray(v)){
      DATA.slots[key]=Object.keys(v).filter(function(h){return v[h]&&v[h].trim();}).map(function(h){
        const hn=parseInt(h);
        return{id:uid(),startH:hn,startM:0,endH:Math.min(hn+1,24),endM:0,text:v[h]};
      });
    }
  });
}
function getBlocks(key){if(!Array.isArray(DATA.slots[key]))DATA.slots[key]=[];return DATA.slots[key];}
function deleteBlock(key,id){DATA.slots[key]=(DATA.slots[key]||[]).filter(function(b){return b.id!==id;});}

function tgDown(ev,key){
  if(ev.target.closest&&ev.target.closest('.tg-block'))return;
  const g=document.getElementById('tgrid-'+key);if(!g)return;
  const rect=g.getBoundingClientRect();
  const slot=Math.max(0,Math.min(TG_ROWS-1,Math.floor((ev.clientY-rect.top)/TG_ROW_H)));
  tgDragKey=key;tgDragStart=slot;tgDragEnd=slot;tgDragging=true;
  tgHi();ev.preventDefault();
}
function tgMove(ev,key){
  if(!tgDragging||tgDragKey!==key)return;
  const g=document.getElementById('tgrid-'+key);if(!g)return;
  const rect=g.getBoundingClientRect();
  const slot=Math.max(0,Math.min(TG_ROWS-1,Math.floor((ev.clientY-rect.top)/TG_ROW_H)));
  if(slot!==tgDragEnd){tgDragEnd=slot;tgHi();}
}
function tgHi(){
  const s=Math.min(tgDragStart,tgDragEnd),e=Math.max(tgDragStart,tgDragEnd);
  const sel=document.getElementById('tg-sel-'+tgDragKey);
  if(sel){sel.style.display='block';sel.style.top=(s*TG_ROW_H)+'px';sel.style.height=((e-s+1)*TG_ROW_H)+'px';}
}
function tgUp(){
  if(!tgDragging)return;
  tgDragging=false;
  const s=Math.min(tgDragStart,tgDragEnd),e=Math.max(tgDragStart,tgDragEnd);
  const key=tgDragKey;tgDragKey=null;
  const sel=document.getElementById('tg-sel-'+key);if(sel)sel.style.display='none';
  openAddBlockModal(key,s,e);
}
function openAddBlockModal(key,s,e){
  const sh=slotH(s),sm=slotM(s),reh=slotH(e+1),rem=slotM(e+1);
  const endStr=reh>=24?'23:59':pad2(reh)+':'+pad2(rem);
  openModal(
    '<div class="modal-title">add time block</div>'+
    '<input id="blk-text" placeholder="e.g. gym, commute, meeting…" autofocus style="margin-bottom:10px">'+
    '<div style="display:flex;gap:10px;margin-bottom:8px">'+
      '<div style="flex:1"><div style="font-size:11px;color:var(--text2);margin-bottom:3px">from</div>'+
        '<input type="time" id="blk-start" value="'+pad2(sh)+':'+pad2(sm)+'" style="width:100%;border:1px solid var(--border);border-radius:var(--radius);padding:6px 8px;font-family:var(--mono);font-size:13px;background:var(--surface2);color:var(--text);outline:none"></div>'+
      '<div style="flex:1"><div style="font-size:11px;color:var(--text2);margin-bottom:3px">to</div>'+
        '<input type="time" id="blk-end" value="'+endStr+'" style="width:100%;border:1px solid var(--border);border-radius:var(--radius);padding:6px 8px;font-family:var(--mono);font-size:13px;background:var(--surface2);color:var(--text);outline:none"></div>'+
    '</div>'+
    '<div class="modal-row">'+
      '<button class="modal-btn ghost" onclick="closeModal()">cancel</button>'+
      '<button class="modal-btn primary" onclick="submitAddBlock(\''+key+'\')">add</button>'+
    '</div>'
  );
  setTimeout(function(){const el=document.getElementById('blk-text');if(el)el.focus();},50);
}
function submitAddBlock(key){
  const text=document.getElementById('blk-text').value.trim();if(!text)return;
  const sv=document.getElementById('blk-start').value,ev=document.getElementById('blk-end').value;
  if(!sv||!ev)return;
  const[sh,sm]=sv.split(':').map(Number),[eh,em]=ev.split(':').map(Number);
  if(eh*60+em<=sh*60+sm)return;
  getBlocks(key).push({id:uid(),startH:sh,startM:sm,endH:eh,endM:em,text:text});
  closeModal();render();
}
function openEditBlockModal(key,id){
  const b=(DATA.slots[key]||[]).find(function(b){return b.id===id;});if(!b)return;
  openModal(
    '<div class="modal-title">edit block</div>'+
    '<input id="blk-text" value="'+b.text+'" autofocus style="margin-bottom:10px">'+
    '<div style="display:flex;gap:10px;margin-bottom:8px">'+
      '<div style="flex:1"><div style="font-size:11px;color:var(--text2);margin-bottom:3px">from</div>'+
        '<input type="time" id="blk-start" value="'+pad2(b.startH)+':'+pad2(b.startM)+'" style="width:100%;border:1px solid var(--border);border-radius:var(--radius);padding:6px 8px;font-family:var(--mono);font-size:13px;background:var(--surface2);color:var(--text);outline:none"></div>'+
      '<div style="flex:1"><div style="font-size:11px;color:var(--text2);margin-bottom:3px">to</div>'+
        '<input type="time" id="blk-end" value="'+pad2(b.endH)+':'+pad2(b.endM)+'" style="width:100%;border:1px solid var(--border);border-radius:var(--radius);padding:6px 8px;font-family:var(--mono);font-size:13px;background:var(--surface2);color:var(--text);outline:none"></div>'+
    '</div>'+
    '<div class="modal-row">'+
      '<button class="modal-btn ghost" style="color:var(--accent);border-color:var(--border)" onclick="deleteBlock(\''+key+'\',\''+id+'\');closeModal();render()">delete</button>'+
      '<button class="modal-btn primary" onclick="submitEditBlock(\''+key+'\',\''+id+'\')">save</button>'+
    '</div>'
  );
  setTimeout(function(){const el=document.getElementById('blk-text');if(el)el.focus();},50);
}
function submitEditBlock(key,id){
  const text=document.getElementById('blk-text').value.trim();if(!text)return;
  const sv=document.getElementById('blk-start').value,ev=document.getElementById('blk-end').value;
  if(!sv||!ev)return;
  const[sh,sm]=sv.split(':').map(Number),[eh,em]=ev.split(':').map(Number);
  if(eh*60+em<=sh*60+sm)return;
  const b=(DATA.slots[key]||[]).find(function(b){return b.id===id;});
  if(b){b.text=text;b.startH=sh;b.startM=sm;b.endH=eh;b.endM=em;}
  closeModal();render();
}
function buildTimeGrid(key){
  const blocks=getBlocks(key);
  let rowsHtml='';
  for(let i=0;i<TG_ROWS;i++){
    const h=slotH(i),m=slotM(i);
    const lbl=m===0?fmtT(h,0):'';
    const bdr=m===30?'border-bottom:1px dashed var(--border)':'border-bottom:1px solid var(--border)';
    rowsHtml+='<div style="height:'+TG_ROW_H+'px;'+bdr+';display:flex">'+
      '<span style="width:46px;font-family:var(--mono);font-size:10px;color:var(--text3);padding:6px 6px 0 10px;flex-shrink:0;text-align:right;line-height:1">'+lbl+'</span>'+
      '<div style="flex:1"></div>'+
    '</div>';
  }
  let blocksHtml='';
  blocks.forEach(function(b){
    const startMins=Math.max(0,(b.startH-4)*60+b.startM);
    const endMins=Math.min(TG_ROWS*30,(b.endH-4)*60+b.endM);
    if(startMins>=endMins)return;
    const top=startMins/30*TG_ROW_H;
    const height=Math.max((endMins-startMins)/30*TG_ROW_H,TG_ROW_H);
    blocksHtml+='<div class="tg-block" onclick="openEditBlockModal(\''+key+'\',\''+b.id+'\')" style="top:'+top+'px;height:'+height+'px">'+
      '<div style="font-size:11px;font-weight:500;line-height:1.3;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">'+b.text+'</div>'+
      (height>TG_ROW_H+4?'<div style="font-size:9px;opacity:.75;font-family:var(--mono);margin-top:1px">'+fmtT(b.startH,b.startM)+' – '+fmtT(b.endH,b.endM)+'</div>':'')+
    '</div>';
  });
  return '<div id="tgrid-'+key+'" style="position:relative;user-select:none;cursor:crosshair" onmousedown="tgDown(event,\''+key+'\')" onmousemove="tgMove(event,\''+key+'\')">'+
    rowsHtml+
    '<div id="tg-sel-'+key+'" style="position:absolute;left:46px;right:4px;top:0;height:0;display:none;background:rgba(194,96,122,.12);border:1px solid rgba(194,96,122,.4);border-radius:4px;pointer-events:none;z-index:1"></div>'+
    blocksHtml+
  '</div>';
}

// ── SPEND MATH ────────────────────────────────────────────────────────
function parseExpr(str){
  if(!str&&str!==0) return 0;
  const s=str.toString().trim().replace(/[^0-9+\-*/.() ]/g,'');
  if(!s) return 0;
  try{const v=Function('"use strict";return('+s+')')();return(isFinite(v)&&v>=0)?Math.round(v*100)/100:0;}
  catch(e){return parseFloat(s)||0;}
}
function spendVal(e){if(!e)return 0;if(typeof e==='object')return e.val||0;return parseFloat(e)||0;}
function daySpendTotal(key){
  const sp=DATA.spend[key]||{};
  return CATS.reduce(function(s,c){return s+spendVal(sp[c.key]);},0);
}
function monthSpendTotal(y,m){
  let t=0,dim=new Date(y,m+1,0).getDate();
  for(let i=1;i<=dim;i++) t+=daySpendTotal(fd(new Date(y,m,i)));
  return t;
}

function commitSpend(input,dayKey,catKey){
  const raw=input.value.trim();
  const val=parseExpr(raw);
  if(!DATA.spend[dayKey]) DATA.spend[dayKey]={};
  DATA.spend[dayKey][catKey]={raw:raw,val:val};
  input.value=val||'';
  input.dataset.raw=raw;
  const hasB=raw&&(raw.includes('+')||raw.includes('-')||raw.includes('*')||raw.includes('/'));
  const hint=input.closest('.spend-cat').querySelector('.spend-breakdown');
  if(hint){hint.textContent=hasB&&val?raw+' = '+Math.round(val).toLocaleString():'';hint.style.display=hasB&&val?'block':'none';}
  const tot=document.getElementById('day-spend-total');
  if(tot) tot.textContent=fmtSpend(daySpendTotal(dayKey));
  renderSidebar();
}

// ── EVENTS CRUD ───────────────────────────────────────────────────────
function getEvents(key){return DATA.events[key]||[];}
function addEvent(key,text,color){
  if(!DATA.events[key]) DATA.events[key]=[];
  DATA.events[key].push({id:uid(),text:text,color:color||'#c2607a'});
}
function deleteEvent(key,id){
  if(!DATA.events[key]) return;
  DATA.events[key]=DATA.events[key].filter(function(e){return e.id!==id;});
}

// ── TASKS CRUD ────────────────────────────────────────────────────────
function getTasks(key){return DATA.tasks[key]||[];}
function addTask(key,text){
  if(!DATA.tasks[key]) DATA.tasks[key]=[];
  DATA.tasks[key].push({id:uid(),text:text.trim(),done:false});
}
function deleteTask(key,id){
  if(!DATA.tasks[key]) return;
  DATA.tasks[key]=DATA.tasks[key].filter(function(t){return t.id!==id;});
}
function toggleTask(key,id){
  if(!DATA.tasks[key]) return;
  const t=DATA.tasks[key].find(function(t){return t.id===id;});
  if(t) t.done=!t.done;
}

// ── MODAL ─────────────────────────────────────────────────────────────
function openModal(html){
  document.getElementById('modal-content').innerHTML=html;
  document.getElementById('modal-overlay').style.display='flex';
}
function closeModal(){document.getElementById('modal-overlay').style.display='none';}

function openAddEventModal(key){
  const d=key||fd(cursor);
  openModal(
    '<div class="modal-title">add event — '+d+'</div>'+
    '<input id="evt-text" placeholder="event name..." autofocus>'+
    '<input id="evt-date" type="date" value="'+d+'" style="width:100%;border:1px solid var(--border);border-radius:var(--radius);padding:6px 8px;font-family:var(--sans);font-size:12px;background:var(--surface2);color:var(--text);outline:none;margin-bottom:8px">'+
    '<div style="font-size:11px;color:var(--text2);margin-bottom:5px">colour</div>'+
    buildSwatches('evt-color','#2c4a6e')+
    '<div class="modal-row">'+
      '<button class="modal-btn ghost" onclick="closeModal()">cancel</button>'+
      '<button class="modal-btn primary" onclick="submitAddEvent()">add event</button>'+
    '</div>'
  );
  setTimeout(function(){const el=document.getElementById('evt-text');if(el)el.focus();},50);
}

function submitAddEvent(){
  const text=document.getElementById('evt-text').value.trim();
  const color=document.getElementById('evt-color').value;
  const date=document.getElementById('evt-date').value;
  if(!text) return;
  addEvent(date,text,color);
  closeModal();
  render();
}

// ── VIEW / NAV ────────────────────────────────────────────────────────
function setView(v){view=v;document.querySelectorAll('.vbtn').forEach(function(b){b.classList.toggle('active',b.textContent===v);});render();}
function setSTab(t){stab=t;document.querySelectorAll('.stab').forEach(function(b){b.classList.toggle('active',b.textContent===t);});renderSidebar();}
function nav(dir){
  if(view==='day') cursor.setDate(cursor.getDate()+dir);
  else if(view==='week'){cursor.setDate(cursor.getDate()+dir*7);focusDay=null;}
  else if(view==='month') cursor.setMonth(cursor.getMonth()+dir);
  else if(view==='year') cursor.setFullYear(cursor.getFullYear()+dir);
  else if(view==='multiyear') multiYearStart+=dir*5;
  var cy=cursor.getFullYear();
  if(cy<MIN_YEAR){cursor=new Date(MIN_YEAR,0,1);}
  if(cy>MAX_YEAR){cursor=new Date(MAX_YEAR,11,31);}
  multiYearStart=Math.max(MIN_YEAR,Math.min(MAX_YEAR-4,multiYearStart));
  render();
}
function jumpDay(key){const p=key.split('-');cursor=new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));setView('day');}
function jumpWeek(key){const p=key.split('-');cursor=new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));focusDay=key;setView('week');}
function jumpMonth(y,m){cursor=new Date(y,m,1);setView('month');}

function render(){
  const panel=document.getElementById('main-panel');
  const label=document.getElementById('period-label');
  if(view==='day'){
    label.textContent=DAYS[(cursor.getDay()+6)%7]+', '+MS[cursor.getMonth()]+' '+cursor.getDate()+' '+cursor.getFullYear();
    renderDay(panel,new Date(cursor));
  }else if(view==='week'){
    const mon=getMon(new Date(cursor)),sun=new Date(mon);sun.setDate(sun.getDate()+6);
    label.textContent=MS[mon.getMonth()]+' '+mon.getDate()+' – '+MS[sun.getMonth()]+' '+sun.getDate()+' '+mon.getFullYear();
    renderWeek(panel,mon);
  }else if(view==='month'){
    label.textContent=MONTHS[cursor.getMonth()]+' '+cursor.getFullYear();
    renderMonth(panel,new Date(cursor));
  }else if(view==='year'){
    label.textContent=cursor.getFullYear();
    renderYear(panel,cursor.getFullYear());
  }else if(view==='multiyear'){
    label.textContent=multiYearStart+' – '+(multiYearStart+4);
    renderMultiYear(panel);
  }else if(view==='savings'){
    label.textContent='savings & NISA';
    renderSavings(panel);
  }
  renderSidebar();
  autoSave();
}

// ── DAY VIEW ──────────────────────────────────────────────────────────
function renderDay(panel,d){
  const key=fd(d);
  const evts=getEvents(key);
  const tasks=getTasks(key);
  const spend=DATA.spend[key]||{};
  const total=daySpendTotal(key);

  let evtHtml=evts.map(function(e){
    return '<span class="evt-pill" style="background:'+e.color+'18;color:'+e.color+'">'+
      e.text+
      '<button onclick="deleteEvent(\''+key+'\',\''+e.id+'\');render()" title="remove">×</button>'+
    '</span>';
  }).join('');

  let taskHtml=tasks.map(function(t){
    return '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border)">'+
      '<input type="checkbox" '+(t.done?'checked':'')+' onchange="toggleTask(\''+key+'\',\''+t.id+'\');render()" style="cursor:pointer">'+
      '<span style="font-size:12px;flex:1;'+(t.done?'text-decoration:line-through;opacity:.5':'')+'">'+(t.text)+'</span>'+
      '<button class="icon-btn" onclick="deleteTask(\''+key+'\',\''+t.id+'\');render()">×</button>'+
    '</div>';
  }).join('');


  let spendHtml=CATS.map(function(cat){
    const ent=spend[cat.key]||null;
    const dv=ent?spendVal(ent):0;
    const rw=ent&&typeof ent==='object'?ent.raw:'';
    const hasB=rw&&(rw.includes('+')||rw.includes('-')||rw.includes('*')||rw.includes('/'));
    return '<div class="spend-cat">'+
      '<div class="spend-cat-label">'+
        '<span class="spend-cat-dot" style="background:'+catColor(cat.key)+'"></span>'+
        '<span ondblclick="renameCat(\''+cat.key+'\')" title="double-click to rename" style="cursor:default">'+catLabel(cat.key)+'</span>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:3px">'+
        '<span style="font-size:10px;color:var(--text3)">¥</span>'+
        '<input class="spend-expr-input" type="text" inputmode="decimal" placeholder="e.g. 90+20"'+
          ' value="'+(dv||'')+'\" data-raw="'+(rw||'')+'\"'+
          ' onfocus="this.value=this.dataset.raw||this.value;this.select()"'+
          ' onblur="commitSpend(this,\''+key+'\',\''+cat.key+'\')"'+
          ' onkeydown="if(event.key===\'Enter\')this.blur()"'+
        ' />'+
      '</div>'+
      '<div class="spend-breakdown" style="display:'+(hasB&&dv?'block':'none')+'">'+(hasB&&dv?rw+' = '+Math.round(dv).toLocaleString():'')+'</div>'+
    '</div>';
  }).join('');

  panel.innerHTML=
    '<div class="day-wrap">'+
      '<div class="day-card">'+
        '<div class="day-hdr">'+
          '<div class="day-num-big">'+d.getDate()+'</div>'+
          '<div class="day-info">'+
            '<div class="day-dow">'+DAYS[(d.getDay()+6)%7]+'</div>'+
            '<div class="day-full">'+MONTHS[d.getMonth()]+' '+d.getFullYear()+'</div>'+
          '</div>'+
          (isToday(d)?'<span class="today-badge">today</span>':'')+
        '</div>'+
        '<div style="padding:6px 14px;border-bottom:1px solid var(--border);display:flex;flex-wrap:wrap;align-items:center;gap:4px;min-height:34px">'+
          evtHtml+
          '<button onclick="openAddEventModal(\''+key+'\')" style="background:none;border:1px dashed var(--border2);border-radius:12px;padding:2px 10px;font-size:11px;color:var(--text3);cursor:pointer">+ event</button>'+
        '</div>'+
        '<div style="padding:8px 14px;border-bottom:1px solid var(--border)">'+
          '<div style="font-size:10px;font-weight:500;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">tasks</div>'+
          taskHtml+
          '<input placeholder="+ add task" style="width:100%;background:none;border:none;border-bottom:1px dashed var(--border);outline:none;font-family:var(--sans);font-size:12px;color:var(--text);padding:4px 0;margin-top:4px"'+
            ' onkeydown="if(event.key===\'Enter\'&&this.value.trim()){addTask(\''+key+'\',this.value);this.value=\'\';render()}"'+
          ' />'+
        '</div>'+
        '<div class="day-body">'+
          '<div class="day-slots-col">'+buildTimeGrid(key)+'</div>'+
          '<div class="day-spend-col">'+
            '<div class="day-spend-title">spend</div>'+
            '<div class="spend-day-grid">'+spendHtml+'</div>'+
            '<div class="spend-total-row"><span style="font-size:11px;color:var(--text2)">total today</span><span id="day-spend-total" style="font-family:var(--mono);font-size:14px;font-weight:500">'+fmtSpend(total)+'</span></div>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>';
}

function renameCat(catKey){
  const curLabel=catLabel(catKey),curColor=catColor(catKey);
  openModal(
    '<div class="modal-title">edit category</div>'+
    '<input id="cat-label" value="'+curLabel+'" placeholder="category name" autofocus style="margin-bottom:10px">'+
    '<div style="font-size:11px;color:var(--text2);margin-bottom:5px">colour</div>'+
    buildSwatches('cat-color',curColor)+
    '<div class="modal-row">'+
      '<button class="modal-btn ghost" onclick="closeModal()">cancel</button>'+
      '<button class="modal-btn primary" onclick="submitRenameCat(\''+catKey+'\')">save</button>'+
    '</div>'
  );
  setTimeout(function(){const el=document.getElementById('cat-label');if(el)el.focus();},50);
}
function submitRenameCat(catKey){
  const lbl=document.getElementById('cat-label').value.trim();
  const col=document.getElementById('cat-color').value;
  if(lbl) DATA.catLabels[catKey]=lbl;
  if(!DATA.catColors) DATA.catColors={};
  DATA.catColors[catKey]=col;
  closeModal();render();
}

// ── WEEK VIEW ─────────────────────────────────────────────────────────
function renderWeek(panel,mon){
  let cols='',weekTotal=0;
  for(let i=0;i<7;i++){
    const d=new Date(mon);d.setDate(mon.getDate()+i);
    const key=fd(d);
    const evts=getEvents(key);
    const tasks=getTasks(key);
    const blocks=getBlocks(key);
    const spend=daySpendTotal(key);
    weekTotal+=spend;

    const evtHtml=evts.map(function(e){
      return '<div class="wc-evt">'+
        '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+e.text+'</span>'+
        '<button style="background:none;border:none;cursor:pointer;color:inherit;opacity:.6;font-size:10px;flex-shrink:0" onclick="deleteEvent(\''+key+'\',\''+e.id+'\');render()">×</button>'+
      '</div>';
    }).join('');

    const taskHtml=tasks.map(function(t){
      return '<div class="wc-task'+(t.done?' done':'')+'" onclick="toggleTask(\''+key+'\',\''+t.id+'\');render()">'+
        '<span class="wc-task-text">'+t.text+'</span>'+
        '<button class="wc-task-del icon-btn" onclick="event.stopPropagation();deleteTask(\''+key+'\',\''+t.id+'\');render()">×</button>'+
      '</div>';
    }).join('');

    const slotHtml=blocks.slice(0,3).map(function(b){
      return '<div class="wc-slot"><span style="color:var(--text3);font-family:var(--mono);font-size:9px">'+fmtT(b.startH,b.startM)+'</span> '+b.text+'</div>';
    }).join('');

    cols+=
      '<div class="week-col'+(isToday(d)?' today-col':'')+(focusDay&&fd(d)===focusDay?' focus-col':'')+'">'+
        '<div class="wc-head" onclick="jumpDay(\''+key+'\')">'+
          '<div class="wc-dow">'+DAYS[i]+'</div>'+
          '<div class="wc-num">'+d.getDate()+'</div>'+
          (isToday(d)?'<div style="width:5px;height:5px;border-radius:50%;background:var(--accent);margin:2px auto 0"></div>':'')+
        '</div>'+
        evtHtml+
        slotHtml+
        taskHtml+
        '<input class="wc-task-input" placeholder="+ task" onkeydown="if(event.key===\'Enter\'&&this.value.trim()){addTask(\''+key+'\',this.value);this.value=\'\';render()}" />'+
        '<button onclick="openAddEventModal(\''+key+'\')" style="background:none;border:1px dashed var(--border2);border-radius:10px;padding:2px 6px;font-size:10px;color:var(--text3);cursor:pointer;width:100%">+ event</button>'+
        (spend?'<div class="wc-spend">'+fmtSpend(spend)+'</div>':'')+
      '</div>';
  }
  panel.innerHTML=
    '<div class="week-grid">'+cols+'</div>'+
    '<div style="text-align:right;padding:6px 2px;font-family:var(--mono);font-size:11px;color:var(--text2)">week total '+fmtSpend(weekTotal)+'</div>';
}

// ── MONTH VIEW ────────────────────────────────────────────────────────
function renderMonth(panel,d){
  const year=d.getFullYear(),month=d.getMonth();
  const fd_=new Date(year,month,1),startDow=(fd_.getDay()+6)%7;
  const dim=new Date(year,month+1,0).getDate(),prevDim=new Date(year,month,0).getDate();
  let cells=DAYS.map(function(d){return '<div class="mh-label">'+d+'</div>';}).join('');
  let dc=1,nc=1,total=Math.ceil((startDow+dim)/7)*7;
  for(let i=0;i<total;i++){
    let cd,cm=month,cy=year,other=false;
    if(i<startDow){cd=prevDim-startDow+1+i;cm=month-1;if(cm<0){cm=11;cy--;}other=true;}
    else if(dc<=dim){cd=dc++;}
    else{cd=nc++;cm=month+1;if(cm>11){cm=0;cy++;}other=true;}
    const cdate=new Date(cy,cm,cd),ckey=fd(cdate);
    const evts=getEvents(ckey);
    const tasks=getTasks(ckey).filter(function(t){return !t.done;});
    const firstBlock=getBlocks(ckey)[0]||null;
    const spend=daySpendTotal(ckey);
    const isTod=isToday(cdate);
    cells+=
      '<div class="mc'+(isTod?' today-mc':'')+(other?' other':'')+'" onclick="jumpWeek(\''+ckey+'\')">'+
        '<div class="mc-num">'+cd+'</div>'+
        evts.slice(0,2).map(function(e){return '<div class="mc-item" style="background:'+e.color+'18;color:'+e.color+'">'+e.text+'</div>';}).join('')+
        tasks.slice(0,1).map(function(t){return '<div class="mc-item" style="background:#e8e0f5;color:#9b7ec8">'+t.text+'</div>';}).join('')+
        (firstBlock?'<div class="mc-item" style="background:#e8eef5;color:#2c4a6e">'+firstBlock.text+'</div>':'')+
        (spend?'<div class="mc-spend">'+fmtSpend(spend)+'</div>':'')+
      '</div>';
  }

  panel.innerHTML=
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden">'+
      '<div style="display:flex;justify-content:flex-end;padding:8px 10px;border-bottom:1px solid var(--border)">'+
        '<button onclick="openAddEventModal()" style="background:none;border:1px solid var(--border);border-radius:10px;padding:3px 12px;font-size:11px;color:var(--text2);cursor:pointer">+ add event</button>'+
      '</div>'+
      '<div class="month-cal-grid">'+cells+'</div>'+
    '</div>';
}

// ── YEAR VIEW ─────────────────────────────────────────────────────────
function renderYear(panel,year){
  let blocks='';
  for(let m=0;m<12;m++){
    const fd_=new Date(year,m,1),startDow=(fd_.getDay()+6)%7,dim=new Date(year,m+1,0).getDate(),prevDim=new Date(year,m,0).getDate();
    let cells=DAYS.map(function(d){return '<div class="ymb-mini-dow">'+d[0]+'</div>';}).join('');
    for(let i=0;i<startDow;i++) cells+='<div class="ymb-mini-day other">'+(prevDim-startDow+1+i)+'</div>';
    for(let day=1;day<=dim;day++){
      const cdate=new Date(year,m,day),ckey=fd(cdate);
      const hasEv=getEvents(ckey).length>0;
      const hasTask=getTasks(ckey).filter(function(t){return !t.done;}).length>0;
      const hasSlot=getBlocks(ckey).length>0;
      cells+='<div class="ymb-mini-day'+
        (hasEv?' has-ev':hasTask?' has-task':hasSlot?' has-slot':'')+
        (isToday(cdate)?' is-today':'')+
        '" onclick="jumpDay(\''+ckey+'\')" title="'+ckey+'">'+day+'</div>';
    }
    const mTotal=monthSpendTotal(year,m);
    const taskCount=Object.keys(DATA.tasks).filter(function(k){return k.startsWith(year+'-'+String(m+1).padStart(2,'0'));}).reduce(function(s,k){return s+DATA.tasks[k].filter(function(t){return !t.done;}).length;},0);

    const goalRows=[0,1,2].map(function(n){
      const gkey=year+'-'+(m+1)+'-'+n;
      return '<div class="ymb-goal-row">'+
        '<span class="ymb-goal-icon">'+(n===0?'★':n===1?'▶':'—')+'</span>'+
        '<input class="ymb-goal-input" placeholder="'+(n===0?'aim...':n===1?'checkpoint...':'note...')+'" value="'+(DATA.goals[gkey]||'')+'" onchange="DATA.goals[\''+gkey+'\']=this.value" />'+
        (DATA.goals[gkey]?'<button class="icon-btn" onclick="DATA.goals[\''+gkey+'\']=\'\';this.closest(\'.ymb-goal-row\').querySelector(\'input\').value=\'\'">×</button>':'')+
      '</div>';
    }).join('');

    blocks+=
      '<div class="ymb">'+
        '<div class="ymb-head">'+
          '<span class="ymb-month-name" onclick="jumpMonth('+year+','+m+')" style="cursor:pointer" title="go to month">'+MS[m]+'</span>'+
          '<div style="display:flex;gap:8px;align-items:center">'+
            (mTotal?'<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">'+fmtSpend(mTotal)+'</span>':'')+
            '<button onclick="openAddEventModal(\''+ year+'-'+String(m+1).padStart(2,'0')+'-01\')" style="background:none;border:1px dashed var(--border2);border-radius:8px;padding:1px 8px;font-size:10px;color:var(--text3);cursor:pointer">+ event</button>'+
          '</div>'+
        '</div>'+
        '<div class="ymb-mini-grid">'+cells+'</div>'+
        (taskCount?'<div style="padding:2px 8px 4px;font-size:9px;color:#9b7ec8;font-family:var(--mono)">'+taskCount+' open task'+(taskCount>1?'s':'')+'</div>':'')+
        '<div class="ymb-goals">'+goalRows+'</div>'+
      '</div>';
  }
  panel.innerHTML='<div class="year-grid">'+blocks+'</div>';
}

// ── MULTI-YEAR VIEW ───────────────────────────────────────────────────
function renderMultiYear(panel){
  const birthYear=1995;
  const allNisaRows=nisaCalc();
  let html='';
  for(let y=multiYearStart;y<multiYearStart+5;y++){
    const age=y-birthYear;
    let monthCells='';
    for(let m=0;m<12;m++){
      const gkey=y+'-'+(m+1)+'-0';
      const goal=DATA.goals[gkey]||'';
      const mkey=y+'-'+String(m+1).padStart(2,'0');
      const evtKeys=Object.keys(DATA.events).filter(function(k){return k.startsWith(mkey);});
      const evtTexts=evtKeys.map(function(k){return DATA.events[k].map(function(e){return e.text;});}).flat();
      const taskKeys=Object.keys(DATA.tasks).filter(function(k){return k.startsWith(mkey);});
      const taskTexts=taskKeys.map(function(k){return DATA.tasks[k].filter(function(t){return !t.done;}).map(function(t){return t.text;});}).flat();
      const mTotal=monthSpendTotal(y,m);

      const items=[].concat(goal?[goal]:[],evtTexts,taskTexts).slice(0,3);
      monthCells+=
        '<div class="my-month-cell" onclick="cursor=new Date('+y+','+m+',1);setView(\'month\')">'+
          '<div class="my-month-name">'+MS[m]+'</div>'+
          '<div class="my-month-content">'+
            items.map(function(t){return '<div class="my-month-item">'+t+'</div>';}).join('')+
            (mTotal?'<div style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-top:2px">'+fmtSpend(mTotal)+'</div>':'')+
          '</div>'+
        '</div>';
    }

    const nisaRow=allNisaRows.find(function(r){return r.year===y;});
    const contrib=nisaRow?nisaRow.cumulative:0;
    const capRow=allNisaRows.find(function(r){return r.capReached;});
    const capThisYear=capRow&&y>=capRow.year;

    html+=
      '<div class="my-year-section">'+
        '<div class="my-year-hdr">'+
          '<span class="my-year-num">'+y+'</span>'+
          '<span class="my-year-age">age '+age+'</span>'+
          '<button onclick="cursor=new Date('+y+',0,1);setView(\'year\')" style="margin-left:auto;background:none;border:1px solid var(--border);border-radius:8px;padding:2px 10px;font-size:10px;color:var(--text2);cursor:pointer">view year →</button>'+
        '</div>'+
        '<div class="my-months-row">'+monthCells+'</div>'+
        (contrib>0?'<div class="my-nisa-row"><span class="my-nisa-label">NISA contribution:</span><span class="my-nisa-val">¥'+contrib.toLocaleString()+(capThisYear?' 🎉 cap reached!':'')+'</span></div>':'')+
      '</div>';
  }
  panel.innerHTML=html;
}

// ── SAVINGS VIEW ──────────────────────────────────────────────────────
function nisaCalc(){
  var n=DATA.nisa,birthYear=1995;
  var annualTs=Math.min(n.tsumitateMonthly*12,1200000);
  var cumulative=0,rows=[];
  for(var y=n.startYear;y<=2100;y++){
    if(cumulative>=18000000) break;
    var annualLs=Math.min((n.lumpSumByYear&&n.lumpSumByYear[y])||0,2400000);
    var ts=Math.min(annualTs,18000000-cumulative);
    var ls=Math.min(annualLs,18000000-cumulative-ts);
    var total=ts+ls;
    cumulative=Math.min(cumulative+total,18000000);
    rows.push({year:y,age:y-birthYear,tsumitate:ts,lumpsum:ls,total:total,cumulative:cumulative,capReached:cumulative>=18000000});
    if(cumulative>=18000000) break;
  }
  return rows;
}
function addNisaYear(){
  var y=parseInt(prompt('Year to add lump sum for (e.g. 2028):'));
  if(!y||y<2020||y>2100) return;
  if(!DATA.nisa.lumpSumByYear) DATA.nisa.lumpSumByYear={};
  if(!(y in DATA.nisa.lumpSumByYear)) DATA.nisa.lumpSumByYear[y]=0;
  render();
}
function removeNisaYear(yr){
  if(DATA.nisa.lumpSumByYear) delete DATA.nisa.lumpSumByYear[yr];
  render();
}
function addProjectionYear(){
  var y=parseInt(prompt('Add year to track (e.g. 2038):'));
  if(!y||y<2020||y>2100){return;}
  if(DATA.nisa.projectionYears.indexOf(y)>=0){alert('Already in list.');return;}
  DATA.nisa.projectionYears.push(y);
  DATA.nisa.projectionYears.sort(function(a,b){return a-b;});
  render();
}
function removeProjectionYear(y){
  DATA.nisa.projectionYears=DATA.nisa.projectionYears.filter(function(yr){return yr!==y;});
  render();
}
function renderSavings(panel){
  var n=DATA.nisa,birthYear=1995;
  var annualTs=Math.min(n.tsumitateMonthly*12,1200000);
  var rawAnnualTs=n.tsumitateMonthly*12;
  var allRows=nisaCalc();
  var capRow=allRows.find(function(r){return r.capReached;});
  var projRows=allRows.filter(function(r){return n.projectionYears.indexOf(r.year)>=0;});
  var notStarted=n.projectionYears.filter(function(y){return y<n.startYear;});

  var projCards=notStarted.map(function(y){
    return '<div class="nisa-proj-card" style="position:relative">'+
      '<button class="icon-btn" onclick="removeProjectionYear('+y+')" style="position:absolute;top:4px;right:4px">×</button>'+
      '<div class="nisa-proj-year">'+y+'</div>'+
      '<div class="nisa-proj-age">age '+(y-birthYear)+'</div>'+
      '<div style="font-size:11px;color:var(--text3);margin-top:4px">before start year</div>'+
    '</div>';
  }).join('');
  projCards+=projRows.map(function(r){
    return '<div class="nisa-proj-card" style="position:relative">'+
      '<button class="icon-btn" onclick="removeProjectionYear('+r.year+')" style="position:absolute;top:4px;right:4px">×</button>'+
      '<div class="nisa-proj-year">'+r.year+'</div>'+
      '<div class="nisa-proj-age">age '+r.age+'</div>'+
      '<div style="margin-top:6px">'+
        '<div style="font-size:10px;color:var(--text3);margin-bottom:2px">cumulative</div>'+
        '<div class="nisa-proj-val">¥'+r.cumulative.toLocaleString()+'</div>'+
        '<div class="nisa-proj-contrib">つみたて ¥'+Math.round(r.tsumitate/10000)+'万</div>'+
        (r.lumpsum?'<div class="nisa-proj-contrib">成長 ¥'+Math.round(r.lumpsum/10000)+'万</div>':'')+
        (r.capReached?'<div style="font-size:10px;color:var(--accent);font-weight:500;margin-top:4px">🎉 cap reached!</div>':'')+
      '</div>'+
    '</div>';
  }).join('');

  var allJpy=CURRENCIES.filter(function(c){return c.code!=='JPY';}).reduce(function(s,c){var a=parseFloat(DATA.currencies[c.code]||0);return s+(a?Math.round(a*getRate(c.code)):0);},0);
  var currCards=CURRENCIES.filter(function(c){return c.code!=='JPY';}).map(function(c){
    var amt=DATA.currencies[c.code]||'';
    var rate=getRate(c.code);
    var jpyEq=amt?Math.round(parseFloat(amt)*rate):0;
    var idrBase=DATA.baseCurrency==='IDR';
    var idrRate=getRate('IDR');
    var displayRate=idrBase?Math.round(rate/idrRate*100)/100:rate;
    var rateLabel=idrBase?'Rp':'¥';
    return '<div class="curr-card">'+
      '<div style="font-size:16px;margin-bottom:2px">'+c.flag+'</div>'+
      '<div class="curr-code">'+c.code+'</div>'+
      '<input class="curr-input" type="number" placeholder="0" value="'+amt+'" onchange="DATA.currencies[\''+c.code+'\']=this.value;render()" />'+
      '<div style="display:flex;align-items:center;gap:4px;margin-top:4px;border-top:1px solid var(--border);padding-top:4px">'+
        '<span style="font-size:9px;color:var(--text3)">1'+c.code+'=</span>'+
        '<input type="number" step="any" value="'+displayRate+'" onchange="setRate(\''+c.code+'\',this.value)" style="width:60px;background:none;border:none;outline:none;font-family:var(--mono);font-size:10px;color:var(--text2)"/>'+
        '<span style="font-size:9px;color:var(--text3)">'+rateLabel+'</span>'+
      '</div>'+
      (jpyEq?'<div class="curr-jpy">≈ '+fmtSpend(jpyEq)+'</div>':'')+
    '</div>';
  }).join('');

  panel.innerHTML=
    '<div class="savings-wrap">'+
    '<div class="savings-card">'+
      '<div class="savings-title">新NISA — contribution tracker</div>'+

      '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:8px">'+
        '<div style="font-size:11px;font-weight:500;color:var(--accent);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">つみたて投資枠</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
          '<div><div style="font-size:10px;color:var(--text2);margin-bottom:3px">monthly (¥)</div>'+
            '<input type="number" step="1000" value="'+n.tsumitateMonthly+'" onchange="DATA.nisa.tsumitateMonthly=parseInt(this.value)||0;render()" style="width:100%;border:1px solid var(--border);border-radius:4px;padding:5px 8px;font-family:var(--mono);font-size:13px;background:var(--surface);color:var(--text);outline:none">'+
          '</div>'+
          '<div><div style="font-size:10px;color:var(--text2);margin-bottom:3px">→ yearly</div>'+
            '<div style="font-family:var(--mono);font-size:13px;font-weight:500;padding:5px 0">¥'+rawAnnualTs.toLocaleString()+'</div>'+
          '</div>'+
        '</div>'+
        '<div style="font-size:10px;color:var(--text3);margin-top:6px">yearly cap: ¥1,200,000'+(rawAnnualTs>1200000?' <span style="color:#8b2c2c">⚠ over cap, will be capped</span>':'')+'</div>'+
      '</div>'+

      '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:8px">'+
        '<div style="font-size:11px;font-weight:500;color:#2c4a6e;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">成長投資枠 — lump sum by year</div>'+
        '<div style="font-size:10px;color:var(--text3);margin-bottom:8px">yearly cap ¥2,400,000 · add a row for each year you plan a lump sum</div>'+
        Object.keys(n.lumpSumByYear||{}).sort().map(function(yr){
          var val=(n.lumpSumByYear[yr])||0;
          return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
            '<span style="font-family:var(--mono);font-size:12px;color:var(--text2);width:40px;flex-shrink:0">'+yr+'</span>'+
            '<span style="font-size:10px;color:var(--text3)">¥</span>'+
            '<input type="number" step="10000" value="'+val+'" onchange="DATA.nisa.lumpSumByYear[\''+yr+'\']=parseInt(this.value)||0;render()" style="flex:1;border:1px solid var(--border);border-radius:4px;padding:4px 8px;font-family:var(--mono);font-size:12px;background:var(--surface);color:var(--text);outline:none">'+
            (val>2400000?'<span style="font-size:9px;color:#8b2c2c">⚠ over cap</span>':'')+
            '<button onclick="removeNisaYear(\''+yr+'\')" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:16px;line-height:1;padding:0 2px;flex-shrink:0">×</button>'+
          '</div>';
        }).join('')+
        '<button onclick="addNisaYear()" style="width:100%;padding:5px;background:none;border:1px dashed var(--border2);border-radius:4px;font-family:var(--sans);font-size:11px;color:var(--text2);cursor:pointer;margin-top:2px">+ add year</button>'+
      '</div>'+

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'+
        '<div style="background:var(--accent-light);border:1px solid #f0c8d4;border-radius:var(--radius);padding:10px">'+
          '<div style="font-size:10px;color:var(--accent);margin-bottom:3px">tsumitate yearly</div>'+
          '<div style="font-family:var(--mono);font-size:16px;font-weight:500;color:var(--accent)">¥'+annualTs.toLocaleString()+'</div>'+
          '<div style="font-size:9px;color:var(--text3);margin-top:2px">max ¥1,200,000/yr</div>'+
        '</div>'+
        '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:10px">'+
          '<div style="font-size:10px;color:var(--text2);margin-bottom:3px">start year</div>'+
          '<input type="number" value="'+n.startYear+'" onchange="DATA.nisa.startYear=parseInt(this.value)||2026;render()" style="width:100%;background:none;border:none;outline:none;font-family:var(--mono);font-size:16px;font-weight:500;color:var(--text)">'+
        '</div>'+
      '</div>'+

      (capRow?
        '<div style="background:#fce8ee;border:1px solid #f0c8d4;border-radius:var(--radius);padding:12px;margin-bottom:10px;display:flex;align-items:center;gap:12px">'+
          '<div style="font-size:24px">🎯</div>'+
          '<div>'+
            '<div style="font-size:13px;font-weight:500;color:var(--accent)">¥18M cap reached in <strong>'+capRow.year+'</strong></div>'+
            '<div style="font-size:11px;color:var(--text2);margin-top:2px">age '+capRow.age+' · '+Math.round(capRow.year-n.startYear)+' years of contributions</div>'+
          '</div>'+
        '</div>':
        '<div style="font-size:11px;color:var(--text3);margin-bottom:10px;padding:8px;background:var(--surface2);border-radius:var(--radius)">'+
          (rawAnnualTs>0&&capRow?'tsumitate ¥'+rawAnnualTs.toLocaleString()+'/yr + lump sums → cap reached '+capRow.year+' (age '+capRow.age+')':rawAnnualTs>0?'add lump sum years above to refine cap estimate':'set a contribution above to see cap estimate')+
        '</div>')+

      '<div style="font-size:10px;font-weight:500;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">year snapshots</div>'+
      '<div class="nisa-projections">'+projCards+'</div>'+
      '<button onclick="addProjectionYear()" style="margin-top:6px;width:100%;padding:6px;background:none;border:1px dashed var(--border2);border-radius:var(--radius);font-family:var(--sans);font-size:12px;color:var(--text2);cursor:pointer">+ add year</button>'+
      '<div style="margin-top:10px;font-size:10px;color:var(--text3);line-height:1.6">Lifetime cap ¥18M shared — つみたて ¥1.2M/yr max · 成長 ¥2.4M/yr max · up to ¥3.6M/yr combined. Contributions only — no return rate estimates.</div>'+
    '</div>'+
    '<div class="savings-card">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'+
        '<div class="savings-title" style="margin-bottom:0">currencies — enter amounts you hold</div>'+
        '<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text2)">'+
          'base:'+
          '<button onclick="DATA.baseCurrency=\'JPY\';render()" style="padding:3px 10px;border-radius:10px;border:1px solid var(--border);background:'+(DATA.baseCurrency==='JPY'?'var(--accent)':'none')+';color:'+(DATA.baseCurrency==='JPY'?'#fff':'var(--text2)')+';font-size:11px;cursor:pointer;font-family:var(--sans)">JPY</button>'+
          '<button onclick="DATA.baseCurrency=\'IDR\';render()" style="padding:3px 10px;border-radius:10px;border:1px solid var(--border);background:'+(DATA.baseCurrency==='IDR'?'var(--accent)':'none')+';color:'+(DATA.baseCurrency==='IDR'?'#fff':'var(--text2)')+';font-size:11px;cursor:pointer;font-family:var(--sans)">IDR</button>'+
        '</div>'+
      '</div>'+
      '<div class="curr-grid">'+currCards+'</div>'+
      (allJpy?'<div style="border-top:1px solid var(--border);padding-top:8px;margin-top:4px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px;color:var(--text2)">total held</span><span style="font-family:var(--mono);font-size:13px;font-weight:500">'+fmtSpend(allJpy)+'</span></div>':'')+
      '<div style="margin-top:10px;font-size:10px;color:var(--text3)">Rates are editable — click the number next to a currency to update.</div>'+
    '</div>'+
    '</div>';
}

// ── SIDEBAR ───────────────────────────────────────────────────────────
function renderSidebar(){
  const sc=document.getElementById('sidebar-body');
  if(!sc) return;
  if(stab==='notes'){
    sc.innerHTML=
      DATA.notes.map(function(n,i){
        return '<div class="note-card"><textarea onchange="DATA.notes['+i+'].text=this.value" placeholder="note...">'+n.text+'</textarea><div class="note-meta"><span>'+n.date+'</span><button class="note-del icon-btn" onclick="DATA.notes.splice('+i+',1);renderSidebar()">×</button></div></div>';
      }).join('')+
      '<button class="add-btn" onclick="DATA.notes.unshift({id:\''+uid()+'\',text:\'\',date:\''+fd(today)+'\'});renderSidebar()">+ add note</button>';
  } else if(stab==='upcoming'){
    const now=new Date(today.getFullYear(),today.getMonth(),today.getDate());
    const items=[];
    (DATA.countdowns||[]).forEach(function(c){
      if(!c.date)return;
      var cmode=c.mode||'until';
      if(cmode==='since'&&!c.yearly)return;
      var d=new Date(c.date+'T00:00:00');
      var ty=new Date(now.getFullYear(),d.getMonth(),d.getDate());
      d=ty<now?new Date(now.getFullYear()+1,d.getMonth(),d.getDate()):ty;
      var diff=Math.round((d-now)/86400000);
      if(diff>=0&&diff<=365){
        var sub=diff===0?'today!':'in '+diff+' day'+(diff!==1?'s':'');
        if(cmode==='since'){var nYrs=d.getFullYear()-new Date(c.date+'T00:00:00').getFullYear();sub=diff===0?'turning '+nYrs+' today! 🎂':'turning '+nYrs+' in '+diff+' day'+(diff!==1?'s':'');}
        items.push({s:diff,html:'<div style="padding:6px 0;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:flex-start">'+
          '<div style="width:4px;height:4px;border-radius:50%;background:'+c.color+';margin-top:5px;flex-shrink:0"></div>'+
          '<div><div style="font-size:11px;font-weight:500">'+c.label+'</div>'+
          '<div style="font-size:10px;color:var(--text3);font-family:var(--mono)">'+sub+'</div></div></div>'});
      }
    });
    Object.keys(DATA.events).sort().forEach(function(key){
      const evts=DATA.events[key];if(!evts||!evts.length)return;
      const d=new Date(key+'T00:00:00');
      const diff=Math.round((d-now)/86400000);
      if(diff>=0&&diff<=60){evts.forEach(function(e){
        items.push({s:diff,html:'<div style="padding:6px 0;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:flex-start">'+
          '<div style="width:4px;height:4px;border-radius:50%;background:'+e.color+';margin-top:5px;flex-shrink:0"></div>'+
          '<div><div style="font-size:11px;font-weight:500">'+e.text+'</div>'+
          '<div style="font-size:10px;color:var(--text3);font-family:var(--mono)">'+(diff===0?'today!':'in '+diff+' day'+(diff!==1?'s':''))+'</div></div></div>'});
      });}
    });
    Object.keys(DATA.goals).forEach(function(gkey){
      if(!DATA.goals[gkey])return;
      const p=gkey.split('-'),gy=parseInt(p[0]),gm=parseInt(p[1])-1;
      const dm=(gy-today.getFullYear())*12+(gm-today.getMonth());
      if(dm>0)items.push({s:dm*30,html:'<div style="padding:6px 0;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:flex-start">'+
        '<div style="width:4px;height:4px;border-radius:50%;background:var(--lavender-text);margin-top:5px;flex-shrink:0"></div>'+
        '<div><div style="font-size:11px;font-weight:500">'+DATA.goals[gkey]+'</div>'+
        '<div style="font-size:10px;color:var(--text3);font-family:var(--mono)">in '+dm+' month'+(dm!==1?'s':'')+'</div></div></div>'});
    });
    items.sort(function(a,b){return a.s-b.s;});
    sc.innerHTML=
      '<div style="font-size:11px;font-weight:500;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">upcoming</div>'+
      (items.length?items.map(function(i){return i.html;}).join(''):'<div style="font-size:12px;color:var(--text3);padding:8px 0">nothing upcoming in 60 days</div>');
  } else if(stab==='countdowns'){
    const cds=DATA.countdowns||[];
    const now=new Date(today.getFullYear(),today.getMonth(),today.getDate());
    sc.innerHTML=
      '<div style="font-size:11px;font-weight:500;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">countdowns</div>'+
      (cds.length?cds.map(function(c){
        var cmode=c.mode||'until';
        var dispText;
        if(cmode==='since'){
          dispText=c.yearly?cdAnniversary(c.date):cdElapsed(c.date);
        } else {
          var d=new Date(c.date+'T00:00:00');
          if(c.yearly){var ty=new Date(now.getFullYear(),d.getMonth(),d.getDate());d=ty<now?new Date(now.getFullYear()+1,d.getMonth(),d.getDate()):ty;}
          var diff=Math.round((d-now)/86400000);
          dispText=diff===0?'today!':diff>0?'in '+diff+' day'+(diff!==1?'s':''):Math.abs(diff)+' day'+(Math.abs(diff)!==1?'s':'')+' ago';
          if(c.yearly)dispText+=' · yearly';
        }
        return '<div style="display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid var(--border)">'+
          '<div style="width:8px;height:8px;border-radius:50%;background:'+c.color+';flex-shrink:0"></div>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-size:12px;font-weight:500">'+c.label+'</div>'+
            '<div style="font-size:10px;color:var(--text3);font-family:var(--mono)">'+dispText+'</div>'+
          '</div>'+
          '<button class="icon-btn" onclick="openEditCountdownModal(\''+c.id+'\')">✎</button>'+
          '<button class="icon-btn" onclick="deleteCountdown(\''+c.id+'\');renderSidebar()">×</button>'+
        '</div>';
      }).join(''):'<div style="font-size:12px;color:var(--text3);padding:8px 0">no countdowns yet</div>')+
      '<button class="add-btn" onclick="openAddCountdownModal()">+ add countdown</button>';
  }
  autoSave();
}

// ── SAVE / LOAD ───────────────────────────────────────────────────────
function saveData(){
  const blob=new Blob([JSON.stringify(DATA,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='lifeOS-save.json';a.click();
  URL.revokeObjectURL(url);
  showSavedIndicator();
}

function loadFile(event){
  const file=event.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=function(e){
    try{
      DATA=JSON.parse(e.target.result);
      fileHandle=null;
      startApp();
    }catch(err){alert('Could not read file — make sure it is a lifeOS-save.json file.');}
  };
  reader.readAsText(file);
  event.target.value='';
}

// ── AUTO-SAVE ─────────────────────────────────────────────────────────
let fileHandle=null,_saveTimer=null;
function autoSave(){clearTimeout(_saveTimer);_saveTimer=setTimeout(doSave,1000);}
async function doSave(){
  if(!fileHandle)return;
  try{const w=await fileHandle.createWritable();await w.write(JSON.stringify(DATA,null,2));await w.close();showSavedIndicator();}catch(e){}
}
function showSavedIndicator(){
  const el=document.getElementById('saved-indicator');if(!el)return;
  el.style.opacity='1';clearTimeout(el._t);el._t=setTimeout(function(){el.style.opacity='0';},1500);
}
async function initAutoSave(){
  if(!window.showSaveFilePicker){
    const btn=document.getElementById('manual-save-btn');if(btn)btn.style.display='';
    const isSafari=/^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if(isSafari){const ind=document.getElementById('saved-indicator');if(ind){ind.textContent='use Chrome for auto-save';ind.style.opacity='1';}}
    return;
  }
  try{
    fileHandle=await window.showSaveFilePicker({suggestedName:'lifeOS-save.json',types:[{description:'JSON',accept:{'application/json':['.json']}}]});
  }catch(e){const btn=document.getElementById('manual-save-btn');if(btn)btn.style.display='';}
}

// ── COUNTDOWNS CRUD ───────────────────────────────────────────────────
function openAddCountdownModal(){
  openModal(
    '<div class="modal-title">add countdown</div>'+
    '<input id="cd-label" placeholder="label (e.g. Birthday)" autofocus style="margin-bottom:10px">'+
    '<div style="font-size:11px;color:var(--text2);margin-bottom:5px">type</div>'+
    '<div style="display:flex;margin-bottom:12px;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">'+
      '<button id="cd-mode-until" type="button" onclick="cdSetMode(\'until\')" style="flex:1;padding:7px;border:none;cursor:pointer;font-family:var(--sans);font-size:12px;background:var(--text);color:#fff">until →</button>'+
      '<button id="cd-mode-since" type="button" onclick="cdSetMode(\'since\')" style="flex:1;padding:7px;border:none;cursor:pointer;font-family:var(--sans);font-size:12px;background:none;color:var(--text2)">← since</button>'+
    '</div>'+
    '<input type="hidden" id="cd-mode" value="until">'+
    '<div id="cd-mode-hint" style="font-size:11px;color:var(--text3);margin:-8px 0 10px">counts down to this date</div>'+
    '<input id="cd-date" type="date" value="'+fd(today)+'" style="width:100%;border:1px solid var(--border);border-radius:var(--radius);padding:6px 8px;font-family:var(--sans);font-size:12px;background:var(--surface2);color:var(--text);outline:none;margin-bottom:8px">'+
    '<label style="display:flex;align-items:center;gap:6px;font-size:12px;margin-bottom:10px;cursor:pointer">'+
      '<input id="cd-yearly" type="checkbox" style="width:auto;margin:0;flex-shrink:0"> repeat yearly <span id="cd-yearly-hint" style="font-size:10px;color:var(--text3);font-weight:400">(recurring event)</span>'+
    '</label>'+
    '<div style="font-size:11px;color:var(--text2);margin-bottom:5px">colour</div>'+
    buildSwatches('cd-color',PALETTE[0])+
    '<div class="modal-row">'+
      '<button class="modal-btn ghost" onclick="closeModal()">cancel</button>'+
      '<button class="modal-btn primary" onclick="submitAddCountdown()">add</button>'+
    '</div>'
  );
  setTimeout(function(){var el=document.getElementById('cd-label');if(el)el.focus();},50);
}
function submitAddCountdown(){
  const label=document.getElementById('cd-label').value.trim();
  const date=document.getElementById('cd-date').value;
  const yearly=document.getElementById('cd-yearly').checked;
  const color=document.getElementById('cd-color').value;
  const mode=document.getElementById('cd-mode').value||'until';
  if(!label||!date)return;
  if(!DATA.countdowns)DATA.countdowns=[];
  DATA.countdowns.push({id:uid(),label:label,date:date,yearly:yearly,color:color,mode:mode});
  closeModal();renderSidebar();
}
function openEditCountdownModal(id){
  const c=(DATA.countdowns||[]).find(function(x){return x.id===id;});if(!c)return;
  const m=c.mode||'until';
  openModal(
    '<div class="modal-title">edit countdown</div>'+
    '<input id="cd-label" value="'+c.label+'" autofocus style="margin-bottom:10px">'+
    '<div style="font-size:11px;color:var(--text2);margin-bottom:5px">type</div>'+
    '<div style="display:flex;margin-bottom:12px;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">'+
      '<button id="cd-mode-until" type="button" onclick="cdSetMode(\'until\')" style="flex:1;padding:7px;border:none;cursor:pointer;font-family:var(--sans);font-size:12px;background:'+(m==='until'?'var(--text)':'none')+';color:'+(m==='until'?'#fff':'var(--text2)')+'">until →</button>'+
      '<button id="cd-mode-since" type="button" onclick="cdSetMode(\'since\')" style="flex:1;padding:7px;border:none;cursor:pointer;font-family:var(--sans);font-size:12px;background:'+(m==='since'?'var(--text)':'none')+';color:'+(m==='since'?'#fff':'var(--text2)')+'">← since</button>'+
    '</div>'+
    '<input type="hidden" id="cd-mode" value="'+m+'">'+
    '<div id="cd-mode-hint" style="font-size:11px;color:var(--text3);margin:-8px 0 10px">'+(m==='until'?'counts down to this date':'tracks time elapsed from this date')+'</div>'+
    '<input id="cd-date" type="date" value="'+c.date+'" style="width:100%;border:1px solid var(--border);border-radius:var(--radius);padding:6px 8px;font-family:var(--sans);font-size:12px;background:var(--surface2);color:var(--text);outline:none;margin-bottom:8px">'+
    '<label style="display:flex;align-items:center;gap:6px;font-size:12px;margin-bottom:10px;cursor:pointer">'+
      '<input id="cd-yearly" type="checkbox"'+(c.yearly?' checked':'')+' style="width:auto;margin:0;flex-shrink:0"> repeat yearly <span id="cd-yearly-hint" style="font-size:10px;color:var(--text3);font-weight:400">'+(m==='until'?'(recurring event)':'(birthday / anniversary mode)')+'</span>'+
    '</label>'+
    '<div style="font-size:11px;color:var(--text2);margin-bottom:5px">colour</div>'+
    buildSwatches('cd-color',c.color)+
    '<div class="modal-row">'+
      '<button class="modal-btn ghost" style="color:var(--accent);border-color:var(--border)" onclick="deleteCountdown(\''+id+'\');closeModal();renderSidebar()">delete</button>'+
      '<button class="modal-btn primary" onclick="submitEditCountdown(\''+id+'\')">save</button>'+
    '</div>'
  );
  setTimeout(function(){var el=document.getElementById('cd-label');if(el)el.focus();},50);
}
function submitEditCountdown(id){
  const label=document.getElementById('cd-label').value.trim();
  const date=document.getElementById('cd-date').value;
  const yearly=document.getElementById('cd-yearly').checked;
  const color=document.getElementById('cd-color').value;
  const mode=document.getElementById('cd-mode').value||'until';
  if(!label||!date)return;
  const c=(DATA.countdowns||[]).find(function(x){return x.id===id;});
  if(c){c.label=label;c.date=date;c.yearly=yearly;c.color=color;c.mode=mode;}
  closeModal();renderSidebar();
}
function deleteCountdown(id){
  if(DATA.countdowns)DATA.countdowns=DATA.countdowns.filter(function(c){return c.id!==id;});
}
function cdSetMode(m){
  var inp=document.getElementById('cd-mode');if(inp)inp.value=m;
  var bu=document.getElementById('cd-mode-until'),bs=document.getElementById('cd-mode-since');
  if(bu){bu.style.background=m==='until'?'var(--text)':'none';bu.style.color=m==='until'?'#fff':'var(--text2)';}
  if(bs){bs.style.background=m==='since'?'var(--text)':'none';bs.style.color=m==='since'?'#fff':'var(--text2)';}
  var mh=document.getElementById('cd-mode-hint');
  if(mh)mh.textContent=m==='until'?'counts down to this date':'tracks time elapsed from this date';
  var yh=document.getElementById('cd-yearly-hint');
  if(yh)yh.textContent=m==='until'?'(recurring event)':'(birthday / anniversary mode)';
}
function cdElapsed(dateStr){
  var d=new Date(dateStr+'T00:00:00');
  var now=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  var days=Math.round((now-d)/86400000);
  if(days<0)return 'in '+Math.abs(days)+' day'+(Math.abs(days)!==1?'s':'');
  if(days===0)return 'today!';
  var y=today.getFullYear()-d.getFullYear();
  var mo=today.getMonth()-d.getMonth();
  if(mo<0){y--;mo+=12;}
  if(today.getDate()<d.getDate()){mo--;if(mo<0){y--;mo+=11;}}
  if(y>=1)return y+' yr'+(y>1?'s':'')+(mo>0?' '+mo+' mo':'')+' since';
  if(mo>=2)return mo+' months since';
  return days+' day'+(days!==1?'s':'')+' since';
}
function cdAnniversary(dateStr){
  var orig=new Date(dateStr+'T00:00:00');
  var now=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  var years=today.getFullYear()-orig.getFullYear();
  var hadIt=(today.getMonth()>orig.getMonth())||(today.getMonth()===orig.getMonth()&&today.getDate()>=orig.getDate());
  if(!hadIt)years--;
  var ny=today.getFullYear();
  var thisYr=new Date(ny,orig.getMonth(),orig.getDate());
  if(thisYr<now)ny++;
  var nextDate=new Date(ny,orig.getMonth(),orig.getDate());
  var diff=Math.round((nextDate-now)/86400000);
  var nextYears=ny-orig.getFullYear();
  if(diff===0)return years+' yrs · turning '+nextYears+' today! 🎂';
  return years+' yrs · turning '+nextYears+' in '+diff+' day'+(diff!==1?'s':'');
}

function startFresh(){
  DATA={events:{},tasks:{},slots:{},spend:{},goals:{},notes:[],catLabels:{},catColors:{},countdowns:[],nisa:{tsumitateMonthly:60000,lumpSumByYear:{},startYear:2026,projectionYears:[2026,2027,2028,2030,2032,2035,2040,2045,2050,2055,2060]},currencies:{},currencyRates:{},baseCurrency:'JPY'};
  seedData();
  startApp();
}

function startApp(){
  migrateSlots();
  if(!DATA.catColors) DATA.catColors={};
  if(!DATA.currencyRates) DATA.currencyRates={};
  if(!DATA.baseCurrency) DATA.baseCurrency='JPY';
  if(!DATA.countdowns) DATA.countdowns=[];
  DATA.countdowns.forEach(function(c){if(!c.mode)c.mode='until';});
  if(!DATA.nisa.lumpSumByYear){
    DATA.nisa.lumpSumByYear={};
    if(DATA.nisa.lumpSumYearly) DATA.nisa.lumpSumByYear[DATA.nisa.startYear]=DATA.nisa.lumpSumYearly;
    delete DATA.nisa.lumpSumYearly;
  }
  document.getElementById('splash').style.display='none';
  const app=document.getElementById('app');
  app.style.display='flex';
  document.addEventListener('mouseup',tgUp);
  render();
  initAutoSave();
}

// boot
document.getElementById('app').style.display='none';
