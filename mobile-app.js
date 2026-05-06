'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const BIRTH_YEAR  = 1995;
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LETTER  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; // Mon=0 … Sun=6

const CAT_LABELS = {
  food:        {jp:'食べ物',               en:'Food'},
  commute:     {jp:'通勤費',               en:'Commute'},
  transport:   {jp:'電車代金',             en:'Transport'},
  paperwork:   {jp:'書類仕事',             en:'Paperwork'},
  medical:     {jp:'メディカル',            en:'Medical'},
  necessities: {jp:'日常生活',             en:'Daily'},
  nhi:         {jp:'国民保険',             en:'NHI'},
  project:     {jp:'プロジェクト',            en:'Project'},
  fun:         {jp:'エンターテインメント',    en:'Entertainment'},
  clothes:     {jp:'服・髪',              en:'Clothes/Hair'},
};

const LINE_CATS   = ['food','commute','transport'];
const SIMPLE_CATS = ['paperwork','medical','necessities','nhi','project','fun','clothes'];

// Finance dist-bar colours (same as desktop)
const FIN_C = {
  saved:'#2d5a3d', fixed:'#86AFC5', food:'#C79A9A',
  commute:'#B8C89A', necessities:'#D1B36A', optional:'#B7A6B5',
};

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
let DATA = {
  events:{}, tasks:{}, slots:{}, spend:{}, goals:{}, notes:[], countdowns:[],
  spendLog:{},
  nisa:{tsumitateByYear:{},lumpSumByYear:{},startYear:2026,startMonth:1,
        tsumitateMonthly:0,projectionYears:[]},
  currencies:{}, currencyRates:{}, currencyLots:[], bonds:[],
  bankAccounts:[], finance:{},
};

const today = (()=>{ const d=new Date(); d.setHours(0,0,0,0); return d; })();

let curDay   = new Date(today);
let curYear  = today.getFullYear();
let curFinMo = today.getFullYear()+'-'+p2(today.getMonth()+1);
let tab      = 'day';
let fileHandle = null;

let openSpendCats = new Set();   // 'food', 'commute', 'transport'
let expandedYears = new Set([today.getFullYear()]);
let openSections  = new Set(['income']);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function p2(n){ return String(n).padStart(2,'0'); }
function uid(){ return Math.random().toString(36).slice(2,10); }
function fd(d){ return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()); }
function fmtY(n){ return '¥'+(Math.round(n)||0).toLocaleString(); }
function calcAge(year){ return year - BIRTH_YEAR; }
function daysInMonth(y,m){ return new Date(y,m,0).getDate(); }
function addDays(d,n){ const r=new Date(d); r.setDate(r.getDate()+n); return r; }
function sameDay(a,b){ return fd(a)===fd(b); }

function weekMon(d){
  const r=new Date(d); r.setHours(0,0,0,0);
  const dow=r.getDay(); // 0=Sun
  r.setDate(r.getDate()-(dow===0?6:dow-1));
  return r;
}

function dayIdx(d){ return (d.getDay()+6)%7; } // Mon=0…Sun=6

function evalExpr(str){
  str=String(str).trim(); if(!str) return 0;
  try{
    const r=Function('"use strict";return('+str.replace(/[^0-9+\-*/.() ]/g,'')+')' )();
    return isFinite(r)?r:0;
  }catch(e){ return parseFloat(str)||0; }
}

function getSpend(dk,cat){
  return parseFloat((DATA.spend[dk]||{})[cat])||0;
}

function spendLogTotal(dk,cat){
  const items=(DATA.spendLog[dk]||{})[cat]||[];
  return items.reduce((s,it)=>s+(parseFloat(it.amount)||0),0);
}

// Sync spendLog total → DATA.spend so desktop finance view stays correct
function syncSpend(dk,cat){
  if(!DATA.spend[dk]) DATA.spend[dk]={};
  DATA.spend[dk][cat]=spendLogTotal(dk,cat);
}

function weekTotal(mon){
  let t=0;
  for(let i=0;i<7;i++){
    const dk=fd(addDays(mon,i));
    const s=DATA.spend[dk]||{};
    Object.keys(CAT_LABELS).forEach(c=>{ t+=parseFloat(s[c])||0; });
  }
  return t;
}

function daySpendTotal(dk){
  const s=DATA.spend[dk]||{};
  return Object.keys(CAT_LABELS).reduce((t,c)=>t+(parseFloat(s[c])||0),0);
}

// NISA cumulative up to end of given year
function nisaCum(upToYear){
  const n=DATA.nisa; let t=0;
  for(let y=(n.startYear||2026);y<=upToYear;y++){
    t+=(parseFloat(n.tsumitateByYear[y])||parseFloat(n.tsumitateMonthly)||0)*12;
    t+=parseFloat((n.lumpSumByYear||{})[y])||0;
  }
  return t;
}

// Finance: sum daily spend for a category across a month
function monthSpend(year,mo,cats){
  let t=0;
  for(let d=1;d<=daysInMonth(year,mo);d++){
    const dk=year+'-'+p2(mo)+'-'+p2(d);
    const s=DATA.spend[dk]||{};
    [].concat(cats).forEach(c=>{ t+=parseFloat(s[c])||0; });
  }
  return t;
}

