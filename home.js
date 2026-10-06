const PROFILES = [
  { id: 'prep6', e: '🎓', n: 'طالب سادس إعدادي', acts: [
    ['رياضيات', '📐', '#3b82f6', 'duration', 90, 'day'], ['فيزياء', '⚛️', '#8b5cf6', 'duration', 60, 'day'],
    ['كيمياء', '🧪', '#10b981', 'duration', 60, 'day'], ['أحياء', '🧬', '#16a34a', 'duration', 60, 'day'],
    ['عربي', '📖', '#f59e0b', 'duration', 45, 'day'], ['إنجليزي', '🔤', '#ef4444', 'duration', 45, 'day']] },
  { id: 'prep3', e: '📘', n: 'طالب ثالث متوسط', acts: [
    ['رياضيات', '📐', '#3b82f6', 'duration', 60, 'day'], ['علوم', '🔬', '#10b981', 'duration', 60, 'day'],
    ['عربي', '📖', '#f59e0b', 'duration', 45, 'day'], ['إنجليزي', '🔤', '#ef4444', 'duration', 45, 'day'],
    ['إسلامية', '🕌', '#16a34a', 'duration', 30, 'day'], ['اجتماعيات', '🌍', '#06b6d4', 'duration', 30, 'day']] },
  { id: 'uni', e: '🏛️', n: 'طالب جامعي', acts: [
    ['محاضرات', '🎓', '#6366f1', 'duration', 240, 'day'], ['مذاكرة', '📚', '#3b82f6', 'duration', 120, 'day'],
    ['واجبات وتقارير', '📝', '#f59e0b', 'count', 3, 'week']] },
  { id: 'teacher', e: '🧑‍🏫', n: 'معلم / مدرّس خصوصي', lists: [['طلابي', '#10b981', 'teacher']],
    acts: [['تحضير الدروس', '📝', '#8b5cf6', 'duration', 60, 'day']] },
  { id: 'employee', e: '💼', n: 'موظف / مقاول', lists: [['الفريق', '#3b82f6', 'emp']],
    acts: [['ساعات العمل', '💼', '#f59e0b', 'duration', 420, 'day']] },
  { id: 'shop', e: '🏪', n: 'صاحب محل / صيدلية / مكتب', ledgers: [['ديون الزبائن', 'debt', 0]],
    acts: [['إيراد اليوم', '💰', '#16a34a', 'money', 0, 'day']] },
  { id: 'gen', e: '⚡', n: 'صاحب مولدة أهلية', ledgers: [['مشتركو المولدة', 'gen', 0]],
    acts: [['وقود وصيانة', '⛽', '#ef4444', 'money', 0, 'week']] },
  { id: 'driver', e: '🚕', n: 'سائق (تكسي / ستوتة / نقل)', acts: [
    ['رحلات اليوم', '🚕', '#f59e0b', 'count', 15, 'day'], ['إيراد اليوم', '💰', '#16a34a', 'money', 0, 'day'],
    ['بنزين', '⛽', '#ef4444', 'money', 0, 'day'], ['المسافة', '🛣️', '#3b82f6', 'distance', 0, 'day']] },
  { id: 'tech', e: '🛠️', n: 'فني / عامل (كهرباء، سباكة، صيانة)', lists: [['زبائني', '#f59e0b', 'tech']],
    acts: [['إيراد', '💰', '#16a34a', 'money', 0, 'day']] },
  { id: 'jam', e: '🤝', n: 'جمعية (موظفين / أهل)', ledgers: [['الجمعية', 'jam', 0]] },
  { id: 'sales', e: '🚶', n: 'مندوب مبيعات', lists: [['زبائني', '#8b5cf6', 'sales']],
    acts: [['زيارات اليوم', '🚶', '#8b5cf6', 'count', 10, 'day']] },
  { id: 'doctor', e: '🩺', n: 'طبيب / عيادة', lists: [['المرضى', '#06b6d4', 'clinic']],
    acts: [['مراجعون اليوم', '🩺', '#06b6d4', 'count', 0, 'day']] },
  { id: 'athlete', e: '🏃', n: 'رياضي / عدّاء', acts: [
    ['ركض', '🏃', '#10b981', 'distance', 20, 'week'], ['تمرين', '🏋️', '#ef4444', 'count', 4, 'week'],
    ['شرب الماء', '💧', '#06b6d4', 'count', 8, 'day']] },
  { id: 'quran', e: '🕌', n: 'صلاة وقرآن', acts: [
    ['ورد القرآن (صفحات)', '📖', '#16a34a', 'count', 20, 'day'], ['الصلوات', '🕌', '#3b82f6', 'count', 5, 'day'],
    ['الأذكار', '📿', '#8b5cf6', 'count', 2, 'day']] },
  { id: 'arbaeen', e: '🚶‍♂️', n: 'مشي الأربعين', acts: [
    ['مشي الأربعين', '🚶', '#16a34a', 'distance', 80, 'week'], ['شرب الماء', '💧', '#06b6d4', 'count', 8, 'day']] },
  { id: 'general', e: '✨', n: 'استخدام عام', acts: [
    ['شرب الماء', '💧', '#06b6d4', 'count', 8, 'day'], ['قراءة', '📖', '#8b5cf6', 'duration', 30, 'day'],
    ['رياضة', '🏋️', '#ef4444', 'duration', 30, 'day']] }
];

