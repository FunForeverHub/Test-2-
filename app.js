const raw = window.DASHBOARD_DATA;
const charts = {};
const money = v => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v||0);
const num = v => new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(v||0);
const doneStatuses = new Set(['Done','Complete','Completed','Closed']);
const canceledStatuses = new Set(['Canceled','Cancelled','Cancel','Cancelled / Rejected','Rejected']);
const categoryMap = {
  initiatives: ['Initiative', 'Initiatives'],
  ktlo: ['BAU/KTLO', 'KTLO', 'BAU-KTLO', 'BAU / KTLO'],
  enhancements: ['Enhancement', 'Enhancements']
};

function clean(v){ return (v === undefined || v === null || v === '') ? 'Blank' : String(v).trim(); }
function unique(arr){ return [...new Set(arr.map(clean).filter(x => x && x !== 'Blank'))].sort((a,b)=>a.localeCompare(b)); }
function fillSelect(id, values){ const el=document.getElementById(id); values.forEach(v=>{const o=document.createElement('option'); o.value=v; o.textContent=v; el.appendChild(o);}); }
function val(id){ return document.getElementById(id).value; }
function ticketKey(d){ return clean(d.jiraIssueKey) !== 'Blank' ? clean(d.jiraIssueKey) : `row-${d.row}`; }
function distinctTickets(arr){ return new Set(arr.map(ticketKey)).size; }
function solutionKey(d){ return clean(d.solutionId) !== 'Blank' ? clean(d.solutionId) : clean(d.businessSolution); }
function distinctSolutions(arr){ const m = new Map(); arr.forEach(d => { const k = solutionKey(d); if(k !== 'Blank' && !m.has(k)) m.set(k, d); }); return [...m.values()]; }

fillSelect('categoryFilter', unique(raw.tickets.map(d=>d.gtoCategory)));
fillSelect('statusFilter', unique(raw.tickets.map(d=>d.jiraStatus)));
fillSelect('departmentFilter', unique(raw.tickets.map(d=>d.department)));
fillSelect('priorityFilter', unique(raw.tickets.map(d=>d.priority)));
fillSelect('yearFilter', unique(raw.tickets.map(d=>d.year)));
['categoryFilter','statusFilter','departmentFilter','priorityFilter','yearFilter'].forEach(id => document.getElementById(id).addEventListener('change', render));
document.getElementById('resetBtn').addEventListener('click', () => { ['categoryFilter','statusFilter','departmentFilter','priorityFilter','yearFilter'].forEach(id => document.getElementById(id).value='All'); render(); });
document.getElementById('topSearch').addEventListener('input', renderTables);
document.getElementById('pendingSearch').addEventListener('input', renderTables);

function filters(){ return { category:val('categoryFilter'), status:val('statusFilter'), department:val('departmentFilter'), priority:val('priorityFilter'), year:val('yearFilter') }; }
function passTicket(d,f){
  return (f.category==='All'||clean(d.gtoCategory)===f.category) &&
         (f.status==='All'||clean(d.jiraStatus)===f.status) &&
         (f.department==='All'||clean(d.department)===f.department) &&
         (f.priority==='All'||clean(d.priority)===f.priority) &&
         (f.year==='All'||String(clean(d.year))===String(f.year));
}
function filteredData(){
  const f = filters();
  const tickets = raw.tickets.filter(d => passTicket(d,f));
  const solutionIds = new Set(tickets.map(solutionKey).filter(k => k !== 'Blank'));
  const solutions = distinctSolutions(raw.initiatives.filter(d => solutionIds.has(solutionKey(d))));
  return { tickets, solutions };
}
function countCategory(tickets, names){ return distinctTickets(tickets.filter(d => names.includes(clean(d.gtoCategory)))); }
function groupCountUnique(arr, key, idFn){ const m={}; const seen={}; arr.forEach(d=>{const k=clean(d[key]); const id=idFn(d); seen[k] ||= new Set(); seen[k].add(id);}); Object.keys(seen).forEach(k => m[k]=seen[k].size); return m; }
function chart(id,type,labels,data,opts={}){
  if(charts[id]) charts[id].destroy();
  charts[id] = new Chart(document.getElementById(id), { type, data:{ labels, datasets:[{ label:opts.label||'', data, borderWidth:1, borderRadius:8 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:!!opts.legend} }, scales: opts.noScales ? {} : { y:{beginAtZero:true,ticks:{precision:0}}, x:{ticks:{autoSkip:false,maxRotation:45,minRotation:0}} } } });
}

