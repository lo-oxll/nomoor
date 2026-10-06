(() => {
  const app = document.getElementById('tab-ledger');
  const K = {
    debt: { n: 'دفتر ديون (محل / صيدلية / مكتب)', p: 'زبون', i: '📒', c: '#ef4444', tx: 'دين' },
    gen: { n: 'مولدة أهلية', p: 'مشترك', i: '⚡', c: '#f59e0b', tx: 'قيد', price: 'سعر الأمبير' },
    jam: { n: 'جمعية', p: 'مشارك', i: '🤝', c: '#8b5cf6', tx: 'قسط', price: 'القسط الشهري' }
  };
  const kd = b => K[b.kind] || K.debt;
  const bal = p => p.tx.reduce((s, x) => s + x.amt, 0);
  const owed = b => b.people.reduce((s, p) => s + Math.max(0, bal(p)), 0);
  const find = (bid, pid) => {
    const b = state.ledgers.find(x => x.id === bid);
    return [b, b && b.people.find(x => x.id === pid)];
  };

  function personRow(b, p, idx) {
    const k = kd(b), v = bal(p);
    const extra = b.kind === 'gen' ? `<button data-a="amps" data-b="${b.id}" data-p="${p.id}" class="text-xs text-amber-600">⚡${p.amps || 0} أمبير</button>`
      : b.kind === 'jam' ? `<button data-a="got" data-b="${b.id}" data-p="${p.id}" class="text-xs ${p.got ? 'text-green-600' : 'text-slate-400'}">${p.got ? '✅ استلم ' + dateStr(p.got) : '⬜ لم يستلم'}</button>` : '';
    return `<tr class="border-b">
      <td class="p-2 font-medium">${b.kind === 'jam' ? idx + 1 + '. ' : ''}${esc(p.name)}<div>${extra}</div></td>
      <td class="p-2 text-center font-bold ${v > 0 ? 'text-red-600' : v < 0 ? 'text-green-600' : 'text-slate-400'}">${money(Math.abs(v))}<div class="text-[10px] font-normal">${v > 0 ? 'عليه' : v < 0 ? 'له' : 'مسدّد'}</div></td>
      <td class="p-2 text-center whitespace-nowrap">
        <button data-a="debt" data-b="${b.id}" data-p="${p.id}" class="bg-red-100 text-red-600 rounded px-2 py-1 text-xs">+ ${k.tx}</button>
        <button data-a="pay" data-b="${b.id}" data-p="${p.id}" class="bg-green-100 text-green-600 rounded px-2 py-1 text-xs">− تسديد</button>
        <button data-a="stmt" data-b="${b.id}" data-p="${p.id}" class="bg-blue-100 text-blue-600 rounded px-2 py-1 text-xs">كشف</button>
        <button data-a="delp" data-b="${b.id}" data-p="${p.id}" class="text-red-400 text-xs">🗑️</button>
      </td></tr>`;
  }

  function bookCard(b) {
    const k = kd(b);
    const people = b.people.map((p, i) => [p, i]);
    if (b.kind !== 'jam') people.sort((x, y) => bal(y[0]) - bal(x[0]));
    return `<div class="bg-white rounded-2xl shadow p-4" style="border-top:4px solid ${esc(b.color || k.c)}">
      <div class="flex justify-between items-center mb-2">
        <b class="text-lg">${k.i} ${esc(b.name)}</b>
        <button data-a="delb" data-b="${b.id}" class="text-red-500">🗑️</button>
      </div>
      <div class="text-sm text-slate-600 mb-2">المتبقي على ${k.p === 'زبون' ? 'الزبائن' : 'الجميع'}: <b class="text-red-600">${money(owed(b))}</b></div>
      ${k.price ? `<div class="text-sm mb-2">${k.price}: <b>${money(b.price || 0)}</b> <button data-a="price" data-b="${b.id}">✏️</button>
        <button data-a="charge" data-b="${b.id}" class="bg-amber-500 text-white rounded-xl px-3 py-1 mr-2 text-sm">قيّد الشهر للجميع</button></div>` : ''}
      <button data-a="addp" data-b="${b.id}" class="w-full py-2 bg-blue-500 text-white rounded-xl mb-2">+ إضافة ${k.p}</button>
      <div class="overflow-x-auto"><table class="w-full text-sm"><tbody>${people.map(([p, i]) => personRow(b, p, i)).join('')}</tbody></table></div>
      ${b.people.length ? '' : '<p class="text-center text-gray-500 py-3">لا يوجد أحد بعد</p>'}
    </div>`;
  }

  function renderLedger() {
    app.innerHTML = `<div class="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h2 class="text-2xl font-bold text-slate-800">الدفتر</h2>
        <button data-a="xl" class="bg-green-600 text-white px-3 py-2 rounded-xl">Excel</button>
      </div>
      <form id="bookForm" class="bg-white p-4 rounded-2xl shadow mb-4 flex flex-wrap gap-2 items-center">
        <input name="name" required placeholder="اسم الدفتر (مثال: ديون المحل)" class="border rounded-xl px-3 py-2 flex-1 min-w-[10rem]">
        <select name="kind" class="border rounded-xl px-3 py-2">${Object.entries(K).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('')}</select>
        <input name="price" type="text" inputmode="decimal" placeholder="السعر / القسط (للمولدة والجمعية)" class="border rounded-xl px-3 py-2 w-56">
        <button class="bg-slate-800 text-white px-4 py-2 rounded-xl">إضافة دفتر</button>
      </form>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">${state.ledgers.map(bookCard).join('')}</div>
      ${state.ledgers.length ? '' : '<p class="text-center text-gray-500 py-8">أنشئ دفتراً للبدء</p>'}`;
  }

  function stmtText(b, p) {
    const k = kd(b), v = bal(p);
    const rows = p.tx.slice(-15).map(x => `${dateStr(x.t)}  ${x.amt > 0 ? k.tx : 'تسديد'} ${money(Math.abs(x.amt))}${x.note ? ' — ' + x.note : ''}`);
    return `📒 كشف حساب\n${b.name}\nالاسم: ${p.name}\n──────\n${rows.join('\n')}\n──────\n${v > 0 ? 'المتبقي عليكم' : v < 0 ? 'زيادة لكم' : 'الرصيد'}: ${money(Math.abs(v))}`;
  }

  function openStmt(b, p) {
    const k = kd(b), v = bal(p);
    openModal(`<h3 class="font-bold text-lg">${esc(p.name)}</h3><p class="text-sm text-slate-500 mb-2">${esc(b.name)}</p>
      <div class="max-h-64 overflow-y-auto border rounded-xl">${p.tx.length ? [...p.tx].reverse().map(x => `<div class="flex justify-between p-2 border-b text-sm"><span>${dateStr(x.t)} ${esc(x.note || '')}</span>
        <b class="${x.amt > 0 ? 'text-red-600' : 'text-green-600'}">${x.amt > 0 ? '+' : '−'}${money(Math.abs(x.amt))}</b></div>`).join('') : '<p class="p-3 text-center text-gray-500">لا توجد حركات</p>'}</div>
      <p class="mt-3 font-bold">${v > 0 ? 'المتبقي عليه' : v < 0 ? 'له' : 'الرصيد'}: ${money(Math.abs(v))}</p>
      <div class="flex gap-2 mt-3">
        <button data-la="share" data-b="${b.id}" data-p="${p.id}" class="flex-1 bg-green-600 text-white rounded-xl py-2">📤 مشاركة الكشف</button>
        <button data-la="undo" data-b="${b.id}" data-p="${p.id}" class="border rounded-xl px-3">↩ تراجع آخر حركة</button>
      </div>`);
  }

  function ask(msg) {
    const v = prompt(msg);
    if (v === null) return null;
    const m = v.trim().match(/^([\d٠-٩۰-۹.,٬٫]+)\s*(.*)$/);
    return m && parseNum(m[1]) > 0 ? { amt: parseNum(m[1]), note: m[2].trim() } : null;
  }
  const addTx = (p, amt, note) => p.tx.push({ id: uid(), t: Date.now(), amt, note: note || '' });

  app.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target), kind = f.get('kind');
    state.ledgers.push({ id: uid(), name: f.get('name').trim(), kind, color: K[kind].c, price: parseNum(f.get('price')) || 0, people: [] });
    save();
  });

  app.addEventListener('click', e => {
    const x = e.target.closest('[data-a]');
    if (!x) return;
    const act = x.dataset.a, [b, p] = find(+x.dataset.b, +x.dataset.p);
    if (act === 'xl') return exportLedger();
    if (!b) return;
    const k = kd(b);
    if (act === 'delb') { if (!confirm('حذف الدفتر وكل ما فيه؟')) return; state.ledgers = state.ledgers.filter(y => y.id !== b.id); }
    else if (act === 'price') { const v = parseNum(prompt(k.price + ':', b.price || '')); if (isNaN(v)) return; b.price = v; }
    else if (act === 'addp') {
      const name = (prompt(`اسم ${k.p}:`) || '').trim();
      if (!name) return;
      const person = { id: uid(), name, phone: '', tx: [] };
      if (b.kind === 'gen') person.amps = parseNum(prompt('عدد الأمبيرات:', '5')) || 0;
      else person.phone = (prompt('رقم الهاتف (اختياري، لمشاركة الكشف):') || '').trim();
      b.people.push(person);
    } else if (act === 'charge') {
      const n = b.people.filter(q => (b.kind === 'gen' ? (q.amps || 0) * b.price : b.price) > 0).length;
      if (!n) return alert(b.price ? 'لا يوجد من يُقيَّد عليه' : 'حدّد السعر أولاً');
      if (!confirm(`قيد الشهر على ${n} (${k.p})؟`)) return;
      const note = 'شهر ' + new Date().toLocaleDateString('ar-IQ-u-nu-latn', { month: 'long' });
      b.people.forEach(q => { const a = b.kind === 'gen' ? (q.amps || 0) * b.price : b.price; if (a > 0) addTx(q, a, note); });
    } else if (!p) return;
    else if (act === 'delp') { if (!confirm('حذف ' + p.name + '؟')) return; b.people = b.people.filter(y => y.id !== p.id); }
    else if (act === 'amps') { const v = parseNum(prompt('عدد الأمبيرات:', p.amps || '')); if (isNaN(v)) return; p.amps = v; }
    else if (act === 'got') p.got = p.got ? 0 : Date.now();
    else if (act === 'debt' || act === 'pay') {
      const r = ask(act === 'debt' ? `مبلغ الـ${k.tx} (يمكن كتابة ملاحظة بعده، مثال: 25000 حليب):` : 'مبلغ التسديد (ويمكن ملاحظة بعده):');
      if (!r) return;
      addTx(p, act === 'debt' ? r.amt : -r.amt, r.note);
    } else if (act === 'stmt') return openStmt(b, p);
    save();
  });

  modal.addEventListener('click', e => {
    const x = e.target.closest('[data-la]');
    if (!x) return;
    const [b, p] = find(+x.dataset.b, +x.dataset.p);
    if (!b || !p) return;
    if (x.dataset.la === 'share') return shareText(stmtText(b, p), p.phone);
    if (x.dataset.la === 'undo') { p.tx.pop(); persist(); render(); openStmt(b, p); }
  });

  function exportLedger() {
    xl(state.ledgers.map(b => {
      const k = kd(b), rows = [['الاسم', 'الهاتف', 'الأمبير', 'الرصيد'], ...b.people.map(p => [p.name, p.phone || '-', p.amps || '-', bal(p)]),
        [], ['التاريخ', 'الاسم', 'النوع', 'المبلغ', 'ملاحظة']];
      b.people.forEach(p => p.tx.forEach(t => rows.push([dateStr(t.t), p.name, t.amt > 0 ? k.tx : 'تسديد', Math.abs(t.amt), t.note])));
      return [b.name, rows];
    }), 'الدفتر.xlsx');
  }

  renderers.push(renderLedger);
  window.LEDGER = { bal, owed, K };
})();
