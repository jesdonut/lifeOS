const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const MS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const HOURS=[]; const HLABELS=[];
for(let h=4;h<=23;h++){HOURS.push(h);HLABELS.push(h<12?h+'am':h===12?'12pm':(h-12)+'pm');}

const PALETTE=[
  {color:'#8FAFA2',label:'education'},
  {color:'#86AFC5',label:'family'},
  {color:'#7C9CCB',label:'friends'},
  {color:'#C79A9A',label:'health'},
  {color:'#B7A6B5',label:'partner'},
  {color:'#D69AA5',label:'personal'},
  {color:'#C49A73',label:'project'},
  {color:'#D1B36A',label:'travel'},
  {color:'#B8C89A',label:'work'},
];
function buildSwatches(inputId,selected){
  return '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">'+
    PALETTE.map(function(p){
      var sel=p.color===(selected||PALETTE[0].color);
      return '<span onclick="selectSwatch(\''+p.color+'\',\''+inputId+'\')" data-swatch="'+inputId+'" data-color="'+p.color+'"'+
        ' style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px 3px 5px;border-radius:10px;cursor:pointer;border:1.5px solid '+(sel?'var(--text)':'transparent')+';background:var(--surface2);transition:.1s">'+
        '<span style="width:10px;height:10px;border-radius:50%;background:'+p.color+';flex-shrink:0"></span>'+
        '<span style="font-size:10px;color:var(--text2)">'+p.label+'</span>'+
      '</span>';
    }).join('')+
    '<input type="hidden" id="'+inputId+'" value="'+(selected||PALETTE[0].color)+'">'+
  '</div>';
}
function selectSwatch(color,inputId){
  var inp=document.getElementById(inputId);if(inp)inp.value=color;
  document.querySelectorAll('[data-swatch="'+inputId+'"]').forEach(function(s){
    s.style.border=s.dataset.color===color?'1.5px solid var(--text)':'1.5px solid transparent';
  });
}

const SPEND_CATS=[
  {key:'food',       jp:'食べ物',          en:'Food',          group:'food'},
  {key:'commute',    jp:'通勤費',           en:'Commute',       group:'transport'},
  {key:'transport',  jp:'電車代金',         en:'Transport',     group:'necessities'},
  {key:'paperwork',  jp:'書類仕事',         en:'Paperwork',     group:'necessities'},
  {key:'medical',    jp:'メディカル',       en:'Medical',       group:'necessities'},
  {key:'necessities',jp:'日常生活',         en:'Daily',         group:'necessities'},
  {key:'nhi',        jp:'国民保険',         en:'NHI',           group:'necessities'},
  {key:'project',    jp:'ゲーム/P',         en:'Project/Game',  group:'optional'},
  {key:'fun',        jp:'エンターテインメント', en:'Entertainment', group:'optional'},
  {key:'clothes',    jp:'服・髪',           en:'Clothes/Hair',  group:'optional'},
];

const CURRENCIES=[
  {code:'JPY',flag:'🇯🇵',rate:1},{code:'IDR',flag:'🇮🇩',rate:0.0093},
  {code:'USD',flag:'🇺🇸',rate:149.5},{code:'GBP',flag:'🇬🇧',rate:189.2},
  {code:'CNY',flag:'🇨🇳',rate:20.7},{code:'KRW',flag:'🇰🇷',rate:0.109},
  {code:'MYR',flag:'🇲🇾',rate:32.1},{code:'EUR',flag:'🇪🇺',rate:161.3},
];

const today=new Date();
const MIN_YEAR=1995,MAX_YEAR=2095;
let view='week',stab='notes',cursor=new Date(today),multiYearStart=2026,focusDay=null;
let _nisaLsExpanded=false;
let _yearExpanded=null;

// DATA MODEL
// events: "YYYY-MM-DD": [{id, text, color}]
// tasks:  "YYYY-MM-DD": [{id, text, done}]
// slots:  "YYYY-MM-DD": [{id, startH, startM, endH, endM, text}]
// spend:  "YYYY-MM-DD": {food:{raw,val}, transport:{raw,val},...}
// goals:  "YYYY-MM-N":  string
// notes:  [{id, text, date}]
// nisa: {tsumitateMonthly, lumpSumYearly, startYear, projectionYears}
// currencies: {code: amount}

let DATA={events:{},tasks:{},slots:{},spend:{},goals:{},notes:[],countdowns:[],nisa:{tsumitateMonthly:60000,tsumitateByYear:{},lumpSumByYear:{},startYear:2026,startMonth:1,projectionYears:[2026,2027,2028,2030,2032,2035,2040,2045,2050,2055,2060]},currencies:{},currencyRates:{},baseCurrency:'JPY',currencyLots:[],bonds:[],bankAccounts:[{id:'bank-bca',name:'BCA',currency:'IDR',balance:0},{id:'bank-mufg',name:'MUFG',currency:'JPY',balance:0}],finance:{}};

// ── UTILS ─────────────────────────────────────────────────────────────
let _uid=0; function uid(){return 'id'+(++_uid)+Date.now();}
function fd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function isToday(d){return fd(d)===fd(today);}
function getMon(d){let day=d.getDay(),diff=day===0?-6:1-day,m=new Date(d);m.setDate(m.getDate()+diff);return m;}

function getRate(code){
  var r=DATA.currencyRates&&DATA.currencyRates[code];
  if(r==null) return CURRENCIES.find(function(c){return c.code===code;}).rate;
  return(typeof r==='object')?r.jpy||0:r;
}
function getRateIDR(code){
  var r=DATA.currencyRates&&DATA.currencyRates[code];
  if(r&&typeof r==='object'&&r.idr) return r.idr;
  var jpyRate=getRate(code),idrJpy=getRate('IDR');
  return idrJpy>0?Math.round(jpyRate/idrJpy):0;
}
function setRateJPY(code,val){
  var v=parseFloat(val);if(!v||isNaN(v))return;
  if(!DATA.currencyRates)DATA.currencyRates={};
  var ex=DATA.currencyRates[code];
  var idr=(ex&&typeof ex==='object')?ex.idr:null;
  DATA.currencyRates[code]={jpy:v,idr:idr||getRateIDR(code)};
  render();
}
function setRateIDR(code,val){
  var v=parseFloat(val);if(!v||isNaN(v))return;
  if(!DATA.currencyRates)DATA.currencyRates={};
  var ex=DATA.currencyRates[code];
  var jpy=(ex&&typeof ex==='object')?ex.jpy:(typeof ex==='number'?ex:getRate(code));
  DATA.currencyRates[code]={jpy:jpy,idr:v};
  render();
}
function fmtSpend(jpyVal){
  return '¥'+Math.round(jpyVal).toLocaleString();
}

// ── SPEND MATH ────────────────────────────────────────────────────────
function parseExpr(str){
  if(!str&&str!==0) return 0;
  const s=str.toString().trim().replace(/[^0-9+\-*/.() ]/g,'');
  if(!s) return 0;
  try{const v=Function('"use strict";return('+s+')')();return isFinite(v)?Math.round(v*100)/100:0;}
  catch(e){return parseFloat(s)||0;}
}
function spendVal(e){if(!e)return 0;if(typeof e==='object')return e.val||0;return parseFloat(e)||0;}
function daySpendTotal(key){
  const sp=DATA.spend[key]||{};
  return SPEND_CATS.reduce(function(s,c){return s+spendVal(sp[c.key]);},0);
}
function monthSpendTotal(y,m){
  let t=0,dim=new Date(y,m+1,0).getDate();
  for(let i=1;i<=dim;i++) t+=daySpendTotal(fd(new Date(y,m,i)));
  return t;
}

function commitSpend(input,dayKey,catKey){
  const val=parseExpr(input.value.trim());
  if(!DATA.spend[dayKey]) DATA.spend[dayKey]={};
  DATA.spend[dayKey][catKey]=val||0;
  input.value=val||'';
  autoSave();
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
    buildSwatches('evt-color',PALETTE[0].color)+
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

function openEditEventModal(key,id){
  var evt=(DATA.events[key]||[]).find(function(e){return e.id===id;});
  if(!evt) return;
  var dateStyle='width:100%;border:1px solid var(--border);border-radius:var(--radius);padding:6px 8px;font-family:var(--sans);font-size:12px;background:var(--surface2);color:var(--text);outline:none;margin-bottom:8px';
  openModal(
    '<div class="modal-title">edit event</div>'+
    '<input id="evt-text" value="'+evt.text.replace(/"/g,'&quot;')+'" placeholder="event name...">'+
    '<input id="evt-date" type="date" value="'+key+'" style="'+dateStyle+'">'+
    '<div style="font-size:11px;color:var(--text2);margin-bottom:5px">colour</div>'+
    buildSwatches('evt-color',evt.color)+
    '<div class="modal-row">'+
      '<button class="modal-btn ghost" style="color:var(--bad)" onclick="deleteEvent(\''+key+'\',\''+id+'\');closeModal();render()">delete</button>'+
      '<button class="modal-btn ghost" onclick="closeModal()">cancel</button>'+
      '<button class="modal-btn primary" onclick="submitEditEvent(\''+key+'\',\''+id+'\')">save</button>'+
    '</div>'
  );
  setTimeout(function(){var el=document.getElementById('evt-text');if(el){el.focus();el.select();}},50);
}
function submitEditEvent(origKey,id){
  var text=document.getElementById('evt-text').value.trim();
  var color=document.getElementById('evt-color').value;
  var newKey=document.getElementById('evt-date').value;
  if(!text) return;
  if(newKey===origKey){
    var evt=(DATA.events[origKey]||[]).find(function(e){return e.id===id;});
    if(evt){evt.text=text;evt.color=color;}
  } else {
    deleteEvent(origKey,id);
    addEvent(newKey,text,color);
  }
  autoSave();
  closeModal();
  render();
}

// ── VIEW / NAV ────────────────────────────────────────────────────────
function setView(v){view=v;document.querySelectorAll('.vbtn').forEach(function(b){b.classList.toggle('active',b.textContent===v);});render();}
function setSTab(t){stab=t;document.querySelectorAll('.stab').forEach(function(b){b.classList.toggle('active',b.textContent===t);});renderSidebar();}
function nav(dir){
  if(view==='week'){cursor.setDate(cursor.getDate()+dir*7);focusDay=null;}
  else if(view==='month') cursor.setMonth(cursor.getMonth()+dir);
  else if(view==='year') cursor.setFullYear(cursor.getFullYear()+dir);
  else if(view==='finance') cursor.setMonth(cursor.getMonth()+dir);
  var cy=cursor.getFullYear();
  if(cy<MIN_YEAR){cursor=new Date(MIN_YEAR,0,1);}
  if(cy>MAX_YEAR){cursor=new Date(MAX_YEAR,11,31);}
  multiYearStart=Math.max(MIN_YEAR,Math.min(MAX_YEAR-4,multiYearStart));
  render();
}
function jumpWeek(key){const p=key.split('-');cursor=new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));focusDay=key;setView('week');}
function jumpMonth(y,m){cursor=new Date(y,m,1);setView('month');}

