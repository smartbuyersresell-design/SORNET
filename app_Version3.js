/* ================= THEME ================= */
const root = document.documentElement;
const themeSwitch = document.getElementById('themeSwitch');

function applyTheme(mode){
  root.setAttribute('data-theme', mode);
  themeSwitch.checked = mode === 'dark';
  localStorage.setItem('sornet_theme', mode);
}
(function initTheme(){
  const saved = localStorage.getItem('sornet_theme');
  if(saved){ applyTheme(saved); }
  else{
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
})();
themeSwitch.addEventListener('change', () => applyTheme(themeSwitch.checked ? 'dark' : 'light'));

/* ================= ACCOUNTS ================= */
function getAccounts(){ return JSON.parse(localStorage.getItem('sornet_accounts') || '[]'); }
function saveAccounts(list){ localStorage.setItem('sornet_accounts', JSON.stringify(list)); }
function getCurrentEmail(){ return localStorage.getItem('sornet_current'); }
function setCurrentEmail(email){ localStorage.setItem('sornet_current', email); renderAccountUI(); }
function signOutCurrent(){ localStorage.removeItem('sornet_current'); renderAccountUI(); }

function initials(email){ return email.trim().charAt(0).toUpperCase(); }

function renderAccountUI(){
  const email = getCurrentEmail();
  const signedIn = !!email;

  document.getElementById('signinBtn').style.display = signedIn ? 'none' : 'inline-block';
  const avBtn = document.getElementById('avatarBtn');
  if(signedIn){
    avBtn.style.display = 'flex';
    avBtn.textContent = initials(email);
  } else {
    avBtn.style.display = 'none';
  }

  document.getElementById('amAvatar').textContent = signedIn ? initials(email) : '?';
  document.getElementById('amEmail').textContent = signedIn ? email : 'Not signed in';
  document.getElementById('amSignoutSection').style.display = signedIn ? 'block' : 'none';

  const accSection = document.getElementById('amAccountsSection');
  accSection.innerHTML = '';
  const accounts = getAccounts();

  accounts.forEach(acc => {
    const row = document.createElement('button');
    row.className = 'am-row' + (acc === email ? ' active' : '');
    row.innerHTML = `<span class="mini-avatar">${initials(acc)}</span><span>${acc}</span>`;
    row.addEventListener('click', () => { setCurrentEmail(acc); closeAccountMenu(); });
    accSection.appendChild(row);
  });

  const addRow = document.createElement('button');
  addRow.className = 'am-row';
  addRow.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Add account</span>`;
  addRow.addEventListener('click', () => { closeAccountMenu(); openSignin(); });
  accSection.appendChild(addRow);
}
renderAccountUI();

/* ---- Sign-in modal ---- */
const signinModal = document.getElementById('signinModal');
const gmailInput = document.getElementById('gmailInput');
const gmailError = document.getElementById('gmailError');

function openSignin(){
  signinModal.classList.add('show');
  gmailInput.value = '';
  gmailError.textContent = '';
  setTimeout(() => gmailInput.focus(), 50);
}
function closeSignin(){ signinModal.classList.remove('show'); }

document.getElementById('signinBtn').addEventListener('click', openSignin);
document.getElementById('cancelSignin').addEventListener('click', closeSignin);
signinModal.addEventListener('click', e => { if(e.target.classList.contains('overlay') || e.target === signinModal) closeSignin(); });

document.getElementById('confirmSignin').addEventListener('click', () => {
  const val = gmailInput.value.trim().toLowerCase();
  if(!/^[^\s@]+@gmail\.com$/.test(val)){
    gmailError.textContent = 'Enter a valid @gmail.com address.';
    return;
  }
  const accounts = getAccounts();
  if(!accounts.includes(val)){ accounts.push(val); saveAccounts(accounts); }
  setCurrentEmail(val);
  closeSignin();
});
gmailInput.addEventListener('keydown', e => { if(e.key === 'Enter') document.getElementById('confirmSignin').click(); });

/* ---- Account menu ---- */
const accountMenu = document.getElementById('accountMenu');
function toggleAccountMenu(){ accountMenu.classList.toggle('show'); }
function closeAccountMenu(){ accountMenu.classList.remove('show'); }

[document.getElementById('avatarBtn'), document.getElementById('settingsBtn')].forEach(btn => {
  btn.addEventListener('click', e => { e.stopPropagation(); toggleAccountMenu(); });
});
document.addEventListener('click', e => {
  if(!accountMenu.contains(e.target)) closeAccountMenu();
});
document.getElementById('signOutBtn').addEventListener('click', () => { signOutCurrent(); closeAccountMenu(); });

/* ================= SEARCH HISTORY ================= */
function getSearchHistory(){ return JSON.parse(localStorage.getItem('sornet_history') || '[]'); }
function saveSearchHistory(list){ localStorage.setItem('sornet_history', JSON.stringify(list)); }

function addToHistory(query){
  if(!query.trim()) return;
  let history = getSearchHistory();
  const timestamp = new Date().toISOString();
  history = history.filter(h => h.query !== query);
  history.unshift({ query, timestamp });
  history = history.slice(0, 50);
  saveSearchHistory(history);
  renderHistory();
}

function renderHistory(){
  const historyContent = document.getElementById('historyContent');
  const history = getSearchHistory();
  
  if(history.length === 0){
    historyContent.innerHTML = '<div style="padding:40px 12px; text-align:center; color:var(--muted); font-size:13px;">No searches yet</div>';
    return;
  }

  historyContent.innerHTML = '';
  history.forEach((item, idx) => {
    const date = new Date(item.timestamp);
    const timeStr = formatTime(date);
    const row = document.createElement('button');
    row.className = 'sidebar-item';
    row.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <div style="flex:1; text-align:left;">
        <div style="font-weight:500;">${escapeHtml(item.query)}</div>
        <div class="sidebar-item-time">${timeStr}</div>
      </div>
    `;
    row.addEventListener('click', () => {
      closeHistorySidebar();
      searchQuery(item.query);
    });
    historyContent.appendChild(row);
  });

  historyContent.innerHTML += `<div class="sidebar-divider"></div>`;
  const clearBtn = document.createElement('button');
  clearBtn.className = 'sidebar-action';
  clearBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><polyline points="3 6 5 4 21 4"/><path d="M19 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4M10 9v6M14 9v6"/></svg> Clear history';
  clearBtn.addEventListener('click', () => {
    saveSearchHistory([]);
    renderHistory();
  });
  historyContent.appendChild(clearBtn);
}