// ─────────────────────────────────────────────────────────────────────────────
// Save / Load
// ─────────────────────────────────────────────────────────────────────────────
// All saves go to localStorage only — no download prompt during use.
// Call exportData() explicitly when ready to export.
const LS_KEY='lifeos-mobile-data';

function saveData(){
  if(!DATA.spendLog) DATA.spendLog={};
  try{ localStorage.setItem(LS_KEY,JSON.stringify(DATA)); }catch(e){}
  showToast('✓ saved');
}

function exportData(){
  const json=JSON.stringify(DATA);
  const a=document.createElement('a');
  a.href='data:application/json,'+encodeURIComponent(json);
  a.download='lifeOS-save.json'; a.click();
  showToast('✓ exported');
}

async function pickAndLoad(){
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='.json';
  inp.onchange=async()=>{
    try{
      const text=await inp.files[0].text();
      applyData(JSON.parse(text));
      saveData();  // persist to localStorage immediately
      startApp();
    }catch(e){ alert('Invalid save file.'); }
  };
  inp.click();
}

function loadFromLocal(){
  try{
    const raw=localStorage.getItem(LS_KEY);
    if(raw){ applyData(JSON.parse(raw)); startApp(); }
  }catch(e){ showSplash(); }
}

function applyData(d){
  DATA=Object.assign({
    events:{},tasks:{},slots:{},spend:{},goals:{},notes:[],countdowns:[],
    spendLog:{},
    nisa:{tsumitateByYear:{},lumpSumByYear:{},startYear:2026,startMonth:1,
          tsumitateMonthly:0,projectionYears:[]},
    currencies:{},currencyRates:{},currencyLots:[],bonds:[],
    bankAccounts:[],finance:{},
  },d);
  if(!DATA.spendLog) DATA.spendLog={};
}

function showToast(msg){
  const el=document.getElementById('saved-toast');
  if(!el) return;
  el.textContent=msg; el.classList.add('show');
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),1800);
}

// ─────────────────────────────────────────────────────────────────────────────
// Splash
// ─────────────────────────────────────────────────────────────────────────────
function showSplash(){
  const hasLocal=!!localStorage.getItem(LS_KEY);
  document.getElementById('m-header').innerHTML='<div class="m-header-nav"><div class="m-header-title">lifeOS</div></div><div class="m-header-sub">mobile</div>';
  document.getElementById('m-content').innerHTML=
    '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:12px">'+
    '<div style="font-size:28px;font-weight:700;color:var(--accent);font-family:var(--mono)">lifeOS</div>'+
    '<div style="font-size:12px;color:var(--text3);margin-bottom:4px">mobile</div>'+
    (hasLocal?'<button onclick="loadFromLocal()" style="width:220px;padding:12px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);font-family:var(--sans);font-size:14px;font-weight:500">continue last session</button>':'')+
    '<button onclick="pickAndLoad()" style="width:220px;padding:12px;background:'+(hasLocal?'none':'var(--accent)')+';color:'+(hasLocal?'var(--text2)':'#fff')+';border:1px solid '+(hasLocal?'var(--border)':'transparent')+';border-radius:var(--radius);font-family:var(--sans);font-size:14px;'+(hasLocal?'':'font-weight:500')+'">load save file</button>'+
    '<button onclick="startFresh()" style="width:220px;padding:12px;background:none;color:var(--text3);border:1px solid var(--border);border-radius:var(--radius);font-family:var(--sans);font-size:13px">start fresh</button>'+
    '</div>';
  document.getElementById('m-nav').style.display='none';
}

function startFresh(){
  localStorage.removeItem(LS_KEY);
  applyData({});
  startApp();
}