function render(){
  const panel=document.getElementById('main-panel');
  const label=document.getElementById('period-label');
  panel.style.display='';panel.style.flexDirection='';
  if(view==='week'){
    const mon=getMon(new Date(cursor)),sun=new Date(mon);sun.setDate(sun.getDate()+6);
    label.textContent=MS[mon.getMonth()]+' '+mon.getDate()+' – '+MS[sun.getMonth()]+' '+sun.getDate()+' '+mon.getFullYear();
    renderWeek(panel,mon);
  }else if(view==='month'){
    label.textContent=MONTHS[cursor.getMonth()]+' '+cursor.getFullYear();
    renderMonth(panel,new Date(cursor));
  }else if(view==='year'){
    label.textContent=cursor.getFullYear();
    renderYear(panel,cursor.getFullYear());
  }else if(view==='savings'){
    label.textContent='savings & NISA';
    renderSavings(panel);
  }else if(view==='finance'){
    label.textContent=MONTHS[cursor.getMonth()]+' '+cursor.getFullYear();
    renderFinance(panel,cursor.getFullYear(),cursor.getMonth());
  }
  renderSidebar();
  autoSave();
}

// ── WEEK VIEW ─────────────────────────────────────────────────────────
function renderWeek(panel,mon){
  let cols='',weekTotal=0;
  for(let i=0;i<7;i++){
    const d=new Date(mon);d.setDate(mon.getDate()+i);
    const key=fd(d);
    const evts=getEvents(key);
    const tasks=getTasks(key);
    const spend=daySpendTotal(key);
    weekTotal+=spend;

    const evtHtml=evts.map(function(e){
      return '<div class="wc-evt" style="cursor:pointer;background:'+e.color+'18;color:'+e.color+'" onclick="openEditEventModal(\''+key+'\',\''+e.id+'\')">'+
        '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">'+e.text+'</span>'+
        '<button style="background:none;border:none;cursor:pointer;color:inherit;opacity:.6;font-size:10px;flex-shrink:0" onclick="event.stopPropagation();deleteEvent(\''+key+'\',\''+e.id+'\');render()">×</button>'+
      '</div>';
    }).join('');

    const taskHtml=tasks.map(function(t){
      return '<div class="wc-task'+(t.done?' done':'')+'" onclick="toggleTask(\''+key+'\',\''+t.id+'\');render()">'+
        '<span class="wc-task-text">'+t.text+'</span>'+
        '<button class="wc-task-del icon-btn" onclick="event.stopPropagation();deleteTask(\''+key+'\',\''+t.id+'\');render()">×</button>'+
      '</div>';
    }).join('');

    cols+=
      '<div class="week-col'+(isToday(d)?' today-col':'')+(focusDay&&fd(d)===focusDay?' focus-col':'')+'">'+
        '<div class="wc-head">'+
          '<div class="wc-dow">'+DAYS[i]+'</div>'+
          '<div class="wc-num">'+d.getDate()+'</div>'+
          (isToday(d)?'<div style="width:5px;height:5px;border-radius:50%;background:var(--accent);margin:2px auto 0"></div>':'')+
        '</div>'+
        evtHtml+
        taskHtml+
        '<input class="wc-task-input" placeholder="+ task" onkeydown="if(event.key===\'Enter\'&&this.value.trim()){addTask(\''+key+'\',this.value);this.value=\'\';render()}" />'+
        '<button onclick="openAddEventModal(\''+key+'\')" style="background:none;border:1px dashed var(--border2);border-radius:10px;padding:2px 6px;font-size:10px;color:var(--text3);cursor:pointer;width:100%">+ event</button>'+
        (spend?'<div class="wc-spend">'+fmtSpend(spend)+'</div>':'')+
      '</div>';
  }
  // ── spend panel ──
  const wkDays=[];
  for(let si=0;si<7;si++){const sd=new Date(mon);sd.setDate(mon.getDate()+si);wkDays.push({d:sd,key:fd(sd)});}
  var spHdr='<div class="wk-sp-corner">spend</div>'+
    wkDays.map(function(di,i){return '<div class="wk-sp-hdr">'+DAYS[i][0]+'<span class="wk-sp-hdr-n">'+di.d.getDate()+'</span></div>';}).join('');
  var spRows=SPEND_CATS.map(function(cat){
    return '<div class="wk-sp-lab"><span class="wk-sp-jp">'+cat.jp+'</span><span class="wk-sp-en">'+cat.en+'</span></div>'+
      wkDays.map(function(di){
        var val=spendVal((DATA.spend[di.key]||{})[cat.key]);
        return '<div class="wk-sp-cell"><input class="wk-sp-inp" type="text" inputmode="decimal" value="'+(val||'')+'" placeholder="0"'+
          ' onchange="commitSpend(this,\''+di.key+'\',\''+cat.key+'\');render()"></div>';
      }).join('');
  }).join('');
  var spTots='<div class="wk-sp-corner wk-sp-tot-lab">total</div>'+
    wkDays.map(function(di){
      var tot=daySpendTotal(di.key);
      return '<div class="wk-sp-tot">'+(tot?fmtSpend(tot):'—')+'</div>';
    }).join('');

  panel.style.display='flex';
  panel.style.flexDirection='column';
  panel.innerHTML=
    '<div class="week-shell"><div class="wk-shell-spacer"></div>'+cols+spHdr+spRows+spTots+'</div>'+
    '<div class="wk-spend-toggle">'+
      '<span style="font-family:var(--mono);font-size:11px;color:var(--text2)">week '+fmtSpend(weekTotal)+'</span>'+
    '</div>';
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
    const spend=daySpendTotal(ckey);
    const isTod=isToday(cdate);
    cells+=
      '<div class="mc'+(isTod?' today-mc':'')+(other?' other':'')+'" onclick="jumpWeek(\''+ckey+'\')">'+
        '<div class="mc-num">'+cd+'</div>'+
        evts.slice(0,2).map(function(e){return '<div class="mc-item" style="background:'+e.color+'18;color:'+e.color+';cursor:pointer" onclick="event.stopPropagation();openEditEventModal(\''+ckey+'\',\''+e.id+'\')">'+e.text+'</div>';}).join('')+
        tasks.slice(0,1).map(function(t){return '<div class="mc-item" style="background:#e8e0f5;color:#9b7ec8">'+t.text+'</div>';}).join('')+
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
var _CAT_MAP={
  '#b8c89a':'work','#c49a73':'work',
  '#d1b36a':'travel',
  '#8fafa2':'learn',
  '#86afc5':'life','#7c9ccb':'life','#c79a9a':'life','#b7a6b5':'life','#d69aa5':'life',
};
function evtCat(color){return _CAT_MAP[(color||'').toLowerCase()]||'other';}
function yearEvtCounts(y){
  var pfx=String(y)+'-';
  var c={work:0,life:0,learn:0,travel:0,other:0};
  Object.keys(DATA.events).filter(function(k){return k.startsWith(pfx);}).forEach(function(k){
    DATA.events[k].forEach(function(e){c[evtCat(e.color)]++;});
  });
  return c;
}
function renderYear(panel,year){
  multiYearStart=Math.max(MIN_YEAR,Math.min(MAX_YEAR-4,year-2));
  const birthYear=1995;
  const allNisaRows=nisaCalc();

  // ── decade nav strip ──
  var decStart=Math.max(MIN_YEAR,year-5);
  var decEnd=Math.min(MAX_YEAR,decStart+10);
  decStart=Math.max(MIN_YEAR,decEnd-10);
  var decStrip='<div class="yr-strip">';
  for(var dy=decStart;dy<=decEnd;dy++){
    var dage=dy-birthYear;
    var dcounts=yearEvtCounts(dy);
    var catKeys=['work','life','learn','travel','other'];
    var catClrs={work:'var(--c-work)',life:'var(--c-life)',learn:'var(--c-learn)',travel:'var(--c-travel)',other:'var(--text3)'};
    var ddots=catKeys.filter(function(c){return dcounts[c]>0;}).map(function(c){
      return '<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:'+catClrs[c]+';margin:1px"></span>';
    }).join('');
    decStrip+=
      '<div class="yr-strip-card'+(dy===year?' yr-strip-cur':'')+'" onclick="cursor=new Date('+dy+',0,1);render()" title="'+dy+'">'+
        '<div class="yr-strip-yr">'+dy+'</div>'+
        '<div class="yr-strip-age">age '+dage+'</div>'+
        '<div class="yr-strip-dots">'+ddots+'</div>'+
      '</div>';
  }
  decStrip+='</div>';

  // ── year cards ──
  let strip='';
  for(let y=multiYearStart;y<multiYearStart+5;y++){
    const age=y-birthYear;
    const focused=y===year;
    // ── timeline ──
    const tlByMonth={};
    for(let tlm=0;tlm<12;tlm++){
      const tmk=String(y)+'-'+String(tlm+1).padStart(2,'0');
      Object.keys(DATA.events).filter(function(k){return k.startsWith(tmk);}).forEach(function(k){
        DATA.events[k].forEach(function(e){
          if(!tlByMonth[tlm+1]) tlByMonth[tlm+1]=[];
          tlByMonth[tlm+1].push({text:e.text,color:e.color});
        });
      });
    }
    let tlTracks=0;
    for(let tmi=1;tmi<=12;tmi++) tlTracks=Math.max(tlTracks,(tlByMonth[tmi]||[]).length);
    const tlMLabels=Array.from({length:12},function(_,i){return '<div class="yr-tl-mlabel" style="grid-column:'+(i+1)+'">'+MS[i]+'</div>';}).join('');
    const tlChips=Array.from({length:Math.max(tlTracks,0)},function(){return '';});
    for(let tmi=1;tmi<=12;tmi++){
      (tlByMonth[tmi]||[]).forEach(function(e,ti){
        tlChips[ti]+='<div class="yr-tl-chip" style="grid-column:'+tmi+';background:'+e.color+'18" title="'+e.text.replace(/"/g,'&quot;')+'">'+
          '<span class="yr-tl-dot" style="background:'+e.color+'"></span><span class="yr-tl-txt" style="color:'+e.color+'">'+e.text+'</span></div>';
      });
    }
    const tlHtml=
      '<div class="yr-timeline">'+
        '<div class="yr-tl-header">'+tlMLabels+'</div>'+
        tlChips.map(function(c){return '<div class="yr-tl-track">'+c+'</div>';}).join('')+
      '</div>';
    const nisaRow=allNisaRows.find(function(r){return r.year===y;});
    const contrib=nisaRow?nisaRow.cumulative:0;
    const thisYrDelta=nisaRow?nisaRow.total:0;
    const nisPct=Math.min(100,Math.round(contrib/180000));
    const yCounts=yearEvtCounts(y);
    const summaryKey=y+'-sum';
    const catBadges=['work','life','learn','travel'].filter(function(c){return yCounts[c]>0;}).map(function(c){
      return '<span class="yr-cat-badge yr-cat-'+c+'">'+yCounts[c]+' '+c+'</span>';
    }).join('');
    const nisaRight=
      '<div class="yr-hdr-nisa">'+
        '<div class="yr-hdr-nisa-bar"><div class="yr-hdr-nisa-fill" style="width:'+nisPct+'%"></div></div>'+
        '<div class="yr-hdr-nisa-vals">'+
          '<span class="yr-hdr-nisa-v">¥'+contrib.toLocaleString()+'</span>'+
          '<span class="yr-hdr-nisa-p">'+nisPct+'%</span>'+
          (thisYrDelta>0?'<span class="yr-hdr-nisa-d">+¥'+thisYrDelta.toLocaleString()+'</span>':'')+
        '</div>'+
      '</div>';
    // ── aims footer ──
    const footerCols=[
      {icon:'★',placeholder:'aim...',key:y+'-0-0'},
      {icon:'▶',placeholder:'checkpoint...',key:y+'-0-1'},
      {icon:'—',placeholder:'note...',key:y+'-0-2'},
    ];
    const footerHtml=
      '<div class="yr-footer">'+
        footerCols.map(function(fc){
          return '<div class="yr-footer-col">'+
            '<span class="yr-footer-icon">'+fc.icon+'</span>'+
            '<input class="yr-footer-inp" placeholder="'+fc.placeholder+'" value="'+(DATA.goals[fc.key]||'')+'" onchange="DATA.goals[\''+fc.key+'\']=this.value;autoSave()">'+
          '</div>';
        }).join('')+
      '</div>';

    // ── collapse sparse years ──
    const totalEvtCount=Object.values(yCounts).reduce(function(s,n){return s+n;},0);
    const isExpanded=focused||_yearExpanded===y||totalEvtCount>0;
    if(!isExpanded){
      strip+=
        '<div class="my-year-section yr-collapsed" onclick="_yearExpanded='+y+';render()">'+
          '<span class="my-year-num">'+y+'</span>'+
          '<span class="my-year-age">age '+age+'</span>'+
          '<span class="yr-collapsed-meta">'+(contrib>0?'NISA ¥'+contrib.toLocaleString():'no NISA')+(DATA.goals[summaryKey]?' · '+DATA.goals[summaryKey]:'')+'</span>'+
          '<span class="yr-collapsed-expand">expand →</span>'+
        '</div>';
    } else {
      strip+=
        '<div class="my-year-section'+(focused?' my-year-focused':'')+'">'+
          '<div class="yr-card-hdr">'+
            '<div class="yr-card-left">'+
              '<span class="my-year-num" onclick="cursor=new Date('+y+',0,1);render()" style="cursor:pointer" title="view '+y+'">'+y+'</span>'+
              '<span class="my-year-age">age '+age+'</span>'+
              (catBadges?'<div class="yr-cat-badges">'+catBadges+'</div>':'')+
            '</div>'+
            '<div class="yr-card-center">'+
              '<input class="yr-summary-inp" placeholder="year summary..." value="'+(DATA.goals[summaryKey]||'')+'" onchange="DATA.goals[\''+summaryKey+'\']=this.value;autoSave()">'+
            '</div>'+
            '<div class="yr-card-right">'+nisaRight+'</div>'+
          '</div>'+
          tlHtml+
          footerHtml+
        '</div>';
    }
  }

  // ── 12-month detail (focused year only, months with events) ──
  let blocks='';
  for(let m=0;m<12;m++){
    const mKeyFilt=year+'-'+String(m+1).padStart(2,'0');
    const mHasEv=Object.keys(DATA.events).some(function(k){return k.startsWith(mKeyFilt);});
    if(!mHasEv) continue;
    const fd_=new Date(year,m,1),startDow=(fd_.getDay()+6)%7,dim=new Date(year,m+1,0).getDate(),prevDim=new Date(year,m,0).getDate();
    let cells=DAYS.map(function(d){return '<div class="ymb-mini-dow">'+d[0]+'</div>';}).join('');
    for(let i=0;i<startDow;i++) cells+='<div class="ymb-mini-day other">'+(prevDim-startDow+1+i)+'</div>';
    for(let day=1;day<=dim;day++){
      const cdate=new Date(year,m,day),ckey=fd(cdate);
      const hasEv=getEvents(ckey).length>0;
      const hasTask=getTasks(ckey).filter(function(t){return !t.done;}).length>0;

      cells+='<div class="ymb-mini-day'+
        (hasEv?' has-ev':hasTask?' has-task':'')+
        (isToday(cdate)?' is-today':'')+
        '" onclick="jumpWeek(\''+ckey+'\')" title="'+ckey+'">'+day+'</div>';
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

  panel.innerHTML=
    '<div style="display:flex;flex-direction:column;gap:16px">'+
      decStrip+
      strip+
      (blocks?'<div class="year-grid">'+blocks+'</div>':'')+
    '</div>';
}

// ── SAVINGS VIEW ──────────────────────────────────────────────────────
function getTsumitateForYear(n,y){
  var keys=Object.keys(n.tsumitateByYear||{}).map(Number).filter(function(k){return k<=y;}).sort(function(a,b){return b-a;});
  return keys.length?n.tsumitateByYear[keys[0]]:0;
}
function nisaToggleLs(){_nisaLsExpanded=!_nisaLsExpanded;render();}
function nisaCalc(){
  var n=DATA.nisa,birthYear=1995;
  var cumulative=0,rows=[];
  for(var y=n.startYear;y<=2100;y++){
    if(cumulative>=18000000) break;
    var months=y===n.startYear?(13-(n.startMonth||1)):12;
    var annualTs=Math.min(getTsumitateForYear(n,y)*months,1200000);
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
function addTsumitateYear(){
  var y=parseInt(prompt('Year to configure monthly tsumitate for (e.g. 2027):'));
  if(!y||y<2020||y>2100) return;
  if(!DATA.nisa.tsumitateByYear) DATA.nisa.tsumitateByYear={};
  if(!(y in DATA.nisa.tsumitateByYear)) DATA.nisa.tsumitateByYear[y]=getTsumitateForYear(DATA.nisa,y)||0;
  render();
}
function removeTsumitateYear(yr){
  if(DATA.nisa.tsumitateByYear) delete DATA.nisa.tsumitateByYear[yr];
  render();
}
function updateBankBalance(id,val){
  var a=(DATA.bankAccounts||[]).find(function(b){return b.id===id;});
  if(a) a.balance=parseFloat(val)||0;
  render();
}
function addBankAccount(){
  var name=prompt('Account name (e.g. BNI):');
  if(!name||!name.trim()) return;
  var currency=prompt('Currency code (e.g. IDR, JPY, USD):');
  if(!currency||!currency.trim()) return;
  if(!DATA.bankAccounts) DATA.bankAccounts=[];
  DATA.bankAccounts.push({id:uid(),name:name.trim(),currency:currency.trim().toUpperCase(),balance:0});
  render();
}
function deleteBankAccount(id){
  DATA.bankAccounts=(DATA.bankAccounts||[]).filter(function(a){return a.id!==id;});
  render();
}
function renderSavings(panel){
  var n=DATA.nisa,birthYear=1995;
  var thisYear=new Date().getFullYear();
  var allRows=nisaCalc();
  var capRow=allRows.find(function(r){return r.capReached;});
  var thisYearRow=allRows.find(function(r){return r.year===thisYear;});
  var lastRow=allRows.length?allRows[allRows.length-1]:null;
  var totalPlannedTs=allRows.reduce(function(s,r){return s+r.tsumitate;},0);
  var totalPlannedLs=allRows.reduce(function(s,r){return s+r.lumpsum;},0);
  var tsPct=Math.round(totalPlannedTs/180000);
  var lsPct=Math.round(totalPlannedLs/180000);
  var yearsCount=allRows.length||1;
  var avgPace=lastRow?Math.round(lastRow.cumulative/yearsCount):0;
  var thisYearTotal=thisYearRow?thisYearRow.total:0;
  var curYearMonthly=getTsumitateForYear(n,thisYear);
  var lsKeys=Object.keys(n.lumpSumByYear||{}).sort();
  var lsNonEmpty=lsKeys.filter(function(yr){return (n.lumpSumByYear[yr]||0)>0;});
  var lsEmpty=lsKeys.filter(function(yr){return (n.lumpSumByYear[yr]||0)===0;});
  var lsShow=_nisaLsExpanded?lsKeys:lsNonEmpty;
  var projRows=allRows.filter(function(r){return n.projectionYears.indexOf(r.year)>=0;});
  var notStarted=n.projectionYears.filter(function(y){return y<n.startYear;});

  var tsRows=Object.keys(n.tsumitateByYear||{}).sort().map(function(yr){
    var monthly=(n.tsumitateByYear[yr])||0;
    var yearly=monthly*12;
    var overCap=yearly>1200000;
    return '<div class="nisa-tl-row">'+
      '<span class="nisa-tl-yr">'+yr+'</span>'+
      '<input class="nisa-tl-inp" type="number" step="1000" value="'+monthly+'" onchange="DATA.nisa.tsumitateByYear[\''+yr+'\']=parseInt(this.value)||0;render()">'+
      '<span class="nisa-tl-annot">¥'+Math.round(Math.min(yearly,1200000)/10000)+'万</span>'+
      (overCap?'<span style="font-size:9px;color:#8b2c2c">!</span>':'')+
      '<button class="nisa-tl-x" onclick="removeTsumitateYear(\''+yr+'\')">×</button>'+
    '</div>';
  }).join('');

  var lsRowsHtml=lsShow.map(function(yr){
    var val=(n.lumpSumByYear[yr])||0;
    var overCap=val>2400000;
    return '<div class="nisa-tl-row">'+
      '<span class="nisa-tl-yr">'+yr+'</span>'+
      '<input class="nisa-tl-inp" type="number" step="10000" value="'+val+'" onchange="DATA.nisa.lumpSumByYear[\''+yr+'\']=parseInt(this.value)||0;render()">'+
      (overCap?'<span style="font-size:9px;color:#8b2c2c">!</span>':'')+
      '<button class="nisa-tl-x" onclick="removeNisaYear(\''+yr+'\')">×</button>'+
    '</div>';
  }).join('');
  var lsToggle=lsEmpty.length?
    '<div class="nisa-tl-skip" onclick="nisaToggleLs()">'+
      (_nisaLsExpanded?'▾ hide '+lsEmpty.length+' empty':('▸ '+lsEmpty.length+' empty ¥0 year'+(lsEmpty.length!==1?'s':'')))+
    '</div>':'';

  var snapRows=notStarted.map(function(y){
    return '<tr class="nisa-snap-row">'+
      '<td class="nisa-snap-yr">'+y+'</td>'+
      '<td style="color:var(--text3)">'+( y-birthYear)+'</td>'+
      '<td colspan="3" style="font-size:10px;color:var(--text3)">before start</td>'+
      '<td></td>'+
      '<td><button class="icon-btn" onclick="removeProjectionYear('+y+')">×</button></td>'+
    '</tr>';
  }).join('');
  snapRows+=projRows.map(function(r){
    var tPct=Math.round(r.tsumitate/180000);
    var lPct=Math.round(r.lumpsum/180000);
    return '<tr class="nisa-snap-row">'+
      '<td class="nisa-snap-yr">'+r.year+'</td>'+
      '<td style="color:var(--text3)">'+r.age+'</td>'+
      '<td style="font-family:var(--mono);font-size:10px">¥'+Math.round(r.tsumitate/10000)+'万</td>'+
      '<td style="font-family:var(--mono);font-size:10px">'+(r.lumpsum?'¥'+Math.round(r.lumpsum/10000)+'万':'—')+'</td>'+
      '<td style="font-family:var(--mono);font-weight:500;color:var(--accent)">¥'+Math.round(r.cumulative/10000)+'万</td>'+
      '<td><div class="nisa-snap-bar"><div style="width:'+tPct+'%;background:var(--accent)"></div><div style="width:'+lPct+'%;background:#2c4a6e"></div></div></td>'+
      '<td><button class="icon-btn" onclick="removeProjectionYear('+r.year+')">×</button></td>'+
    '</tr>';
  }).join('');

  var allJpy=CURRENCIES.filter(function(c){return c.code!=='JPY';}).reduce(function(s,c){var a=parseFloat(DATA.currencies[c.code]||0);return s+(a?Math.round(a*getRate(c.code)):0);},0);
  var allIdr=CURRENCIES.filter(function(c){return c.code!=='JPY'&&c.code!=='IDR';}).reduce(function(s,c){var a=parseFloat(DATA.currencies[c.code]||0);return s+(a?Math.round(a*getRateIDR(c.code)):0);},0);
  var currCards=CURRENCIES.filter(function(c){return c.code!=='JPY';}).map(function(c){
    var amt=DATA.currencies[c.code]||'';
    var jpyRate=getRate(c.code);
    var idrRate=getRateIDR(c.code);
    var jpyEq=amt?Math.round(parseFloat(amt)*jpyRate):0;
    var idrEq=amt?Math.round(parseFloat(amt)*idrRate):0;
    var lots=(DATA.currencyLots||[]).filter(function(l){return l.code===c.code;});
    var lotsHtml='';
    if(lots.length){
      var totalCost=lots.reduce(function(s,l){return s+l.rateIDR;},0);
      var totalNow=lots.reduce(function(s,l){return s+l.amount*idrRate;},0);
      var totalPL=Math.round(totalNow-totalCost);
      lotsHtml='<div style="margin-top:6px;border-top:1px solid var(--border);padding-top:5px">'+
        lots.map(function(l){
          var costPerUnit=l.rateIDR/l.amount;
          var pl=Math.round((idrRate-costPerUnit)*l.amount);
          var plColor=pl>=0?'#2d5a3d':'#8b2c2c';
          return '<div style="font-size:9px;color:var(--text3);display:flex;justify-content:space-between;align-items:center;gap:3px;margin-bottom:3px">'+
            '<span>'+l.date.slice(5)+'</span>'+
            '<span>'+l.amount.toLocaleString()+'@'+Math.round(costPerUnit).toLocaleString()+'</span>'+
            '<span style="color:'+plColor+';font-weight:500">'+(pl>=0?'+':'')+'Rp'+Math.abs(pl).toLocaleString()+'</span>'+
            '<button onclick="deleteLot(\''+l.id+'\')" style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--text3);padding:0;line-height:1;flex-shrink:0">×</button>'+
          '</div>';
        }).join('')+
        '<div style="font-size:9px;font-weight:600;color:'+(totalPL>=0?'#2d5a3d':'#8b2c2c')+';padding-top:3px;border-top:1px solid var(--border)">P&L '+(totalPL>=0?'+':'')+'Rp'+Math.abs(totalPL).toLocaleString()+'</div>'+
      '</div>';
    }
    return '<div class="curr-card">'+
      '<div style="font-size:16px;margin-bottom:2px">'+c.flag+'</div>'+
      '<div class="curr-code">'+c.code+'</div>'+
      '<input class="curr-input" type="number" placeholder="0" value="'+amt+'" onchange="DATA.currencies[\''+c.code+'\']=this.value;render()" />'+
      '<div style="display:flex;align-items:center;gap:3px;margin-top:4px;border-top:1px solid var(--border);padding-top:4px">'+
        '<span style="font-size:9px;color:var(--text3);flex-shrink:0">1'+c.code+'=</span>'+
        '<input type="number" step="any" value="'+jpyRate+'" onchange="setRateJPY(\''+c.code+'\',this.value)" style="width:50px;background:none;border:none;outline:none;font-family:var(--mono);font-size:10px;color:var(--text2)"/>'+
        '<span style="font-size:9px;color:var(--text3)">¥</span>'+
        '<input type="number" step="any" value="'+idrRate+'" onchange="setRateIDR(\''+c.code+'\',this.value)" style="width:60px;background:none;border:none;outline:none;font-family:var(--mono);font-size:10px;color:var(--text2)"/>'+
        '<span style="font-size:9px;color:var(--text3)">Rp</span>'+
      '</div>'+
      (jpyEq?'<div class="curr-jpy">¥'+jpyEq.toLocaleString()+' · Rp'+idrEq.toLocaleString()+'</div>':'')+
      lotsHtml+
      '<button onclick="openAddLotModal(\''+c.code+'\')" style="margin-top:5px;width:100%;background:none;border:1px dashed var(--border2);border-radius:var(--radius);font-size:9px;color:var(--text2);padding:2px 0;cursor:pointer;font-family:var(--sans)">+ lot</button>'+
    '</div>';
  }).join('');

  var activeBonds=(DATA.bonds||[]).filter(function(b){return !bondIsMatured(b);});
  var maturedBonds=(DATA.bonds||[]).filter(function(b){return bondIsMatured(b);});
  var totalMonthlyNet=activeBonds.reduce(function(s,b){return s+bondMonthlyNet(b);},0);

  var activeBondCards=activeBonds.map(function(b){
    var monthly=bondMonthlyNet(b);
    var received=bondReceivedNet(b);
    var total=bondTotalNet(b);
    var remaining=bondRemainingNet(b);
    var days=bondDaysToMaturity(b);
    var daysLabel=days<=0?'matured':days===1?'1 day to maturity':days+' days to maturity';
    var pct=total>0?Math.round(received/total*100):0;
    return '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:10px;margin-bottom:8px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'+
        '<span style="font-weight:600;font-size:13px;font-family:var(--mono)">'+b.series+'</span>'+
        '<div style="display:flex;gap:6px">'+
          '<button onclick="toggleBondMatured(\''+b.id+'\')" style="font-size:10px;background:none;border:1px solid var(--border);border-radius:6px;padding:2px 7px;cursor:pointer;color:var(--text2);font-family:var(--sans)">mark matured</button>'+
          '<button onclick="deleteBond(\''+b.id+'\')" style="font-size:11px;background:none;border:none;cursor:pointer;color:var(--text3);padding:0 2px">×</button>'+
        '</div>'+
      '</div>'+
      '<div style="font-size:11px;color:var(--text2);margin-bottom:4px">Rp '+b.faceValue.toLocaleString()+' · '+(b.couponRate*100).toFixed(2)+'% gross · '+(b.taxRate*100)+'% tax</div>'+
      '<div style="display:flex;gap:16px;font-size:11px;margin-bottom:6px">'+
        '<div><div style="color:var(--text3);font-size:10px">net/month</div><div style="font-family:var(--mono);font-weight:600">Rp '+monthly.toLocaleString()+'</div></div>'+
        '<div><div style="color:var(--text3);font-size:10px">received</div><div style="font-family:var(--mono)">Rp '+received.toLocaleString()+'</div></div>'+
        '<div><div style="color:var(--text3);font-size:10px">remaining</div><div style="font-family:var(--mono)">Rp '+remaining.toLocaleString()+'</div></div>'+
      '</div>'+
      '<div style="background:var(--border);border-radius:4px;height:4px;margin-bottom:5px"><div style="background:var(--accent);height:4px;border-radius:4px;width:'+pct+'%"></div></div>'+
      '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3)">'+
        '<span>'+pct+'% of Rp '+total.toLocaleString()+' received</span>'+
        '<span>'+(days<=0?'<span style="color:var(--accent)">matured</span>':daysLabel)+'</span>'+
      '</div>'+
    '</div>';
  }).join('');

  var maturedArchive=maturedBonds.length?
    '<details style="margin-top:8px"><summary style="font-size:11px;color:var(--text2);cursor:pointer;padding:4px 0">matured bonds ('+maturedBonds.length+')</summary>'+
    maturedBonds.map(function(b){
      var total=bondTotalNet(b);
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:11px">'+
        '<span style="font-family:var(--mono);font-weight:500">'+b.series+'</span>'+
        '<span style="color:var(--text2)">Rp '+b.faceValue.toLocaleString()+'</span>'+
        '<span style="color:var(--text2)">earned Rp '+total.toLocaleString()+'</span>'+
        '<div style="display:flex;gap:6px">'+
          '<button onclick="toggleBondMatured(\''+b.id+'\')" style="font-size:10px;background:none;border:1px solid var(--border);border-radius:6px;padding:2px 7px;cursor:pointer;color:var(--text2);font-family:var(--sans)">reactivate</button>'+
          '<button onclick="deleteBond(\''+b.id+'\')" style="font-size:11px;background:none;border:none;cursor:pointer;color:var(--text3);padding:0 2px">×</button>'+
        '</div>'+
      '</div>';
    }).join('')+
    '</details>':'';

  var bankRows=(DATA.bankAccounts||[]).map(function(a){
    var jpyVal=a.currency==='JPY'?a.balance:(a.balance*(a.currency==='IDR'?getRate('IDR'):getRate(a.currency)));
    var idrVal=a.currency==='IDR'?a.balance:(a.currency==='JPY'?Math.round(a.balance/getRate('IDR')):Math.round(a.balance*getRateIDR(a.currency)));
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
      '<span style="font-size:12px;font-weight:500;color:var(--text);min-width:48px">'+a.name+'</span>'+
      '<span style="font-size:10px;color:var(--text3);min-width:28px">'+a.currency+'</span>'+
      '<input type="number" step="1000" value="'+a.balance+'" onchange="updateBankBalance(\''+a.id+'\',this.value)" style="flex:1;border:1px solid var(--border);border-radius:4px;padding:4px 8px;font-family:var(--mono);font-size:12px;background:var(--surface);color:var(--text);outline:none">'+
      '<span style="font-size:10px;color:var(--text2);white-space:nowrap">¥'+Math.round(jpyVal).toLocaleString()+' · Rp'+idrVal.toLocaleString()+'</span>'+
      '<button onclick="deleteBankAccount(\''+a.id+'\')" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:16px;line-height:1;padding:0 2px;flex-shrink:0">×</button>'+
    '</div>';
  }).join('');
  var bankTotalJpy=(DATA.bankAccounts||[]).reduce(function(s,a){
    return s+(a.currency==='JPY'?a.balance:(a.balance*(a.currency==='IDR'?getRate('IDR'):getRate(a.currency))));
  },0);
  var bankTotalIdr=(DATA.bankAccounts||[]).reduce(function(s,a){
    return s+(a.currency==='IDR'?a.balance:(a.currency==='JPY'?Math.round(a.balance/getRate('IDR')):Math.round(a.balance*getRateIDR(a.currency))));
  },0);
  var bankSection='<div class="savings-card">'+
    '<div class="savings-title">bank accounts</div>'+
    bankRows+
    '<button onclick="addBankAccount()" style="width:100%;padding:5px;background:none;border:1px dashed var(--border2);border-radius:4px;font-family:var(--sans);font-size:11px;color:var(--text2);cursor:pointer;margin-top:2px">+ add account</button>'+
    (bankTotalJpy?'<div style="border-top:1px solid var(--border);padding-top:8px;margin-top:8px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px;color:var(--text2)">total</span><span style="font-family:var(--mono);font-size:12px;font-weight:500">¥'+Math.round(bankTotalJpy).toLocaleString()+' · Rp'+bankTotalIdr.toLocaleString()+'</span></div>':'')+
  '</div>';

  var bondsSection=
    '<div class="savings-card">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'+
        '<div class="savings-title" style="margin-bottom:0">government bonds</div>'+
        '<button onclick="openAddBondModal()" style="font-size:11px;background:none;border:1px solid var(--border);border-radius:8px;padding:3px 10px;cursor:pointer;color:var(--text2);font-family:var(--sans)">+ add bond</button>'+
      '</div>'+
      (activeBonds.length?
        activeBondCards+
        (totalMonthlyNet?'<div style="border-top:1px solid var(--border);padding-top:8px;margin-top:4px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px;color:var(--text2)">total monthly income</span><span style="font-family:var(--mono);font-size:13px;font-weight:500">Rp '+totalMonthlyNet.toLocaleString()+'</span></div>':'')
        :'<div style="font-size:11px;color:var(--text3);padding:8px 0">no active bonds — click + add bond to get started.</div>')+
      maturedArchive+
    '</div>';

  panel.innerHTML=
    '<div class="savings-wrap">'+
    '<div class="savings-card">'+
      '<div class="savings-title">新NISA — contribution tracker</div>'+

      '<div class="nisa-hero">'+
        '<div class="nisa-hero-stat" style="flex:2;min-width:0">'+
          '<div class="nisa-hero-lab">lifetime plan</div>'+
          '<div class="nisa-hero-big">¥'+Math.round((totalPlannedTs+totalPlannedLs)/10000)+'万<span style="font-size:11px;color:var(--text3);font-weight:400"> / ¥1800万</span></div>'+
          '<div class="nisa-prog"><div class="nisa-prog-t" style="width:'+tsPct+'%"></div><div class="nisa-prog-g" style="width:'+lsPct+'%"></div></div>'+
          '<div class="nisa-leg"><span style="font-size:9px;color:var(--accent)">▪ つみたて ¥'+Math.round(totalPlannedTs/10000)+'万</span>&nbsp;<span style="font-size:9px;color:#2c4a6e">▪ 成長 ¥'+Math.round(totalPlannedLs/10000)+'万</span></div>'+
        '</div>'+
        '<div class="nisa-hero-stat">'+
          '<div class="nisa-hero-lab">cap year</div>'+
          '<div class="nisa-hero-big">'+(capRow?capRow.year:'—')+'</div>'+
          (capRow?'<div class="nisa-hero-sub">age '+capRow.age+'</div>':'')+
        '</div>'+
        '<div class="nisa-hero-stat">'+
          '<div class="nisa-hero-lab">'+thisYear+' total</div>'+
          '<div class="nisa-hero-big">¥'+Math.round(thisYearTotal/10000)+'万</div>'+
        '</div>'+
        '<div class="nisa-hero-stat">'+
          '<div class="nisa-hero-lab">avg / yr</div>'+
          '<div class="nisa-hero-big">¥'+Math.round(avgPace/10000)+'万</div>'+
          '<div class="nisa-hero-sub">over '+yearsCount+' yr'+(yearsCount!==1?'s':'')+'</div>'+
        '</div>'+
      '</div>'+

      '<div class="nisa-2col">'+
        '<div class="nisa-panel ts">'+
          '<div class="nisa-phdr">つみたて — monthly/yr</div>'+
          '<div style="font-size:9px;color:var(--text3);margin-bottom:7px">cap ¥1.2M/yr</div>'+
          tsRows+
          '<button class="nisa-tl-add" onclick="addTsumitateYear()">+ add year</button>'+
        '</div>'+
        '<div class="nisa-panel gr">'+
          '<div class="nisa-phdr">成長 — lump sum/yr</div>'+
          '<div style="font-size:9px;color:var(--text3);margin-bottom:7px">cap ¥2.4M/yr</div>'+
          lsRowsHtml+
          lsToggle+
          '<button class="nisa-tl-add" onclick="addNisaYear()">+ add year</button>'+
        '</div>'+
      '</div>'+

      '<div class="nisa-meta">'+
        '<div class="nisa-meta-cell">'+
          '<div class="nisa-meta-lab">start year</div>'+
          '<input type="number" value="'+n.startYear+'" onchange="DATA.nisa.startYear=parseInt(this.value)||2026;render()" style="width:100%;background:none;border:none;outline:none;font-family:var(--mono);font-size:13px;font-weight:500;color:var(--text)">'+
        '</div>'+
        '<div class="nisa-meta-cell">'+
          '<div class="nisa-meta-lab">start month</div>'+
          '<select onchange="DATA.nisa.startMonth=parseInt(this.value);render()" style="width:100%;background:none;border:none;outline:none;font-family:var(--mono);font-size:13px;font-weight:500;color:var(--text);cursor:pointer">'+
            ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(function(m,i){return '<option value="'+(i+1)+'"'+(n.startMonth===i+1?' selected':'')+'>'+m+'</option>';}).join('')+
          '</select>'+
        '</div>'+
        '<div class="nisa-meta-cell">'+
          '<div class="nisa-meta-lab">this yr monthly</div>'+
          '<div style="font-family:var(--mono);font-size:13px;font-weight:500;color:var(--text)">¥'+curYearMonthly.toLocaleString()+'</div>'+
        '</div>'+
      '</div>'+

      '<div style="font-size:10px;font-weight:500;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">year snapshots</div>'+
      '<table class="nisa-snaps"><thead><tr>'+
        '<th>year</th><th>age</th><th>つみたて</th><th>成長</th><th>cumulative</th><th>progress</th><th></th>'+
      '</tr></thead><tbody>'+snapRows+'</tbody></table>'+
      '<button onclick="addProjectionYear()" style="margin-top:6px;width:100%;padding:6px;background:none;border:1px dashed var(--border2);border-radius:var(--radius);font-family:var(--sans);font-size:12px;color:var(--text2);cursor:pointer">+ add snapshot year</button>'+
      '<div style="margin-top:10px;font-size:10px;color:var(--text3);line-height:1.6">Lifetime cap ¥18M — つみたて ¥1.2M/yr · 成長 ¥2.4M/yr · up to ¥3.6M/yr combined.</div>'+
    '</div>'+
    '<div class="savings-card">'+
      '<div class="savings-title">currencies — enter amounts you hold</div>'+
      '<div class="curr-grid">'+currCards+'</div>'+
      (allJpy?'<div style="border-top:1px solid var(--border);padding-top:8px;margin-top:4px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px;color:var(--text2)">total held</span><span style="font-family:var(--mono);font-size:12px;font-weight:500">¥'+Math.round(allJpy).toLocaleString()+' · Rp'+Math.round(allIdr).toLocaleString()+'</span></div>':'')+
    '</div>'+
    bankSection+
    bondsSection+
    '</div>';
}

// ── FINANCE ───────────────────────────────────────────────────────────
var _finOpen={income:true,commute:false,food:false,fixed:false,necessities:false,optional:false};
function finToggle(sec){_finOpen[sec]=!_finOpen[sec];render();}

function getFinMonth(y,m){
  var key=y+'-'+(m<9?'0':'')+(m+1);
  if(!DATA.finance[key]) DATA.finance[key]={};
  return DATA.finance[key];
}
function finVal(d,k){return d[k]||0;}
function finSet(y,m,k,v){
  var key=y+'-'+(m<9?'0':'')+(m+1);
  if(!DATA.finance[key]) DATA.finance[key]={};
  DATA.finance[key][k]=parseExpr(v);
  autoSave();
}
function monthSpendCat(y,m,catKey){
  var total=0,dim=new Date(y,m+1,0).getDate();
  for(var i=1;i<=dim;i++){
    var sp=DATA.spend[fd(new Date(y,m,i))]||{};
    total+=spendVal(sp[catKey]);
  }
  return total;
}
function monthSpendGroup(y,m,group){
  return SPEND_CATS.filter(function(c){return c.group===group;}).reduce(function(s,c){return s+monthSpendCat(y,m,c.key);},0);
}
function finTotals(d,y,m){
  var isNewIns=y>2025||(y===2025&&m>=4);
  var deductions=isNewIns
    ?(finVal(d,'healthIns')+finVal(d,'careIns')+finVal(d,'childRearing')+finVal(d,'pensionIns')+finVal(d,'employmentIns')+finVal(d,'incomeTax')+finVal(d,'residentTax'))
    :(finVal(d,'taxWithheld')+finVal(d,'insuranceDed'));
  var income=(finVal(d,'salary')+finVal(d,'transportReimb')+finVal(d,'otherIncome')+finVal(d,'momPays'))-deductions;
  var commutePass=finVal(d,'commutationPass');
  var commuteSpend=monthSpendGroup(y,m,'transport');
  var commute=commutePass+commuteSpend;
  var bills=finVal(d,'rent')+finVal(d,'gas')+finVal(d,'water')+finVal(d,'electricity')+finVal(d,'phone')+finVal(d,'internet');
  var food=monthSpendGroup(y,m,'food');
  var necessities=monthSpendGroup(y,m,'necessities');
  var optional=monthSpendGroup(y,m,'optional');
  var balance=income-commute-bills-food-necessities-optional;
  return {income:income,commute:commute,commutePass:commutePass,commuteSpend:commuteSpend,bills:bills,food:food,necessities:necessities,optional:optional,balance:balance,isNewIns:isNewIns};
}

function finRow(y,m,k,jpLabel,enLabel,step,negative){
  var key=y+'-'+(m<9?'0':'')+(m+1);
  var val=finVal(DATA.finance[key]||{},k);
  var filled=val>0;
  return '<div class="fin-row">'+
    '<div class="fin-row-label">'+jpLabel+'<span class="en">'+enLabel+(negative?' (−)':'')+'</span></div>'+
    '<div class="fin-inp-wrap'+(filled?' filled':'')+(negative?' negative':'')+'">'+
      '<span class="yen">¥</span>'+
      '<input type="number" step="'+(step||1000)+'" value="'+(val||'')+'" placeholder="0"'+
        ' onchange="finSet('+y+','+m+',\''+k+'\',this.value);render()">'+
    '</div>'+
  '</div>';
}
function finReadRow(jpLabel,enLabel,val){
  return '<div class="fin-row">'+
    '<div class="fin-row-label">'+jpLabel+'<span class="en">'+enLabel+'</span></div>'+
    '<div class="fin-chip-auto">'+
      '<span class="fin-chip-auto-badge">auto</span>'+
      '<span class="fin-chip-auto-val">'+(val?'¥'+val.toLocaleString():'¥0')+'</span>'+
    '</div>'+
  '</div>';
}

function finSection(title,jpTitle,sec,rows,total,negative,meta){
  var open=_finOpen[sec];
  return '<div class="fin-acc'+(open?' open':'')+'">'+
    '<div class="fin-acc-head" onclick="finToggle(\''+sec+'\')">'+
      '<span class="fin-acc-chev">▸</span>'+
      '<span class="fin-acc-title">'+title+'<span class="jp">'+jpTitle+'</span></span>'+
      (meta?'<span class="fin-acc-meta">'+meta+'</span>':'<span></span>')+
      '<span class="fin-acc-total'+(sec==='income'?' income':'')+'">'+
        (negative&&total>0?'−':'')+'¥'+total.toLocaleString()+
      '</span>'+
    '</div>'+
    (open?'<div class="fin-acc-body">'+rows+'</div>':'')+
  '</div>';
}
function finAutoSection(title,jpTitle,sec,rows,total){
  var open=_finOpen[sec];
  return '<div class="fin-acc'+(open?' open':'')+'">'+
    '<div class="fin-acc-head" onclick="finToggle(\''+sec+'\')">'+
      '<span class="fin-acc-chev">▸</span>'+
      '<span class="fin-acc-title">'+title+'<span class="jp">'+jpTitle+'</span></span>'+
      '<span class="fin-acc-meta auto-pill">auto · from daily</span>'+
      '<span class="fin-acc-total">¥'+total.toLocaleString()+'</span>'+
    '</div>'+
    (open?'<div class="fin-acc-body">'+rows+'</div>':'')+
  '</div>';
}

function renderFinance(panel,y,m){
  var d=getFinMonth(y,m);
  var t=finTotals(d,y,m);
  var balColor=t.balance>=0?'var(--c-income)':'var(--bad)';
  // prev months helper
  function pmy(yi,mi){while(mi<0){mi+=12;yi--;}return{y:yi,m:mi};}
  var p1=pmy(y,m-1);
  var t1=finTotals(getFinMonth(p1.y,p1.m),p1.y,p1.m);
  var delta=t.balance-t1.balance;
  // sparkline — last 6 months
  var sp6=[],sp6L=[];
  for(var si=5;si>=0;si--){var psi=pmy(y,m-si);sp6.push(finTotals(getFinMonth(psi.y,psi.m),psi.y,psi.m).balance);sp6L.push(MS[psi.m]);}
  var sMin=Math.min.apply(null,sp6),sMax=Math.max.apply(null,sp6),sRange=sMax-sMin||1;
  var spPts=sp6.map(function(v,i){return(i*40)+','+(58-Math.round(((v-sMin)/sRange)*54));});
  var spPath='M'+spPts.join(' L'),spFill=spPath+' L200,60 L0,60 Z';
  var spColor=t.balance>=0?'#2d5a3d':'#8b2c2c',spSoft=t.balance>=0?'#e6f0ea':'#f6e3e3';
  // proportion bar widths
  var pInc=Math.max(t.income,1);
  var pCo=Math.min(100,Math.round(t.commute/pInc*100));
  var pF=Math.min(100-pCo,Math.round(t.bills/pInc*100));
  var pFo=Math.min(100-pCo-pF,Math.round(t.food/pInc*100));
  var pNe=Math.min(100-pCo-pF-pFo,Math.round(t.necessities/pInc*100));
  var pOp=Math.min(100-pCo-pF-pFo-pNe,Math.round(t.optional/pInc*100));
  var pSv=Math.max(0,Math.round(t.balance/pInc*100));
  // filled counts
  var fkey=y+'-'+(m<9?'0':'')+(m+1),fd2=DATA.finance[fkey]||{};
  var incFields=t.isNewIns
    ?['salary','transportReimb','otherIncome','momPays','healthIns','careIns','childRearing','pensionIns','employmentIns','incomeTax','residentTax']
    :['salary','transportReimb','otherIncome','momPays','taxWithheld','insuranceDed'];
  var incFill=incFields.filter(function(k){return fd2[k]>0;}).length;
  var fixFill=['rent','gas','water','electricity','phone','internet'].filter(function(k){return fd2[k]>0;}).length;
  var commuteFill=['commutationPass'].filter(function(k){return fd2[k]>0;}).length;
  // cumulative net since Jan 2025
  var cumNet=0;
  for(var cny=2025;cny<=y;cny++){
    var cnmEnd=cny<y?11:m;
    for(var cnm=0;cnm<=cnmEnd;cnm++){cumNet+=finTotals(getFinMonth(cny,cnm),cny,cnm).balance;}
  }
  // rows
  var insRows=t.isNewIns
    ?(finRow(y,m,'healthIns','健康保険','Health Insurance',100,true)+
      finRow(y,m,'careIns','介護保険','Care Insurance',100,true)+
      finRow(y,m,'childRearing','子ども・子育て支援','Child-Rearing Support',100,true)+
      finRow(y,m,'pensionIns','厚生年金保険','Welfare Pension',100,true)+
      finRow(y,m,'employmentIns','雇用保険','Employment Insurance',100,true)+
      finRow(y,m,'incomeTax','所得税','Income Tax',100,true)+
      finRow(y,m,'residentTax','住民税','Resident Tax',100,true))
    :(finRow(y,m,'taxWithheld','税金','Tax Withheld',1000,true)+
      finRow(y,m,'insuranceDed','保険料','Insurance',1000,true));
  var incomeRows=
    finRow(y,m,'salary','給料','Salary',1000,false)+
    finRow(y,m,'transportReimb','交通費補助','Transport Reimbursement',1000,false)+
    finRow(y,m,'otherIncome','所得','Other Income',1000,false)+
    finRow(y,m,'momPays','親の援助','Mom Pays',1000,false)+
    insRows;
  var commuteRows=
    finRow(y,m,'commutationPass','通勤定期券','Commutation Pass',1000,false)+
    finReadRow('通勤費','Daily Commute',monthSpendCat(y,m,'commute'));
  var fixedRows=
    finRow(y,m,'rent','家賃','Rent',1000,false)+
    finRow(y,m,'gas','ガス費','Gas',100,false)+
    finRow(y,m,'water','水道費','Water',100,false)+
    finRow(y,m,'electricity','電気料金','Electricity',100,false)+
    finRow(y,m,'phone','携帯','Phone',100,false)+
    finRow(y,m,'internet','インターネット','Internet',100,false);
  var foodRows=finReadRow('食べ物','Food',monthSpendCat(y,m,'food'));
  var necRows=
    finReadRow('電車代金','Transport',monthSpendCat(y,m,'transport'))+
    finReadRow('書類仕事','Paperwork',monthSpendCat(y,m,'paperwork'))+
    finReadRow('メディカル','Medical',monthSpendCat(y,m,'medical'))+
    finReadRow('日常生活','Daily',monthSpendCat(y,m,'necessities'))+
    finReadRow('国民保険','NHI',monthSpendCat(y,m,'nhi'));
  var optRows=
    finReadRow('ゲーム/P','Project/Game',monthSpendCat(y,m,'project'))+
    finReadRow('エンターテインメント','Entertainment',monthSpendCat(y,m,'fun'))+
    finReadRow('服・髪','Clothes/Hair',monthSpendCat(y,m,'clothes'));

  panel.innerHTML=
    '<div class="fin-wrap">'+
      '<div class="fin-hero">'+
        '<div>'+
          '<div class="fin-hero-lab">Balance · '+MONTHS[m]+' '+y+'</div>'+
          '<div class="fin-hero-bal" style="color:'+balColor+'">¥'+t.balance.toLocaleString()+'</div>'+
          '<div class="fin-hero-delta'+(delta>0?' up':delta<0?' dn':'')+'">'+
            (delta!==0?(delta>0?'+':'')+'¥'+Math.abs(delta).toLocaleString()+' vs '+MS[p1.m]:'no prior data')+
          '</div>'+
        '</div>'+
        '<div>'+
          '<div class="fin-hero-lab">6-month trend</div>'+
          '<svg class="fin-spark" viewBox="0 0 200 60" height="46" preserveAspectRatio="none">'+
            '<path d="'+spPath+'" fill="none" stroke="'+spColor+'" stroke-width="1.5"/>'+
            '<path d="'+spFill+'" fill="'+spSoft+'" opacity=".6"/>'+
          '</svg>'+
          '<div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text3);font-family:var(--mono);margin-top:2px">'+
            sp6L.map(function(l){return'<span>'+l+'</span>';}).join('')+
          '</div>'+
        '</div>'+
        '<div>'+
          '<div class="fin-hero-lab">Income ¥'+t.income.toLocaleString()+' → distribution</div>'+
          '<div class="fin-prop">'+
            (t.income>0?
              '<i style="width:'+pCo+'%;background:var(--c-transport)" title="Commute ¥'+t.commute.toLocaleString()+'"></i>'+
              '<i style="width:'+pF+'%;background:var(--c-fixed)" title="Fixed ¥'+t.bills.toLocaleString()+'"></i>'+
              '<i style="width:'+pFo+'%;background:var(--c-food)" title="Food ¥'+t.food.toLocaleString()+'"></i>'+
              '<i style="width:'+pNe+'%;background:var(--c-necessities)" title="Necessities ¥'+t.necessities.toLocaleString()+'"></i>'+
              '<i style="width:'+pOp+'%;background:var(--c-optional)" title="Optional ¥'+t.optional.toLocaleString()+'"></i>':'')+
          '</div>'+
          '<div class="fin-prop-leg">'+
            '<span><i style="background:var(--c-transport)"></i>Commute <b>'+pCo+'%</b></span>'+
            '<span><i style="background:var(--c-fixed)"></i>Fixed <b>'+pF+'%</b></span>'+
            '<span><i style="background:var(--c-food)"></i>Food <b>'+pFo+'%</b></span>'+
            '<span><i style="background:var(--c-necessities)"></i>Nec <b>'+pNe+'%</b></span>'+
            '<span><i style="background:var(--c-optional)"></i>Optional <b>'+pOp+'%</b></span>'+
            '<span><i style="background:var(--border2);border:1px solid var(--border2)"></i>Saved <b>'+pSv+'%</b></span>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="fin-2col">'+
        '<div class="fin-left">'+
          finSection('Income','収入','income',incomeRows,t.income,false,incFill+' of '+incFields.length+' filled')+
          finSection('Commute','通勤','commute',commuteRows,t.commute,true,commuteFill+' of 1 filled')+
          finAutoSection('Food','食べ物','food',foodRows,t.food)+
          finSection('Fixed Monthly','固定費','fixed',fixedRows,t.bills,true,fixFill+' of 6 filled')+
          finAutoSection('Necessities','生活費','necessities',necRows,t.necessities)+
          finAutoSection('Optional','任意支出','optional',optRows,t.optional)+
        '</div>'+
        '<div>'+
          '<div class="fin-compare">'+
            '<div class="fin-cumnet">'+
              '<div class="fin-compare-h" style="margin-bottom:8px">'+MONTHS[m]+' '+y+'</div>'+
              '<div class="fin-cum-row"><span>Income</span><span style="color:var(--c-income)">+¥'+t.income.toLocaleString()+'</span></div>'+
              '<div class="fin-cum-row"><span>Commute</span><span>−¥'+t.commute.toLocaleString()+'</span></div>'+
              '<div class="fin-cum-row"><span>Food</span><span>−¥'+t.food.toLocaleString()+'</span></div>'+
              '<div class="fin-cum-row"><span>Fixed</span><span>−¥'+t.bills.toLocaleString()+'</span></div>'+
              '<div class="fin-cum-row"><span>Necessities</span><span>−¥'+t.necessities.toLocaleString()+'</span></div>'+
              '<div class="fin-cum-row"><span>Optional</span><span>−¥'+t.optional.toLocaleString()+'</span></div>'+
              '<div class="fin-cum-row fin-cum-total"><span>Net</span><span style="color:'+(t.balance>=0?'var(--c-income)':'var(--bad)')+'">'+
                (t.balance>=0?'+':'')+t.balance.toLocaleString()+'</span></div>'+
              '<div class="fin-cum-row fin-cum-total" style="margin-top:8px;padding-top:8px"><span>Total since Jan 2025</span><span style="color:'+(cumNet>=0?'var(--c-income)':'var(--bad)')+'">'+
                (cumNet>=0?'+':'')+cumNet.toLocaleString()+'</span></div>'+
            '</div>'+
          '</div>'+
        '</div>'+
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
    (DATA.bonds||[]).filter(function(b){return !bondIsMatured(b);}).forEach(function(b){
      var days=bondDaysToMaturity(b);
      if(days>=0&&days<=365){
        var sub=days===0?'matures today! 🎉':'matures in '+days+' day'+(days!==1?'s':'');
        items.push({s:days,html:'<div style="padding:6px 0;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:flex-start">'+
          '<div style="width:4px;height:4px;border-radius:50%;background:#7a6830;margin-top:5px;flex-shrink:0"></div>'+
          '<div><div style="font-size:11px;font-weight:500">'+b.series+'</div>'+
          '<div style="font-size:10px;color:var(--text3);font-family:var(--mono)">'+sub+'</div></div></div>'});
      }
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
    buildSwatches('cd-color',PALETTE[0].color)+
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

// ── BOND MATH ─────────────────────────────────────────────────────────
function bondIsMatured(b){return b.matured||fd(today)>=b.maturityDate;}
function bondMonthlyNet(b){return Math.round(b.faceValue*b.couponRate/12*(1-b.taxRate));}
function bondDurationMonths(b){
  var a=new Date(b.firstCouponDate+'T00:00:00');
  var z=new Date(b.maturityDate+'T00:00:00');
  return (z.getFullYear()-a.getFullYear())*12+(z.getMonth()-a.getMonth())+1;
}
function bondReceivedMonths(b){
  var todayStr=fd(today);
  if(todayStr<b.firstCouponDate)return 0;
  if(todayStr>=b.maturityDate)return bondDurationMonths(b);
  var a=new Date(b.firstCouponDate+'T00:00:00');
  var diff=(today.getFullYear()-a.getFullYear())*12+(today.getMonth()-a.getMonth());
  if(today.getDate()>=a.getDate())diff++;
  return Math.min(diff,bondDurationMonths(b));
}
function bondTotalNet(b){return bondMonthlyNet(b)*bondDurationMonths(b);}
function bondReceivedNet(b){return bondMonthlyNet(b)*bondReceivedMonths(b);}
function bondRemainingNet(b){return bondTotalNet(b)-bondReceivedNet(b);}
function bondDaysToMaturity(b){
  var z=new Date(b.maturityDate+'T00:00:00');
  var now=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  return Math.round((z-now)/86400000);
}

// ── CURRENCY LOTS ─────────────────────────────────────────────────────
function openAddLotModal(code){
  openModal(
    '<div class="modal-title">add purchase lot — '+code+'</div>'+
    '<label>date purchased</label>'+
    '<input id="lot-date" type="date" value="'+fd(today)+'">'+
    '<label>amount ('+code+' units bought)</label>'+
    '<input id="lot-amount" type="number" min="0" step="any" placeholder="0">'+
    '<label>total IDR spent</label>'+
    '<input id="lot-rate" type="number" min="0" step="any" placeholder="0">'+
    '<div style="display:flex;gap:8px;margin-top:8px">'+
      '<button class="modal-btn primary" onclick="submitAddLot(\''+code+'\')">add lot</button>'+
      '<button class="modal-btn" onclick="closeModal()">cancel</button>'+
    '</div>'
  );
}
function submitAddLot(code){
  var date=document.getElementById('lot-date').value;
  var amount=parseFloat(document.getElementById('lot-amount').value);
  var rateIDR=parseFloat(document.getElementById('lot-rate').value);
  if(!date||!amount||isNaN(amount)||!rateIDR||isNaN(rateIDR)){alert('Please fill all fields.');return;}
  DATA.currencyLots.push({id:uid(),code:code,amount:amount,rateIDR:rateIDR,date:date});
  closeModal();render();
}
function deleteLot(id){
  DATA.currencyLots=DATA.currencyLots.filter(function(l){return l.id!==id;});
  render();
}

// ── BOND CRUD ──────────────────────────────────────────────────────────
function openAddBondModal(){
  openModal(
    '<div class="modal-title">add government bond</div>'+
    '<label>series (e.g. ORI024, ST009)</label>'+
    '<input id="bond-series" type="text" placeholder="ORI024">'+
    '<label>face value (IDR)</label>'+
    '<input id="bond-face" type="number" min="0" step="any" placeholder="0">'+
    '<label>coupon rate % (annual gross)</label>'+
    '<input id="bond-coupon" type="number" min="0" max="100" step="0.01" placeholder="e.g. 7.40">'+
    '<label>tax rate % (withholding)</label>'+
    '<input id="bond-tax" type="number" min="0" max="100" step="0.01" placeholder="e.g. 10">'+
    '<label>settlement date</label>'+
    '<input id="bond-settlement" type="date">'+
    '<label>first coupon date</label>'+
    '<input id="bond-firstcoupon" type="date">'+
    '<label>maturity date</label>'+
    '<input id="bond-maturity" type="date">'+
    '<div style="display:flex;gap:8px;margin-top:8px">'+
      '<button class="modal-btn primary" onclick="submitAddBond()">add bond</button>'+
      '<button class="modal-btn" onclick="closeModal()">cancel</button>'+
    '</div>'
  );
}
function submitAddBond(){
  var series=document.getElementById('bond-series').value.trim();
  var faceValue=parseFloat(document.getElementById('bond-face').value);
  var couponRate=parseFloat(document.getElementById('bond-coupon').value)/100;
  var taxRate=parseFloat(document.getElementById('bond-tax').value)/100;
  var settlementDate=document.getElementById('bond-settlement').value;
  var firstCouponDate=document.getElementById('bond-firstcoupon').value;
  var maturityDate=document.getElementById('bond-maturity').value;
  if(!series||isNaN(faceValue)||isNaN(couponRate)||isNaN(taxRate)||!settlementDate||!firstCouponDate||!maturityDate){
    alert('Please fill all fields.');return;
  }
  DATA.bonds.push({id:uid(),series:series,faceValue:faceValue,couponRate:couponRate,taxRate:taxRate,settlementDate:settlementDate,firstCouponDate:firstCouponDate,maturityDate:maturityDate,matured:false});
  closeModal();render();
}
function deleteBond(id){
  DATA.bonds=DATA.bonds.filter(function(b){return b.id!==id;});
  render();
}
function toggleBondMatured(id){
  var b=DATA.bonds.find(function(b){return b.id===id;});
  if(b){b.matured=!b.matured;render();}
}

function startFresh(){
  DATA={events:{},tasks:{},slots:{},spend:{},goals:{},notes:[],countdowns:[],nisa:{tsumitateMonthly:60000,tsumitateByYear:{},lumpSumByYear:{},startYear:2026,startMonth:1,projectionYears:[2026,2027,2028,2030,2032,2035,2040,2045,2050,2055,2060]},currencies:{},currencyRates:{},baseCurrency:'JPY',currencyLots:[],bonds:[],bankAccounts:[{id:'bank-bca',name:'BCA',currency:'IDR',balance:0},{id:'bank-mufg',name:'MUFG',currency:'JPY',balance:0}]};
  startApp();
}

function startApp(){
  DATA.slots={};
  // migrate old spend format {raw,val} → plain number
  Object.keys(DATA.spend||{}).forEach(function(dk){
    var sp=DATA.spend[dk];
    Object.keys(sp).forEach(function(ck){
      if(sp[ck]&&typeof sp[ck]==='object') sp[ck]=sp[ck].val||0;
    });
  });
  if(!DATA.currencyRates) DATA.currencyRates={};
  if(!DATA.countdowns) DATA.countdowns=[];
  DATA.countdowns.forEach(function(c){if(!c.mode)c.mode='until';});
  if(!DATA.currencyLots) DATA.currencyLots=[];
  if(!DATA.bonds) DATA.bonds=[];
  if(!DATA.nisa.lumpSumByYear){
    DATA.nisa.lumpSumByYear={};
    if(DATA.nisa.lumpSumYearly) DATA.nisa.lumpSumByYear[DATA.nisa.startYear]=DATA.nisa.lumpSumYearly;
    delete DATA.nisa.lumpSumYearly;
  }
  if(!DATA.nisa.tsumitateByYear) DATA.nisa.tsumitateByYear={};
  if(!Object.keys(DATA.nisa.tsumitateByYear).length&&DATA.nisa.tsumitateMonthly>0)
    DATA.nisa.tsumitateByYear[DATA.nisa.startYear]=DATA.nisa.tsumitateMonthly;
  if(!DATA.nisa.startMonth) DATA.nisa.startMonth=1;
  if(!DATA.bankAccounts) DATA.bankAccounts=[{id:'bank-bca',name:'BCA',currency:'IDR',balance:0},{id:'bank-mufg',name:'MUFG',currency:'JPY',balance:0}];
  if(!DATA.finance) DATA.finance={};
  document.getElementById('splash').style.display='none';
  const app=document.getElementById('app');
  app.style.display='flex';
  render();
  initAutoSave();
}

// boot
document.getElementById('app').style.display='none';