function formatTime(date){
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if(diffMins < 1) return 'Just now';
  if(diffMins < 60) return diffMins + 'm ago';
  if(diffHours < 24) return diffHours + 'h ago';
  if(diffDays < 7) return diffDays + 'd ago';
  return date.toLocaleDateString();
}

/* ================= DOWNLOADS ================= */
function getDownloads(){ return JSON.parse(localStorage.getItem('sornet_downloads') || '[]'); }
function saveDownloads(list){ localStorage.setItem('sornet_downloads', JSON.stringify(list)); }

function addDownload(filename, url){
  let downloads = getDownloads();
  downloads.unshift({ filename, url, timestamp: new Date().toISOString() });
  downloads = downloads.slice(0, 100);
  saveDownloads(downloads);
  renderDownloads();
}

function renderDownloads(){
  const downloadsContent = document.getElementById('downloadsContent');
  const downloads = getDownloads();
  
  if(downloads.length === 0){
    downloadsContent.innerHTML = '<div style="padding:40px 12px; text-align:center; color:var(--muted); font-size:13px;">No downloads yet</div>';
    return;
  }

  downloadsContent.innerHTML = '';
  downloads.forEach((item, idx) => {
    const date = new Date(item.timestamp);
    const timeStr = formatTime(date);
    const row = document.createElement('div');
    row.className = 'sidebar-item';
    row.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      <div style="flex:1; text-align:left;">
        <div style="font-weight:500;">${escapeHtml(item.filename)}</div>
        <div class="sidebar-item-time">${timeStr}</div>
      </div>
    `;
    downloadsContent.appendChild(row);
  });

  downloadsContent.innerHTML += `<div class="sidebar-divider"></div>`;
  const clearBtn = document.createElement('button');
  clearBtn.className = 'sidebar-action';
  clearBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><polyline points="3 6 5 4 21 4"/><path d="M19 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4M10 9v6M14 9v6"/></svg> Clear downloads';
  clearBtn.addEventListener('click', () => {
    saveDownloads([]);
    renderDownloads();
  });
  downloadsContent.appendChild(clearBtn);
}

document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  saveSearchHistory([]);
  renderHistory();
  closeAccountMenu();
});

renderHistory();
renderDownloads();

/* ================= SIDEBARS ================= */
const overlay = document.getElementById('overlay');
const historySidebar = document.getElementById('historySidebar');
const downloadsSidebar = document.getElementById('downloadsSidebar');

function openHistorySidebar(){
  historySidebar.classList.add('show');
  overlay.classList.add('show');
}
function closeHistorySidebar(){
  historySidebar.classList.remove('show');
  overlay.classList.remove('show');
}

function openDownloadsSidebar(){
  downloadsSidebar.classList.add('show');
  overlay.classList.add('show');
}
function closeDownloadsSidebar(){
  downloadsSidebar.classList.remove('show');
  overlay.classList.remove('show');
}

document.getElementById('historyBtn').addEventListener('click', openHistorySidebar);
document.getElementById('downloadsBtn').addEventListener('click', openDownloadsSidebar);
document.getElementById('closeHistorySidebar').addEventListener('click', closeHistorySidebar);
document.getElementById('closeDownloadsSidebar').addEventListener('click', closeDownloadsSidebar);
overlay.addEventListener('click', () => {
  closeHistorySidebar();
  closeDownloadsSidebar();
});

/* ================= TABS ================= */
let tabs = JSON.parse(localStorage.getItem('sornet_tabs') || '[]');
let activeTabId = localStorage.getItem('sornet_active_tab');

function createTab(query = ''){
  const tabId = Date.now().toString();
  const tab = { id: tabId, query, created: new Date().toISOString() };
  tabs.push(tab);
  saveTabs();
  setActiveTab(tabId);
  renderTabs();
  if(query) searchQuery(query);
  return tabId;
}

function closeTab(tabId){
  tabs = tabs.filter(t => t.id !== tabId);
  if(activeTabId === tabId){
    activeTabId = tabs.length > 0 ? tabs[0].id : null;
  }
  saveTabs();
  renderTabs();
  if(activeTabId) setActiveTab(activeTabId);
  else showHome();
}

function setActiveTab(tabId){
  activeTabId = tabId;
  localStorage.setItem('sornet_active_tab', tabId);
  saveTabs();
  renderTabs();
  const tab = tabs.find(t => t.id === tabId);
  if(tab && tab.query) showResults(tab.query);
  else showHome();
}

function saveTabs(){
  localStorage.setItem('sornet_tabs', JSON.stringify(tabs));
  localStorage.setItem('sornet_active_tab', activeTabId);
}

function renderTabs(){
  const tabsContainer = document.getElementById('tabsContainer');
  tabsContainer.innerHTML = '';

  tabs.forEach(tab => {
    const tabBtn = document.createElement('button');
    tabBtn.className = 'tab-item' + (tab.id === activeTabId ? ' active' : '');
    const displayText = tab.query ? tab.query.substring(0, 20) + (tab.query.length > 20 ? '...' : '') : 'New Tab';
    tabBtn.innerHTML = `
      <span>${displayText}</span>
      <svg class="tab-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    `;
    tabBtn.addEventListener('click', () => setActiveTab(tab.id));
    tabBtn.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });
    tabsContainer.appendChild(tabBtn);
  });

  const newTabBtn = document.createElement('button');
  newTabBtn.className = 'new-tab-btn';
  newTabBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  newTabBtn.addEventListener('click', () => createTab());
  tabsContainer.appendChild(newTabBtn);
}