function applyProfiles(ids) {
  const s = state.settings;
  ids.map(id => PROFILES.find(p => p.id === id)).filter(Boolean).forEach(p => {
    (p.acts || []).forEach(([name, icon, color, type, goal, per]) => {
      if (!state.activities.some(a => a.name === name))
        state.activities.push({ id: uid(), name, icon, color, type, due: '', goal: { v: goal * ACT.T[type].k, p: per } });
      s.modules.act = true;
    });
    (p.lists || []).forEach(([name, color, kind]) => {
      if (!state.lists.some(l => l.name === name)) state.lists.push({ id: uid(), name, color, kind, employees: [] });
      s.modules.work = true;
    });
    (p.ledgers || []).forEach(([name, kind, price]) => {
      if (!state.ledgers.some(b => b.name === name))
        state.ledgers.push({ id: uid(), name, kind, color: LEDGER.K[kind].c, price, people: [] });
      s.modules.ledger = true;
    });
  });
  s.setupDone = true;
  save();
  setTab('home');
}

function openWelcome(first) {
  openModal(`<h2 class="text-xl font-bold mb-1">${first ? 'أهلاً بك في نمور 👋' : 'إضافة قوالب جاهزة'}</h2>
    <p class="text-sm text-slate-500 mb-3">اختر ما يناسبك (يمكن أكثر من واحد) وسنجهّز لك الأقسام والأهداف. كل شيء قابل للتعديل لاحقاً. 🔒 بياناتك تبقى على جهازك فقط ولا تُرسل لأي خادم.</p>
    <div class="grid grid-cols-2 gap-2">${PROFILES.map(p => `<button data-prof="${p.id}" class="border rounded-xl p-3 text-right text-sm">${p.e} ${p.n}</button>`).join('')}</div>
    <button data-prof-go class="mt-4 w-full bg-blue-600 text-white rounded-xl py-2">ابدأ</button>
    ${first ? '<button data-prof-skip class="mt-2 w-full border rounded-xl py-2 text-slate-500">تخطي (استخدام عام)</button>' : ''}`, first);
}

modal.addEventListener('click', e => {
  const b = e.target.closest('[data-prof]');
  if (b) { b.classList.toggle('bg-blue-100'); b.classList.toggle('border-blue-500'); return; }
  if (e.target.closest('[data-prof-go]')) {
    const ids = [...modal.querySelectorAll('[data-prof].bg-blue-100')].map(x => x.dataset.prof);
    closeModal();
    applyProfiles(ids.length ? ids : ['general']);
  } else if (e.target.closest('[data-prof-skip]')) {
    closeModal();
    applyProfiles(['general']);
  }
});

