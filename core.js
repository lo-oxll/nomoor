const STORAGE_KEY = 'empDashboardTimeSorted';
const DEFAULTS = {
  currency: 'IQD', digits: 'latn', hijri: false, weekend: 'fri',
  modules: { act: false, work: false, ledger: false }, setupDone: false
};
let state = {};
try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { /* بيانات تالفة */ }

function normalize() {
  if (!state || typeof state !== 'object' || Array.isArray(state)) state = {};
  state.lists ||= [];
  state.activities ||= [];
  state.entries ||= [];
  state.ledgers ||= [];
  const old = state.settings && typeof state.settings === 'object' ? state.settings : {};
  const s = state.settings = Object.assign({}, DEFAULTS, old);
  s.modules = Object.assign({}, DEFAULTS.modules, old.modules);
  s.since ||= Date.now();
  if (!s.setupDone && (state.lists.length || state.activities.length || state.ledgers.length)) {
    s.setupDone = true;
    s.modules = { act: true, work: true, ledger: true };
  }
}
normalize();

/* ---------- أدوات عامة ---------- */
const renderers = [];
let _u = Date.now();
const uid = () => ++_u;
const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const AR = '٠١٢٣٤٥٦٧٨٩';
const D = s => {
  s = String(s);
  return state.settings.digits === 'arab'
    ? s.replace(/\d/g, d => AR[d])
    : s.replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632).replace(/[۰-۹]/g, d => d.charCodeAt(0) - 1776);
};
const parseNum = s => parseFloat(String(s ?? '')
  .replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632).replace(/[۰-۹]/g, d => d.charCodeAt(0) - 1776)
  .replace(/[,٬\s]/g, '').replace(/٫/g, '.'));
const money = n => {
  const iqd = state.settings.currency === 'IQD';
  const v = iqd ? Math.round(n) : Math.round(n * 100) / 100;
  return v.toLocaleString('en-US') + (iqd ? ' د.ع' : ' $');
};
const today = () => new Date().toLocaleDateString('sv');
const dayKey = t => new Date(t).toLocaleDateString('sv');
const dateStr = t => new Date(t).toLocaleDateString('ar-IQ-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' });
const isWeekend = d => d.getDay() === 5 || (state.settings.weekend === 'fri-sat' && d.getDay() === 6);
function longDate(t = Date.now()) {
  const d = new Date(t);
  let s = d.toLocaleDateString('ar-IQ-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  if (state.settings.hijri) {
    try { s += ' — ' + d.toLocaleDateString('ar-IQ-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { /* غير مدعوم */ }
  }
  return s;
}

function localize(root = document.body) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    if (/SCRIPT|STYLE|TEXTAREA/.test(n.parentNode.nodeName)) continue;
    const v = D(n.nodeValue);
    if (v !== n.nodeValue) n.nodeValue = v;
  }
}

function render() {
  renderers.forEach(f => f());
  buildNav();
  localize();
}

function save() {
  persist();
  render();
}

/* ---------- التنقل السفلي ---------- */
const TABS = [
  ['home', 'الرئيسية', 'fa-house'], ['act', 'الأنشطة', 'fa-bullseye'], ['work', 'القوائم', 'fa-list-check'],
  ['ledger', 'الدفتر', 'fa-book'], ['set', 'الإعدادات', 'fa-gear']
];
const visible = k => k === 'home' || k === 'set' || !!state.settings.modules[k];
let tab = localStorage.getItem('nomoorTab') || 'home';
if (!visible(tab)) tab = 'home';

function buildNav() {
  document.getElementById('nav').innerHTML = TABS.filter(([k]) => visible(k)).map(([k, l, i]) =>
    `<button data-tab="${k}" class="flex-1 py-2 text-xs flex flex-col items-center gap-1 ${k === tab ? 'text-blue-600 font-bold' : 'text-slate-500'}"><i class="fas ${i} text-lg"></i>${l}</button>`).join('');
}

function setTab(k) {
  tab = visible(k) ? k : 'home';
  localStorage.setItem('nomoorTab', tab);
  TABS.forEach(([t]) => { document.getElementById('tab-' + t).hidden = t !== tab; });
  render();
  window.scrollTo(0, 0);
}
document.getElementById('nav').addEventListener('click', e => {
  const b = e.target.closest('[data-tab]');
  if (b) setTab(b.dataset.tab);
});