if(!activeTabId && tabs.length > 0){
  activeTabId = tabs[0].id;
  localStorage.setItem('sornet_active_tab', activeTabId);
}
renderTabs();

/* ================= VIEW SWITCHING ================= */
const homeView = document.getElementById('homeView');
const resultsView = document.getElementById('resultsView');
const homeInput = document.getElementById('homeInput');
const resultsInput = document.getElementById('resultsInput');

function showHome(){
  resultsView.style.display = 'none';
  homeView.style.display = 'flex';
  homeInput.value = '';
  homeInput.focus();
}

function showResults(query){
  homeView.style.display = 'none';
  resultsView.style.display = 'flex';
  resultsInput.value = query;
  dispatchSearch(query);
}

function searchQuery(query){
  if(!query.trim()) return;
  
  if(!activeTabId){
    createTab(query);
  } else {
    const tab = tabs.find(t => t.id === activeTabId);
    if(tab) tab.query = query;
    saveTabs();
    renderTabs();
  }
  
  addToHistory(query);
  showResults(query);
  dispatchSearch(query);
}

document.getElementById('logoBackBtn').addEventListener('click', showHome);

document.getElementById('homeForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = homeInput.value.trim();
  if(q) searchQuery(q);
});

document.getElementById('btnSornetSearch').addEventListener('click', () => {
  const q = homeInput.value.trim();
  if(q) searchQuery(q);
});