function startApp(){
  document.getElementById('m-nav').style.display='';
  setTab('day');
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab routing
// ─────────────────────────────────────────────────────────────────────────────
function setTab(t){
  tab=t;
  document.querySelectorAll('.m-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));
  renderHeader();
  renderContent();
}

function renderHeader(){ ({day:renderDayHeader,week:renderWeekHeader,year:renderYearHeader,finance:renderFinHeader,search:renderSearchHeader})[tab](); }
function renderContent(){ ({day:renderDayContent,week:renderWeekContent,year:renderYearContent,finance:renderFinContent,search:renderSearchContent})[tab](); }

// ─────────────────────────────────────────────────────────────────────────────
// Day — header
// ─────────────────────────────────────────────────────────────────────────────
function renderDayHeader(){
  const mon=weekMon(curDay);
  const strips=DAY_LETTER.map((l,i)=>{
    const d=addDays(mon,i);
    const dk=fd(d);
    const isToday=sameDay(d,today);
    const isActive=sameDay(d,curDay);
    const hasEvents=(DATA.events[dk]||[]).length>0;
    return '<div class="day-strip-cell'+(isToday?' today':isActive?' active':'')+'" onclick="jumpDay('+d.getTime()+')">'+
      '<div class="day-strip-label">'+l+'</div>'+
      '<div class="day-strip-num">'+d.getDate()+'</div>'+
      (hasEvents?'<div class="day-strip-dot"></div>':'<div style="width:4px;height:4px"></div>')+
    '</div>';
  }).join('');

  const label=DAY_LETTER[dayIdx(curDay)]+' · '+MONTH_SHORT[curDay.getMonth()]+' '+curDay.getDate();
  document.getElementById('m-header').innerHTML=
    '<div class="m-header-nav">'+
      '<button class="m-nav-btn" onclick="shiftDay(-1)">←</button>'+
      '<div class="m-header-title">'+label+'</div>'+
      '<button class="m-nav-btn" onclick="shiftDay(1)">→</button>'+
    '</div>'+
    '<div class="m-header-sub">'+curDay.getFullYear()+' · age '+calcAge(curDay.getFullYear())+'</div>'+
    '<div class="day-week-strip">'+strips+'</div>';
}

function shiftDay(n){ curDay=addDays(curDay,n); renderDayHeader(); renderDayContent(); }
function jumpDay(ts){ curDay=new Date(ts); renderDayHeader(); renderDayContent(); }

// ─────────────────────────────────────────────────────────────────────────────
// Day — content
// ─────────────────────────────────────────────────────────────────────────────
function renderDayContent(){
  const dk=fd(curDay);
  const events=(DATA.events[dk]||[]);
  const dayTotal=daySpendTotal(dk);

  // Events
  const evRows=events.map(e=>
    '<div class="event-row">'+
      '<div class="event-dot" style="background:'+e.color+'"></div>'+
      '<div class="event-text">'+e.text+'</div>'+
    '</div>'
  ).join('');

  const evSection=
    '<div class="m-section">'+
      '<div class="m-section-title">Events</div>'+
      (evRows||'<div style="font-size:12px;color:var(--text3);padding:4px 0">no events</div>')+
    '</div>';

  // Spend — line-item categories
  const lineCatHtml=LINE_CATS.map(cat=>{
    const items=(DATA.spendLog[dk]||{})[cat]||[];
    const total=spendLogTotal(dk,cat) || getSpend(dk,cat);
    const isOpen=openSpendCats.has(cat);

    const itemRows=items.map((it,idx)=>
      '<div class="spend-item-row">'+
        '<span class="spend-item-label">'+(it.label||'—')+'</span>'+
        '<span class="spend-item-amount">'+fmtY(it.amount)+'</span>'+
        '<button class="spend-item-del" onclick="deleteItem(\''+cat+'\','+idx+',\''+dk+'\')">×</button>'+
      '</div>'
    ).join('');

    return '<div class="spend-cat'+(isOpen?' open':'')+'">'+
      '<div class="spend-cat-header" onclick="toggleSpendCat(\''+cat+'\')">'+
        '<div class="spend-cat-names">'+
          '<div class="spend-cat-jp">'+CAT_LABELS[cat].jp+'</div>'+
          '<div class="spend-cat-en">'+CAT_LABELS[cat].en+'</div>'+
        '</div>'+
        '<div class="spend-cat-total">'+(total?fmtY(total):'¥0')+'</div>'+
        '<div class="spend-cat-chevron">▾</div>'+
      '</div>'+
      '<div class="spend-cat-body">'+
        itemRows+
        '<div class="spend-add-form">'+
          '<input class="spend-add-amount" type="number" inputmode="numeric" placeholder="¥" id="amt-'+cat+'">'+
          '<input class="spend-add-label" type="text" placeholder="label" id="lbl-'+cat+'">'+
          '<button class="spend-add-btn" onclick="addItem(\''+cat+'\',\''+dk+'\')">+</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  }).join('');

  // Spend — simple categories
  const simpleCatHtml=SIMPLE_CATS.map(cat=>{
    const val=getSpend(dk,cat);
    return '<div class="spend-simple-row">'+
      '<div class="spend-simple-names">'+
        '<div class="spend-simple-jp">'+CAT_LABELS[cat].jp+'</div>'+
        '<div class="spend-simple-en">'+CAT_LABELS[cat].en+'</div>'+
      '</div>'+
      '<input class="spend-simple-input" type="number" inputmode="numeric" value="'+(val||'')+'" placeholder="0"'+
        ' onchange="saveSimple(\''+cat+'\',\''+dk+'\',this.value)"'+
        ' onblur="saveSimple(\''+cat+'\',\''+dk+'\',this.value)">'+
    '</div>';
  }).join('');

  const spendSection=
    '<div class="m-section">'+
      '<div class="spend-total-bar">'+
        '<div class="spend-total-label">Spend</div>'+
        '<div class="spend-total-amount">'+(dayTotal?fmtY(dayTotal):'¥0')+'</div>'+
      '</div>'+
      lineCatHtml+
      '<div style="margin-top:4px">'+simpleCatHtml+'</div>'+
    '</div>';

  document.getElementById('m-content').innerHTML=evSection+spendSection;
}

// ─────────────────────────────────────────────────────────────────────────────
// Spend actions
// ─────────────────────────────────────────────────────────────────────────────
function toggleSpendCat(cat){
  openSpendCats.has(cat)?openSpendCats.delete(cat):openSpendCats.add(cat);
  renderDayContent();
}

function addItem(cat,dk){
  const amtEl=document.getElementById('amt-'+cat);
  const lblEl=document.getElementById('lbl-'+cat);
  const amount=evalExpr(amtEl.value);
  if(!amount) return;
  const label=lblEl.value.trim();

  if(!DATA.spendLog) DATA.spendLog={};
  if(!DATA.spendLog[dk]) DATA.spendLog[dk]={};
  if(!DATA.spendLog[dk][cat]) DATA.spendLog[dk][cat]=[];
  DATA.spendLog[dk][cat].push({id:uid(),amount,label});
  syncSpend(dk,cat);
  openSpendCats.add(cat);
  saveData();
  renderDayContent();
}

function deleteItem(cat,idx,dk){
  if(!DATA.spendLog[dk]||!DATA.spendLog[dk][cat]) return;
  DATA.spendLog[dk][cat].splice(idx,1);
  syncSpend(dk,cat);
  saveData();
  renderDayContent();
}

function saveSimple(cat,dk,val){
  const v=evalExpr(val);
  if(!DATA.spend[dk]) DATA.spend[dk]={};
  DATA.spend[dk][cat]=v;
  saveData();
  // re-render total only — avoid full re-render on every keystroke
  const dayTotal=daySpendTotal(dk);
  const el=document.querySelector('.spend-total-amount');
  if(el) el.textContent=dayTotal?fmtY(dayTotal):'¥0';
}

// ─────────────────────────────────────────────────────────────────────────────
// Week — header
// ─────────────────────────────────────────────────────────────────────────────
function renderWeekHeader(){
  const mon=weekMon(curDay);
  const sun=addDays(mon,6);
  const wk=getWeekNum(mon);
  const range=MONTH_SHORT[mon.getMonth()]+' '+mon.getDate()+'–'+
    (mon.getMonth()!==sun.getMonth()?MONTH_SHORT[sun.getMonth()]+' ':'')+sun.getDate();

  document.getElementById('m-header').innerHTML=
    '<div class="m-header-nav">'+
      '<button class="m-nav-btn" onclick="shiftWeek(-1)">←</button>'+
      '<div class="m-header-range">'+range+'</div>'+
      '<button class="m-nav-btn" onclick="shiftWeek(1)">→</button>'+
    '</div>'+
    '<div class="m-header-detail">Week '+wk+' · '+mon.getFullYear()+'</div>';
}

function shiftWeek(n){
  curDay=addDays(weekMon(curDay),n*7);
  renderWeekHeader(); renderWeekContent();
}

function getWeekNum(d){
  const jan1=new Date(d.getFullYear(),0,1);
  return Math.ceil(((d-jan1)/86400000+jan1.getDay()+1)/7);
}

// ─────────────────────────────────────────────────────────────────────────────
// Week — content
// ─────────────────────────────────────────────────────────────────────────────
function renderWeekContent(){
  const mon=weekMon(curDay);
  const prevMon=addDays(mon,-7);
  const total=weekTotal(mon);
  const prevTotal=weekTotal(prevMon);
  const delta=total-prevTotal;

  const hero=
    '<div class="week-hero">'+
      '<div class="week-hero-left">'+
        '<div class="week-hero-label">Week spend</div>'+
        '<div class="week-hero-total">'+fmtY(total)+'</div>'+
      '</div>'+
      '<div class="week-hero-delta '+(delta>=0?'up':'down')+'">'+
        (delta>=0?'+':'')+fmtY(delta)+' vs prev'+
      '</div>'+
    '</div>';

  const DAY_ABBR=['MON','TUE','WED','THU','FRI','SAT','SUN'];
  const rows=DAY_ABBR.map((abbr,i)=>{
    const d=addDays(mon,i);
    const dk=fd(d);
    const isT=sameDay(d,today);
    const events=DATA.events[dk]||[];
    const spend=daySpendTotal(dk);

    const dots=events.slice(0,5).map(e=>'<div class="week-event-dot" style="background:'+e.color+'"></div>').join('');

    return '<div class="week-day-row" onclick="jumpToDay('+d.getTime()+')">'+
      '<div class="week-day-label">'+abbr+'</div>'+
      '<div class="week-day-num'+(isT?' today':'')+'">'+d.getDate()+'</div>'+
      (events.length?
        '<div class="week-day-events">'+dots+'</div>':
        '<div class="week-day-quiet">quiet</div>')+
      '<div class="week-day-spend'+(spend?'':' zero')+'">'+fmtY(spend)+'</div>'+
    '</div>';
  }).join('');

  document.getElementById('m-content').innerHTML=hero+rows;
}

function jumpToDay(ts){
  curDay=new Date(ts);
  setTab('day');
}

// ─────────────────────────────────────────────────────────────────────────────
// Year — header
// ─────────────────────────────────────────────────────────────────────────────
function renderYearHeader(){
  document.getElementById('m-header').innerHTML=
    '<div class="m-header-nav">'+
      '<button class="m-nav-btn" onclick="shiftYear(-1)">←</button>'+
      '<div class="m-header-range">'+curYear+'</div>'+
      '<button class="m-nav-btn" onclick="shiftYear(1)">→</button>'+
    '</div>'+
    '<div class="m-header-detail">age '+calcAge(curYear)+'</div>';
}

function shiftYear(n){ curYear+=n; renderYearHeader(); renderYearContent(); }

// ─────────────────────────────────────────────────────────────────────────────
// Year — content
// ─────────────────────────────────────────────────────────────────────────────
function renderYearContent(){
  // Decade strip: curYear-3 to curYear+7 (11 years)
  const PALETTE={education:'#8FAFA2',family:'#86AFC5',friends:'#7C9CCB',
    health:'#C79A9A',partner:'#B7A6B5',personal:'#D69AA5',
    project:'#C49A73',travel:'#D1B36A',work:'#B8C89A'};

  function yearDots(y){
    const colors=new Set();
    Object.keys(DATA.events).forEach(dk=>{
      if(dk.startsWith(y+'-')) (DATA.events[dk]||[]).forEach(e=>colors.add(e.color));
    });
    return Array.from(colors).slice(0,4).map(c=>'<div class="decade-event-dot" style="background:'+c+'"></div>').join('');
  }

  const stripCards=[];
  for(let y=curYear-3;y<=curYear+7;y++){
    stripCards.push(
      '<div class="decade-card'+(y===curYear?' focused':'')+'" onclick="focusYear('+y+')">'+
        '<div class="decade-card-year">'+y+'</div>'+
        '<div class="decade-card-age">'+calcAge(y)+'</div>'+
        '<div class="decade-card-dots">'+yearDots(y)+'</div>'+
      '</div>'
    );
  }
  const strip='<div class="decade-strip">'+stripCards.join('')+'</div>';

  // Year cards: curYear-2 to curYear+2 (5 visible, more on scroll)
  const cards=[];
  for(let y=curYear-2;y<=curYear+5;y++){
    const isExpanded=expandedYears.has(y);
    const evCount=Object.keys(DATA.events).filter(dk=>dk.startsWith(y+'-'))
      .reduce((s,dk)=>s+(DATA.events[dk]||[]).length,0);
    const nisa=nisaCum(y);
    const nisaPct=Math.min(100,Math.round(nisa/18000000*100));
    const summaryKey=y+'-sum';
    const summary=(DATA.goals||{})[summaryKey]||'';

    if(!isExpanded){
      cards.push(
        '<div class="year-card">'+
          '<div class="year-card-collapsed" onclick="toggleYear('+y+')">'+
            '<div class="year-card-year">'+y+'</div>'+
            '<div class="year-card-age">age '+calcAge(y)+'</div>'+
            '<div class="year-card-summary">'+(summary||'—')+'</div>'+
            '<div class="year-card-meta">'+(evCount?evCount+'ev':'no events')+'</div>'+
          '</div>'+
        '</div>'
      );
    } else {
      // Expanded
      const monthRows=buildMonthRows(y,PALETTE);
      const tsumPct=Math.min(nisaPct,nisaPct*(1.2/3.6));
      const lsPct=Math.max(0,nisaPct-tsumPct);

      const aimKey=y+'-0-0'; const cpKey=y+'-0-1'; const noteKey=y+'-0-2';
      const g=DATA.goals||{};

      cards.push(
        '<div class="year-card">'+
          '<div class="year-card-collapsed" onclick="toggleYear('+y+')" style="border-bottom:1px solid var(--border)">'+
            '<div class="year-card-year">'+y+'</div>'+
            '<div class="year-card-age">age '+calcAge(y)+'</div>'+
            '<div style="flex:1"></div>'+
            '<div class="year-card-meta">▲ collapse</div>'+
          '</div>'+
          '<div class="year-card-expanded">'+
            '<div class="year-expanded-summary">'+
              '<input style="width:100%;border:none;background:none;outline:none;font-family:var(--sans);font-size:13px;color:var(--text2)"'+
              ' placeholder="one-line summary…" value="'+escHtml(summary)+'"'+
              ' onchange="saveGoal(\''+summaryKey+'\',this.value)">'+
            '</div>'+
            '<div class="year-nisa-bar-wrap">'+
              '<div class="year-nisa-label">'+
                '<span>NISA ¥'+Math.round(nisa/10000)+'万</span>'+
                '<span>'+nisaPct+'% of ¥18M</span>'+
              '</div>'+
              '<div class="year-nisa-bar">'+
                '<div class="year-nisa-t" style="width:'+tsumPct+'%"></div>'+
                '<div class="year-nisa-g" style="width:'+lsPct+'%"></div>'+
              '</div>'+
            '</div>'+
            monthRows+
            '<div class="year-footer">'+
              '<div class="year-goal-row"><span class="year-goal-icon">★</span>'+
                '<textarea class="year-goal-input" rows="1" placeholder="aim…" oninput="autoSz(this);saveGoal(\''+aimKey+'\',this.value)">'+escHtml(g[aimKey]||'')+'</textarea></div>'+
              '<div class="year-goal-row"><span class="year-goal-icon">▶</span>'+
                '<textarea class="year-goal-input" rows="1" placeholder="checkpoint…" oninput="autoSz(this);saveGoal(\''+cpKey+'\',this.value)">'+escHtml(g[cpKey]||'')+'</textarea></div>'+
              '<div class="year-goal-row"><span class="year-goal-icon">—</span>'+
                '<textarea class="year-goal-input" rows="1" placeholder="note…" oninput="autoSz(this);saveGoal(\''+noteKey+'\',this.value)">'+escHtml(g[noteKey]||'')+'</textarea></div>'+
            '</div>'+
          '</div>'+
        '</div>'
      );
    }
  }

  document.getElementById('m-content').innerHTML=strip+cards.join('');
  document.querySelectorAll('.year-goal-input').forEach(autoSz);
}

function buildMonthRows(y, PALETTE){
  const rows=[];
  for(let m=1;m<=12;m++){
    const mo=p2(m);
    const evs=[];
    for(let d=1;d<=daysInMonth(y,m);d++){
      const dk=y+'-'+mo+'-'+p2(d);
      (DATA.events[dk]||[]).forEach(e=>evs.push(e));
    }
    if(!evs.length) continue;
    const chips=evs.map(e=>{
      const bg=e.color+'33'; // 20% opacity tint
      return '<span class="year-event-chip" style="background:'+bg+';color:'+e.color+'">'+escHtml(e.text)+'</span>';
    }).join('');
    rows.push('<div class="year-month-row"><div class="year-month-label">'+MONTH_SHORT[m-1]+'</div><div class="year-month-chips">'+chips+'</div></div>');
  }
  return rows.length?rows.join(''):'<div style="font-size:12px;color:var(--text3);padding:4px 0">no events this year</div>';
}

function focusYear(y){ curYear=y; renderYearHeader(); renderYearContent(); }
function toggleYear(y){ expandedYears.has(y)?expandedYears.delete(y):expandedYears.add(y); renderYearContent(); }

function saveGoal(key,val){
  if(!DATA.goals) DATA.goals={};
  DATA.goals[key]=val;
  saveData();
}

function autoSz(el){ el.style.height='auto'; el.style.height=el.scrollHeight+'px'; }
function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ─────────────────────────────────────────────────────────────────────────────
// Finance — helpers
// ─────────────────────────────────────────────────────────────────────────────
function finCalc(moKey){
  const [year,mo]=[parseInt(moKey),parseInt(moKey.split('-')[1])];
  const f=DATA.finance[moKey]||{};
  const isNew=year>2025||(year===2025&&mo>=5);

  const salary    =evalExpr(f.salary)||0;
  const tReimb    =evalExpr(f.transportReimb)||0;
  const other     =evalExpr(f.otherIncome)||0;
  const momPays   =evalExpr(f.momPays)||0;
  const gross     =salary+tReimb+other+momPays;

  let ded=0;
  if(isNew){
    ['healthIns','careIns','childRearing','pensionIns','employmentIns','incomeTax','residentTax']
      .forEach(k=>{ ded+=evalExpr(f[k])||0; });
  } else {
    ded=(evalExpr(f.taxWithheld)||0)+(evalExpr(f.insuranceDed)||0);
  }
  const net=gross-ded;

  const food        =monthSpend(year,mo,'food');
  const commuteAuto =monthSpend(year,mo,'commute');
  const commPass    =evalExpr(f.commutationPass)||0;
  const commute     =commuteAuto+commPass;
  const transport   =monthSpend(year,mo,'transport');
  const necessities =monthSpend(year,mo,['transport','paperwork','medical','necessities','nhi']);
  const optional    =monthSpend(year,mo,['project','fun','clothes']);
  const fixed       =['rent','gas','water','electricity','phone','internet'].reduce((s,k)=>s+(evalExpr(f[k])||0),0);
  const balance     =net-commute-food-fixed-necessities-optional;

  return {gross,ded,net,salary,tReimb,other,momPays,food,commute,commuteAuto,commPass,
          transport,necessities,optional,fixed,balance,f,isNew,year,mo};
}

// ─────────────────────────────────────────────────────────────────────────────
// Finance — header
// ─────────────────────────────────────────────────────────────────────────────
function renderFinHeader(){
  const [year,mo]=curFinMo.split('-');
  document.getElementById('m-header').innerHTML=
    '<div class="m-header-nav">'+
      '<button class="m-nav-btn" onclick="shiftFinMo(-1)">←</button>'+
      '<div class="m-header-range">Finance · '+MONTH_SHORT[parseInt(mo)-1]+'</div>'+
      '<button class="m-nav-btn" onclick="shiftFinMo(1)">→</button>'+
    '</div>'+
    '<div class="m-header-detail">'+year+'</div>';
}

function shiftFinMo(n){
  let [year,mo]=[parseInt(curFinMo),parseInt(curFinMo.split('-')[1])];
  mo+=n;
  if(mo>12){mo=1;year++;} if(mo<1){mo=12;year--;}
  curFinMo=year+'-'+p2(mo);
  renderFinHeader(); renderFinContent();
}

// ─────────────────────────────────────────────────────────────────────────────
// Finance — content
// ─────────────────────────────────────────────────────────────────────────────
function renderFinContent(){
  const c=finCalc(curFinMo);
  const moKey=curFinMo;

  // Hero
  const prevMo=prevMonth(moKey);
  const prev=finCalc(prevMo);
  const delta=c.balance-prev.balance;
  const hero=
    '<div class="fin-hero">'+
      '<div class="fin-hero-label">Balance</div>'+
      '<div class="fin-hero-balance">'+fmtY(c.balance)+'</div>'+
      '<div class="fin-hero-delta '+(delta>=0?'up':'down')+'">'+
        (delta>=0?'+':'')+fmtY(delta)+' vs '+MONTH_SHORT[parseInt(prevMo.split('-')[1])-1]+
      '</div>'+
    '</div>';

  // Distribution bar
  const safeNet=c.net||1;
  const pSaved =Math.max(0,Math.round(c.balance/safeNet*100));
  const pFixed =Math.max(0,Math.round(c.fixed/safeNet*100));
  const pFood  =Math.max(0,Math.round(c.food/safeNet*100));
  const pComm  =Math.max(0,Math.round(c.commute/safeNet*100));
  const pNec   =Math.max(0,Math.round(c.necessities/safeNet*100));
  const pOp    =Math.max(0,Math.round(c.optional/safeNet*100));

  const distBar=
    '<div class="fin-dist-wrap">'+
      '<div class="fin-dist-label">'+fmtY(c.net)+' income → distribution</div>'+
      '<div class="fin-dist-bar">'+
        '<span style="width:'+pSaved+'%;background:'+FIN_C.saved+'"></span>'+
        '<span style="width:'+pFixed+'%;background:'+FIN_C.fixed+'"></span>'+
        '<span style="width:'+pFood+'%;background:'+FIN_C.food+'"></span>'+
        '<span style="width:'+pComm+'%;background:'+FIN_C.commute+'"></span>'+
        '<span style="width:'+pNec+'%;background:'+FIN_C.necessities+'"></span>'+
        '<span style="width:'+pOp+'%;background:'+FIN_C.optional+'"></span>'+
      '</div>'+
      '<div class="fin-dist-legend">'+
        '<span><i style="background:'+FIN_C.saved+'"></i>Saved <b>'+pSaved+'%</b></span>'+
        '<span><i style="background:'+FIN_C.fixed+'"></i>Fixed <b>'+pFixed+'%</b></span>'+
        '<span><i style="background:'+FIN_C.food+'"></i>Food <b>'+pFood+'%</b></span>'+
        '<span><i style="background:'+FIN_C.commute+'"></i>Commute <b>'+pComm+'%</b></span>'+
        '<span><i style="background:'+FIN_C.necessities+'"></i>Necessities <b>'+pNec+'%</b></span>'+
        '<span><i style="background:'+FIN_C.optional+'"></i>Optional <b>'+pOp+'%</b></span>'+
      '</div>'+
    '</div>';

  // Accordion sections
  const sections=[
    buildIncomeSection(c,moKey),
    buildFixedSection(c,moKey),
    buildAutoSection('commute','Commute 通勤',fmtY(c.commute),commuteBody(c,moKey)),
    buildAutoSection('food','Food 食べ物',fmtY(c.food),autoCatRow('食べ物','Food',c.food)),
    buildAutoSection('necessities','Necessities 生活費',fmtY(c.necessities),
      autoCatRow('電車代金','Transport',monthSpend(c.year,c.mo,'transport'))+
      autoCatRow('メディカル','Medical',monthSpend(c.year,c.mo,'medical'))+
      autoCatRow('日常生活','Daily',monthSpend(c.year,c.mo,'necessities'))+
      autoCatRow('国民保険','NHI',monthSpend(c.year,c.mo,'nhi'))),
    buildAutoSection('optional','Optional 任意支出',fmtY(c.optional),
      autoCatRow('ゲーム/Project','Project',monthSpend(c.year,c.mo,'project'))+
      autoCatRow('エンターテインメント','Entertainment',monthSpend(c.year,c.mo,'fun'))+
      autoCatRow('服・髪','Clothes',monthSpend(c.year,c.mo,'clothes'))),
  ].join('');

  // Net
  const netRow=
    '<div class="fin-net-row">'+
      '<div class="fin-net-label">Net</div>'+
      '<div class="fin-net-amount '+(c.balance>=0?'pos':'neg')+'">'+fmtY(c.balance)+'</div>'+
    '</div>';

  document.getElementById('m-content').innerHTML=hero+distBar+sections+netRow;
}

function buildIncomeSection(c,moKey){
  const f=c.f; const isNew=c.isNew;
  const isOpen=openSections.has('income');
  const dedFields=isNew?
    [['healthIns','Health insurance (−)'],['careIns','Care insurance (−)'],['childRearing','Child-rearing insurance (−)'],
     ['pensionIns','Pension insurance (−)'],['employmentIns','Employment insurance (−)'],['incomeTax','Income tax (−)'],['residentTax','Resident tax (−)']]:
    [['taxWithheld','Tax withheld (−)'],['insuranceDed','Insurance (−)']];

  const rows=[
    finRow('Salary','給料','salary',f,moKey),
    finRow('Transport reimbursement','交通費補助','transportReimb',f,moKey),
    finRow('Other income','所得','otherIncome',f,moKey),
    finRow('Mom pays','親の援助','momPays',f,moKey),
    ...dedFields.map(([k,lbl])=>finRow(lbl,'',k,f,moKey)),
  ].join('');

  return buildSection('income','Income 収入',fmtY(c.net),false,rows);
}

function buildFixedSection(c,moKey){
  const f=c.f;
  const rows=[
    finRow('Rent','家賃','rent',f,moKey),
    finRow('Gas','ガス','gas',f,moKey),
    finRow('Water','水道','water',f,moKey),
    finRow('Electricity','電気','electricity',f,moKey),
    finRow('Phone','携帯','phone',f,moKey),
    finRow('Internet','ネット','internet',f,moKey),
  ].join('');
  return buildSection('fixed','Fixed 固定費',fmtY(c.fixed),false,rows);
}

function commuteBody(c,moKey){
  const f=c.f;
  return finRow('Commutation pass','定期券','commutationPass',f,moKey)+
    '<div class="fin-field-row"><div class="fin-field-label"><div>Daily commute</div><div class="fin-field-sub">通勤費 AUTO</div></div><div class="fin-field-auto">'+fmtY(c.commuteAuto)+'</div></div>';
}

function autoCatRow(jp,en,amount){
  return '<div class="fin-field-row">'+
    '<div class="fin-field-label"><div>'+en+'</div><div class="fin-field-sub">'+jp+'</div></div>'+
    '<div class="fin-field-auto">'+fmtY(amount)+'</div>'+
  '</div>';
}

function finRow(label,sub,fieldKey,f,moKey){
  const key=fieldKey;
  const val=f[key]||'';
  const filled=!!val;
  return '<div class="fin-field-row">'+
    '<div class="fin-field-label"><div>'+label+'</div>'+(sub?'<div class="fin-field-sub">'+sub+'</div>':'')+' </div>'+
    '<input class="fin-field-input'+(filled?' filled':'')+'" value="'+escHtml(String(val))+'"'+
    ' placeholder="0" inputmode="decimal"'+
    ' onchange="saveFinField(\''+moKey+'\',\''+key+'\',this.value);this.classList.toggle(\'filled\',!!this.value)"'+
    '>'+
  '</div>';
}

function buildSection(key,name,total,isAuto,body){
  const isOpen=openSections.has(key);
  return '<div class="fin-section'+(isOpen?' open':'')+'">'+
    '<div class="fin-section-header" onclick="toggleSection(\''+key+'\')">'+
      '<div class="fin-section-name">'+name+'</div>'+
      (isAuto?'<div class="fin-section-auto">AUTO</div>':'')+
      '<div class="fin-section-total">'+total+'</div>'+
      '<div class="fin-section-chevron">▾</div>'+
    '</div>'+
    '<div class="fin-section-body">'+body+'</div>'+
  '</div>';
}

function buildAutoSection(key,name,total,body){
  return buildSection(key,name,total,true,body);
}

function toggleSection(key){
  openSections.has(key)?openSections.delete(key):openSections.add(key);
  renderFinContent();
}

function saveFinField(moKey,field,val){
  if(!DATA.finance[moKey]) DATA.finance[moKey]={};
  DATA.finance[moKey][field]=val;
  saveData();
}

function prevMonth(moKey){
  let [year,mo]=[parseInt(moKey),parseInt(moKey.split('-')[1])];
  mo--; if(mo<1){mo=12;year--;}
  return year+'-'+p2(mo);
}

// ─────────────────────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────────────────────
function renderSearchHeader(){
  document.getElementById('m-header').innerHTML=
    '<div class="m-header-nav"><div class="m-header-range">Search</div></div>';
}

function renderSearchContent(){
  document.getElementById('m-content').innerHTML=
    '<div style="margin-bottom:10px">'+
      '<input id="m-search-inp" type="search" placeholder="search events..." '+
        'style="width:100%;box-sizing:border-box;border:1px solid var(--border);border-radius:var(--radius);padding:10px 12px;font-size:14px;font-family:var(--sans);background:var(--surface);color:var(--text);outline:none" '+
        'oninput="mobileSearchResults(this.value)">'+
    '</div>'+
    '<div id="m-search-results"></div>';
  document.getElementById('m-search-inp').focus();
}

function mobileSearchResults(q){
  const res=document.getElementById('m-search-results');
  const query=q.toLowerCase().trim();
  if(!query){res.innerHTML='';return;}
  const results=[];
  Object.keys(DATA.events).forEach(dk=>{
    (DATA.events[dk]||[]).forEach(e=>{
      if(e.text.toLowerCase().includes(query)) results.push({dk,e});
    });
  });
  results.sort((a,b)=>b.dk.localeCompare(a.dk));
  if(!results.length){
    res.innerHTML='<div style="font-size:13px;color:var(--text3);padding:8px 0">no results</div>';
    return;
  }
  res.innerHTML=results.map(r=>{
    const d=new Date(r.dk+'T12:00:00');
    const dl=DAY_LETTER[dayIdx(d)]+' '+d.getDate()+' '+MONTH_SHORT[d.getMonth()]+' '+d.getFullYear();
    return '<div onclick="curDay=new Date(\''+r.dk+'T12:00:00\');setTab(\'day\')" '+
      'style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border);cursor:pointer">'+
      '<span style="width:10px;height:10px;border-radius:50%;background:'+r.e.color+';flex-shrink:0"></span>'+
      '<span style="flex:1;font-size:14px;color:var(--text)">'+r.e.text+'</span>'+
      '<span style="font-size:11px;color:var(--text3);font-family:var(--mono);white-space:nowrap">'+dl+'</span>'+
    '</div>';
  }).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  showSplash();
});