function render(){
  const {tickets, solutions} = filteredData();
  const uniqueSolutions = distinctSolutions(solutions);
  document.getElementById('kpiTickets').textContent = num(distinctTickets(tickets));
  document.getElementById('kpiParentSolutions').textContent = num(uniqueSolutions.length);
  document.getElementById('kpiInitiatives').textContent = num(countCategory(tickets, categoryMap.initiatives));
  document.getElementById('kpiKTLO').textContent = num(countCategory(tickets, categoryMap.ktlo));
  document.getElementById('kpiEnhancements').textContent = num(countCategory(tickets, categoryMap.enhancements));
  document.getElementById('kpiSavings').textContent = money(uniqueSolutions.reduce((s,d)=>s+(+d.savings||0),0));
  document.getElementById('kpiUsers').textContent = num(uniqueSolutions.reduce((s,d)=>s+(+d.usersImpacted||0),0));
  document.getElementById('kpiDepartments').textContent = num(unique(uniqueSolutions.map(d=>d.department)).length);

  const byStatus = groupCountUnique(uniqueSolutions, 'jiraStatus', solutionKey);
  chart('solutionsByStatus','bar',Object.keys(byStatus),Object.values(byStatus),{label:'Parent Solutions'});
  const byCategory = groupCountUnique(tickets, 'gtoCategory', ticketKey);
  chart('ticketsByCategory','doughnut',Object.keys(byCategory),Object.values(byCategory),{legend:true,noScales:true});

  const completed = uniqueSolutions.filter(d=>doneStatuses.has(clean(d.jiraStatus))).reduce((a,d)=>a+(+d.savings||0),0);
  const inprog = uniqueSolutions.filter(d=>clean(d.jiraStatus).includes('Progress')||clean(d.jiraStatus).includes('UAT')||clean(d.jiraStatus).includes('Queued')).reduce((a,d)=>a+(+d.savings||0),0);
  const backlog = uniqueSolutions.filter(d=>clean(d.jiraStatus).includes('Backlog')).reduce((a,d)=>a+(+d.savings||0),0);
  chart('savingsPipeline','bar',['Completed Savings','In Progress / Queued Savings','Backlog Potential Savings'],[completed,inprog,backlog],{label:'Savings'});

  const dept = groupCountUnique(uniqueSolutions, 'department', solutionKey);
  const topDept = Object.entries(dept).filter(([k])=>k!=='Blank').sort((a,b)=>b[1]-a[1]).slice(0,10);
  chart('departmentImpact','bar',topDept.map(x=>x[0]),topDept.map(x=>x[1]),{label:'Parent Solutions'});
  renderTables();
}
function renderTables(){
  const {solutions} = filteredData();
  const uniqueSolutions = distinctSolutions(solutions);
  const topQ = document.getElementById('topSearch').value.toLowerCase();
  const pendingQ = document.getElementById('pendingSearch').value.toLowerCase();
  const isOpen = d => !doneStatuses.has(clean(d.jiraStatus)) && !canceledStatuses.has(clean(d.jiraStatus));
  const top = uniqueSolutions.filter(d=>isOpen(d) && JSON.stringify(d).toLowerCase().includes(topQ)).sort((a,b)=>(+b.savings||0)-(+a.savings||0));
  const pending = uniqueSolutions.filter(d=>isOpen(d) && JSON.stringify(d).toLowerCase().includes(pendingQ)).sort((a,b)=>clean(a.jiraStatus).localeCompare(clean(b.jiraStatus))||(+b.savings||0)-(+a.savings||0));
  rowFill('topSavingsTable', top, d=>`<tr><td><strong>${esc(d.businessSolution)}</strong><br>${badge(d.jiraStatus)}</td><td>${esc(d.department)}</td><td>${esc(d.requestor)}</td><td>${esc(d.description)}</td><td>${esc(d.financialImpact)}</td><td class="num">${num(d.usersImpacted)}</td><td class="num savings">${money(d.savings)}</td></tr>`, 7);
  rowFill('pendingTable', pending, d=>`<tr><td>${badge(d.jiraStatus)}</td><td>${esc(d.businessSolution)}</td><td>${esc(d.department)}</td><td>${esc(d.financialImpact)}</td><td class="num">${num(d.usersImpacted)}</td><td class="num">${num(d.ticketCount)}</td><td class="num">${money(d.savings)}</td></tr>`, 7);
}
function rowFill(tableId, arr, fn, cols){ document.querySelector(`#${tableId} tbody`).innerHTML = arr.length ? arr.map(fn).join('') : `<tr><td colspan="${cols}">No matching records.</td></tr>`; }
function esc(v){ return String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function badge(s){ let cls='status '; const st=clean(s); if(doneStatuses.has(st)) cls+='done'; else if(canceledStatuses.has(st)) cls+='cancel'; else if(st.includes('Backlog')) cls+='backlog'; else if(st.includes('Progress')||st.includes('UAT')||st.includes('Queued')) cls+='progress'; return `<span class="${cls}">${esc(st)}</span>`; }
render();
