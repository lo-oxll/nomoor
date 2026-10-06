(() => {
  const app = document.getElementById('tab-act');
  const T = {
    duration: { l: 'مدة', k: 60, u: 'دقيقة', f: s => { const m = Math.round(s / 60); return m >= 60 ? `${Math.floor(m / 60)}س ${m % 60}د` : `${m}د`; } },
    count: { l: 'عدد', k: 1, u: '', f: v => Math.round(v) },
    distance: { l: 'مسافة', k: 1, u: 'كم', f: v => `${+v.toFixed(2)} كم` },
    money: { l: 'مبلغ', k: 1, u: '', f: v => money(v) },
    score: { l: 'درجة (متوسط)', k: 1, u: '', f: v => +v.toFixed(1) }
  };
  const tp = a => T[a.type] || T.count;
  const PH = { duration: 'دقائق', count: 'عدد', distance: 'كم', money: 'المبلغ', score: 'درجة' };
  const WD = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
  const EMOJI = ['📚','🏃','💼','🏋️','🧘','📖','💧','🛠️','🚗','🎨','🎵','💻','🍎','😴','🕌','🧹','💰','⛽','🩺','🚶'];
  const TPL = [
    ['مذاكرة','📚','#3b82f6','duration',120,'day'],
    ['ركض','🏃','#10b981','distance',20,'week'],
    ['تمرين','🏋️','#ef4444','count',4,'week'],
    ['قراءة','📖','#8b5cf6','duration',30,'day'],
    ['شرب الماء','💧','#06b6d4','count',8,'day'],
    ['العمل','💼','#f59e0b','duration',480,'day'],
    ['الإيراد','💰','#16a34a','money',0,'day'],
    ['جودة النوم','😴','#6366f1','score',8,'day']
  ];

  const dayStart = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return +d; };
  const weekStart = t => { const d = new Date(dayStart(t)); d.setDate(d.getDate() - (d.getDay() + 1) % 7); return +d; };
  const start = p => p === 'week' ? weekStart(Date.now()) : dayStart(Date.now());
  const total = (a, p) => {
    const es = state.entries.filter(e => e.a === a.id && e.t >= start(p));
    const s = es.reduce((x, e) => x + e.v, 0);
    return a.type === 'score' ? (es.length ? s / es.length : 0) : s;
  };
  const group = (a, keyFn) => {
    const m = {};
    state.entries.forEach(e => {
      if (e.a !== a.id) return;
      const k = keyFn(e.t), r = m[k] || (m[k] = { s: 0, c: 0 });
      r.s += e.v;
      r.c++;
    });
    return m;
  };
  const val = (a, r) => !r ? 0 : a.type === 'score' ? r.s / r.c : r.s;

  function streak(a) {
    const g = a.goal;
    if (!g || !(g.v > 0)) return 0;
    const week = g.p === 'week', m = group(a, week ? t => dayKey(weekStart(t)) : dayKey);
    let n = 0, d = new Date(week ? weekStart(Date.now()) : dayStart(Date.now()));
    for (let i = 0; i < 400; i++) {
      const r = m[dayKey(+d)];
      if (val(a, r) >= g.v) n++;
      else if (i > 0 && !(!week && isWeekend(d) && !r)) break;
      d.setDate(d.getDate() - (week ? 7 : 1));
    }
    return n;
  }

  function last7(a) {
    const m = group(a, dayKey), out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(dayStart(Date.now()));
      d.setDate(d.getDate() - i);
      out.push({ v: val(a, m[dayKey(+d)]), dow: d.getDay(), now: i === 0 });
    }
    return out;
  }

  function countdown(a) {
    if (!a.due) return null;
    const n = Math.round((new Date(a.due + 'T00:00:00') - dayStart(Date.now())) / 864e5);
    if (isNaN(n)) return null;
    return { n, text: n > 0 ? `باقي ${n} يوم` : n === 0 ? 'اليوم!' : 'انتهى الموعد' };
  }

  function controls(a) {
    const timer = a.type !== 'duration' ? '' : a.run
      ? `<button data-a="stop" data-id="${a.id}" class="bg-red-500 text-white rounded-xl px-3">⏹ <span data-timer="${a.run}">${formatDuration(Date.now() - a.run)}</span></button>`
      : `<button data-a="start" data-id="${a.id}" class="bg-green-500 text-white rounded-xl px-3">▶ ابدأ</button>`;
    const inc = a.type === 'count' ? `<button data-a="inc" data-id="${a.id}" class="bg-green-500 text-white rounded-xl px-3">+1</button>` : '';
    return `${timer}${inc}<input type="text" inputmode="decimal" placeholder="${PH[a.type] || ''}" data-in="${a.id}" class="w-20 border rounded-xl px-2">
      <button data-a="add" data-id="${a.id}" class="bg-slate-800 text-white rounded-xl px-3">＋</button>
      <button data-a="undo" data-id="${a.id}" class="border rounded-xl px-2" title="تراجع">↩</button>`;
  }

  function card(a) {
    const m = tp(a), g = a.goal || { v: 0, p: 'day' }, cur = total(a, g.p), pct = g.v ? Math.min(100, cur / g.v * 100) : 0;
    const st = streak(a), cd = countdown(a), days = last7(a);
    const mx = Math.max(...days.map(x => x.v), g.p === 'day' ? g.v : 0, 1);
    return `<div class="bg-white rounded-2xl shadow p-4" style="border-top:4px solid ${esc(a.color)}">
      <div class="flex justify-between items-center">
        <b class="text-lg">${esc(a.icon)} ${esc(a.name)} ${st > 1 ? `<span class="text-sm text-orange-500">🔥${st}</span>` : ''}</b>
        <span><button data-a="edit" data-id="${a.id}">✏️</button> <button data-a="del" data-id="${a.id}">🗑️</button></span>
      </div>
      ${cd ? `<div class="text-sm mt-1 ${cd.n <= 3 ? 'text-red-600 font-bold' : 'text-slate-600'}">⏳ ${cd.text}</div>` : ''}
      <div class="text-sm text-slate-600 mt-2">اليوم: ${m.f(total(a, 'day'))} · الأسبوع: ${m.f(total(a, 'week'))}</div>
      ${g.v ? `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${esc(a.color)}"></div></div>
      <div class="text-xs text-slate-500">${g.p === 'day' ? 'هدف يومي' : 'هدف أسبوعي'}: ${m.f(cur)} / ${m.f(g.v)} ${pct >= 100 ? '✅' : ''}</div>` : ''}
      <div class="flex items-end gap-1 mt-3">${days.map(x => `<div class="flex-1 flex flex-col items-center" title="${esc(m.f(x.v))}">
        <div class="flex items-end" style="height:40px;width:100%"><div class="w-full rounded-t" style="height:${x.v ? Math.max(4, Math.round(x.v / mx * 40)) : 2}px;background:${esc(a.color)};opacity:${x.now ? 1 : .55}"></div></div>
        <span class="text-[10px] text-slate-400">${WD[x.dow]}</span></div>`).join('')}</div>
      <div class="flex flex-wrap gap-2 mt-3">${controls(a)}</div></div>`;
  }

  function openForm(a = {}) {
    const t = a.type || 'duration', k = T[t].k, g = a.goal || {};
    document.getElementById('actForm').innerHTML = `<form class="bg-white p-4 rounded-2xl shadow mb-4 space-y-3">
      <div class="flex flex-wrap gap-2">${TPL.map((x, i) => `<button type="button" data-a="tpl" data-i="${i}" class="border rounded-xl px-2 py-1 text-sm">${x[1]} ${x[0]}</button>`).join('')}</div>
      <input type="hidden" name="id" value="${a.id || ''}">
      <div class="flex gap-2">
        <input name="name" required placeholder="اسم النشاط" value="${esc(a.name || '')}" class="flex-1 border rounded-xl px-3 py-2">
        <input type="color" name="color" value="${esc(a.color || '#3b82f6')}" class="w-10 h-10">
      </div>
      <div class="flex flex-wrap gap-1">${EMOJI.map(e => `<label class="cursor-pointer"><input type="radio" name="icon" value="${e}" class="peer hidden" ${(a.icon || EMOJI[0]) === e ? 'checked' : ''}><span class="text-2xl p-1 rounded-lg block peer-checked:bg-blue-100">${e}</span></label>`).join('')}</div>
      <div class="grid grid-cols-3 gap-2">
        <select name="type" ${a.id ? 'disabled' : ''} class="border rounded-xl px-2 py-2">${Object.entries(T).map(([n, v]) => `<option value="${n}" ${n === t ? 'selected' : ''}>${v.l}</option>`).join('')}</select>
        <input name="goal" type="text" inputmode="decimal" placeholder="الهدف" value="${g.v ? g.v / k : ''}" class="border rounded-xl px-2 py-2">
        <select name="period" class="border rounded-xl px-2 py-2"><option value="day">يومي</option><option value="week" ${g.p === 'week' ? 'selected' : ''}>أسبوعي</option></select>
      </div>
      <p class="text-xs text-slate-500">الهدف: مدة=دقائق · مسافة=كم · مبلغ=بالعملة · درجة=المتوسط</p>
      <label class="block text-sm text-slate-600">موعد نهائي / امتحان (اختياري)
        <input type="date" name="due" value="${esc(a.due || '')}" class="border rounded-xl px-2 py-1 mr-2"></label>
      <div class="flex gap-2"><button class="flex-1 bg-blue-600 text-white rounded-xl py-2">حفظ</button><button type="button" data-a="cancel" class="px-4 border rounded-xl">إلغاء</button></div>
    </form>`;
    localize(document.getElementById('actForm'));
  }

  function weekText() {
    const lines = state.activities.map(a => {
      const m = tp(a), g = a.goal || {}, st = streak(a), cd = countdown(a);
      return `${a.icon} ${a.name}: ${m.f(total(a, 'week'))}` + (g.v ? ` (الهدف ${g.p === 'day' ? 'اليومي' : 'الأسبوعي'} ${m.f(g.v)})` : '') + (st > 1 ? ` 🔥${st}` : '') + (cd ? ` ⏳ ${cd.text}` : '');
    });
    return `📊 ملخص الأسبوع — ${longDate()}\n` + lines.join('\n');
  }

  function exportActivities() {
    const by = Object.fromEntries(state.activities.map(a => [a.id, a]));
    xl([
      ['الأنشطة', [['النشاط', 'النوع', 'الهدف', 'الفترة', 'اليوم', 'الأسبوع', 'السلسلة', 'الموعد'],
        ...state.activities.map(a => { const m = tp(a), g = a.goal || {}; return [a.name, m.l, g.v ? g.v / m.k : '-', g.p === 'week' ? 'أسبوعي' : 'يومي', +(total(a, 'day') / m.k).toFixed(2), +(total(a, 'week') / m.k).toFixed(2), streak(a), a.due || '-']; })]],
      ['السجل', [['النشاط', 'التاريخ والوقت', 'القيمة', 'الوحدة'],
        ...state.entries.filter(e => by[e.a]).map(e => { const a = by[e.a], m = tp(a); return [a.name, new Date(e.t).toLocaleString('ar-IQ-u-nu-latn'), +(e.v / m.k).toFixed(2), m.u]; })]]
    ], 'الأنشطة.xlsx');
  }

  function renderActivities() {
    const A = state.activities;
    app.innerHTML = `<div class="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h2 class="text-2xl font-bold text-slate-800">أنشطتي</h2>
        <div class="flex gap-2">
          <button data-a="week" class="border bg-white px-3 py-2 rounded-xl">📤 ملخص الأسبوع</button>
          <button data-a="xl" class="bg-green-600 text-white px-3 py-2 rounded-xl">Excel</button>
          <button data-a="new" class="bg-slate-800 text-white px-4 py-2 rounded-xl">+ نشاط جديد</button>
        </div>
      </div><div id="actForm"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${A.map(card).join('')}</div>`;
    if (!A.length) openForm();
  }

  app.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target), a = state.activities.find(x => x.id === +f.get('id'));
    const type = a ? a.type : f.get('type');
    const o = { name: f.get('name').trim(), icon: f.get('icon'), color: f.get('color'), type, due: f.get('due') || '',
      goal: { v: (parseNum(f.get('goal')) || 0) * T[type].k, p: f.get('period') } };
    a ? Object.assign(a, o) : state.activities.push({ id: uid(), ...o });
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
    if (act === 'week') return shareText(weekText());
    if (act === 'xl') return exportActivities();
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
      if (!push(parseNum(app.querySelector(`[data-in="${id}"]`).value) * tp(a).k)) return;
    } else if (act === 'undo') {
      const i = state.entries.map(x => x.a).lastIndexOf(id);
      if (i > -1) state.entries.splice(i, 1);
    }
    save();
  });

  setInterval(() => app.querySelectorAll('[data-timer]').forEach(el => {
    el.textContent = D(formatDuration(Date.now() - el.dataset.timer));
  }), 1000);

  renderers.push(renderActivities);
  window.ACT = { T, tp, total, streak, countdown };
})();
