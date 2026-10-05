(() => {
  state.activities ||= [];
  state.entries ||= [];
  const T = {
    duration: { l: 'مدة', k: 60, f: s => { const m = Math.round(s / 60); return m >= 60 ? `${Math.floor(m / 60)}س ${m % 60}د` : `${m}د`; } },
    count: { l: 'عدد', k: 1, f: v => Math.round(v) },
    distance: { l: 'مسافة', k: 1, f: v => `${+v.toFixed(2)} كم` },
    score: { l: 'درجة (متوسط)', k: 1, f: v => +v.toFixed(1) }
  };
  const PH = { duration: 'دقائق', count: 'عدد', distance: 'كم', score: 'درجة' };
  const EMOJI = ['📚','🏃','💼','🏋️','🧘','📖','💧','🛠️','🚗','🎨','🎵','💻','🍎','😴','🕌','🧹'];
  const TPL = [
    ['مذاكرة','📚','#3b82f6','duration',120,'day'],
    ['ركض','🏃','#10b981','distance',20,'week'],
    ['تمرين','🏋️','#ef4444','count',4,'week'],
    ['قراءة','📖','#8b5cf6','duration',30,'day'],
    ['شرب الماء','💧','#06b6d4','count',8,'day'],
    ['العمل','💼','#f59e0b','duration',480,'day'],
    ['جودة النوم','😴','#6366f1','score',8,'day']
  ];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const start = p => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (p === 'week') d.setDate(d.getDate() - (d.getDay() + 1) % 7);
    return +d;
  };
  const total = (a, p) => {
    const es = state.entries.filter(e => e.a === a.id && e.t >= start(p));
    const s = es.reduce((x, e) => x + e.v, 0);
    return a.type === 'score' ? (es.length ? s / es.length : 0) : s;
  };

  const work = document.querySelector('.max-w-7xl');
  const nav = document.createElement('nav');
  const app = document.createElement('div');
  nav.className = 'max-w-7xl mx-auto px-6 pt-4 flex gap-2';
  app.className = 'max-w-7xl mx-auto p-6';
  nav.innerHTML = [['act', 'الأنشطة'], ['work', 'القوائم']]
    .map(([k, l]) => `<button data-tab="${k}" class="px-4 py-2 rounded-xl border">${l}</button>`).join('');
  work.before(nav);
  work.after(app);

  function setTab(t) {
    localStorage.setItem('nomoorTab', t);
    work.hidden = t !== 'work';
    app.hidden = t !== 'act';
    nav.querySelectorAll('button').forEach(b => {
      const on = b.dataset.tab === t;
      b.classList.toggle('bg-slate-800', on);
      b.classList.toggle('text-white', on);
    });
  }
  nav.onclick = e => e.target.dataset.tab && setTab(e.target.dataset.tab);

  function controls(a) {
    const timer = a.type !== 'duration' ? '' : a.run
      ? `<button data-a="stop" data-id="${a.id}" class="bg-red-500 text-white rounded-xl px-3">⏹ <span data-timer="${a.run}">${formatDuration(Date.now() - a.run)}</span></button>`
      : `<button data-a="start" data-id="${a.id}" class="bg-green-500 text-white rounded-xl px-3">▶ ابدأ</button>`;
    const inc = a.type === 'count' ? `<button data-a="inc" data-id="${a.id}" class="bg-green-500 text-white rounded-xl px-3">+1</button>` : '';
    return `${timer}${inc}<input type="number" min="0" step="any" placeholder="${PH[a.type]}" data-in="${a.id}" class="w-20 border rounded-xl px-2">
      <button data-a="add" data-id="${a.id}" class="bg-slate-800 text-white rounded-xl px-3">＋</button>
      <button data-a="undo" data-id="${a.id}" class="border rounded-xl px-2" title="تراجع">↩</button>`;
  }

  function card(a) {
    const m = T[a.type], g = a.goal || { v: 0, p: 'day' }, cur = total(a, g.p);
    const pct = g.v ? Math.min(100, cur / g.v * 100) : 0;
    return `<div class="bg-white rounded-2xl shadow p-4" style="border-top:4px solid ${esc(a.color)}">
      <div class="flex justify-between items-center">
        <b class="text-lg">${esc(a.icon)} ${esc(a.name)}</b>
        <span><button data-a="edit" data-id="${a.id}">✏️</button> <button data-a="del" data-id="${a.id}">🗑️</button></span>
      </div>
      <div class="text-sm text-slate-600 mt-2">اليوم: ${m.f(total(a, 'day'))} · الأسبوع: ${m.f(total(a, 'week'))}</div>
      ${g.v ? `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${esc(a.color)}"></div></div>
      <div class="text-xs text-slate-500">${g.p === 'day' ? 'هدف يومي' : 'هدف أسبوعي'}: ${m.f(cur)} / ${m.f(g.v)} ${pct >= 100 ? '✅' : ''}</div>` : ''}
      <div class="flex flex-wrap gap-2 mt-3">${controls(a)}</div></div>`;
  }

  function openForm(a = {}) {
    const t = a.type || 'duration', k = T[t].k, g = a.goal || {};
    document.getElementById('actForm').innerHTML = `<form class="bg-white p-4 rounded-2xl shadow mb-4 space-y-3">
      <div class="flex flex-wrap gap-2">${TPL.map((x, i) => `<button type="button" data-a="tpl" data-i="${i}" class="border rounded-xl px-2 py-1 text-sm">${x[1]} ${x[0]}</button>`).join('')}</div>
      <input type="hidden" name="id" value="${a.id || ''}">
      <div class="flex gap-2">
        <input name="name" required placeholder="اسم النشاط" value="${esc(a.name || '')}" class="flex-1 border rounded-xl px-3 py-2">
        <input type="color" name="color" value="${a.color || '#3b82f6'}" class="w-10 h-10">
      </div>
      <div class="flex flex-wrap gap-1">${EMOJI.map(e => `<label class="cursor-pointer"><input type="radio" name="icon" value="${e}" class="peer hidden" ${(a.icon || EMOJI[0]) === e ? 'checked' : ''}><span class="text-2xl p-1 rounded-lg block peer-checked:bg-blue-100">${e}</span></label>`).join('')}</div>
      <div class="grid grid-cols-3 gap-2">
        <select name="type" ${a.id ? 'disabled' : ''} class="border rounded-xl px-2 py-2">${Object.entries(T).map(([n, v]) => `<option value="${n}" ${n === t ? 'selected' : ''}>${v.l}</option>`).join('')}</select>
        <input name="goal" type="number" min="0" step="any" placeholder="الهدف" value="${g.v ? g.v / k : ''}" class="border rounded-xl px-2 py-2">
        <select name="period" class="border rounded-xl px-2 py-2"><option value="day">يومي</option><option value="week" ${g.p === 'week' ? 'selected' : ''}>أسبوعي</option></select>
      </div>
      <p class="text-xs text-slate-500">الهدف: مدة=دقائق · مسافة=كم · درجة=المتوسط</p>
      <div class="flex gap-2"><button class="flex-1 bg-blue-600 text-white rounded-xl py-2">حفظ</button><button type="button" data-a="cancel" class="px-4 border rounded-xl">إلغاء</button></div>
    </form>`;
  }

  function renderActivities() {
    const A = state.activities;
    app.innerHTML = `<div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-slate-800">أنشطتي</h2>
        <button data-a="new" class="bg-slate-800 text-white px-4 py-2 rounded-xl">+ نشاط جديد</button>
      </div><div id="actForm"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${A.map(card).join('')}</div>`;
    if (!A.length) openForm();
  }

  app.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target), a = state.activities.find(x => x.id === +f.get('id'));
    const type = a ? a.type : f.get('type');
    const o = { name: f.get('name').trim(), icon: f.get('icon'), color: f.get('color'), type, goal: { v: (+f.get('goal') || 0) * T[type].k, p: f.get('period') } };
    a ? Object.assign(a, o) : state.activities.push({ id: Date.now(), ...o });
    save();
  });

  app.addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const act = b.dataset.a, id = +b.dataset.id, a = state.activities.find(x => x.id === id);
    const push = v => {
      if (!(v > 0)) return false;
      state.entries.push({ a: id, v, t: Date.now() });
      return true;
    };
    if (act === 'new') return openForm();
    if (act === 'cancel') return (document.getElementById('actForm').innerHTML = '');
    if (act === 'tpl') {
      const [name, icon, color, type, v, p] = TPL[+b.dataset.i];
      return openForm({ name, icon, color, type, goal: { v: v * T[type].k, p } });
    }
    if (!a) return;
    if (act === 'edit') return openForm(a);
    if (act === 'del') {
      if (!confirm('حذف النشاط وكل سجلاته؟')) return;
      state.activities = state.activities.filter(x => x.id !== id);
      state.entries = state.entries.filter(x => x.a !== id);
    } else if (act === 'start') a.run = Date.now();
    else if (act === 'stop') { push((Date.now() - a.run) / 1000); a.run = null; }
    else if (act === 'inc') push(1);
    else if (act === 'add') {
      if (!push(parseFloat(app.querySelector(`[data-in="${id}"]`).value) * T[a.type].k)) return;
    } else if (act === 'undo') {
      const i = state.entries.map(x => x.a).lastIndexOf(id);
      if (i > -1) state.entries.splice(i, 1);
    }
    save();
  });

  setInterval(() => app.querySelectorAll('[data-timer]').forEach(el => {
    el.textContent = formatDuration(Date.now() - el.dataset.timer);
  }), 1000);

  const baseRender = render;
  render = () => { baseRender(); renderActivities(); };
  renderActivities();
  setTab(localStorage.getItem('nomoorTab') || (state.lists.length ? 'work' : 'act'));
})();