/* ---------- الرئيسية ---------- */
function renderHome() {
  const el = document.getElementById('tab-home'), s = state.settings, m = s.modules, td = today();
  const card = (title, go, body) => `<div class="bg-white rounded-2xl shadow p-4"><div class="flex justify-between items-center mb-2"><b>${title}</b>${go ? `<button data-go="${go}" class="text-blue-600 text-sm">فتح ←</button>` : ''}</div>${body}</div>`;
  const parts = [];

  const days = Math.floor((Date.now() - (s.lastBackup || s.since)) / 864e5);
  if (state.lists.length + state.activities.length + state.ledgers.length > 0 && days >= 7)
    parts.push(`<div class="bg-amber-50 border border-amber-300 rounded-2xl p-3 flex justify-between items-center gap-2"><span class="text-sm">💾 ${s.lastBackup ? `مضى ${days} يوم على آخر نسخة احتياطية` : 'لم تحفظ نسخة احتياطية بعد'}</span><button data-bk class="bg-amber-500 text-white rounded-xl px-3 py-1 text-sm">احفظ الآن</button></div>`);

  if (m.act && state.activities.length) {
    const goals = state.activities.filter(a => a.goal && a.goal.v > 0);
    const done = goals.filter(a => ACT.total(a, a.goal.p) >= a.goal.v).length;
    const rows = goals.slice(0, 8).map(a => {
      const t = ACT.tp(a), g = a.goal, cur = ACT.total(a, g.p), st = ACT.streak(a);
      return `<div class="mb-2"><div class="flex justify-between text-sm"><span>${esc(a.icon)} ${esc(a.name)} ${st > 1 ? '🔥' + st : ''}</span><span class="text-slate-500">${t.f(cur)} / ${t.f(g.v)}</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, cur / g.v * 100)}%;background:${esc(a.color)}"></div></div></div>`;
    }).join('');
    const dues = state.activities.map(a => [a, ACT.countdown(a)]).filter(x => x[1] && x[1].n >= 0).sort((x, y) => x[1].n - y[1].n).slice(0, 3)
      .map(([a, c]) => `<div class="text-sm ${c.n <= 3 ? 'text-red-600 font-bold' : 'text-slate-600'}">⏳ ${esc(a.name)} — ${c.text}</div>`).join('');
    parts.push(card('🎯 أهداف الفترة' + (goals.length ? ` (${done}/${goals.length} ✅)` : ''), 'act', (rows || '<p class="text-sm text-slate-500">لا توجد أهداف محددة بعد</p>') + dues));
  }

  if (m.work && state.lists.length) {
    let running = 0; const late = [], now = [];
    state.lists.forEach(l => l.employees.forEach(e => {
      if (e.timeLogs.some(x => x.endTime === null)) running++;
      if (e.next && e.status !== 'done') (e.next < td ? late : e.next === td ? now : []).push(`${esc(e.name)} <span class="text-slate-400">(${esc(l.name)})</span>`);
    }));
    const list = (arr, cls) => arr.slice(0, 5).map(x => `<div class="text-sm ${cls}">${x}</div>`).join('');
    parts.push(card('📋 القوائم والمتابعات', 'work',
      `<div class="text-sm mb-1">زيارات/جلسات جارية: <b>${running}</b></div>` +
      (late.length ? `<div class="text-sm font-bold text-red-600 mt-1">متأخر (${late.length})</div>${list(late, 'text-red-600')}` : '') +
      (now.length ? `<div class="text-sm font-bold text-amber-600 mt-1">اليوم (${now.length})</div>${list(now, 'text-amber-600')}` : '') +
      (!late.length && !now.length ? '<p class="text-sm text-slate-500">لا متابعات مستحقة 👌</p>' : '')));
  }

  if (m.ledger && state.ledgers.length) {
    const tot = state.ledgers.reduce((x, b) => x + LEDGER.owed(b), 0);
    const top = state.ledgers.flatMap(b => b.people.map(p => [p.name, LEDGER.bal(p)])).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
    parts.push(card('📒 الدفتر', 'ledger', `<div class="text-sm">إجمالي المتبقي: <b class="text-red-600">${money(tot)}</b></div>` +
      top.map(([n, v]) => `<div class="text-sm text-slate-600">${esc(n)} — ${money(v)}</div>`).join('')));
  }

  if (!parts.length || !(m.act || m.work || m.ledger))
    parts.push(card('ابدأ من هنا', '', '<p class="text-sm text-slate-600 mb-2">لم تُفعَّل أي أقسام بعد.</p><button data-prof-open class="bg-blue-600 text-white rounded-xl px-4 py-2">اختر نوع استخدامك</button>'));

  el.innerHTML = `<div class="mb-4"><h1 class="text-2xl font-bold text-slate-800">أهلاً بك 👋</h1><p class="text-slate-500 text-sm">${esc(longDate())}</p></div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${parts.join('')}</div>`;
}