/* ---------- نافذة عامة ومشاركة ---------- */
const modal = document.getElementById('modal');
function openModal(html, lock) {
  modal.innerHTML = `<div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5">${html}${lock ? '' : '<button data-close class="mt-4 w-full border rounded-xl py-2">إغلاق</button>'}</div>`;
  modal.style.display = 'flex';
  modal.dataset.lock = lock ? '1' : '';
  localize(modal);
}
function closeModal() {
  modal.style.display = 'none';
  modal.innerHTML = '';
}
modal.addEventListener('click', e => {
  if (e.target.closest('[data-close]') || (e.target === modal && !modal.dataset.lock)) closeModal();
});

let shareBuf = '';
function waLink(text, phone) {
  let p = String(phone || '').replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632).replace(/\D/g, '');
  if (p.startsWith('0')) p = '964' + p.slice(1);
  else if (p.length === 10 && p.startsWith('7')) p = '964' + p;
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}
function shareText(text, phone) {
  shareBuf = D(text);
  const btn = 'text-center rounded-xl py-2 text-white';
  openModal(`<h3 class="font-bold mb-3">مشاركة</h3>
    <pre class="bg-slate-50 border rounded-xl p-3 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto" style="font-family:inherit">${esc(shareBuf)}</pre>
    <div class="grid grid-cols-2 gap-2 mt-3">
      <a target="_blank" rel="noopener" href="${waLink(shareBuf, phone)}" class="${btn} bg-green-600">واتساب</a>
      <a target="_blank" rel="noopener" href="https://t.me/share/url?url=%20&text=${encodeURIComponent(shareBuf)}" class="${btn} bg-sky-500">تيليغرام</a>
      <button data-copy class="${btn} bg-slate-700">نسخ</button>
      ${navigator.share ? `<button data-nshare class="${btn} bg-indigo-600">مشاركة أخرى</button>` : ''}
    </div>`);
}
modal.addEventListener('click', e => {
  const c = e.target.closest('[data-copy]');
  if (c) navigator.clipboard.writeText(shareBuf).then(() => { c.textContent = 'تم النسخ ✓'; });
  if (e.target.closest('[data-nshare]')) navigator.share({ text: shareBuf }).catch(() => {});
});

/* ---------- Excel ---------- */
function xl(sheets, file) {
  const wb = XLSX.utils.book_new(), used = new Set();
  sheets.forEach(([name, rows]) => {
    const base = (String(name).replace(/[\\\/?*\[\]:]/g, ' ').trim().slice(0, 28)) || 'ورقة';
    let u = base, i = 2;
    while (used.has(u)) u = `${base} ${i++}`;
    used.add(u);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), u);
  });
  XLSX.writeFile(wb, file);
}

/* ---------- نسخ احتياطي واستعادة ---------- */
function backupData() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state)], { type: 'application/json' }));
  a.download = `nomoor-backup-${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  state.settings.lastBackup = Date.now();
  save();
}

function importData(inp) {
  const f = inp.files[0];
  inp.value = '';
  if (!f) return;
  f.text().then(t => {
    try {
      const d = JSON.parse(t), A = Array.isArray, N = x => typeof x === 'number';
      const ok = A(d.lists) && d.lists.every(l => N(l.id) && A(l.employees) &&
          l.employees.every(e => N(e.id) && A(e.timeLogs) && A(e.notes)))
        && (!d.activities || (A(d.activities) && d.activities.every(a => N(a.id))))
        && (!d.entries || (A(d.entries) && d.entries.every(e => N(e.a) && N(e.v) && N(e.t))))
        && (!d.ledgers || (A(d.ledgers) && d.ledgers.every(b => N(b.id) && A(b.people) &&
          b.people.every(p => N(p.id) && A(p.tx) && p.tx.every(x => N(x.id) && N(x.amt) && N(x.t))))));
      if (!ok) throw 0;
      if (!confirm('سيتم استبدال البيانات الحالية. متابعة؟')) return;
      state = d;
      normalize();
      save();
    } catch (err) {
      alert('ملف غير صالح');
    }
  });
}

function resetData() {
  if (confirm('هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('nomoorTab');
    location.reload();
  }
}