document.getElementById('resultsForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = resultsInput.value.trim();
  if(q) searchQuery(q);
});

document.getElementById('homePill').addEventListener('focusin', function(){ this.classList.add('focused'); });
document.getElementById('homePill').addEventListener('focusout', function(){ this.classList.remove('focused'); });
document.getElementById('resultsPill').addEventListener('focusin', function(){ this.classList.add('focused'); });
document.getElementById('resultsPill').addEventListener('focusout', function(){ this.classList.remove('focused'); });

/* ================= SEARCH ENGINES ================= */
const ENGINES = [
  { id:'sornet',     label:'Sornet AI',   badge:'S', cls:'eng-sornet',     inline:true },
  { id:'google',     label:'Google',      badge:'G', cls:'eng-google',     urlFn:q => `https://www.google.com/search?q=${q}` },
  { id:'bing',       label:'Bing',        badge:'B', cls:'eng-bing',       urlFn:q => `https://www.bing.com/search?q=${q}` },
  { id:'duckduckgo', label:'DuckDuckGo',  badge:'D', cls:'eng-duckduckgo', urlFn:q => `https://duckduckgo.com/?q=${q}` },
  { id:'yahoo',      label:'Yahoo',       badge:'Y', cls:'eng-yahoo',      urlFn:q => `https://search.yahoo.com/search?p=${q}` }
];
let activeEngine = localStorage.getItem('sornet_engine') || 'sornet';

function setActiveEngine(id){
  activeEngine = id;
  localStorage.setItem('sornet_engine', id);
  renderEngineChips();
}

function renderEngineChips(){
  const row = document.getElementById('engineRowResults');
  row.innerHTML = '';
  ENGINES.forEach(eng => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'engine-chip' + (eng.id === activeEngine ? ' active' : '');
    chip.innerHTML = `<span class="eng-badge ${eng.cls}">${eng.badge}</span>${eng.label}`;
    chip.addEventListener('click', () => {
      setActiveEngine(eng.id);
      const q = resultsInput.value.trim();
      if(q) dispatchSearch(q);
    });
    row.appendChild(chip);
  });

  const homeRow = document.getElementById('engineRowHome');
  homeRow.innerHTML = '';
  ENGINES.forEach(eng => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'engine-chip' + (eng.id === activeEngine ? ' active' : '');
    chip.innerHTML = `<span class="eng-badge ${eng.cls}">${eng.badge}</span>${eng.label}`;
    chip.addEventListener('click', () => {
      setActiveEngine(eng.id);
      const q = homeInput.value.trim();
      if(q) searchQuery(q);
    });
    homeRow.appendChild(chip);
  });
}
renderEngineChips();

function dispatchSearch(query){
  const eng = ENGINES.find(e => e.id === activeEngine) || ENGINES[0];
  if(eng.inline){
    runSearch(query);
  } else {
    showRedirectCard(eng, query);
    window.open(eng.urlFn(encodeURIComponent(query)), '_blank', 'noopener');
  }
}

function showRedirectCard(eng, query){
  statusLine.innerHTML = `Results for <b>${escapeHtml(query)}</b>`;
  resultsContent.innerHTML = `
    <div class="redirect-card">
      <div class="eng-badge ${eng.cls}" style="font-size:28px;">${eng.badge}</div>
      <h3>Opened ${eng.label} in a new tab</h3>
      <p>${eng.label} doesn't allow its results to be shown inside other sites, so Sornet opened it separately for you. Switch back to <b>Sornet AI</b> anytime to see instant answers right here.</p>
      <a class="btn-solid" href="${eng.urlFn(encodeURIComponent(query))}" target="_blank" rel="noopener" style="display:inline-block;margin-top:14px;">Reopen ${eng.label}</a>
    </div>`;
}

const statusLine = document.getElementById('statusLine');
const resultsContent = document.getElementById('resultsContent');
let searchToken = 0;

function jsonp(url){
  return new Promise((resolve, reject) => {
    const cbName = 'sornet_cb_' + Date.now() + '_' + Math.floor(Math.random()*10000);
    const script = document.createElement('script');
    window[cbName] = data => { resolve(data); cleanup(); };
    script.onerror = () => { reject(new Error('network')); cleanup(); };
    function cleanup(){ delete window[cbName]; script.remove(); }
    script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cbName;
    document.body.appendChild(script);
  });
}

