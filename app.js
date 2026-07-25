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

function getAccounts(){ return JSON.parse(localStorage.getItem('sornet_accounts') || '[]'); }
function saveAccounts(list){ localStorage.setItem('sornet_accounts', JSON.stringify(list)); }
function getCurrentEmail(){ return localStorage.getItem('sornet_current'); }
function setCurrentEmail(email){ localStorage.setItem('sornet_current', email); renderAccountUI(); }
function signOutCurrent(){ localStorage.removeItem('sornet_current'); renderAccountUI(); }

function initials(email){ return email.trim().charAt(0).toUpperCase(); }

function renderAccountUI(){
  const email = getCurrentEmail();
  const signedIn = !!email;

  const accountBtn = document.getElementById('accountBtn');
  const accountBtnText = document.getElementById('accountBtnText');
  
  if(signedIn){
    accountBtn.classList.remove('primary');
    accountBtnText.textContent = initials(email);
  } else {
    accountBtn.classList.add('primary');
    accountBtnText.textContent = 'Sign up';
  }

  document.getElementById('accountAvatar').textContent = signedIn ? initials(email) : '?';
  document.getElementById('accountEmail').textContent = signedIn ? email : 'Not signed in';
  document.getElementById('signoutSection').style.display = signedIn ? 'block' : 'none';

  const accSection = document.getElementById('accountsSection');
  accSection.innerHTML = '';
  const accounts = getAccounts();

  accounts.forEach(acc => {
    const row = document.createElement('button');
    row.className = 'menu-item';
    if(acc === email) row.classList.add('active');
    row.innerHTML = `<span style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,var(--accent1),var(--accent2));color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${initials(acc)}</span><span>${acc}</span>`;
    row.addEventListener('click', () => { setCurrentEmail(acc); closeAccountMenu(); });
    accSection.appendChild(row);
  });

  const addRow = document.createElement('button');
  addRow.className = 'menu-item';
  addRow.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Add account</span>`;
  addRow.addEventListener('click', () => { closeAccountMenu(); openSignin(); });
  accSection.appendChild(addRow);
}

renderAccountUI();

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

document.getElementById('accountBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('accountMenu').classList.toggle('show');
});

document.getElementById('cancelSignin').addEventListener('click', closeSignin);
signinModal.addEventListener('click', e => { if(e.target === signinModal) closeSignin(); });

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

function closeAccountMenu(){ document.getElementById('accountMenu').classList.remove('show'); }
document.addEventListener('click', e => {
  if(!e.target.closest('.navbar-right')) closeAccountMenu();
});

document.getElementById('signOutBtn').addEventListener('click', () => { signOutCurrent(); closeAccountMenu(); });

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
    historyContent.innerHTML = '<div style="padding:40px 12px;text-align:center;color:var(--text-secondary);font-size:13px;">No searches yet</div>';
    return;
  }

  historyContent.innerHTML = '';
  history.forEach(item => {
    const date = new Date(item.timestamp);
    const timeStr = formatTime(date);
    const row = document.createElement('button');
    row.className = 'sidebar-item';
    row.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><div style="flex:1;text-align:left;"><div style="font-weight:500;">${escapeHtml(item.query)}</div><div class="sidebar-time">${timeStr}</div></div>`;
    row.addEventListener('click', () => {
      closeHistorySidebar();
      searchQuery(item.query);
    });
    historyContent.appendChild(row);
  });
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

function getDownloads(){ return JSON.parse(localStorage.getItem('sornet_downloads') || '[]'); }
function saveDownloads(list){ localStorage.setItem('sornet_downloads', JSON.stringify(list)); }

function renderDownloads(){
  const downloadsContent = document.getElementById('downloadsContent');
  const downloads = getDownloads();
  
  if(downloads.length === 0){
    downloadsContent.innerHTML = '<div style="padding:40px 12px;text-align:center;color:var(--text-secondary);font-size:13px;">No downloads yet</div>';
    return;
  }

  downloadsContent.innerHTML = '';
  downloads.forEach(item => {
    const date = new Date(item.timestamp);
    const timeStr = formatTime(date);
    const row = document.createElement('div');
    row.className = 'sidebar-item';
    row.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><div style="flex:1;text-align:left;"><div style="font-weight:500;">${escapeHtml(item.filename)}</div><div class="sidebar-time">${timeStr}</div></div>`;
    downloadsContent.appendChild(row);
  });
}

renderHistory();
renderDownloads();

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
  const tabsBar = document.getElementById('tabsBar');
  const existingTabs = tabsBar.querySelectorAll('.tab');
  existingTabs.forEach(t => t.remove());

  tabs.forEach(tab => {
    const tabBtn = document.createElement('button');
    tabBtn.className = 'tab' + (tab.id === activeTabId ? ' active' : '');
    const displayText = tab.query ? tab.query.substring(0, 20) + (tab.query.length > 20 ? '...' : '') : 'New Tab';
    tabBtn.innerHTML = `<span>${displayText}</span><button class="tab-close" style="margin-left:4px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
    tabBtn.addEventListener('click', () => setActiveTab(tab.id));
    tabBtn.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });
    tabsBar.insertBefore(tabBtn, tabsBar.lastChild);
  });
}

if(!activeTabId && tabs.length > 0){
  activeTabId = tabs[0].id;
  localStorage.setItem('sornet_active_tab', activeTabId);
}
renderTabs();

document.getElementById('newTabBtn').addEventListener('click', () => createTab());

const homeView = document.getElementById('homeView');
const resultsView = document.getElementById('resultsView');
const homeInput = document.getElementById('homeInput');
const resultsInput = document.getElementById('resultsInput');