document.getElementById('tab-home').addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g) setTab(g.dataset.go);
  else if (e.target.closest('[data-bk]')) backupData();
  else if (e.target.closest('[data-prof-open]')) openWelcome(false);
});

/* ---------- الإعدادات ---------- */
function renderSettings() {
  const el = document.getElementById('tab-set'), s = state.settings;
  const sel = (key, opts) => `<select data-set="${key}" class="border rounded-xl px-3 py-2">${opts.map(([v, t]) => `<option value="${v}" ${String(s[key]) === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  const row = (label, ctl) => `<label class="flex justify-between items-center gap-3 py-2 border-b"><span>${label}</span>${ctl}</label>`;
  const last = s.lastBackup ? `آخر نسخة: ${dateStr(s.lastBackup)}` : 'لم تُحفظ نسخة بعد';
  el.innerHTML = `<h2 class="text-2xl font-bold text-slate-800 mb-4">الإعدادات</h2>
    <div class="bg-white rounded-2xl shadow p-4">
      <button data-prof-open class="w-full bg-blue-600 text-white rounded-xl py-2 mb-3">➕ إضافة قوالب جاهزة (طالب، سائق، مولدة...)</button>
      <div class="font-bold mt-2">الأقسام المفعّلة</div>
      ${[['act', 'الأنشطة والأهداف'], ['work', 'القوائم والزيارات'], ['ledger', 'الدفتر (ديون، مولدة، جمعية)']].map(([k, t]) =>
        row(t, `<input type="checkbox" data-mod="${k}" ${s.modules[k] ? 'checked' : ''} class="w-5 h-5">`)).join('')}
      <div class="font-bold mt-4">التخصيص</div>
      ${row('العملة', sel('currency', [['IQD', 'دينار عراقي (د.ع)'], ['USD', 'دولار ($)']]))}
      ${row('الأرقام', sel('digits', [['latn', '123 إنجليزية'], ['arab', '١٢٣ هندية']]))}
      ${row('العطلة الأسبوعية', sel('weekend', [['fri', 'الجمعة'], ['fri-sat', 'الجمعة والسبت']]))}
      ${row('إظهار التاريخ الهجري', `<input type="checkbox" data-set="hijri" ${s.hijri ? 'checked' : ''} class="w-5 h-5">`)}
      <div class="font-bold mt-4">النسخ الاحتياطي <span class="text-xs font-normal text-slate-500">(${last})</span></div>
      <div class="flex flex-wrap gap-2 mt-2">
        <button data-bk class="bg-slate-600 text-white rounded-xl px-4 py-2">نسخ احتياطي</button>
        <button data-restore class="bg-slate-600 text-white rounded-xl px-4 py-2">استعادة</button>
        <input type="file" id="importFile" accept=".json" class="hidden" onchange="importData(this)">
      </div>
      <p class="text-xs text-slate-500 mt-4">🔒 الخصوصية: كل بياناتك محفوظة على هذا الجهاز فقط ولا تُرسل لأي خادم. احفظ نسخة احتياطية دورياً لأن مسح بيانات المتصفح يحذفها.</p>
      <button data-reset class="mt-4 bg-red-500 text-white rounded-xl px-4 py-2">مسح كل البيانات</button>
    </div>`;
}

document.getElementById('tab-set').addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.mod) state.settings.modules[t.dataset.mod] = t.checked;
  else if (t.dataset.set) state.settings[t.dataset.set] = t.type === 'checkbox' ? t.checked : t.value;
  else return;
  save();
});
document.getElementById('tab-set').addEventListener('click', e => {
  if (e.target.closest('[data-bk]')) backupData();
  else if (e.target.closest('[data-restore]')) document.getElementById('importFile').click();
  else if (e.target.closest('[data-reset]')) resetData();
  else if (e.target.closest('[data-prof-open]')) openWelcome(false);
});

renderers.push(renderHome, renderSettings);
setTab(tab);
if (!state.settings.setupDone) openWelcome(true);
