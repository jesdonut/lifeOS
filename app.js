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
let view='week',stab='notes',cursor=new Date(today),multiYearStart=2026,focusDay=null;
let _nisaLsExpanded=false;

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

let DATA={events:{},tasks:{},slots:{},spend:{},goals:{},notes:[],catLabels:{},catColors:{},countdowns:[],nisa:{tsumitateMonthly:60000,tsumitateByYear:{},lumpSumByYear:{},startYear:2026,startMonth:1,projectionYears:[2026,2027,2028,2030,2032,2035,2040,2045,2050,2055,2060]},currencies:{},currencyRates:{},baseCurrency:'JPY',currencyLots:[],bonds:[],bankAccounts:[{id:'bank-bca',name:'BCA',currency:'IDR',balance:0},{id:'bank-mufg',name:'MUFG',currency:'JPY',balance:0}]};

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
  if(view==='week'){cursor.setDate(cursor.getDate()+dir*7);focusDay=null;}
  else if(view==='month') cursor.setMonth(cursor.getMonth()+dir);
  else if(view==='year') cursor.setFullYear(cursor.getFullYear()+dir);
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
    const spend=daySpendTotal(ckey);
    const isTod=isToday(cdate);
    cells+=
      '<div class="mc'+(isTod?' today-mc':'')+(other?' other':'')+'" onclick="jumpWeek(\''+ckey+'\')">'+
        '<div class="mc-num">'+cd+'</div>'+
        evts.slice(0,2).map(function(e){return '<div class="mc-item" style="background:'+e.color+'18;color:'+e.color+'">'+e.text+'</div>';}).join('')+
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
function renderYear(panel,year){
  multiYearStart=Math.max(MIN_YEAR,Math.min(MAX_YEAR-4,year-2));
  const birthYear=1995;
  const allNisaRows=nisaCalc();

  // ── multi-year strip ──
  let strip='';
  for(let y=multiYearStart;y<multiYearStart+5;y++){
    const age=y-birthYear;
    const focused=y===year;
    let monthCells='';
    for(let m=0;m<12;m++){
      const gkey=y+'-'+(m+1)+'-0';
      const goal=DATA.goals[gkey]||'';
      const mkey=y+'-'+String(m+1).padStart(2,'0');
      const evtKeys=Object.keys(DATA.events).filter(function(k){return k.startsWith(mkey);});
      const evtItems=evtKeys.map(function(k){var d=parseInt(k.split('-')[2]);return DATA.events[k].map(function(e){return {day:d,text:e.text};});}).flat();
      const taskKeys=Object.keys(DATA.tasks).filter(function(k){return k.startsWith(mkey);});
      const taskItems=taskKeys.map(function(k){var d=parseInt(k.split('-')[2]);return DATA.tasks[k].filter(function(t){return !t.done;}).map(function(t){return {day:d,text:t.text};});}).flat();
      const mTotal=monthSpendTotal(y,m);
      const goalItems=goal?[{day:null,text:goal}]:[];
      const items=goalItems.concat(evtItems,taskItems).slice(0,3);
      monthCells+=
        '<div class="my-month-cell" onclick="jumpMonth('+y+','+m+')">'+
          '<div class="my-month-name">'+MS[m]+'</div>'+
          '<div class="my-month-content">'+
            items.map(function(item){
              var badge=item.day?'<span style="display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;background:var(--border2);border-radius:2px;font-size:7px;font-weight:600;color:var(--text2);margin-right:2px;flex-shrink:0">'+item.day+'</span>':'';
              return '<div class="my-month-item">'+badge+'<span>'+item.text+'</span></div>';
            }).join('')+
            (mTotal?'<div style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-top:2px">'+fmtSpend(mTotal)+'</div>':'')+
          '</div>'+
        '</div>';
    }
    const nisaRow=allNisaRows.find(function(r){return r.year===y;});
    const contrib=nisaRow?nisaRow.cumulative:0;
    const capRow=allNisaRows.find(function(r){return r.capReached;});
    const capThisYear=capRow&&y>=capRow.year;
    strip+=
      '<div class="my-year-section'+(focused?' my-year-focused':'')+'">'+
        '<div class="my-year-hdr">'+
          '<span class="my-year-num" onclick="cursor=new Date('+y+',0,1);render()" style="cursor:pointer" title="view '+y+'">'+y+'</span>'+
          '<span class="my-year-age">age '+age+'</span>'+
        '</div>'+
        '<div class="my-months-row">'+monthCells+'</div>'+
        (contrib>0?'<div class="my-nisa-row"><span class="my-nisa-label">NISA:</span><span class="my-nisa-val">¥'+contrib.toLocaleString()+(capThisYear?' 🎉 cap reached!':'')+'</span></div>':'')+
      '</div>';
  }

  // ── 12-month detail ──
  let blocks='';
  for(let m=0;m<12;m++){
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
      strip+
      '<div class="year-grid">'+blocks+'</div>'+
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
  var currCards=CURRENCIES.filter(function(c){return c.code!=='JPY';}).map(function(c){
    var amt=DATA.currencies[c.code]||'';
    var rate=getRate(c.code);
    var jpyEq=amt?Math.round(parseFloat(amt)*rate):0;
    var idrBase=DATA.baseCurrency==='IDR';
    var idrRate=getRate('IDR');
    var displayRate=idrBase?Math.round(rate/idrRate*100)/100:rate;
    var rateLabel=idrBase?'Rp':'¥';
    var currentIDR=idrRate>0?Math.round(rate/idrRate):0;
    var lots=(DATA.currencyLots||[]).filter(function(l){return l.code===c.code;});
    var lotsHtml='';
    if(lots.length){
      var totalCost=lots.reduce(function(s,l){return s+l.rateIDR;},0);
      var totalNow=lots.reduce(function(s,l){return s+l.amount*currentIDR;},0);
      var totalPL=Math.round(totalNow-totalCost);
      lotsHtml='<div style="margin-top:6px;border-top:1px solid var(--border);padding-top:5px">'+
        lots.map(function(l){
          var costPerUnit=l.rateIDR/l.amount;
          var pl=Math.round((currentIDR-costPerUnit)*l.amount);
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
      '<div style="display:flex;align-items:center;gap:4px;margin-top:4px;border-top:1px solid var(--border);padding-top:4px">'+
        '<span style="font-size:9px;color:var(--text3)">1'+c.code+'=</span>'+
        '<input type="number" step="any" value="'+displayRate+'" onchange="setRate(\''+c.code+'\',this.value)" style="width:60px;background:none;border:none;outline:none;font-family:var(--mono);font-size:10px;color:var(--text2)"/>'+
        '<span style="font-size:9px;color:var(--text3)">'+rateLabel+'</span>'+
      '</div>'+
      (jpyEq?'<div class="curr-jpy">≈ '+fmtSpend(jpyEq)+'</div>':'')+
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
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
      '<span style="font-size:12px;font-weight:500;color:var(--text);min-width:48px">'+a.name+'</span>'+
      '<span style="font-size:10px;color:var(--text3);min-width:28px">'+a.currency+'</span>'+
      '<input type="number" step="1000" value="'+a.balance+'" onchange="updateBankBalance(\''+a.id+'\',this.value)" style="flex:1;border:1px solid var(--border);border-radius:4px;padding:4px 8px;font-family:var(--mono);font-size:12px;background:var(--surface);color:var(--text);outline:none">'+
      '<span style="font-size:11px;color:var(--text2);white-space:nowrap">'+fmtSpend(jpyVal)+'</span>'+
      '<button onclick="deleteBankAccount(\''+a.id+'\')" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:16px;line-height:1;padding:0 2px;flex-shrink:0">×</button>'+
    '</div>';
  }).join('');
  var bankTotalJpy=(DATA.bankAccounts||[]).reduce(function(s,a){
    return s+(a.currency==='JPY'?a.balance:(a.balance*(a.currency==='IDR'?getRate('IDR'):getRate(a.currency))));
  },0);
  var bankSection='<div class="savings-card">'+
    '<div class="savings-title">bank accounts</div>'+
    bankRows+
    '<button onclick="addBankAccount()" style="width:100%;padding:5px;background:none;border:1px dashed var(--border2);border-radius:4px;font-family:var(--sans);font-size:11px;color:var(--text2);cursor:pointer;margin-top:2px">+ add account</button>'+
    (bankTotalJpy?'<div style="border-top:1px solid var(--border);padding-top:8px;margin-top:8px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px;color:var(--text2)">total</span><span style="font-family:var(--mono);font-size:13px;font-weight:500">'+fmtSpend(bankTotalJpy)+'</span></div>':'')+
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
    bankSection+
    bondsSection+
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
  DATA={events:{},tasks:{},slots:{},spend:{},goals:{},notes:[],catLabels:{},catColors:{},countdowns:[],nisa:{tsumitateMonthly:60000,tsumitateByYear:{},lumpSumByYear:{},startYear:2026,startMonth:1,projectionYears:[2026,2027,2028,2030,2032,2035,2040,2045,2050,2055,2060]},currencies:{},currencyRates:{},baseCurrency:'JPY',currencyLots:[],bonds:[],bankAccounts:[{id:'bank-bca',name:'BCA',currency:'IDR',balance:0},{id:'bank-mufg',name:'MUFG',currency:'JPY',balance:0}]};
  seedData();
  startApp();
}

function startApp(){
  DATA.slots={};
  if(!DATA.catColors) DATA.catColors={};
  if(!DATA.currencyRates) DATA.currencyRates={};
  if(!DATA.baseCurrency) DATA.baseCurrency='JPY';
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
  document.getElementById('splash').style.display='none';
  const app=document.getElementById('app');
  app.style.display='flex';
  render();
  initAutoSave();
}

// boot
document.getElementById('app').style.display='none';