function showHome(){
  resultsView.classList.remove('show');
  homeView.style.display = 'flex';
  homeInput.value = '';
  homeInput.focus();
}

function showResults(query){
  homeView.style.display = 'none';
  resultsView.classList.add('show');
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

document.getElementById('resultsBackBtn').addEventListener('click', (e) => {
  e.preventDefault();
  showHome();
});

document.getElementById('navbarBrand').addEventListener('click', (e) => {
  e.preventDefault();
  showHome();
});

document.getElementById('homeForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = homeInput.value.trim();
  if(q) searchQuery(q);
});

document.getElementById('searchBtn').addEventListener('click', () => {
  const q = homeInput.value.trim();
  if(q) searchQuery(q);
});

document.getElementById('resultsForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = resultsInput.value.trim();
  if(q) searchQuery(q);
});

document.getElementById('navSearchForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = document.getElementById('navSearchInput').value.trim();
  if(q) searchQuery(q);
});

document.getElementById('searchHero').addEventListener('focusin', function(){ this.classList.add('focused'); });
document.getElementById('searchHero').addEventListener('focusout', function(){ this.classList.remove('focused'); });

const ENGINES = [
  { id:'sornet', label:'Sornet AI', badge:'S', inline:true },
  { id:'google', label:'Google', badge:'G', urlFn:q => `https://www.google.com/search?q=${q}` },
  { id:'bing', label:'Bing', badge:'B', urlFn:q => `https://www.bing.com/search?q=${q}` },
  { id:'duckduckgo', label:'DuckDuckGo', badge:'D', urlFn:q => `https://duckduckgo.com/?q=${q}` },
  { id:'yahoo', label:'Yahoo', badge:'Y', urlFn:q => `https://search.yahoo.com/search?p=${q}` }
];
let activeEngine = localStorage.getItem('sornet_engine') || 'sornet';

function setActiveEngine(id){
  activeEngine = id;
  localStorage.setItem('sornet_engine', id);
  renderEngineChips();
}

function renderEngineChips(){
  [' engineSelector', 'engineSelectorResults'].forEach(id => {
    const row = document.getElementById(id);
    row.innerHTML = '';
    ENGINES.forEach(eng => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'engine-btn' + (eng.id === activeEngine ? ' active' : '');
      chip.innerHTML = `<span class="engine-badge" style="background:linear-gradient(135deg,#5b3df0,#ec4899);">${eng.badge}</span>${eng.label}`;
      chip.addEventListener('click', () => {
        setActiveEngine(eng.id);
        const q = resultsInput.value.trim() || homeInput.value.trim();
        if(q) dispatchSearch(q);
      });
      row.appendChild(chip);
    });
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
  const resultsHeader = document.getElementById('resultsHeader');
  const resultsContent = document.getElementById('resultsContent');
  resultsHeader.innerHTML = `Results for <strong>${escapeHtml(query)}</strong>`;
  resultsContent.innerHTML = `<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius-xl);padding:40px;text-align:center;"><div style="font-size:48px;margin-bottom:16px;">${eng.badge}</div><h3 style="font-size:20px;margin-bottom:12px;color:var(--text);">Opened ${eng.label}</h3><p style="color:var(--text-secondary);margin-bottom:20px;">${eng.label} doesn't allow results inside other sites.</p></div>`;
}

const resultsHeader = document.getElementById('resultsHeader');
const resultsContent = document.getElementById('resultsContent');
let searchToken = 0;

function jsonp(url){
  return new Promise((resolve, reject) => {
    const cbName = 'sornet_cb_' + Date.now();
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
  resultsHeader.textContent = `Results for "${query}"`;
  resultsContent.innerHTML = `<div class="skeleton"><div class="skeleton-line" style="width:60%;height:20px;"></div><div class="skeleton-line" style="width:95%;"></div><div class="skeleton-line" style="width:85%;"></div></div>`;

  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

  let data = null;
  try{ data = await jsonp(url); }catch(err){ data = null; }
  if(myToken !== searchToken) return;

  renderResults(query, data);
}

function renderResults(query, data){
  resultsContent.innerHTML = '';

  const hasAbstract = data && data.AbstractText;
  const related = data ? flattenTopics(data.RelatedTopics).slice(0, 8) : [];

  if(!hasAbstract && related.length === 0){
    resultsHeader.textContent = `No instant results for "${query}"`;
    resultsContent.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><h3>No instant results found</h3><p>Try rephrasing your search or asking about a specific topic.</p></div>`;
    return;
  }

  resultsHeader.innerHTML = `Results for <strong>${escapeHtml(query)}</strong>`;

  if(hasAbstract){
    const card = document.createElement('div');
    card.className = 'ai-result';
    card.innerHTML = `<span class="ai-badge">🤖 AI Answer</span><h2>${escapeHtml(data.Heading || query)}</h2><p>${escapeHtml(data.AbstractText)}</p>${data.AbstractURL ? `<span class="ai-source">Source: <a href="${data.AbstractURL}" target="_blank">${domainOf(data.AbstractURL)}</a></span>` : ''}`;
    resultsContent.appendChild(card);
  }

  related.forEach(item => {
    const title = item.Text.includes(' - ') ? item.Text.split(' - ')[0] : item.Text;
    const row = document.createElement('div');
    row.className = 'result-item';
    row.innerHTML = `<div class="result-url"><span class="result-favicon">${domainOf(item.FirstURL).charAt(0).toUpperCase()}</span><span>${domainOf(item.FirstURL)}</span></div><a class="result-title" href="${item.FirstURL}" target="_blank">${escapeHtml(title)}</a><div class="result-desc">${escapeHtml(item.Text)}</div>`;
    resultsContent.appendChild(row);
  });
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

homeInput.focus();