function domainOf(url){
  try{ return new URL(url).hostname.replace('www.',''); }catch(e){ return url; }
}

function flattenTopics(topics){
  const out = [];
  (topics || []).forEach(t => {
    if(t.Topics){ out.push(...flattenTopics(t.Topics)); }
    else if(t.Text && t.FirstURL){ out.push(t); }
  });
  return out;
}

async function runSearch(query){
  const myToken = ++searchToken;
  statusLine.textContent = `Results for "${query}"`;
  resultsContent.innerHTML = `
    <div class="skeleton">
      <div class="skel-line" style="width:60%;height:20px;"></div>
      <div class="skel-line" style="width:95%;"></div>
      <div class="skel-line" style="width:85%;"></div>
      <div class="skel-line" style="width:40%;height:16px;margin-top:10px;"></div>
      <div class="skel-line" style="width:90%;"></div>
    </div>`;

  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

  let data = null;
  try{
    data = await jsonp(url);
  }catch(err){
    data = null;
  }
  if(myToken !== searchToken) return;

  renderResults(query, data);
}

function renderResults(query, data){
  resultsContent.innerHTML = '';

  const hasAbstract = data && data.AbstractText;
  const related = data ? flattenTopics(data.RelatedTopics).slice(0, 8) : [];

  if(!hasAbstract && related.length === 0){
    statusLine.textContent = `No instant results for "${query}"`;
    resultsContent.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <h3>No instant results found</h3>
        <p>Sornet's live AI answers don't have anything on this yet. Try rephrasing your search or asking about a specific topic, person, or place.</p>
      </div>`;
    return;
  }

  statusLine.innerHTML = `Results for <b>${escapeHtml(query)}</b>`;

  if(hasAbstract){
    const card = document.createElement('div');
    card.className = 'ai-card';
    card.innerHTML = `
      <span class="ai-badge">AI Answer</span>
      <h2>${escapeHtml(data.Heading || query)}</h2>
      <p>${escapeHtml(data.AbstractText)}</p>
      ${data.AbstractURL ? `<span class="ai-source">Source: <a href="${data.AbstractURL}" target="_blank" rel="noopener">${domainOf(data.AbstractURL)}</a></span>` : ''}
    `;
    resultsContent.appendChild(card);
  }

  related.forEach(item => {
    const title = item.Text.includes(' - ') ? item.Text.split(' - ')[0] : item.Text;
    const desc = item.Text;
    const domain = domainOf(item.FirstURL);
    const row = document.createElement('div');
    row.className = 'result-item';
    row.innerHTML = `
      <div class="result-url">
        <span class="favicon">${domain.charAt(0).toUpperCase()}</span>
        <span>${domain}</span>
      </div>
      <a class="result-title" href="${item.FirstURL}" target="_blank" rel="noopener">${escapeHtml(title)}</a>
      <div class="result-desc">${escapeHtml(desc)}</div>
    `;
    resultsContent.appendChild(row);
  });

  const footer = document.createElement('div');
  footer.className = 'powered-by';
  footer.textContent = 'AI answers and related results powered by DuckDuckGo';
  resultsContent.appendChild(footer);
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ================= Canvas animation ================= */
const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');
let stars = [], w, h;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function resize(){
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  const count = Math.floor((w * h) / 22000);
  stars = Array.from({length: count}, () => ({
    x: Math.random() * w, y: Math.random() * h,
    r: Math.random() * 1.3 + 0.3,
    baseAlpha: Math.random() * 0.3 + 0.08,
    speed: Math.random() * 0.018 + 0.005,
    phase: Math.random() * Math.PI * 2
  }));
}
function draw(){
  ctx.clearRect(0,0,w,h);
  const isDark = root.getAttribute('data-theme') === 'dark';
  for(const s of stars){
    s.phase += s.speed;
    const alpha = Math.max(0, s.baseAlpha + Math.sin(s.phase) * 0.15);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fillStyle = isDark ? `rgba(230,225,255,${alpha})` : `rgba(107,78,255,${alpha*0.6})`;
    ctx.fill();
  }
  if(!reduceMotion) requestAnimationFrame(draw);
}
resize();
window.addEventListener('resize', resize);
draw();

/* ================= Service worker ================= */
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

/* ================= PWA ================= */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });

homeInput.focus();