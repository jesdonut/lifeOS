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
function autoResize(el){el.style.height='auto';el.style.height=el.scrollHeight+'px';}
function buildSwatches(inputId,selected){
  return '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">'+
    PALETTE.map(function(p){
      var sel=p.color===(selected||PALETTE[0].color);
      return '<span onclick="selectSwatch(\''+p.color+'\',\''+inputId+'\')" data-swatch="'+inputId+'" data-color="'+p.color+'"'+
        ' style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px 3px 5px;border-radius:10px;cursor:pointer;border:1.5px solid '+(sel?'var(--text)':'transparent')+';background:var(--surface2);transition:.1s">'+
        '<span style="width:10px;height:10px;border-radius:50%;background:'+p.color+';flex-shrink:0"></span>'+
        '<span style="font-size:var(--fs-xs);color:var(--text2)">'+p.label+'</span>'+
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

const SYMPTOM_CATS=[
  {key:'mood',label:'Mood',items:[
    {key:'mood_swings',en:'Mood swings'},{key:'irritability',en:'Irritable'},{key:'sadness',en:'Sad'},
    {key:'crying_easily',en:'Crying easily'},{key:'anxiety',en:'Anxious'},{key:'emotional_sensitivity',en:'Emotional'},
    {key:'low_motivation',en:'Low motivation'},{key:'brain_fog',en:'Brain fog'},
  ]},
  {key:'pain',label:'Pain',items:[
    {key:'stomach_cramps',en:'Cramps'},{key:'lower_abdominal_pain',en:'Lower abdominal'},{key:'back_pain',en:'Back pain'},
    {key:'headache',en:'Headache'},{key:'migraine',en:'Migraine'},{key:'breast_pain',en:'Breast tender'},
    {key:'pelvic_heaviness',en:'Pelvic heavy'},{key:'body_aches',en:'Body aches'},{key:'muscle_aches',en:'Muscle aches'},
    {key:'joint_aches',en:'Joint aches'},{key:'leg_pain',en:'Leg pain'},{key:'shoulder_stiffness',en:'Shoulder stiff'},
    {key:'neck_stiffness',en:'Neck stiff'},{key:'jaw_pain',en:'Jaw pain'},{key:'chest_tightness',en:'Chest tight'},
    {key:'heart_palpitations',en:'Palpitations'},{key:'skin_sensitivity',en:'Skin sensitive'},{key:'body_sore',en:'Body sore'},
  ]},
  {key:'physical',label:'Physical',items:[
    {key:'fatigue',en:'Fatigue'},{key:'sleepiness',en:'Sleepy'},{key:'insomnia',en:'Insomnia'},
    {key:'difficulty_waking',en:'Hard to wake'},{key:'bloating',en:'Bloating'},{key:'gas',en:'Gas'},
    {key:'diarrhea',en:'Diarrhea'},{key:'constipation',en:'Constipation'},{key:'frequent_bowel',en:'Frequent bowel'},
    {key:'nausea',en:'Nausea'},{key:'food_cravings',en:'Cravings'},{key:'food_cravings_specific',en:'Sweet/salty/carbs'},
    {key:'appetite_changes',en:'Appetite changes'},{key:'increased_appetite',en:'Very hungry'},
    {key:'acne',en:'Acne'},{key:'dry_skin',en:'Dry skin'},{key:'oily_skin',en:'Oily skin'},{key:'itchy',en:'Itchy'},{key:'hair_loss',en:'Hair loss'},
    {key:'dizziness',en:'Dizzy'},{key:'lightheadedness',en:'Lightheaded'},{key:'hot_flashes',en:'Hot flashes'},
    {key:'cold_hands_feet',en:'Cold extremities'},{key:'swelling',en:'Swelling'},{key:'weight_fluctuation',en:'Weight change'},
    {key:'clumsiness',en:'Clumsy'},{key:'sneezing',en:'Sneezing'},{key:'chills',en:'Chills'},
    {key:'feeling_feverish',en:'Feverish'},{key:'mild_fever',en:'Mild fever'},{key:'malaise',en:'Malaise'},
    {key:'acid_reflux',en:'Acid reflux'},{key:'gum_sensitivity',en:'Gum sensitive'},
  ]},
  {key:'discharge',label:'Discharge',singleSelect:true,items:[
    {key:'discharge_dry',en:'dry'},{key:'discharge_sticky',en:'sticky'},
    {key:'discharge_creamy',en:'creamy'},{key:'discharge_watery',en:'watery'},
    {key:'discharge_eggwhite',en:'egg-white'},
  ]},
];
const TODAY_CARD_SYMS={
  mood:['mood_swings','irritability','sadness','anxiety','low_motivation','brain_fog'],
  pain:['stomach_cramps','back_pain','headache','breast_pain','body_aches'],
  physical:['fatigue','bloating','nausea','food_cravings','insomnia','itchy'],
  discharge:['discharge_dry','discharge_sticky','discharge_creamy','discharge_watery','discharge_eggwhite']
};
const FLOW_LEVELS=[
  {key:'none',en:'none'},{key:'spotting',en:'spotting'},{key:'light',en:'light'},
  {key:'medium',en:'medium'},{key:'heavy',en:'heavy'},
];

const SPEND_CATS=[
  {key:'food',       jp:'食べ物',          en:'Food',          group:'food'},
  {key:'commute',    jp:'通勤費',           en:'Commute',       group:'transport'},
  {key:'transport',  jp:'電車代金',         en:'Transport',     group:'necessities'},
  {key:'paperwork',  jp:'書類仕事',         en:'Paperwork',     group:'necessities'},
  {key:'medical',    jp:'メディカル',       en:'Medical',       group:'necessities'},
  {key:'necessities',jp:'日常生活',         en:'Daily',         group:'necessities'},
  {key:'nhi',        jp:'国民保険',         en:'NHI',           group:'necessities'},
  {key:'project',    jp:'プロジェクト',         en:'Project',  group:'optional'},
  {key:'fun',        jp:'エンターテインメント', en:'Entertainment', group:'optional'},
  {key:'clothes',    jp:'服・髪',           en:'Clothes/Hair',  group:'optional'},
];

const CURRENCIES=[
  {code:'JPY',flag:'🇯🇵',rate:1},{code:'IDR',flag:'🇮🇩',rate:0.0093,hidden:true},
  {code:'USD',flag:'🇺🇸',rate:149.5},{code:'GBP',flag:'🇬🇧',rate:189.2},
  {code:'CNY',flag:'🇨🇳',rate:20.7},{code:'MYR',flag:'🇲🇾',rate:32.1},
];

const today=new Date();
const MIN_YEAR=1995,MAX_YEAR=2095;
let view='week',stab='notes',cursor=new Date(today),multiYearStart=2026,focusDay=null;
let _periodSymKey={}; // flat key→en lookup, built lazily
let _nisaLsExpanded=false;
let _yearExpanded=null;
let _currenciesExpanded=true,_bondsExpanded=false;

// DATA MODEL
// events: "YYYY-MM-DD": [{id, text, color}]
// tasks:  "YYYY-MM-DD": [{id, text, done}]
// slots:  "YYYY-MM-DD": [{id, startH, startM, endH, endM, text}]
// spend:  "YYYY-MM-DD": {food:{raw,val}, transport:{raw,val},...}
// goals:  "YYYY-MM-N":  string
// notes:  [{id, text, date}]
// nisa: {tsumitateMonthly, lumpSumYearly, startYear, projectionYears}
// currencies: {code: amount}

let DATA={events:{},tasks:{},slots:{},spend:{},goals:{},notes:[],countdowns:[],nisa:{tsumitateMonthly:0,tsumitateByYear:{},lumpSumByYear:{},startYear:2026,startMonth:1,projectionYears:[today.getFullYear(),today.getFullYear()+2,today.getFullYear()+5]},currencies:{},currencyRates:{},baseCurrency:'JPY',currencyLots:[],bonds:[],bankAccounts:[],finance:{},period:{enabled:false,entries:[],symptomLogs:[],defaultLength:5}};

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

// ── SPEND LOG (line-item tracking for food / commute / transport) ──────
var LOG_CATS=['food','commute','transport'];
function spendLogItems(dk,cat){
  return ((DATA.spendLog||{})[dk]||{})[cat]||[];
}
function spendLogTotal(dk,cat){
  return spendLogItems(dk,cat).reduce(function(s,e){return s+e.amount;},0);
}
function syncSpendLog(dk,cat){
  if(!DATA.spend[dk]) DATA.spend[dk]={};
  DATA.spend[dk][cat]=spendLogTotal(dk,cat);
}
function addSpendLogItem(dk,cat){
  var amtEl=document.getElementById('sl-amt');
  var lblEl=document.getElementById('sl-lbl');
  var amt=parseExpr(amtEl.value.trim());
  if(!amt) return;
  var lbl=lblEl.value.trim();
  if(!DATA.spendLog) DATA.spendLog={};
  if(!DATA.spendLog[dk]) DATA.spendLog[dk]={};
  if(!DATA.spendLog[dk][cat]) DATA.spendLog[dk][cat]=[];
  DATA.spendLog[dk][cat].push({id:uid(),amount:amt,label:lbl});
  syncSpendLog(dk,cat);
  autoSave();
  openSpendLog(dk,cat);
}
function deleteSpendLogItem(dk,cat,id){
  if(!DATA.spendLog||!DATA.spendLog[dk]||!DATA.spendLog[dk][cat]) return;
  DATA.spendLog[dk][cat]=DATA.spendLog[dk][cat].filter(function(e){return e.id!==id;});
  syncSpendLog(dk,cat);
  autoSave();
  openSpendLog(dk,cat);
}
function openSpendLog(dk,cat){
  var catLabel=SPEND_CATS.find(function(c){return c.key===cat;});
  var label=(catLabel?catLabel.en:cat);
  var d=new Date(dk+'T12:00:00');
  var dateLabel=DAYS[d.getDay()==0?6:d.getDay()-1]+' '+d.getDate();
  if(!DATA.spendLog[dk]) DATA.spendLog[dk]={};
  if(!DATA.spendLog[dk][cat]){
    var importedAmt=((DATA.spend[dk])||{})[cat]||0;
    if(importedAmt){
      DATA.spendLog[dk][cat]=[{id:uid(),amount:importedAmt,label:''}];
      autoSave();
    }
  }
  var items=spendLogItems(dk,cat);
  var total=spendLogTotal(dk,cat);
  var listHtml=items.length?items.map(function(e){
    var del='<button class="sl-del" onclick="deleteSpendLogItem(\''+dk+'\',\''+cat+'\',\''+e.id+'\')">×</button>';
    return '<div class="sl-item">'+
      '<span class="sl-item-label">'+(e.label||'—')+'</span>'+
      '<span class="sl-item-amount">¥'+e.amount.toLocaleString()+'</span>'+
      del+
    '</div>';
  }).join(''):'<div style="font-size:var(--fs-xs);color:var(--text3);padding:6px 0">no entries yet</div>';
  openModal(
    '<div class="modal-title">'+label+' — '+dateLabel+'</div>'+
    '<div class="sl-list">'+listHtml+'</div>'+
    (items.length?'<div class="sl-total">total ¥'+total.toLocaleString()+'</div>':'')+
    '<div class="sl-add-row">'+
      '<input id="sl-amt" class="sl-inp" type="text" inputmode="decimal" placeholder="¥ amount" style="width:90px" onkeydown="if(event.key===\'Enter\')addSpendLogItem(\''+dk+'\',\''+cat+'\')">'+
      '<input id="sl-lbl" class="sl-inp" type="text" placeholder="label (optional)" style="flex:1" onkeydown="if(event.key===\'Enter\')addSpendLogItem(\''+dk+'\',\''+cat+'\')">'+
      '<button class="modal-btn" onclick="addSpendLogItem(\''+dk+'\',\''+cat+'\')">add</button>'+
    '</div>'+
    '<div style="margin-top:8px"><button class="modal-btn ghost" onclick="closeModal();render()">done</button></div>'
  );
  document.getElementById('sl-amt').focus();
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

function toggleSidebar(){
  var sb=document.getElementById('sidebar');
  var collapsed=sb.classList.toggle('collapsed');
  document.getElementById('sidebar-toggle-btn').textContent=collapsed?'›':'‹';
  localStorage.setItem('sidebar-collapsed',collapsed?'1':'');
}

function applyFontSize(px){
  var base=parseInt(px)||15;
  document.documentElement.style.setProperty('--fs-base',base+'px');
  document.documentElement.style.setProperty('--fs-sm',(base-2)+'px');
  document.documentElement.style.setProperty('--fs-xs',(base-4)+'px');
}

function setSidebarDefault(checked){
  var sb=document.getElementById('sidebar');
  var btn=document.getElementById('sidebar-toggle-btn');
  if(checked){
    sb.classList.add('collapsed');
    if(btn) btn.textContent='›';
    localStorage.setItem('sidebar-collapsed','1');
  } else {
    sb.classList.remove('collapsed');
    if(btn) btn.textContent='‹';
    localStorage.removeItem('sidebar-collapsed');
  }
}

function openSettingsModal(){
  var fs=parseInt(localStorage.getItem('fs-base'))||15;
  var sbCollapsed=!!localStorage.getItem('sidebar-collapsed');
  openModal(
    '<div class="modal-title">settings</div>'+
    '<div style="margin-bottom:16px">'+
      '<div style="font-size:var(--fs-sm);color:var(--text2);margin-bottom:8px">font size — <span id="fs-val">'+fs+'</span>px</div>'+
      '<input type="range" min="12" max="18" step="1" value="'+fs+'" style="width:100%;accent-color:var(--accent)" '+
        'oninput="applyFontSize(this.value);document.getElementById(\'fs-val\').textContent=this.value;localStorage.setItem(\'fs-base\',this.value)">'+
      '<div style="display:flex;justify-content:space-between;font-size:var(--fs-xs);color:var(--text3);margin-top:3px"><span>12px compact</span><span>15px default</span><span>18px large</span></div>'+
    '</div>'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+
      '<input type="checkbox" id="sb-default"'+(sbCollapsed?' checked':'')+' style="width:auto;margin:0;accent-color:var(--accent)" onchange="setSidebarDefault(this.checked)">'+
      '<label for="sb-default" style="font-size:var(--fs-sm);color:var(--text2);cursor:pointer">sidebar collapsed by default</label>'+
    '</div>'+
    '<div style="border-top:1px solid var(--border);padding-top:14px;margin-bottom:12px">'+
      '<div style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:10px">Period Tracker</div>'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'+
        '<input type="checkbox" id="period-toggle"'+((DATA.period&&DATA.period.enabled)?' checked':'')+' style="width:auto;margin:0;accent-color:var(--accent)" onchange="DATA.period.enabled=this.checked;render()">'+
        '<label for="period-toggle" style="font-size:var(--fs-sm);color:var(--text2);cursor:pointer">enable period tracker</label>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<span style="font-size:var(--fs-sm);color:var(--text2)">default duration</span>'+
        '<input type="number" min="1" max="14" value="'+((DATA.period&&DATA.period.defaultLength)||5)+'" style="width:50px;border:1px solid var(--border);border-radius:var(--radius);padding:4px 6px;font-family:var(--mono);font-size:var(--fs-sm);background:var(--surface2);color:var(--text);outline:none;text-align:center" onchange="DATA.period.defaultLength=Math.max(1,parseInt(this.value)||5);autoSave()">'+
        '<span style="font-size:var(--fs-xs);color:var(--text3)">days</span>'+
      '</div>'+
    '</div>'+
    '<button class="modal-btn ghost" onclick="closeModal()">done</button>'
  );
}

// ── SEARCH ────────────────────────────────────────────────────────────
function openSearchModal(){
  openModal(
    '<div class="modal-title">search events</div>'+
    '<input id="search-inp" type="text" placeholder="type to search..." class="sl-inp" style="width:100%;box-sizing:border-box;font-size:var(--fs-sm);padding:7px 10px;margin-bottom:8px" oninput="renderSearchResults(this.value)" onkeydown="if(event.key===\'Escape\')closeModal()">'+
    '<div id="search-results" style="max-height:320px;overflow-y:auto"></div>'+
    '<div style="margin-top:10px"><button class="modal-btn ghost" onclick="closeModal()">close</button></div>'
  );
  document.getElementById('search-inp').focus();
}
function renderSearchResults(q){
  var res=document.getElementById('search-results');
  var query=q.toLowerCase().trim();
  if(!query){res.innerHTML='';return;}
  var results=[];
  Object.keys(DATA.events).forEach(function(dk){
    (DATA.events[dk]||[]).forEach(function(e){
      if(e.text.toLowerCase().includes(query)) results.push({dk:dk,e:e});
    });
  });
  results.sort(function(a,b){return b.dk.localeCompare(a.dk);});
  if(!results.length){res.innerHTML='<div style="font-size:var(--fs-sm);color:var(--text3);padding:6px 0">no results</div>';return;}
  res.innerHTML=results.map(function(r){
    var d=new Date(r.dk+'T12:00:00');
    var dl=DAYS[d.getDay()===0?6:d.getDay()-1]+' '+d.getDate()+' '+MONTHS[d.getMonth()].slice(0,3)+' '+d.getFullYear();
    return '<div class="search-result" onclick="closeModal();cursor=new Date(\''+r.dk+'T12:00:00\');setView(\'week\')">'+
      '<span style="width:8px;height:8px;border-radius:50%;background:'+r.e.color+';flex-shrink:0;display:inline-block"></span>'+
      '<span style="flex:1;font-size:var(--fs-sm);color:var(--text)">'+r.e.text+'</span>'+
      '<span style="font-size:var(--fs-xs);color:var(--text3);font-family:var(--mono)">'+dl+'</span>'+
    '</div>';
  }).join('');
}
document.addEventListener('keydown',function(e){
  if(e.key==='/'&&document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='TEXTAREA'&&!document.activeElement.isContentEditable){
    e.preventDefault();openSearchModal();
  }
});

(function(){
  var fs=localStorage.getItem('fs-base');
  if(fs) applyFontSize(fs);
  if(localStorage.getItem('sidebar-collapsed')){
    var sb=document.getElementById('sidebar');
    if(sb) sb.classList.add('collapsed');
    var btn=document.getElementById('sidebar-toggle-btn');
    if(btn) btn.textContent='›';
  }
})();


function openAddEventModal(key){
  const d=key||fd(cursor);
  openModal(
    '<div class="modal-title">add event — '+d+'</div>'+
    '<input id="evt-text" placeholder="event name..." autofocus>'+
    '<input id="evt-date" type="date" value="'+d+'" style="width:100%;border:1px solid var(--border);border-radius:var(--radius);padding:6px 8px;font-family:var(--sans);font-size:var(--fs-sm);background:var(--surface2);color:var(--text);outline:none;margin-bottom:8px">'+
    '<div style="font-size:var(--fs-xs);color:var(--text2);margin-bottom:5px">colour</div>'+
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
  var dateStyle='width:100%;border:1px solid var(--border);border-radius:var(--radius);padding:6px 8px;font-family:var(--sans);font-size:var(--fs-sm);background:var(--surface2);color:var(--text);outline:none;margin-bottom:8px';
  openModal(
    '<div class="modal-title">edit event</div>'+
    '<input id="evt-text" value="'+evt.text.replace(/"/g,'&quot;')+'" placeholder="event name...">'+
    '<input id="evt-date" type="date" value="'+key+'" style="'+dateStyle+'">'+
    '<div style="font-size:var(--fs-xs);color:var(--text2);margin-bottom:5px">colour</div>'+
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
  else if(view==='period') cursor.setFullYear(cursor.getFullYear()+dir);
  var cy=cursor.getFullYear();
  if(view==='period'){
    if(cy<2017)cursor=new Date(2017,0,1);
    if(cy>2055)cursor=new Date(2055,0,1);
  }else{
    if(cy<MIN_YEAR){cursor=new Date(MIN_YEAR,0,1);}
    if(cy>MAX_YEAR){cursor=new Date(MAX_YEAR,11,31);}
  }
  multiYearStart=Math.max(MIN_YEAR,Math.min(MAX_YEAR-4,multiYearStart));
  render();
}
function jumpWeek(key){const p=key.split('-');cursor=new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));focusDay=key;setView('week');}
function jumpMonth(y,m){cursor=new Date(y,m,1);setView('month');}

function render(){
  const panel=document.getElementById('main-panel');
  const label=document.getElementById('period-label');
  panel.style.display='';panel.style.flexDirection='';
  var pvbtn=document.getElementById('period-vbtn');
  if(pvbtn) pvbtn.style.display=(DATA.period&&DATA.period.enabled)?'':'none';
  if(view==='period'&&!(DATA.period&&DATA.period.enabled)) view='week';
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
  }else if(view==='period'){
    label.textContent='period · '+cursor.getFullYear();
    renderPeriod(panel,cursor.getFullYear());
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
        '<button style="background:none;border:none;cursor:pointer;color:inherit;opacity:.6;font-size:var(--fs-xs);flex-shrink:0" onclick="event.stopPropagation();deleteEvent(\''+key+'\',\''+e.id+'\');render()">×</button>'+
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
        '<button onclick="openAddEventModal(\''+key+'\')" style="background:none;border:1px dashed var(--border2);border-radius:10px;padding:2px 6px;font-size:var(--fs-xs);color:var(--text3);cursor:pointer;width:100%">+ event</button>'+
        (spend?'<div class="wc-spend">'+fmtSpend(spend)+'</div>':'')+
      '</div>';
  }
  // ── spend panel ──
  const wkDays=[];
  for(let si=0;si<7;si++){const sd=new Date(mon);sd.setDate(mon.getDate()+si);wkDays.push({d:sd,key:fd(sd)});}
  var spHdr='<div class="wk-sp-corner">spend</div>'+
    wkDays.map(function(di,i){return '<div class="wk-sp-hdr">'+DAYS[i][0]+'<span class="wk-sp-hdr-n">'+di.d.getDate()+'</span></div>';}).join('');
  var spRows=SPEND_CATS.map(function(cat){
    var isLog=LOG_CATS.indexOf(cat.key)>=0;
    return '<div class="wk-sp-lab"><span class="wk-sp-jp">'+cat.jp+'</span><span class="wk-sp-en">'+cat.en+'</span></div>'+
      wkDays.map(function(di){
        if(isLog){
          var tot=spendLogTotal(di.key,cat.key)||spendVal((DATA.spend[di.key]||{})[cat.key]);
          return '<div class="wk-sp-cell"><div class="wk-sp-log" onclick="openSpendLog(\''+di.key+'\',\''+cat.key+'\')">'+(tot?'¥'+tot.toLocaleString():'+')+' </div></div>';
        }
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
      '<span style="font-family:var(--mono);font-size:var(--fs-xs);color:var(--text2)">week '+fmtSpend(weekTotal)+'</span>'+
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
    '<div class="month-wrap">'+
      '<div style="display:flex;justify-content:flex-end;padding:8px 10px;border-bottom:1px solid var(--border);flex-shrink:0">'+
        '<button onclick="openAddEventModal()" style="background:none;border:1px solid var(--border);border-radius:10px;padding:3px 12px;font-size:var(--fs-xs);color:var(--text2);cursor:pointer">+ add event</button>'+
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
  var decStrip='<div class="year-strip">';
  for(var dy=decStart;dy<=decEnd;dy++){
    var dage=dy-birthYear;
    var dcounts=yearEvtCounts(dy);
    var catKeys=['work','life','learn','travel','other'];
    var catClrs={work:'var(--c-work)',life:'var(--c-life)',learn:'var(--c-learn)',travel:'var(--c-travel)',other:'var(--text3)'};
    var ddots=catKeys.filter(function(c){return dcounts[c]>0;}).map(function(c){
      return '<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:'+catClrs[c]+';margin:1px"></span>';
    }).join('');
    decStrip+=
      '<div class="year-strip-card'+(dy===year?' year-strip-cur':'')+'" onclick="cursor=new Date('+dy+',0,1);render()" title="'+dy+'">'+
        '<div class="year-strip-year">'+dy+'</div>'+
        '<div class="year-strip-age">age '+dage+'</div>'+
        '<div class="year-strip-dots">'+ddots+'</div>'+
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
    const tlMLabels=Array.from({length:12},function(_,i){return '<div class="year-tl-mlabel" style="grid-column:'+(i+1)+'">'+MS[i]+'</div>';}).join('');
    const tlChips=Array.from({length:Math.max(tlTracks,0)},function(){return '';});
    for(let tmi=1;tmi<=12;tmi++){
      (tlByMonth[tmi]||[]).forEach(function(e,ti){
        tlChips[ti]+='<div class="year-tl-chip" style="grid-column:'+tmi+';background:'+e.color+'18" title="'+e.text.replace(/"/g,'&quot;')+'">'+
          '<span class="year-tl-dot" style="background:'+e.color+'"></span><span class="year-tl-txt" style="color:'+e.color+'">'+e.text+'</span></div>';
      });
    }
    const tlHtml=
      '<div class="year-timeline">'+
        '<div class="year-tl-header">'+tlMLabels+'</div>'+
        tlChips.map(function(c){return '<div class="year-tl-track">'+c+'</div>';}).join('')+
      '</div>';
    const nisaRow=allNisaRows.find(function(r){return r.year===y;});
    const contrib=nisaRow?nisaRow.cumulative:0;
    const thisYrDelta=nisaRow?nisaRow.total:0;
    const nisPct=Math.min(100,Math.round(contrib/180000));
    const yCounts=yearEvtCounts(y);
    const summaryKey=y+'-sum';
    const catBadges=['work','life','learn','travel'].filter(function(c){return yCounts[c]>0;}).map(function(c){
      return '<span class="year-cat-badge year-cat-'+c+'">'+yCounts[c]+' '+c+'</span>';
    }).join('');
    const nisaRight=
      '<div class="year-hdr-nisa">'+
        '<div class="year-hdr-nisa-bar"><div class="year-hdr-nisa-fill" style="width:'+nisPct+'%"></div></div>'+
        '<div class="year-hdr-nisa-vals">'+
          '<span class="year-hdr-nisa-v">¥'+contrib.toLocaleString()+'</span>'+
          '<span class="year-hdr-nisa-p">'+nisPct+'%</span>'+
          (thisYrDelta>0?'<span class="year-hdr-nisa-d">+¥'+thisYrDelta.toLocaleString()+'</span>':'')+
        '</div>'+
      '</div>';
    // ── aims footer ──
    const footerCols=[
      {icon:'★',placeholder:'aim...',key:y+'-0-0'},
      {icon:'▶',placeholder:'checkpoint...',key:y+'-0-1'},
      {icon:'—',placeholder:'note...',key:y+'-0-2'},
    ];
    const footerHtml=
      '<div class="year-footer">'+
        footerCols.map(function(fc){
          return '<div class="year-footer-col">'+
            '<span class="year-footer-icon">'+fc.icon+'</span>'+
            '<input class="year-footer-inp" placeholder="'+fc.placeholder+'" value="'+(DATA.goals[fc.key]||'')+'" onchange="DATA.goals[\''+fc.key+'\']=this.value;autoSave()">'+
          '</div>';
        }).join('')+
      '</div>';

    // ── collapse sparse years ──
    const totalEvtCount=Object.values(yCounts).reduce(function(s,n){return s+n;},0);
    const isExpanded=focused||_yearExpanded===y||totalEvtCount>0;
    if(!isExpanded){
      strip+=
        '<div class="my-year-section year-collapsed" onclick="_yearExpanded='+y+';render()">'+
          '<span class="my-year-num">'+y+'</span>'+
          '<span class="my-year-age">age '+age+'</span>'+
          '<span class="year-collapsed-meta">'+(contrib>0?'NISA ¥'+contrib.toLocaleString():'no NISA')+(DATA.goals[summaryKey]?' · '+DATA.goals[summaryKey]:'')+'</span>'+
          '<span class="year-collapsed-expand">expand →</span>'+
        '</div>';
    } else {
      strip+=
        '<div class="my-year-section'+(focused?' my-year-focused':'')+'">'+
          '<div class="year-card-hdr">'+
            '<div class="year-card-left">'+
              '<span class="my-year-num" onclick="cursor=new Date('+y+',0,1);render()" style="cursor:pointer" title="view '+y+'">'+y+'</span>'+
              '<span class="my-year-age">age '+age+'</span>'+
              (catBadges?'<div class="year-cat-badges">'+catBadges+'</div>':'')+
            '</div>'+
            '<div class="year-card-center">'+
              '<input class="year-summary-inp" placeholder="year summary..." value="'+(DATA.goals[summaryKey]||'')+'" onchange="DATA.goals[\''+summaryKey+'\']=this.value;autoSave()">'+
            '</div>'+
            '<div class="year-card-right">'+nisaRight+'</div>'+
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
            (mTotal?'<span style="font-family:var(--mono);font-size:var(--fs-xs);color:var(--text3)">'+fmtSpend(mTotal)+'</span>':'')+
            '<button onclick="openAddEventModal(\''+ year+'-'+String(m+1).padStart(2,'0')+'-01\')" style="background:none;border:1px dashed var(--border2);border-radius:8px;padding:1px 8px;font-size:var(--fs-xs);color:var(--text3);cursor:pointer">+ event</button>'+
          '</div>'+
        '</div>'+
        '<div class="ymb-mini-grid">'+cells+'</div>'+
        (taskCount?'<div style="padding:2px 8px 4px;font-size:var(--fs-xs);color:#9b7ec8;font-family:var(--mono)">'+taskCount+' open task'+(taskCount>1?'s':'')+'</div>':'')+
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
function toggleSavingsPanel(panel){
  if(panel==='currencies') _currenciesExpanded=!_currenciesExpanded;
  if(panel==='bonds') _bondsExpanded=!_bondsExpanded;
  render();
}
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
function removeNisaYear(year){
  if(DATA.nisa.lumpSumByYear) delete DATA.nisa.lumpSumByYear[year];
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
  DATA.nisa.projectionYears=DATA.nisa.projectionYears.filter(function(year){return year!==y;});
  render();
}
function addTsumitateYear(){
  var y=parseInt(prompt('Year to configure monthly tsumitate for (e.g. 2027):'));
  if(!y||y<2020||y>2100) return;
  if(!DATA.nisa.tsumitateByYear) DATA.nisa.tsumitateByYear={};
  if(!(y in DATA.nisa.tsumitateByYear)) DATA.nisa.tsumitateByYear[y]=getTsumitateForYear(DATA.nisa,y)||0;
  render();
}
function removeTsumitateYear(year){
  if(DATA.nisa.tsumitateByYear) delete DATA.nisa.tsumitateByYear[year];
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
  var lsNonEmpty=lsKeys.filter(function(year){return (n.lumpSumByYear[year]||0)>0;});
  var lsEmpty=lsKeys.filter(function(year){return (n.lumpSumByYear[year]||0)===0;});
  var lsShow=_nisaLsExpanded?lsKeys:lsNonEmpty;
  var projRows=allRows.filter(function(r){return n.projectionYears.indexOf(r.year)>=0;});
  var notStarted=n.projectionYears.filter(function(y){return y<n.startYear;});

  var tsRows=Object.keys(n.tsumitateByYear||{}).sort().map(function(year){
    var monthly=(n.tsumitateByYear[year])||0;
    var yearly=monthly*12;
    var overCap=yearly>1200000;
    return '<div class="nisa-tl-row">'+
      '<span class="nisa-tl-year">'+year+'</span>'+
      '<input class="nisa-tl-inp" type="number" step="1000" value="'+monthly+'" onchange="DATA.nisa.tsumitateByYear[\''+year+'\']=parseInt(this.value)||0;render()">'+
      '<span class="nisa-tl-annot">¥'+Math.round(Math.min(yearly,1200000)/10000)+'万</span>'+
      (overCap?'<span style="font-size:var(--fs-xs);color:#8b2c2c">!</span>':'')+
      '<button class="nisa-tl-x" onclick="removeTsumitateYear(\''+year+'\')">×</button>'+
    '</div>';
  }).join('');

  var lsRowsHtml=lsShow.map(function(year){
    var val=(n.lumpSumByYear[year])||0;
    var overCap=val>2400000;
    return '<div class="nisa-tl-row">'+
      '<span class="nisa-tl-year">'+year+'</span>'+
      '<input class="nisa-tl-inp" type="number" step="10000" value="'+val+'" onchange="DATA.nisa.lumpSumByYear[\''+year+'\']=parseInt(this.value)||0;render()">'+
      (overCap?'<span style="font-size:var(--fs-xs);color:#8b2c2c">!</span>':'')+
      '<button class="nisa-tl-x" onclick="removeNisaYear(\''+year+'\')">×</button>'+
    '</div>';
  }).join('');
  var lsToggle=lsEmpty.length?
    '<div class="nisa-tl-skip" onclick="nisaToggleLs()">'+
      (_nisaLsExpanded?'▾ hide '+lsEmpty.length+' empty':('▸ '+lsEmpty.length+' empty ¥0 year'+(lsEmpty.length!==1?'s':'')))+
    '</div>':'';

  var snapRows=notStarted.map(function(y){
    return '<tr class="nisa-snap-row">'+
      '<td class="nisa-snap-year">'+y+'</td>'+
      '<td style="color:var(--text3)">'+( y-birthYear)+'</td>'+
      '<td colspan="3" style="font-size:var(--fs-xs);color:var(--text3)">before start</td>'+
      '<td></td>'+
      '<td><button class="icon-btn" onclick="removeProjectionYear('+y+')">×</button></td>'+
    '</tr>';
  }).join('');
  snapRows+=projRows.map(function(r){
    var tPct=Math.round(r.tsumitate/180000);
    var lPct=Math.round(r.lumpsum/180000);
    return '<tr class="nisa-snap-row">'+
      '<td class="nisa-snap-year">'+r.year+'</td>'+
      '<td style="color:var(--text3)">'+r.age+'</td>'+
      '<td style="font-family:var(--mono);font-size:var(--fs-xs)">¥'+Math.round(r.tsumitate/10000)+'万</td>'+
      '<td style="font-family:var(--mono);font-size:var(--fs-xs)">'+(r.lumpsum?'¥'+Math.round(r.lumpsum/10000)+'万':'—')+'</td>'+
      '<td style="font-family:var(--mono);font-weight:500;color:var(--accent)">¥'+Math.round(r.cumulative/10000)+'万</td>'+
      '<td><div class="nisa-snap-bar"><div style="width:'+tPct+'%;background:var(--accent)"></div><div style="width:'+lPct+'%;background:#2c4a6e"></div></div></td>'+
      '<td><button class="icon-btn" onclick="removeProjectionYear('+r.year+')">×</button></td>'+
    '</tr>';
  }).join('');

  var displayCurrencies=CURRENCIES.filter(function(c){return !c.hidden&&c.code!=='JPY';});
  var allJpy=displayCurrencies.reduce(function(s,c){var a=parseFloat(DATA.currencies[c.code]||0);return s+(a?Math.round(a*getRate(c.code)):0);},0);
  var allIdr=displayCurrencies.reduce(function(s,c){var a=parseFloat(DATA.currencies[c.code]||0);return s+(a?Math.round(a*getRateIDR(c.code)):0);},0);
  var currCards=displayCurrencies.map(function(c){
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
          return '<div style="font-size:var(--fs-xs);color:var(--text3);display:flex;justify-content:space-between;align-items:center;gap:3px;margin-bottom:3px">'+
            '<span>'+l.date.slice(5)+'</span>'+
            '<span>'+l.amount.toLocaleString()+'@'+Math.round(costPerUnit).toLocaleString()+'</span>'+
            '<span style="color:'+plColor+';font-weight:500">'+(pl>=0?'+':'')+'Rp'+Math.abs(pl).toLocaleString()+'</span>'+
            '<button onclick="deleteLot(\''+l.id+'\')" style="background:none;border:none;cursor:pointer;font-size:var(--fs-xs);color:var(--text3);padding:0;line-height:1;flex-shrink:0">×</button>'+
          '</div>';
        }).join('')+
        '<div style="font-size:var(--fs-xs);font-weight:600;color:'+(totalPL>=0?'#2d5a3d':'#8b2c2c')+';padding-top:3px;border-top:1px solid var(--border)">P&L '+(totalPL>=0?'+':'')+'Rp'+Math.abs(totalPL).toLocaleString()+'</div>'+
      '</div>';
    }
    return '<div class="curr-card">'+
      '<div style="font-size:16px;margin-bottom:2px">'+c.flag+'</div>'+
      '<div class="curr-code">'+c.code+'</div>'+
      '<input class="curr-input" type="number" placeholder="0" value="'+amt+'" onchange="DATA.currencies[\''+c.code+'\']=this.value;render()" />'+
      '<div style="display:flex;align-items:center;gap:3px;margin-top:4px;border-top:1px solid var(--border);padding-top:4px">'+
        '<span style="font-size:var(--fs-xs);color:var(--text3);flex-shrink:0">1'+c.code+'=</span>'+
        '<input type="number" step="any" value="'+jpyRate+'" onchange="setRateJPY(\''+c.code+'\',this.value)" style="width:50px;background:none;border:none;outline:none;font-family:var(--mono);font-size:var(--fs-xs);color:var(--text2)"/>'+
        '<span style="font-size:var(--fs-xs);color:var(--text3)">¥</span>'+
        '<input type="number" step="any" value="'+idrRate+'" onchange="setRateIDR(\''+c.code+'\',this.value)" style="width:60px;background:none;border:none;outline:none;font-family:var(--mono);font-size:var(--fs-xs);color:var(--text2)"/>'+
        '<span style="font-size:var(--fs-xs);color:var(--text3)">Rp</span>'+
      '</div>'+
      (jpyEq?'<div class="curr-jpy">¥'+jpyEq.toLocaleString()+' · Rp'+idrEq.toLocaleString()+'</div>':'')+
      lotsHtml+
      '<button onclick="openAddLotModal(\''+c.code+'\')" style="margin-top:5px;width:100%;background:none;border:1px dashed var(--border2);border-radius:var(--radius);font-size:var(--fs-xs);color:var(--text2);padding:2px 0;cursor:pointer;font-family:var(--sans)">+ lot</button>'+
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
    return '<div class="bond-card">'+
      '<div class="bond-card-head">'+
        '<span style="font-weight:600;font-size:var(--fs-sm);font-family:var(--mono)">'+b.series+'</span>'+
        '<div style="display:flex;gap:6px">'+
          '<button onclick="toggleBondMatured(\''+b.id+'\')" style="font-size:var(--fs-xs);background:none;border:1px solid var(--border);border-radius:6px;padding:2px 7px;cursor:pointer;color:var(--text2);font-family:var(--sans)">mark matured</button>'+
          '<button onclick="deleteBond(\''+b.id+'\')" style="font-size:var(--fs-xs);background:none;border:none;cursor:pointer;color:var(--text3);padding:0 2px">×</button>'+
        '</div>'+
      '</div>'+
      '<div style="font-size:var(--fs-xs);color:var(--text2);margin-bottom:4px">Rp '+b.faceValue.toLocaleString()+' · '+(b.couponRate*100).toFixed(2)+'% gross · '+(b.taxRate*100)+'% tax</div>'+
      '<div style="display:flex;gap:16px;font-size:var(--fs-xs);margin-bottom:6px">'+
        '<div><div style="color:var(--text3);font-size:var(--fs-xs)">net/month</div><div style="font-family:var(--mono);font-weight:600">Rp '+monthly.toLocaleString()+'</div></div>'+
        '<div><div style="color:var(--text3);font-size:var(--fs-xs)">received</div><div style="font-family:var(--mono)">Rp '+received.toLocaleString()+'</div></div>'+
        '<div><div style="color:var(--text3);font-size:var(--fs-xs)">remaining</div><div style="font-family:var(--mono)">Rp '+remaining.toLocaleString()+'</div></div>'+
      '</div>'+
      '<div style="background:var(--border);border-radius:4px;height:4px;margin-bottom:5px"><div style="background:var(--accent);height:4px;border-radius:4px;width:'+pct+'%"></div></div>'+
      '<div style="display:flex;justify-content:space-between;font-size:var(--fs-xs);color:var(--text3)">'+
        '<span>'+pct+'% of Rp '+total.toLocaleString()+' received</span>'+
        '<span>'+(days<=0?'<span style="color:var(--accent)">matured</span>':daysLabel)+'</span>'+
      '</div>'+
    '</div>';
  }).join('');

  var maturedArchive=maturedBonds.length?
    '<details style="margin-top:8px"><summary style="font-size:var(--fs-xs);color:var(--text2);cursor:pointer;padding:4px 0">matured bonds ('+maturedBonds.length+')</summary>'+
    maturedBonds.map(function(b){
      var total=bondTotalNet(b);
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:var(--fs-xs)">'+
        '<span style="font-family:var(--mono);font-weight:500">'+b.series+'</span>'+
        '<span style="color:var(--text2)">Rp '+b.faceValue.toLocaleString()+'</span>'+
        '<span style="color:var(--text2)">earned Rp '+total.toLocaleString()+'</span>'+
        '<div style="display:flex;gap:6px">'+
          '<button onclick="toggleBondMatured(\''+b.id+'\')" style="font-size:var(--fs-xs);background:none;border:1px solid var(--border);border-radius:6px;padding:2px 7px;cursor:pointer;color:var(--text2);font-family:var(--sans)">reactivate</button>'+
          '<button onclick="deleteBond(\''+b.id+'\')" style="font-size:var(--fs-xs);background:none;border:none;cursor:pointer;color:var(--text3);padding:0 2px">×</button>'+
        '</div>'+
      '</div>';
    }).join('')+
    '</details>':'';


  var bondsSection=
    '<div class="savings-card savings-collapse'+(_bondsExpanded?' open':'')+'">'+
      '<div class="savings-collapse-head" onclick="toggleSavingsPanel(\'bonds\')">'+
        '<div class="savings-collapse-names">'+
          '<div class="savings-title" style="margin-bottom:0">government bonds</div>'+
          '<div class="savings-collapse-sub">'+activeBonds.length+' active'+(maturedBonds.length?' · '+maturedBonds.length+' matured':'')+'</div>'+
        '</div>'+
        '<div class="savings-collapse-total">Rp '+totalMonthlyNet.toLocaleString()+' / month</div>'+
        '<button onclick="event.stopPropagation();openAddBondModal()" style="font-size:var(--fs-xs);background:none;border:1px solid var(--border);border-radius:8px;padding:3px 10px;cursor:pointer;color:var(--text2);font-family:var(--sans)">+ add bond</button>'+
        '<div class="savings-collapse-chevron">▾</div>'+
      '</div>'+
      '<div class="savings-collapse-body">'+
        (activeBonds.length?
          '<div class="bond-grid">'+activeBondCards+'</div>'+
          (totalMonthlyNet?'<div class="savings-total-row"><span>total monthly income</span><span>Rp '+totalMonthlyNet.toLocaleString()+'</span></div>':'')
          :'<div style="font-size:var(--fs-xs);color:var(--text3);padding:8px 0">no active bonds — click + add bond to get started.</div>')+
        maturedArchive+
      '</div>'+
    '</div>';

  var currenciesSection=
    '<div class="savings-card savings-collapse'+(_currenciesExpanded?' open':'')+'">'+
      '<div class="savings-collapse-head" onclick="toggleSavingsPanel(\'currencies\')">'+
        '<div class="savings-collapse-names">'+
          '<div class="savings-title" style="margin-bottom:0">currencies — enter amounts you hold</div>'+
          '<div class="savings-collapse-sub">'+displayCurrencies.length+' display currencies</div>'+
        '</div>'+
        '<div class="savings-collapse-total">¥'+Math.round(allJpy).toLocaleString()+' · Rp'+Math.round(allIdr).toLocaleString()+'</div>'+
        '<div class="savings-collapse-chevron">▾</div>'+
      '</div>'+
      '<div class="savings-collapse-body">'+
        '<div class="curr-grid">'+currCards+'</div>'+
        (allJpy?'<div class="savings-total-row"><span>total held</span><span>¥'+Math.round(allJpy).toLocaleString()+' · Rp'+Math.round(allIdr).toLocaleString()+'</span></div>':'')+
      '</div>'+
    '</div>';

  panel.innerHTML=
    '<div class="savings-wrap">'+
    '<div class="savings-card">'+
      '<div class="savings-title">新NISA — contribution tracker</div>'+

      '<div class="nisa-hero">'+
        '<div class="nisa-hero-stat" style="flex:2;min-width:0">'+
          '<div class="nisa-hero-lab">lifetime plan</div>'+
          '<div class="nisa-hero-big">¥'+Math.round((totalPlannedTs+totalPlannedLs)/10000)+'万<span style="font-size:var(--fs-xs);color:var(--text3);font-weight:400"> / ¥1800万</span></div>'+
          '<div class="nisa-prog"><div class="nisa-prog-t" style="width:'+tsPct+'%"></div><div class="nisa-prog-g" style="width:'+lsPct+'%"></div></div>'+
          '<div class="nisa-leg"><span style="font-size:var(--fs-xs);color:var(--accent)">▪ つみたて ¥'+Math.round(totalPlannedTs/10000)+'万</span>&nbsp;<span style="font-size:var(--fs-xs);color:#2c4a6e">▪ 成長 ¥'+Math.round(totalPlannedLs/10000)+'万</span></div>'+
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
          '<div class="nisa-hero-lab">avg / year</div>'+
          '<div class="nisa-hero-big">¥'+Math.round(avgPace/10000)+'万</div>'+
          '<div class="nisa-hero-sub">over '+yearsCount+' year'+(yearsCount!==1?'s':'')+'</div>'+
        '</div>'+
      '</div>'+

      '<div class="nisa-2col">'+
        '<div class="nisa-panel ts">'+
          '<div class="nisa-phdr">つみたて — monthly/year</div>'+
          '<div style="font-size:var(--fs-xs);color:var(--text3);margin-bottom:7px">cap ¥1.2M/year</div>'+
          tsRows+
          '<button class="nisa-tl-add" onclick="addTsumitateYear()">+ add year</button>'+
        '</div>'+
        '<div class="nisa-panel gr">'+
          '<div class="nisa-phdr">成長 — lump sum/year</div>'+
          '<div style="font-size:var(--fs-xs);color:var(--text3);margin-bottom:7px">cap ¥2.4M/year</div>'+
          lsRowsHtml+
          lsToggle+
          '<button class="nisa-tl-add" onclick="addNisaYear()">+ add year</button>'+
        '</div>'+
      '</div>'+

      '<div class="nisa-config-row">'+
        '<div class="nisa-config-left">'+
          '<div class="nisa-meta">'+
            '<div class="nisa-meta-cell">'+
              '<div class="nisa-meta-lab">start year</div>'+
              '<input type="number" value="'+n.startYear+'" onchange="DATA.nisa.startYear=parseInt(this.value)||2026;render()" style="width:100%;background:none;border:none;outline:none;font-family:var(--mono);font-size:var(--fs-sm);font-weight:500;color:var(--text)">'+
            '</div>'+
            '<div class="nisa-meta-cell">'+
              '<div class="nisa-meta-lab">start month</div>'+
              '<select onchange="DATA.nisa.startMonth=parseInt(this.value);render()" style="width:100%;background:none;border:none;outline:none;font-family:var(--mono);font-size:var(--fs-sm);font-weight:500;color:var(--text);cursor:pointer">'+
                ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(function(m,i){return '<option value="'+(i+1)+'"'+(n.startMonth===i+1?' selected':'')+'>'+m+'</option>';}).join('')+
              '</select>'+
            '</div>'+
            '<div class="nisa-meta-cell">'+
              '<div class="nisa-meta-lab">this year monthly</div>'+
              '<div style="font-family:var(--mono);font-size:var(--fs-sm);font-weight:500;color:var(--text)">¥'+curYearMonthly.toLocaleString()+'</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="nisa-config-right">'+
          '<div style="font-size:var(--fs-xs);font-weight:500;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">year snapshots</div>'+
          '<div class="nisa-snaps-scroll"><table class="nisa-snaps"><thead><tr>'+
            '<th>year</th><th>age</th><th>つみたて</th><th>成長</th><th>cumulative</th><th>progress</th><th></th>'+
          '</tr></thead><tbody>'+snapRows+'</tbody></table></div>'+
          '<button onclick="addProjectionYear()" style="margin-top:6px;width:100%;padding:6px;background:none;border:1px dashed var(--border2);border-radius:var(--radius);font-family:var(--sans);font-size:var(--fs-sm);color:var(--text2);cursor:pointer">+ add snapshot year</button>'+
        '</div>'+
      '</div>'+
      '<div style="margin-top:10px;font-size:var(--fs-xs);color:var(--text3);line-height:1.6">Lifetime cap ¥18M — つみたて ¥1.2M/year · 成長 ¥2.4M/year · up to ¥3.6M/year combined.</div>'+
    '</div>'+
    currenciesSection+
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
    finReadRow('プロジェクト','Project',monthSpendCat(y,m,'project'))+
    finReadRow('エンターテインメント','Entertainment',monthSpendCat(y,m,'fun'))+
    finReadRow('服・髪','Clothes/Hair',monthSpendCat(y,m,'clothes'));

  panel.innerHTML=
    '<div class="fin-wrap">'+
      '<div class="fin-hero">'+
        '<div>'+
          '<div class="fin-hero-label">Balance · '+MONTHS[m]+' '+y+'</div>'+
          '<div class="fin-hero-balance" style="color:'+balColor+'">¥'+t.balance.toLocaleString()+'</div>'+
          '<div class="fin-hero-delta'+(delta>0?' up':delta<0?' down':'')+'">'+
            (delta!==0?(delta>0?'+':'')+'¥'+Math.abs(delta).toLocaleString()+' vs '+MS[p1.m]:'no prior data')+
          '</div>'+
        '</div>'+
        '<div>'+
          '<div class="fin-hero-label">6-month trend</div>'+
          '<svg class="fin-spark" viewBox="0 0 200 60" height="46" preserveAspectRatio="none">'+
            '<path d="'+spPath+'" fill="none" stroke="'+spColor+'" stroke-width="1.5"/>'+
            '<path d="'+spFill+'" fill="'+spSoft+'" opacity=".6"/>'+
          '</svg>'+
          '<div style="display:flex;justify-content:space-between;font-size:var(--fs-xs);color:var(--text3);font-family:var(--mono);margin-top:2px">'+
            sp6L.map(function(l){return'<span>'+l+'</span>';}).join('')+
          '</div>'+
        '</div>'+
        '<div>'+
          '<div class="fin-hero-label">Income ¥'+t.income.toLocaleString()+' → distribution</div>'+
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

// ── PERIOD TRACKER ────────────────────────────────────────────────────
function _pdSymKey(){
  if(!Object.keys(_periodSymKey).length)
    SYMPTOM_CATS.forEach(function(c){c.items.forEach(function(s){_periodSymKey[s.key]=s.en;});});
  return _periodSymKey;
}
function getPeriodEntries(){
  return((DATA.period&&DATA.period.entries)||[]).slice().sort(function(a,b){return a.start.localeCompare(b.start);});
}
function periodCycles(){
  var e=getPeriodEntries();if(e.length<2)return[];
  var recent=e.slice(-7);
  var c=[];
  for(var i=1;i<recent.length;i++){
    var a=new Date(recent[i-1].start+'T00:00:00'),b=new Date(recent[i].start+'T00:00:00');
    c.push(Math.round((b-a)/86400000));
  }
  return c;
}
function periodStats(){
  var c=periodCycles();if(!c.length)return null;
  var sorted=c.slice().sort(function(a,b){return a-b;});
  var min=sorted[0],max=sorted[sorted.length-1];
  var avg=c.reduce(function(s,v){return s+v;},0)/c.length;
  var med=sorted[Math.floor(sorted.length/2)];
  var variance=c.reduce(function(s,v){return s+(v-avg)*(v-avg);},0)/c.length;
  var sigma=Math.round(Math.sqrt(variance)*10)/10;
  return{min:min,max:max,avg:Math.round(avg*10)/10,med:med,sigma:sigma,count:c.length};
}
function periodWindow(){
  var e=getPeriodEntries();if(!e.length)return null;
  var st=periodStats();if(!st)return null;
  var last=new Date(e[e.length-1].start+'T00:00:00');
  var earliest=new Date(last);earliest.setDate(earliest.getDate()+st.min);
  var latest=new Date(last);latest.setDate(latest.getDate()+st.max);
  return{earliest:earliest,latest:latest};
}
function periodActiveDaysSet(){
  var set=new Set();
  getPeriodEntries().forEach(function(e){
    var s=new Date(e.start+'T00:00:00');
    var len=e.length||(DATA.period.defaultLength||5);
    for(var d=0;d<len;d++){var day=new Date(s);day.setDate(s.getDate()+d);set.add(fd(day));}
  });
  return set;
}
function periodWindowDaysSet(){
  var win=periodWindow();if(!win)return new Set();
  var set=new Set();
  var cur=new Date(win.earliest);
  while(cur<=win.latest){set.add(fd(cur));cur.setDate(cur.getDate()+1);}
  return set;
}
function getFertileWindow(){
  var win=periodWindow();if(!win)return null;
  var ov=new Date(win.earliest);ov.setDate(ov.getDate()-14);
  var fertile=new Set();
  for(var i=4;i>=0;i--){var d=new Date(ov);d.setDate(d.getDate()-i);fertile.add(fd(d));}
  return {ovulationDay:fd(ov),fertileDays:fertile};
}
function getPeriodSymptomLog(dateKey){
  return(DATA.period.symptomLogs||[]).find(function(l){return l.date===dateKey;})||null;
}
function computePatternInsight(){
  var entries=getPeriodEntries();if(entries.length<3)return null;
  var symptomCount={},windowCount=0;
  entries.forEach(function(e){
    var startDate=new Date(e.start+'T00:00:00');
    var windowLogs=(DATA.period.symptomLogs||[]).filter(function(log){
      var diff=Math.round((startDate-new Date(log.date+'T00:00:00'))/86400000);
      return diff>=1&&diff<=7;
    });
    if(windowLogs.length){
      windowCount++;
      var seen={};
      windowLogs.forEach(function(log){(log.symptoms||[]).forEach(function(s){seen[s]=true;});});
      Object.keys(seen).forEach(function(s){symptomCount[s]=(symptomCount[s]||0)+1;});
    }
  });
  if(windowCount<3)return null;
  var threshold=windowCount*0.5;
  var frequent=Object.keys(symptomCount).filter(function(s){return symptomCount[s]>=threshold;});
  return frequent.length?frequent:null;
}
function getBbtBaseline(){
  var entries=getPeriodEntries();if(!entries.length)return null;
  var lastStart=new Date(entries[entries.length-1].start+'T00:00:00');
  var fw=getFertileWindow();
  var preOvEnd=fw?new Date(fw.ovulationDay+'T00:00:00'):new Date(lastStart);preOvEnd.setDate(preOvEnd.getDate()+13);
  var logs=(DATA.period.symptomLogs||[]).filter(function(l){
    var d=new Date(l.date+'T00:00:00');
    return l.bbt&&d>=lastStart&&d<preOvEnd;
  });
  if(!logs.length)return null;
  return logs.reduce(function(s,l){return s+l.bbt;},0)/logs.length;
}
function pdSaveBbt(dk,val){
  var v=parseFloat(val);
  if(!DATA.period.symptomLogs)DATA.period.symptomLogs=[];
  var idx=DATA.period.symptomLogs.findIndex(function(l){return l.date===dk;});
  var now=new Date();var ts=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  if(idx>=0){DATA.period.symptomLogs[idx].bbt=isNaN(v)?null:v;}
  else if(!isNaN(v))DATA.period.symptomLogs.push({id:uid(),date:dk,time:ts,flow:'',symptoms:[],bbt:v});
  autoSave();
}
function renderBbtChart(){
  var entries=getPeriodEntries();if(!entries.length)return '';
  var last=entries[entries.length-1];
  var lastStart=new Date(last.start+'T00:00:00');
  var logs=(DATA.period.symptomLogs||[]).filter(function(l){
    return l.bbt&&new Date(l.date+'T00:00:00')>=lastStart;
  }).sort(function(a,b){return a.date<b.date?-1:1;});
  if(!logs.length)return '';
  var baseline=getBbtBaseline();
  var fw=getFertileWindow();var ovDay=fw?fw.ovulationDay:null;
  var temps=logs.map(function(l){return l.bbt;});
  var minT=Math.min.apply(null,temps)-0.3;var maxT=Math.max.apply(null,temps)+0.3;
  var W=400,H=80,padL=32,padR=8,padT=8,padB=18;
  var innerW=W-padL-padR,innerH=H-padT-padB;
  function tx(i){return padL+i/(Math.max(logs.length-1,1))*innerW;}
  function ty(v){return padT+innerH-(v-minT)/(maxT-minT)*innerH;}
  var hasShift=false;
  var shiftIdx=-1;
  if(baseline){
    var above=0;
    for(var i=0;i<logs.length;i++){
      if(logs[i].bbt>=baseline+0.2)above++;else above=0;
      if(above>=3){shiftIdx=i-2;hasShift=true;break;}
    }
  }
  var polyPre='',polyPost='';
  logs.forEach(function(l,i){
    var x=tx(i),y=ty(l.bbt);
    var isPost=hasShift&&i>=shiftIdx;
    if(isPost)polyPost+=(polyPost?'L':'M')+x+' '+y;
    else polyPre+=(polyPre?'L':'M')+x+' '+y;
  });
  var baselineLine=baseline?'<line x1="'+padL+'" y1="'+ty(baseline)+'" x2="'+(W-padR)+'" y2="'+ty(baseline)+'" stroke="#c4a0aa" stroke-width="1" stroke-dasharray="3,3"/>':'';
  var dots=logs.map(function(l,i){
    var isPost=hasShift&&i>=shiftIdx;
    return '<circle cx="'+tx(i)+'" cy="'+ty(l.bbt)+'" r="3" fill="'+(isPost?'#7a5cb8':'var(--accent)')+'" />';
  }).join('');
  var yLabels=[minT+0.15,maxT-0.15].map(function(v){return '<text x="'+(padL-4)+'" y="'+(ty(v)+4)+'" text-anchor="end" font-size="9" fill="#c4a0aa">'+v.toFixed(1)+'</text>';}).join('');
  var xLabels=logs.map(function(l,i){
    if(i%(Math.ceil(logs.length/4))!==0&&i!==logs.length-1)return '';
    var d=new Date(l.date+'T00:00:00');
    return '<text x="'+tx(i)+'" y="'+(H-2)+'" text-anchor="middle" font-size="9" fill="#c4a0aa">'+MS[d.getMonth()]+' '+d.getDate()+'</text>';
  }).join('');
  var title='BBT THIS CYCLE'+(hasShift?' · THERMAL SHIFT DETECTED':'');
  return '<div class="pd-bbt-chart">'+
    '<div class="pd-section-title">'+title+'</div>'+
    '<svg width="100%" viewBox="0 0 '+W+' '+H+'" style="display:block;overflow:visible">'+
      baselineLine+
      (polyPre?'<path d="'+polyPre+'" fill="none" stroke="var(--accent)" stroke-width="1.5"/>':'')+
      (polyPost?'<path d="'+polyPost+'" fill="none" stroke="#7a5cb8" stroke-width="1.5"/>':'')+
      dots+yLabels+xLabels+
    '</svg>'+
  '</div>';
}
function getTravelDates(){
  var TRAVEL_COLOR='#D1B36A';
  var dates=[];
  Object.keys(DATA.events||{}).forEach(function(dk){
    (DATA.events[dk]||[]).forEach(function(e){if(e.color===TRAVEL_COLOR)dates.push(dk);});
  });
  return new Set(dates);
}
function getTravelAdjustedWindow(){
  var travelDates=getTravelDates();
  var entries=getPeriodEntries();
  if(entries.length<5)return null;
  var travelCycles=[],normalCycles=[];
  for(var i=0;i<entries.length-1;i++){
    var startMs=new Date(entries[i].start+'T00:00:00').getTime();
    var hasTravel=false;
    for(var b=1;b<=14;b++){if(travelDates.has(fd(new Date(startMs-b*86400000)))){hasTravel=true;break;}}
    var cycleLen=Math.round((new Date(entries[i+1].start+'T00:00:00').getTime()-startMs)/86400000);
    if(hasTravel)travelCycles.push(cycleLen);else normalCycles.push(cycleLen);
  }
  if(travelCycles.length<3||!normalCycles.length)return null;
  var travelAvg=travelCycles.reduce(function(s,v){return s+v;},0)/travelCycles.length;
  var normalAvg=normalCycles.reduce(function(s,v){return s+v;},0)/normalCycles.length;
  var delay=Math.round(travelAvg-normalAvg);
  if(delay<=0)return null;
  var win=periodWindow();if(!win)return null;
  var buffer=7;
  var from=new Date(win.earliest);from.setDate(from.getDate()-buffer);
  var to=new Date(win.latest);to.setDate(to.getDate()+buffer);
  var hits=[];var cur=new Date(from);
  while(cur<=to){if(travelDates.has(fd(cur)))hits.push(fd(cur));cur.setDate(cur.getDate()+1);}
  if(!hits.length)return null;
  var adjEarliest=new Date(win.earliest);adjEarliest.setDate(adjEarliest.getDate()+delay);
  var adjLatest=new Date(win.latest);adjLatest.setDate(adjLatest.getDate()+delay);
  return{earliest:adjEarliest,latest:adjLatest,delay:delay,hits:hits};
}
function openPeriodModal(dateKey){
  var entries=getPeriodEntries();
  var existing=entries.find(function(e){return e.start===dateKey;});
  var len=existing?existing.length:(DATA.period.defaultLength||5);
  var d=new Date(dateKey+'T00:00:00');
  var dlabel=DAYS[(d.getDay()+6)%7]+' '+d.getDate()+' '+MS[d.getMonth()]+' '+d.getFullYear();
  var inp='width:100%;border:1px solid var(--border);border-radius:var(--radius);padding:7px 10px;font-family:var(--mono);font-size:var(--fs-sm);background:var(--surface2);color:var(--text);outline:none;box-sizing:border-box';
  openModal(
    '<div class="modal-title">'+(existing?'edit period entry':'log period start')+'</div>'+
    '<div style="font-size:var(--fs-sm);color:var(--text2);margin-bottom:14px">'+dlabel+'</div>'+
    '<div style="margin-bottom:16px">'+
      '<div style="font-size:var(--fs-sm);color:var(--text2);margin-bottom:6px">duration (days)</div>'+
      '<input id="pd-len" type="number" min="1" max="14" step="1" value="'+len+'" style="'+inp+'">'+
    '</div>'+
    '<div class="modal-row">'+
      '<button class="modal-btn ghost" onclick="closeModal()">cancel</button>'+
      (existing?'<button class="modal-btn ghost" style="border-color:var(--bad);color:var(--bad)" onclick="deletePeriodEntry(\''+dateKey+'\');closeModal()">delete</button>':'')+
      '<button class="modal-btn primary" onclick="savePeriodEntry(\''+dateKey+'\',document.getElementById(\'pd-len\').value)">save</button>'+
    '</div>'
  );
}
function deletePeriodEntry(dateKey){
  if(DATA.period&&DATA.period.entries)
    DATA.period.entries=DATA.period.entries.filter(function(e){return e.start!==dateKey;});
  autoSave();render();
}
function savePeriodEntry(dateKey,len){
  if(!DATA.period.entries)DATA.period.entries=[];
  var length=Math.max(1,parseInt(len)||DATA.period.defaultLength||5);
  var idx=DATA.period.entries.findIndex(function(e){return e.start===dateKey;});
  if(idx>=0)DATA.period.entries[idx].length=length;
  else DATA.period.entries.push({id:uid(),start:dateKey,length:length});
  autoSave();closeModal();render();
}
function openSymptomLogModal(dateKey){
  if(!dateKey)dateKey=fd(today);
  var existing=getPeriodSymptomLog(dateKey);
  var selSymptoms=existing?(existing.symptoms||[]):[];
  var selFlow=existing?(existing.flow||''):'';
  var d=new Date(dateKey+'T00:00:00');
  var dlabel=MS[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear();
  var isPeriodStart=getPeriodEntries().some(function(e){return e.start===dateKey;});
  var flowHtml=FLOW_LEVELS.map(function(f){
    return '<button type="button" class="pd-chip'+(selFlow===f.key?' pd-chip-active':'')+'" id="pfl-'+f.key+'" onclick="pdToggleFlow(\''+f.key+'\')">'+f.en+'</button>';
  }).join('');
  var symHtml=SYMPTOM_CATS.map(function(cat){
    return '<div class="pd-sym-cat-label">'+cat.label+'</div>'+
      '<div class="pd-chip-row">'+
        cat.items.map(function(s){
          var fn=cat.singleSelect?'pdToggleDischarge':'pdToggleSym';
          return '<button type="button" class="pd-chip'+(selSymptoms.includes(s.key)?' pd-chip-active':'')+'" id="psy-'+s.key+'" onclick="'+fn+'(\''+s.key+'\')">'+s.en+'</button>';
        }).join('')+
      '</div>';
  }).join('');
  openModal(
    '<div class="modal-title">log symptoms · '+dlabel+'</div>'+
    '<div class="pd-sym-cat-label">Flow</div>'+
    '<div class="pd-chip-row" style="margin-bottom:12px">'+flowHtml+'</div>'+
    '<div style="max-height:320px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);padding:10px">'+symHtml+'</div>'+
    '<div class="modal-row" style="margin-top:14px;flex-wrap:wrap;gap:6px">'+
      '<button class="modal-btn ghost" onclick="closeModal()">cancel</button>'+
      '<button class="modal-btn ghost" style="font-size:var(--fs-xs)" onclick="closeModal();openPeriodModal(\''+dateKey+'\')">'+(isPeriodStart?'edit period':'+ period start')+'</button>'+
      (existing?'<button class="modal-btn ghost" style="border-color:var(--bad);color:var(--bad)" onclick="deleteSymptomLog(\''+dateKey+'\');closeModal()">delete</button>':'')+
      '<button class="modal-btn primary" onclick="saveSymptomLog(\''+dateKey+'\')">save</button>'+
    '</div>'
  );
}
function pdToggleFlow(key){
  document.querySelectorAll('.pd-chip[id^="pfl-"]').forEach(function(el){el.classList.remove('pd-chip-active');});
  var el=document.getElementById('pfl-'+key);
  if(el)el.classList.toggle('pd-chip-active');
}
function pdToggleSym(key){var el=document.getElementById('psy-'+key);if(el)el.classList.toggle('pd-chip-active');}
function pdToggleDischarge(key){
  var el=document.getElementById('psy-'+key);
  var wasActive=el&&el.classList.contains('pd-chip-active');
  SYMPTOM_CATS.find(function(c){return c.key==='discharge';}).items.forEach(function(s){var e=document.getElementById('psy-'+s.key);if(e)e.classList.remove('pd-chip-active');});
  if(el&&!wasActive)el.classList.add('pd-chip-active');
}
function saveSymptomLog(dateKey){
  var symptoms=[];
  SYMPTOM_CATS.forEach(function(cat){
    cat.items.forEach(function(s){var el=document.getElementById('psy-'+s.key);if(el&&el.classList.contains('pd-chip-active'))symptoms.push(s.key);});
  });
  var flow='';
  FLOW_LEVELS.forEach(function(f){var el=document.getElementById('pfl-'+f.key);if(el&&el.classList.contains('pd-chip-active'))flow=f.key;});
  if(!DATA.period.symptomLogs)DATA.period.symptomLogs=[];
  var now=new Date();
  var timeStr=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  var entry={id:uid(),date:dateKey,time:timeStr,flow:flow,symptoms:symptoms};
  var idx=DATA.period.symptomLogs.findIndex(function(l){return l.date===dateKey;});
  if(idx>=0)DATA.period.symptomLogs[idx]=entry;else DATA.period.symptomLogs.push(entry);
  autoSave();closeModal();render();
}
function deleteSymptomLog(dateKey){
  if(DATA.period&&DATA.period.symptomLogs)
    DATA.period.symptomLogs=DATA.period.symptomLogs.filter(function(l){return l.date!==dateKey;});
  autoSave();render();
}
function pdQuickFlow(dk,key){
  if(!DATA.period.symptomLogs)DATA.period.symptomLogs=[];
  var idx=DATA.period.symptomLogs.findIndex(function(l){return l.date===dk;});
  var now=new Date();var ts=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  if(idx>=0){var cur=DATA.period.symptomLogs[idx].flow;DATA.period.symptomLogs[idx].flow=(cur===key?'':key);}
  else DATA.period.symptomLogs.push({id:uid(),date:dk,time:ts,flow:key,symptoms:[]});
  autoSave();render();
}
function pdQuickSym(dk,key){
  if(!DATA.period.symptomLogs)DATA.period.symptomLogs=[];
  var idx=DATA.period.symptomLogs.findIndex(function(l){return l.date===dk;});
  var now=new Date();var ts=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  if(idx>=0){var syms=DATA.period.symptomLogs[idx].symptoms||[];var si=syms.indexOf(key);if(si>=0)syms.splice(si,1);else syms.push(key);DATA.period.symptomLogs[idx].symptoms=syms;}
  else DATA.period.symptomLogs.push({id:uid(),date:dk,time:ts,flow:'',symptoms:[key]});
  autoSave();render();
}
function pdQuickDischarge(dk,key){
  if(!DATA.period.symptomLogs)DATA.period.symptomLogs=[];
  var DKEYS=TODAY_CARD_SYMS.discharge;
  var idx=DATA.period.symptomLogs.findIndex(function(l){return l.date===dk;});
  var now=new Date();var ts=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  if(idx>=0){
    var syms=DATA.period.symptomLogs[idx].symptoms||[];
    var wasSelected=syms.indexOf(key)>=0;
    syms=syms.filter(function(k){return DKEYS.indexOf(k)<0;});
    if(!wasSelected)syms.push(key);
    DATA.period.symptomLogs[idx].symptoms=syms;
  }else{
    DATA.period.symptomLogs.push({id:uid(),date:dk,time:ts,flow:'',symptoms:[key]});
  }
  autoSave();render();
}
function pdDayClick(dk){
  var entries=getPeriodEntries();
  var activeDays=periodActiveDaysSet();
  if(activeDays.has(dk)){
    var hit=entries.find(function(e){
      var s=new Date(e.start+'T00:00:00'),dDate=new Date(dk+'T00:00:00');
      var end=new Date(s);end.setDate(s.getDate()+(e.length||(DATA.period.defaultLength||5))-1);
      return dDate>=s&&dDate<=end;
    });
    if(hit){openPeriodModal(hit.start);return;}
  }
  openSymptomLogModal(dk);
}
function renderPeriodStatusHero(){
  var entries=getPeriodEntries();
  if(!entries.length){
    return '<div class="pd-hero"><div style="font-size:var(--fs-xs);color:var(--text3)">no periods logged yet — click any day to start tracking</div></div>';
  }
  var last=entries[entries.length-1];
  var lastStart=new Date(last.start+'T00:00:00');
  var lastEnd=new Date(lastStart);lastEnd.setDate(lastStart.getDate()+(last.length||5)-1);
  var daysSince=Math.round((today-lastStart)/86400000);
  var currentlyOn=today>=lastStart&&today<=lastEnd;
  var win=periodWindow();var st=periodStats();
  // row 1: cycle day
  var r1big='Day '+(daysSince+1);
  var r1meta=currentlyOn?'Currently on your period':'Current cycle';
  var r1note='cycle '+entries.length;
  // row 2: next period
  var r2big,r2meta,r2note='';
  if(win){
    var todayMid=new Date(today.getFullYear(),today.getMonth(),today.getDate());
    var daysUntil=Math.round((win.earliest-todayMid)/86400000);
    var inWindow=todayMid>=win.earliest&&todayMid<=win.latest;
    if(inWindow){
      r2big='<span style="color:var(--accent)">in window</span>';
      r2meta='Your period is expected now';
      r2note='est. '+MS[win.earliest.getMonth()]+' '+win.earliest.getDate()+' – '+MS[win.latest.getMonth()]+' '+win.latest.getDate();
    }else if(daysUntil>0){
      r2big=MS[win.earliest.getMonth()]+' '+win.earliest.getDate();
      r2meta='Next period expected in ~'+daysUntil+(daysUntil===1?' day':' days');
      r2note='Estimated end: '+MS[win.latest.getMonth()]+' '+win.latest.getDate();
    }else{
      var daysLate=Math.round((todayMid-win.latest)/86400000);
      r2big='<span style="color:var(--accent)">-'+daysLate+'</span>';
      r2meta='Period is '+daysLate+' day'+(daysLate===1?'':' s')+' past expected window';
      r2note='Window was '+MS[win.earliest.getMonth()]+' '+win.earliest.getDate()+'–'+MS[win.latest.getMonth()]+' '+win.latest.getDate();
    }
  }else{r2big='—';r2meta='Log 2+ periods to see prediction';}
  // row 3: stats
  var r3big,r3meta,r3note='',footerNote='';
  if(st){
    r3big=st.med+' days';
    r3meta='Your usual cycle length';
    r3note='Recent range: '+st.min+'–'+st.max+' days · Usually varies by ~'+Math.round(st.sigma)+' days';
    footerNote='<div class="cycle-stat-footer">Cycles can naturally vary a little. Your recent cycles are around '+st.min+'–'+st.max+' days.</div>';
  }else{r3big='—';r3meta='Log 2+ periods to see stats';}
  var sigmaWarn=st&&st.sigma>3?' · <span style="color:var(--accent)">irregular</span>':'';
  function makeRow(big,meta,note){
    return '<div class="cycle-stat-row">'+
      '<div class="cycle-stat-big">'+big+'</div>'+
      '<div class="cycle-stat-meta"><div>'+meta+'</div>'+(note?'<div class="cycle-stat-note">'+note+'</div>':'')+
      '</div></div>';
  }
  return '<div class="pd-hero">'+
    '<div class="pd-section-title">CYCLE STATUS'+sigmaWarn+'</div>'+
    '<div class="cycle-stat-list">'+
      makeRow(r1big,r1meta,r1note)+
      makeRow(r2big,r2meta,r2note)+
      makeRow(r3big,r3meta,r3note)+
    '</div>'+
    footerNote+
  '</div>';
}
function renderPeriodMonthCard(y,m,activeDays,winDays,startDays,symDates,flowMap,travelDates,fertileDays,ovulationDay,travelAdjActive){
  var dim=new Date(y,m+1,0).getDate();
  var dowOffset=(new Date(y,m,1).getDay()+6)%7;
  var entries=getPeriodEntries();
  var cycleLabel='';var hasPeriodActivity=false;var hasTravel=false;
  var startInMonth=entries.find(function(e){var d=new Date(e.start+'T00:00:00');return d.getFullYear()===y&&d.getMonth()===m;});
  if(startInMonth){
    hasPeriodActivity=true;
    var idx=entries.findIndex(function(e){return e.start===startInMonth.start;});
    if(idx>=0&&idx<entries.length-1){
      var gap=Math.round((new Date(entries[idx+1].start+'T00:00:00')-new Date(startInMonth.start+'T00:00:00'))/86400000);
      cycleLabel='cycle '+gap+'d';
    }
  }else{
    for(var dd=1;dd<=dim;dd++){if(winDays.has(fd(new Date(y,m,dd)))){hasPeriodActivity=true;cycleLabel='predicted';break;}}
  }
  if(travelDates){for(var td=1;td<=dim;td++){if(travelDates.has(fd(new Date(y,m,td)))){hasTravel=true;break;}}}
  var dayHdrs=DAYS.map(function(d){return '<div class="pd-mc-dh">'+d[0]+'</div>';}).join('');
  var cells='';
  for(var i=0;i<dowOffset;i++)cells+='<div class="pd-mc-blank"></div>';
  for(var d=1;d<=dim;d++){
    var dk=fd(new Date(y,m,d));
    var isPeriod=activeDays.has(dk),isStart=startDays.has(dk),isPred=!isPeriod&&winDays.has(dk);
    var isFertile=!isPeriod&&fertileDays&&fertileDays.has(dk),isOv=!isPeriod&&dk===ovulationDay;
    var isTod=dk===fd(today),hasSym=symDates.has(dk),isTravel=travelDates&&travelDates.has(dk);
    var isBeforeMin=y<2017;
    var cls='pd-mc-day';
    if(isBeforeMin)cls+=' pd-mc-disabled';
    else if(isPeriod){if(isStart)cls+=' pd-mc-start';else{var fl=(flowMap&&flowMap[dk]);cls+=fl?' pd-mc-flow-'+fl:' pd-mc-period';}}
    else if(isPred)cls+=travelAdjActive?' pd-mc-pred-travel':' pd-mc-pred';
    else if(isOv)cls+=' pd-mc-ovulation';
    else if(isFertile)cls+=' pd-mc-fertile';
    if(isTod)cls+=' pd-mc-today';
    var dots=(hasSym&&!isBeforeMin?'<div class="pd-mc-sym-dot"></div>':'')+(isTravel&&!isBeforeMin?'<div class="pd-mc-travel-dot"></div>':'');
    cells+='<div class="'+cls+'"'+(isBeforeMin?'':' onclick="pdDayClick(\''+dk+'\')"')+'>'+d+dots+'</div>';
  }
  var cycleLabelFull=cycleLabel+(cycleLabel&&hasTravel&&hasPeriodActivity?' · ✈':(!cycleLabel&&hasTravel&&hasPeriodActivity?'✈':''));
  return '<div class="pd-month-card">'+
    '<div class="pd-mc-header">'+
      '<span class="pd-mc-month">'+MONTHS[m]+'</span>'+
      (cycleLabelFull?'<span class="pd-mc-cycle'+(cycleLabel==='predicted'?' pd-mc-cycle-pred':'')+'">'+cycleLabelFull+'</span>':'')+
    '</div>'+
    '<div class="pd-mc-grid">'+dayHdrs+cells+'</div>'+
  '</div>';
}
function renderCycleHistory(travelDates){
  var entries=getPeriodEntries();
  if(!entries.length)return '<div class="pd-ch-empty">no entries yet</div>';
  var cycles=[];
  for(var i=0;i<entries.length;i++){
    var e=entries[i];var d=new Date(e.start+'T00:00:00');var cycleLen=null;
    if(i<entries.length-1)cycleLen=Math.round((new Date(entries[i+1].start+'T00:00:00')-d)/86400000);
    cycles.push({e:e,d:d,cycleLen:cycleLen});
  }
  var show=cycles.slice(-8);var win=periodWindow();
  var allLens=show.filter(function(c){return c.cycleLen;}).map(function(c){return c.cycleLen;});
  if(win){var predLen=Math.round((win.latest-new Date(show[show.length-1].e.start+'T00:00:00'))/86400000);allLens.push(predLen);}
  var maxLen=allLens.length?Math.max.apply(null,allLens):35;
  var rows=show.map(function(c,idx){
    var isLast=idx===show.length-1&&!c.cycleLen;
    var barLen=c.cycleLen||(win?Math.round((win.earliest-new Date(c.e.start+'T00:00:00'))/86400000):c.e.length||(DATA.period.defaultLength||5));
    var pct=Math.min(100,barLen/maxLen*100);
    var periodPct=Math.min(100,((c.e.length||(DATA.period.defaultLength||5))/barLen*100));
    var label=MS[c.d.getMonth()]+' '+c.d.getDate();
    var lenLabel=c.cycleLen?c.cycleLen+'d':(isLast&&win?'~'+Math.round((win.earliest-new Date(c.e.start+'T00:00:00'))/86400000)+'d est':'—');
    var predBarPct=isLast&&win?Math.min(100,Math.round((win.latest-new Date(c.e.start+'T00:00:00'))/86400000)/maxLen*100):0;
    var hasTravelNear=false;
    if(travelDates){
      var startMs=c.d.getTime();
      for(var b=1;b<=14;b++){var bd=new Date(startMs-b*86400000);if(travelDates.has(fd(bd))){hasTravelNear=true;break;}}
    }
    return '<div class="pd-ch-row'+(isLast?' pd-ch-row-est':'')+'">'+
      '<span class="pd-ch-label'+(isLast?' pd-ch-pred-label':'')+'">'+label+(isLast?'?':'')+'</span>'+
      '<div class="pd-ch-bar-wrap">'+
        (predBarPct?'<div class="pd-ch-bar-pred" style="width:'+predBarPct+'%"></div>':'')+
        '<div class="pd-ch-bar" style="width:'+pct+'%"><div class="pd-ch-bar-period" style="width:'+periodPct+'%"></div></div>'+
      '</div>'+
      '<span class="pd-ch-len'+(isLast?' pd-ch-pred-label':'')+'">'+lenLabel+(hasTravelNear?' <span class="pd-ch-travel-icon">✈</span>':'')+'</span>'+
    '</div>';
  }).join('');
  return '<div class="pd-ch">'+
    '<div class="pd-section-title">LAST 8 CYCLES</div>'+
    rows+'</div>';
}
function renderTodayLogCard(dk,log,insightHtml){
  var d=new Date(dk+'T00:00:00');
  var dlabel=MS[d.getMonth()].toUpperCase()+' '+d.getDate()+', '+d.getFullYear();
  var selFlow=log?(log.flow||''):'';
  var selSymptoms=log?(log.symptoms||[]):[];
  var entries=getPeriodEntries();var lastEntry=entries.length?entries[entries.length-1]:null;
  var activeDays=periodActiveDaysSet();var isTodayPeriod=activeDays.has(dk);
  // header card
  var headerLeft='<div class="pd-today-header">TODAY · <strong>'+dlabel+'</strong></div>';
  if(lastEntry){
    var dayNum=Math.round((today-new Date(lastEntry.start+'T00:00:00'))/86400000)+1;
    var fw2=getFertileWindow();
    var fertBadge='';
    if(fw2){
      if(dk===fw2.ovulationDay)fertBadge=' <span class="pd-fertile-badge pd-fertile-badge-ov">OVULATION</span>';
      else if(fw2.fertileDays.has(dk))fertBadge=' <span class="pd-fertile-badge">FERTILE WINDOW</span>';
    }
    headerLeft+='<div class="pd-today-cycleday">Day <span style="color:var(--accent)">'+dayNum+'</span> of cycle'+fertBadge+'</div>';
  }
  var logPeriodBtn=!isTodayPeriod?'<button class="log-period-btn" onclick="openPeriodModal(\''+dk+'\')">log period</button>':'';
  var headerCard='<div class="period-card period-header-card"><div class="pd-tc-header-left">'+headerLeft+'</div>'+logPeriodBtn+'</div>';
  // flow card
  var keys=_pdSymKey();
  var flowCard='<div class="period-card">'+
    '<div class="pd-tc-title">FLOW</div>'+
    '<div class="pd-chip-row">'+
    FLOW_LEVELS.map(function(f){
      return '<button type="button" class="pd-chip'+(selFlow===f.key?' pd-chip-active':'')+'" onclick="pdQuickFlow(\''+dk+'\',\''+f.key+'\')">'+f.en+'</button>';
    }).join('')+
    '</div></div>';
  function makeChipRow(catKey,arr,isSingle){
    return arr.map(function(k){
      var fn=isSingle?'pdQuickDischarge':'pdQuickSym';
      return '<button type="button" class="pd-chip'+(selSymptoms.indexOf(k)>=0?' pd-chip-active':'')+'" onclick="'+fn+'(\''+dk+'\',\''+k+'\')">'+( keys[k]||k)+'</button>';
    }).join('');
  }
  // symptoms card — grouped by Mood / Pain / Physical
  var symptomsCard='<div class="period-card">'+
    '<div class="pd-tc-title">SYMPTOMS</div>'+
    '<div class="symptom-group"><div class="symptom-group-title">Mood</div><div class="pd-chip-row">'+makeChipRow('mood',TODAY_CARD_SYMS.mood,false)+'</div></div>'+
    '<div class="symptom-group"><div class="symptom-group-title">Pain</div><div class="pd-chip-row">'+makeChipRow('pain',TODAY_CARD_SYMS.pain,false)+'</div></div>'+
    '<div class="symptom-group"><div class="symptom-group-title">Physical</div><div class="pd-chip-row">'+makeChipRow('physical',TODAY_CARD_SYMS.physical,false)+'</div></div>'+
    '<div style="margin-top:12px"><button class="pd-log-sym-btn" onclick="openSymptomLogModal(\''+dk+'\')">log symptoms</button></div>'+
  '</div>';
  // bbt
  var curBbt=log&&log.bbt?log.bbt:'';
  var bbtBaseline=getBbtBaseline();
  var bbtDeltaHtml='';
  if(curBbt&&bbtBaseline){var delta=Math.round((curBbt-bbtBaseline)*100)/100;bbtDeltaHtml='<span style="color:'+(delta>0?'var(--accent)':'var(--text3)')+'"> '+(delta>0?'+':'')+delta+' vs baseline</span>';}
  var bbtInput='<div style="display:flex;align-items:center;gap:6px;margin-top:6px">'+
    '<input id="pd-bbt-input" type="number" step="0.01" min="35" max="42" placeholder="36.00" value="'+curBbt+'" style="width:80px;border:1px solid var(--border);border-radius:var(--radius);padding:4px 8px;font-family:var(--mono);font-size:var(--fs-sm);background:var(--surface2);color:var(--text);outline:none" onblur="pdSaveBbt(\''+dk+'\',this.value)">'+
    '<span style="font-size:var(--fs-xs);color:var(--text3)">°C</span>'+
    bbtDeltaHtml+
  '</div>';
  // cycle details card — discharge + bbt side by side
  var cycleDetailsCard='<div class="period-card">'+
    '<div class="pd-tc-title">CYCLE DETAILS</div>'+
    '<div class="cycle-details-grid">'+
      '<div><div class="symptom-group-title">Discharge</div><div class="pd-chip-row" style="margin-top:6px">'+makeChipRow('discharge',TODAY_CARD_SYMS.discharge,true)+'</div></div>'+
      '<div><div class="symptom-group-title">Basal temp</div>'+bbtInput+'</div>'+
    '</div>'+
  '</div>';
  // row 2: flow + cycle details; row 3: symptoms (+ pattern if available)
  var row2='<div class="pd-row-2">'+flowCard+cycleDetailsCard+'</div>';
  var row3=insightHtml
    ?'<div class="pd-row-3">'+symptomsCard+'<div class="period-card pd-pattern-card">'+insightHtml+'</div></div>'
    :symptomsCard;
  return '<div class="pd-today-card">'+
    '<div class="period-dashboard-grid">'+
      headerCard+row2+row3+
    '</div>'+
  '</div>';
}
function renderPeriod(panel,y){
  var activeDays=periodActiveDaysSet();
  var travelAdj=getTravelAdjustedWindow();
  var travelAdjActive=!!travelAdj;
  var winDays=travelAdjActive?(function(){var s=new Set();var cur=new Date(travelAdj.earliest);while(cur<=travelAdj.latest){s.add(fd(cur));cur.setDate(cur.getDate()+1);}return s;})():periodWindowDaysSet();
  var startDays=new Set(getPeriodEntries().map(function(e){return e.start;}));
  var symDates=new Set((DATA.period.symptomLogs||[]).map(function(l){return l.date;}));
  var flowMap={};(DATA.period.symptomLogs||[]).forEach(function(l){if(l.flow&&l.flow!=='none')flowMap[l.date]=l.flow;});
  var travelDates=getTravelDates();
  var fw=getFertileWindow();
  var fertileDays=fw?fw.fertileDays:null;
  var ovulationDay=fw?fw.ovulationDay:null;
  var heroHtml=renderPeriodStatusHero();
  var yearHdr='<div class="pd-year-hdr">'+
    '<div class="pd-legend">'+
      '<span class="pd-leg"><span class="pd-leg-sw pd-leg-period"></span>Period</span>'+
      '<span class="pd-leg"><span class="pd-leg-sw pd-leg-pred"></span>Predicted</span>'+
      '<span class="pd-leg"><span class="pd-leg-sw pd-leg-fertile"></span>Fertile</span>'+
      '<span class="pd-leg"><span class="pd-leg-sw pd-leg-ovulation"></span>Ovulation</span>'+
      '<span class="pd-leg"><span class="pd-leg-sym-dot"></span>Symptoms</span>'+
      '<span class="pd-leg"><span class="pd-leg-travel-dot"></span>Travel</span>'+
    '</div>'+
  '</div>';
  var monthCards='';
  for(var m=0;m<12;m++)monthCards+=renderPeriodMonthCard(y,m,activeDays,winDays,startDays,symDates,flowMap,travelDates,fertileDays,ovulationDay,travelAdjActive);
  var yearGrid='<div class="pd-year-grid">'+monthCards+'</div>';
  var todayLog=getPeriodSymptomLog(fd(today));
  var insight=computePatternInsight();
  var insightHtml='';
  var travelCallout='';
  if(travelAdj){
    var adjMS=MS[travelAdj.earliest.getMonth()];
    travelCallout='<div class="pd-travel-callout">✈ travel detected near your window — based on past patterns, your period may be ~'+travelAdj.delay+' day'+(travelAdj.delay>1?'s':'')+' later than usual. est. '+adjMS+' '+travelAdj.earliest.getDate()+'–'+MS[travelAdj.latest.getMonth()]+' '+travelAdj.latest.getDate()+'</div>';
  }
  if(insight){
    var keys=_pdSymKey();
    insightHtml='<div class="pd-insight">'+
      '<div style="font-weight:600;margin-bottom:4px">pattern detected</div>'+
      '<div style="color:var(--text2)">you often experience these in the days before your period:</div>'+
      '<div class="pd-insight-chips">'+insight.map(function(k){return '<span class="pd-insight-chip">'+(keys[k]||k)+'</span>';}).join('')+'</div>'+
    '</div>';
  }
  var bbtChartHtml=renderBbtChart();
  panel.innerHTML=
    '<div class="pd-stats-row">'+
      heroHtml+
      (bbtChartHtml||renderCycleHistory(travelDates))+
    '</div>'+
    (bbtChartHtml?renderCycleHistory(travelDates):'')+
    travelCallout+
    renderTodayLogCard(fd(today),todayLog,insightHtml)+
    yearHdr+
    yearGrid;
}

// ── SIDEBAR ───────────────────────────────────────────────────────────
function renderSidebar(){
  const sc=document.getElementById('sidebar-body');
  if(!sc) return;
  if(stab==='notes'){
    sc.innerHTML=
      DATA.notes.map(function(n,i){
        return '<div class="note-card">'+
          '<div class="note-toolbar">'+
            '<button class="note-fmt-btn" onmousedown="event.preventDefault();document.execCommand(\'bold\')"><b>B</b></button>'+
            '<button class="note-fmt-btn" onmousedown="event.preventDefault();document.execCommand(\'underline\')" style="text-decoration:underline">U</button>'+
            '<button class="note-fmt-btn" onmousedown="event.preventDefault();document.execCommand(\'strikeThrough\')" style="text-decoration:line-through">S</button>'+
          '</div>'+
          '<div class="note-content" contenteditable="true" oninput="DATA.notes['+i+'].text=this.innerHTML" data-placeholder="note...">'+n.text+'</div>'+
          '<div class="note-meta"><span>'+n.date+'</span><button class="note-del icon-btn" onclick="DATA.notes.splice('+i+',1);renderSidebar()">×</button></div>'+
        '</div>';
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
          '<div><div style="font-size:var(--fs-xs);font-weight:500">'+c.label+'</div>'+
          '<div style="font-size:var(--fs-xs);color:var(--text3);font-family:var(--mono)">'+sub+'</div></div></div>'});
      }
    });
    Object.keys(DATA.events).sort().forEach(function(key){
      const evts=DATA.events[key];if(!evts||!evts.length)return;
      const d=new Date(key+'T00:00:00');
      const diff=Math.round((d-now)/86400000);
      if(diff>=0&&diff<=60){evts.forEach(function(e){
        items.push({s:diff,html:'<div style="padding:6px 0;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:flex-start">'+
          '<div style="width:4px;height:4px;border-radius:50%;background:'+e.color+';margin-top:5px;flex-shrink:0"></div>'+
          '<div><div style="font-size:var(--fs-xs);font-weight:500">'+e.text+'</div>'+
          '<div style="font-size:var(--fs-xs);color:var(--text3);font-family:var(--mono)">'+(diff===0?'today!':'in '+diff+' day'+(diff!==1?'s':''))+'</div></div></div>'});
      });}
    });
    Object.keys(DATA.goals).forEach(function(gkey){
      if(!DATA.goals[gkey])return;
      const p=gkey.split('-'),gy=parseInt(p[0]),gm=parseInt(p[1])-1;
      const dm=(gy-today.getFullYear())*12+(gm-today.getMonth());
      if(dm>0)items.push({s:dm*30,html:'<div style="padding:6px 0;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:flex-start">'+
        '<div style="width:4px;height:4px;border-radius:50%;background:var(--lavender-text);margin-top:5px;flex-shrink:0"></div>'+
        '<div><div style="font-size:var(--fs-xs);font-weight:500">'+DATA.goals[gkey]+'</div>'+
        '<div style="font-size:var(--fs-xs);color:var(--text3);font-family:var(--mono)">in '+dm+' month'+(dm!==1?'s':'')+'</div></div></div>'});
    });
    (DATA.bonds||[]).filter(function(b){return !bondIsMatured(b);}).forEach(function(b){
      var days=bondDaysToMaturity(b);
      if(days>=0&&days<=365){
        var sub=days===0?'matures today! 🎉':'matures in '+days+' day'+(days!==1?'s':'');
        items.push({s:days,html:'<div style="padding:6px 0;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:flex-start">'+
          '<div style="width:4px;height:4px;border-radius:50%;background:#7a6830;margin-top:5px;flex-shrink:0"></div>'+
          '<div><div style="font-size:var(--fs-xs);font-weight:500">'+b.series+'</div>'+
          '<div style="font-size:var(--fs-xs);color:var(--text3);font-family:var(--mono)">'+sub+'</div></div></div>'});
      }
    });
    items.sort(function(a,b){return a.s-b.s;});
    sc.innerHTML=
      '<div style="font-size:var(--fs-xs);font-weight:500;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">upcoming</div>'+
      (items.length?items.map(function(i){return i.html;}).join(''):'<div style="font-size:var(--fs-sm);color:var(--text3);padding:8px 0">nothing upcoming in 60 days</div>');
  } else if(stab==='countdowns'){
    const cds=DATA.countdowns||[];
    const now=new Date(today.getFullYear(),today.getMonth(),today.getDate());
    sc.innerHTML=
      '<div style="font-size:var(--fs-xs);font-weight:500;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">countdowns</div>'+
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
            '<div style="font-size:var(--fs-sm);font-weight:500">'+c.label+'</div>'+
            '<div style="font-size:var(--fs-xs);color:var(--text3);font-family:var(--mono)">'+dispText+'</div>'+
          '</div>'+
          '<button class="icon-btn" onclick="openEditCountdownModal(\''+c.id+'\')">✎</button>'+
          '<button class="icon-btn" onclick="deleteCountdown(\''+c.id+'\');renderSidebar()">×</button>'+
        '</div>';
      }).join(''):'<div style="font-size:var(--fs-sm);color:var(--text3);padding:8px 0">no countdowns yet</div>')+
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
    '<div style="font-size:var(--fs-xs);color:var(--text2);margin-bottom:5px">type</div>'+
    '<div style="display:flex;margin-bottom:12px;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">'+
      '<button id="cd-mode-until" type="button" onclick="cdSetMode(\'until\')" style="flex:1;padding:7px;border:none;cursor:pointer;font-family:var(--sans);font-size:var(--fs-sm);background:var(--text);color:#fff">until →</button>'+
      '<button id="cd-mode-since" type="button" onclick="cdSetMode(\'since\')" style="flex:1;padding:7px;border:none;cursor:pointer;font-family:var(--sans);font-size:var(--fs-sm);background:none;color:var(--text2)">← since</button>'+
    '</div>'+
    '<input type="hidden" id="cd-mode" value="until">'+
    '<div id="cd-mode-hint" style="font-size:var(--fs-xs);color:var(--text3);margin:-8px 0 10px">counts down to this date</div>'+
    '<input id="cd-date" type="date" value="'+fd(today)+'" style="width:100%;border:1px solid var(--border);border-radius:var(--radius);padding:6px 8px;font-family:var(--sans);font-size:var(--fs-sm);background:var(--surface2);color:var(--text);outline:none;margin-bottom:8px">'+
    '<label style="display:flex;align-items:center;gap:6px;font-size:var(--fs-sm);margin-bottom:10px;cursor:pointer">'+
      '<input id="cd-yearly" type="checkbox" style="width:auto;margin:0;flex-shrink:0"> repeat yearly <span id="cd-yearly-hint" style="font-size:var(--fs-xs);color:var(--text3);font-weight:400">(recurring event)</span>'+
    '</label>'+
    '<div style="font-size:var(--fs-xs);color:var(--text2);margin-bottom:5px">colour</div>'+
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
    '<div style="font-size:var(--fs-xs);color:var(--text2);margin-bottom:5px">type</div>'+
    '<div style="display:flex;margin-bottom:12px;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">'+
      '<button id="cd-mode-until" type="button" onclick="cdSetMode(\'until\')" style="flex:1;padding:7px;border:none;cursor:pointer;font-family:var(--sans);font-size:var(--fs-sm);background:'+(m==='until'?'var(--text)':'none')+';color:'+(m==='until'?'#fff':'var(--text2)')+'">until →</button>'+
      '<button id="cd-mode-since" type="button" onclick="cdSetMode(\'since\')" style="flex:1;padding:7px;border:none;cursor:pointer;font-family:var(--sans);font-size:var(--fs-sm);background:'+(m==='since'?'var(--text)':'none')+';color:'+(m==='since'?'#fff':'var(--text2)')+'">← since</button>'+
    '</div>'+
    '<input type="hidden" id="cd-mode" value="'+m+'">'+
    '<div id="cd-mode-hint" style="font-size:var(--fs-xs);color:var(--text3);margin:-8px 0 10px">'+(m==='until'?'counts down to this date':'tracks time elapsed from this date')+'</div>'+
    '<input id="cd-date" type="date" value="'+c.date+'" style="width:100%;border:1px solid var(--border);border-radius:var(--radius);padding:6px 8px;font-family:var(--sans);font-size:var(--fs-sm);background:var(--surface2);color:var(--text);outline:none;margin-bottom:8px">'+
    '<label style="display:flex;align-items:center;gap:6px;font-size:var(--fs-sm);margin-bottom:10px;cursor:pointer">'+
      '<input id="cd-yearly" type="checkbox"'+(c.yearly?' checked':'')+' style="width:auto;margin:0;flex-shrink:0"> repeat yearly <span id="cd-yearly-hint" style="font-size:var(--fs-xs);color:var(--text3);font-weight:400">'+(m==='until'?'(recurring event)':'(birthday / anniversary mode)')+'</span>'+
    '</label>'+
    '<div style="font-size:var(--fs-xs);color:var(--text2);margin-bottom:5px">colour</div>'+
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
  if(y>=1)return y+' year'+(y>1?'s':'')+(mo>0?' '+mo+' mo':'')+' since';
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
  if(diff===0)return years+' years · turning '+nextYears+' today! 🎂';
  return years+' years · turning '+nextYears+' in '+diff+' day'+(diff!==1?'s':'');
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
  DATA={events:{},tasks:{},slots:{},spend:{},goals:{},notes:[],countdowns:[],nisa:{tsumitateMonthly:0,tsumitateByYear:{},lumpSumByYear:{},startYear:2026,startMonth:1,projectionYears:[]},currencies:{},currencyRates:{},baseCurrency:'JPY',currencyLots:[],bonds:[],bankAccounts:[],finance:{}};
  startApp();
}

function startApp(){
  DATA.slots={};
  if(!DATA.spendLog) DATA.spendLog={};
  if(!DATA.period) DATA.period={enabled:false,entries:[],symptomLogs:[],defaultLength:5};
  if(!DATA.period.symptomLogs) DATA.period.symptomLogs=[];
  if(!DATA.period.entries) DATA.period.entries=[];
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
  if(!DATA.nisa.projectionYears) DATA.nisa.projectionYears=[];
  if(!Object.keys(DATA.nisa.tsumitateByYear).length&&DATA.nisa.tsumitateMonthly>0)
    DATA.nisa.tsumitateByYear[DATA.nisa.startYear]=DATA.nisa.tsumitateMonthly;
  if(!DATA.nisa.startMonth) DATA.nisa.startMonth=1;
  if(!DATA.bankAccounts) DATA.bankAccounts=[];
  if(!DATA.finance) DATA.finance={};
  document.getElementById('splash').style.display='none';
  const app=document.getElementById('app');
  app.style.display='flex';
  render();
  initAutoSave();
}

// boot
document.getElementById('app').style.display='none';
