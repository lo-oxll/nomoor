let draggedEmployee = null;
let sourceListId = null;
let draggedRowIndex = null;
const KINDS = {
  emp: { n: 'موظفون', i: 'موظف', v: 'زيارة' },
  teacher: { n: 'معلم', i: 'طالب', v: 'حصة' },
  sales: { n: 'مبيعات', i: 'عميل', v: 'زيارة' },
  clinic: { n: 'عيادة', i: 'مريض', v: 'جلسة' },
  free: { n: 'مستقل', i: 'مشروع', v: 'جلسة عمل' },
  tech: { n: 'فني/عامل', i: 'زبون', v: 'عمل' },
  custom: { n: 'مخصص' }
};
const ST = { run: 'مفتوح', hold: 'مؤجل', done: 'مغلق' };
const STC = { run: 'bg-blue-100 text-blue-700', hold: 'bg-yellow-100 text-yellow-700', done: 'bg-gray-200 text-gray-600' };
const labels = l => l.kind === 'custom' ? { i: l.i || 'عنصر', v: l.v || 'زيارة' } : (KINDS[l.kind] || KINDS.emp);
const amountVal = e => e.rate > 0 ? calculateTotalTime(e.timeLogs) / 3600000 * e.rate : 0;
const amount = e => { const v = amountVal(e); return v ? money(v) : ''; };

function addList() {
  const name = document.getElementById('listName').value.trim();
  const color = document.getElementById('listColor').value;
  if (!name) return alert('أدخل اسم القائمة');
  const kind = document.getElementById('listKind').value;
  const list = { id: Date.now(), name, color, kind, employees: [] };
  if (kind === 'custom') {
    list.i = prompt('اسم العنصر (مثال: عميل):') || 'عنصر';
    list.v = prompt('اسم الزيارة (مثال: جلسة):') || 'زيارة';
  }
  state.lists.push(list);
  save();
  document.getElementById('listName').value = '';
}

function addEmployee(listId) {
  const list = state.lists.find(l => l.id === listId);
  const name = prompt(`اسم ${labels(list).i}:`);
  if (!name) return;
  const now = new Date();
  const time = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  list.employees.push({ 
    id: Date.now(), 
    name, 
    visits: 0, 
    lastVisit: null, 
    lastTime: null, 
    notes: [],
    timeLogs: [],
    order: list.employees.length // لترتيب يدوي
  });
  save();
}

function deleteEmployee(listId, empId) {
  if (!confirm('هل أنت متأكد من الحذف؟')) return;
  
  const list = state.lists.find(l => l.id === listId);
  list.employees = list.employees.filter(e => e.id !== empId);
  save();
}

function openNotes(listId, empId) {
  const list = state.lists.find(l => l.id === listId);
  const emp = list.employees.find(e => e.id === empId);
  document.getElementById('notesTitle').textContent = `ملاحظات: ${emp.name}`;
  const chatBox = document.getElementById('chatBox');
  chatBox.innerHTML = '';
  
  if (emp.notes.length === 0) {
    chatBox.innerHTML = '<p class="text-center text-gray-500 py-4">لا توجد ملاحظات حتى الآن</p>';
  } else {
    emp.notes.forEach(text => {
      const div = document.createElement('div');
      div.className = 'note';
      div.textContent = text;
      chatBox.appendChild(div);
    });
  }
  
  document.getElementById('notesPanel').style.display = 'flex';
  document.getElementById('overlay').style.display = 'block';
  document.getElementById('noteInput').value = '';
  document.getElementById('noteInput').dataset.listId = listId;
  document.getElementById('noteInput').dataset.empId = empId;
  document.getElementById('noteInput').focus();
}

function openTimeLog(listId, empId) {
  const list = state.lists.find(l => l.id === listId);
  const emp = list.employees.find(e => e.id === empId);
  document.getElementById('timeLogTitle').textContent = `سجل الوقت: ${emp.name}`;
  
  const timeLogBox = document.getElementById('timeLogBox');
  timeLogBox.innerHTML = '';
  
  if (emp.timeLogs.length === 0) {
    timeLogBox.innerHTML = '<p class="text-center text-gray-500 py-4">لا توجد تسجيلات وقت حتى الآن</p>';
  } else {
    emp.timeLogs.forEach((log, index) => {
      const div = document.createElement('div');
      div.className = 'time-log-entry';
      
      const duration = log.endTime ? 
        formatDuration(log.endTime - log.startTime) : 
        'جاري...';
        
      div.innerHTML = `
        <div class="flex justify-between items-center">
          <span class="font-semibold">${esc(labels(list).v)} ${index + 1}</span>
          <span class="text-sm ${log.endTime ? 'text-green-600' : 'text-blue-600'}">${duration}</span>
        </div>
        <div class="text-xs text-gray-500 mt-1">
          البدء: ${new Date(log.startTime).toLocaleString('ar-EG')}
          ${log.endTime ? `<br>الانتهاء: ${new Date(log.endTime).toLocaleString('ar-EG')}` : ''}
        </div>
      `;
      timeLogBox.appendChild(div);
    });
  }
  
  const totalTime = calculateTotalTime(emp.timeLogs);
  const averageTime = emp.timeLogs.length > 0 ? 
    formatDuration(totalTime / emp.timeLogs.filter(log => log.endTime).length) : 
    '00:00:00';
  
  document.getElementById('totalTime').textContent = `إجمالي الوقت: ${formatDuration(totalTime)}${amount(emp) ? ` | المستحق: ${amount(emp)}` : ''}`;
  document.getElementById('averageTime').textContent = `متوسط الوقت: ${averageTime}`;
  
  document.getElementById('timeLogPanel').style.display = 'flex';
  document.getElementById('overlay').style.display = 'block';
}

function calculateTotalTime(timeLogs) {
  return timeLogs.reduce((total, log) => {
    if (log.endTime) {
      return total + (log.endTime - log.startTime);
    }
    return total;
  }, 0);
}

function formatDuration(ms) {
  if (!ms) return '00:00:00';
  
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
}

function addNote() {
  const input = document.getElementById('noteInput');
  const text = input.value.trim();
  if (!text) return;
  
  const listId = +input.dataset.listId;
  const empId = +input.dataset.empId;
  const list = state.lists.find(l => l.id === listId);
  const emp = list.employees.find(e => e.id === empId);
  emp.notes.push(text);
  save();
  openNotes(listId, empId);
}

function closeNotes() {
  document.getElementById('notesPanel').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
}

function closeTimeLog() {
  document.getElementById('timeLogPanel').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
}

document.getElementById('noteInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    addNote();
  }
});

function updateVisits(listId, empId, delta) {
  const list = state.lists.find(l => l.id === listId);
  const emp = list.employees.find(e => e.id === empId);
  
  if (delta > 0) {
    emp.visits += 1;
    const now = new Date();
    emp.lastTime = now.getTime();
    emp.lastVisit = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    
    emp.timeLogs.push({
      startTime: now.getTime(),
      endTime: null
    });
  } else if (delta < 0 && emp.visits > 0) {
    emp.visits -= 1;
    
    const activeLogIndex = emp.timeLogs.findIndex(log => log.endTime === null);
    if (activeLogIndex !== -1) {
      emp.timeLogs[activeLogIndex].endTime = new Date().getTime();
    }
  }
  
  sortEmployeesByTime(list);
  save();
}

function completeVisit(listId, empId) {
  const list = state.lists.find(l => l.id === listId);
  const emp = list.employees.find(e => e.id === empId);
  
  const activeLogIndex = emp.timeLogs.findIndex(log => log.endTime === null);
  if (activeLogIndex !== -1) {
    emp.timeLogs[activeLogIndex].endTime = new Date().getTime();
    
    // نقل الموظف إلى نهاية القائمة
    const empIndex = list.employees.findIndex(e => e.id === empId);
    if (empIndex !== -1) {
      const [removedEmp] = list.employees.splice(empIndex, 1);
      list.employees.push(removedEmp);
    }
    
    save();
    
    if (document.getElementById('timeLogPanel').style.display === 'flex') {
      openTimeLog(listId, empId);
    }
  }
}

function sortEmployeesByTime(list) {
  // نفرز حسب الوقت (الأحدث أولاً) أو حسب الترتيب اليدوي
  list.employees.sort((a, b) => {
    if (a.lastTime && b.lastTime) {
      return b.lastTime - a.lastTime;
    }
    return (b.lastTime || 0) - (a.lastTime || 0);
  });
}

// وظائف السحب والإفلات
function onDragStart(e, listId, empId, index) {
  draggedEmployee = { listId, empId, index };
  sourceListId = listId;
  e.target.classList.add('dragging');
  e.dataTransfer.setData('text/plain', '');
  e.dataTransfer.effectAllowed = 'move';
}

function onDragOver(e, listId) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const targetElement = e.target.closest('tr') || e.target.closest('tbody');
  if (targetElement) {
    targetElement.classList.add('drag-over');
  }
}

function onDragLeave(e) {
  const targetElement = e.target.closest('tr') || e.target.closest('tbody');
  if (targetElement) {
    targetElement.classList.remove('drag-over');
  }
}

function onDrop(e, listId, targetIndex) {
  e.preventDefault();
  
  const allRows = document.querySelectorAll('.employee-row');
  allRows.forEach(row => row.classList.remove('drag-over'));
  
  if (!draggedEmployee) return;
  
  const sourceList = state.lists.find(l => l.id === draggedEmployee.listId);
  const targetList = state.lists.find(l => l.id === listId);
  
  if (sourceList.id === targetList.id) {
    // إعادة ترتيب داخل نفس القائمة
    const emp = sourceList.employees[draggedEmployee.index];
    sourceList.employees.splice(draggedEmployee.index, 1);
    
    if (targetIndex !== undefined) {
      sourceList.employees.splice(targetIndex, 0, emp);
    } else {
      sourceList.employees.push(emp);
    }
  } else {
    // نقل إلى قائمة أخرى
    const emp = sourceList.employees[draggedEmployee.index];
    sourceList.employees.splice(draggedEmployee.index, 1);
    
    if (targetIndex !== undefined) {
      targetList.employees.splice(targetIndex, 0, emp);
    } else {
      targetList.employees.push(emp);
    }
    
    // تحديث وقت الزيارة تلقائياً
    const now = new Date();
    emp.lastTime = now.getTime();
    emp.lastVisit = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    emp.visits += 1;
    emp.timeLogs.push({
      startTime: now.getTime(),
      endTime: null
    });
  }
  
  draggedEmployee = null;
  save();
}

function onDragEnd(e) {
  const allRows = document.querySelectorAll('.employee-row');
  allRows.forEach(row => {
    row.classList.remove('dragging');
    row.classList.remove('drag-over');
  });
}

function renderLists() {
  const container = document.getElementById('listsContainer');
  container.innerHTML = '';
  
  if (state.lists.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="gradient-bg text-white p-8 rounded-2xl shadow-lg pulse-animation">
          <i class="fas fa-inbox text-5xl mb-4"></i>
          <h2 class="text-2xl font-bold mb-2">لا توجد قوائم</h2>
          <p class="opacity-90">انشئ قائمة جديدة لبدء إدارة الموظفين</p>
        </div>
      </div>
    `;
    return;
  }
  
  state.lists.forEach(list => {
    const section = document.createElement('section');
    section.className = 'list-section bg-white border rounded-2xl shadow p-4 relative';
    section.style.borderColor = list.color;
    section.draggable = false;

    const employeesWithActiveVisits = list.employees.filter(emp => 
      emp.timeLogs.some(log => log.endTime === null)
    ).length;

    const lb = { i: esc(labels(list).i), v: esc(labels(list).v) };
    const q = document.getElementById('q').value.trim().toLowerCase();
    const sf = document.getElementById('stFilter').value;
    const td = today();
    const view = list.employees.map((emp, index) => ({ emp, index }))
      .filter(({ emp }) => emp.name.toLowerCase().includes(q) && (!sf || (emp.status || 'run') === sf));
    const by = {
      recent: (a, b) => (b.emp.lastTime || 0) - (a.emp.lastTime || 0),
      time: (a, b) => calculateTotalTime(b.emp.timeLogs) - calculateTotalTime(a.emp.timeLogs),
      name: (a, b) => a.emp.name.localeCompare(b.emp.name, 'ar')
    }[list.sort];
    if (typeof by === 'function') view.sort(by);
    const manual = typeof by !== 'function' && !q && !sf;
    const overdue = list.employees.filter(e => e.next && e.next < td && e.status !== 'done').length;

    section.innerHTML = `
      <div class="flex justify-between items-center mb-3 list-header">
        <div>
          <input class="list-name font-bold text-lg bg-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none px-2 py-1 rounded" value="${esc(list.name)}" onchange="renameList(${list.id}, this.value)">
          <span class="text-xs text-gray-500 block">${list.employees.length} ${lb.i} | ${employeesWithActiveVisits} ${lb.v} نشطة${overdue ? ` | <span class="text-red-600">${overdue} متأخر</span>` : ''}</span>
        </div>
        <div class="flex items-center gap-2">
          <select onchange="setSort(${list.id}, this.value)" class="text-xs border rounded p-1">
            ${[['', 'يدوي'], ['recent', 'الأحدث'], ['time', 'الأكثر وقتاً'], ['name', 'الاسم']].map(([v, t]) => `<option value="${v}" ${(list.sort || '') === v ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
          <input type="color" value="${esc(list.color)}" onchange="changeColor(${list.id}, this.value)" class="w-8 h-8 border rounded cursor-pointer">
          <button class="text-red-500 hover:text-red-700 transition-colors" onclick="deleteList(${list.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <button onclick="addEmployee(${list.id})" class="mb-3 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow flex items-center justify-center gap-2 transition-all">
        <i class="fas fa-user-plus"></i> إضافة ${lb.i}
      </button>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="text-right p-2">الاسم</th>
              <th class="text-center p-2">عدد: ${lb.v}</th>
              <th class="text-center p-2">آخر ${lb.v}</th>
              <th class="text-center p-2">إجمالي الوقت</th>
              <th class="text-center p-2">المتابعة</th>
              <th class="text-center p-2">إجراءات</th>
            </tr>
          </thead>
          <tbody id="list-${list.id}" 
            ondrop="onDrop(event, ${list.id})" 
            ondragover="onDragOver(event, ${list.id})" 
            ondragleave="onDragLeave(event)">
            ${view.map(({ emp, index }) => {
              const totalTime = calculateTotalTime(emp.timeLogs);
              const activeVisit = emp.timeLogs.some(log => log.endTime === null);
              const st = ST[emp.status] ? emp.status : 'run';
              const late = emp.next && emp.next < td && st !== 'done';
              const amt = amount(emp);

              return `
              <tr class="employee-row border-b ${activeVisit ? 'bg-blue-50' : ''}" 
                  draggable="true" 
                  ondragstart="onDragStart(event, ${list.id}, ${emp.id}, ${index})" 
                  ondragend="onDragEnd(event)"
                  ondrop="onDrop(event, ${list.id}, ${index})"
                  ondragover="onDragOver(event, ${list.id})"
                  ondragleave="onDragLeave(event)">
                <td class="p-2 font-medium">
                  ${manual ? `<span class="inline-flex flex-col leading-none ml-1 text-[10px] text-gray-400"><button onclick="event.stopPropagation(); moveEmp(${list.id}, ${emp.id}, -1)">▲</button><button onclick="event.stopPropagation(); moveEmp(${list.id}, ${emp.id}, 1)">▼</button></span>` : ''}
                  ${esc(emp.name)} ${activeVisit ? '<span class="text-xs text-blue-500">(نشط)</span>' : ''}
                  <button onclick="event.stopPropagation(); cycleStatus(${list.id}, ${emp.id})" class="text-xs rounded px-1 ${STC[st]}">${ST[st]}</button>
                </td>
                <td class="p-2 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button onclick="event.stopPropagation(); updateVisits(${list.id}, ${emp.id}, -1)" class="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors">-</button>
                    <span class="mx-2 w-6 text-center">${emp.visits}</span>
                    <button onclick="event.stopPropagation(); updateVisits(${list.id}, ${emp.id}, 1)" class="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors">+</button>
                  </div>
                </td>
                <td class="p-2 text-center">${emp.lastVisit || '-'}</td>
                <td class="p-2 text-center">${formatDuration(totalTime)}${amt ? `<div class="text-xs text-green-600">${amt}</div>` : ''}</td>
                <td class="p-2 text-center"><input type="date" value="${esc(emp.next || '')}" onclick="event.stopPropagation()" onchange="setNext(${list.id}, ${emp.id}, this.value)" class="text-xs border rounded p-1 ${late ? 'border-red-500 text-red-600' : ''}"></td>
                <td class="p-2 text-center">
                  <button onclick="event.stopPropagation(); openTimeLog(${list.id}, ${emp.id})" class="bg-blue-100 text-blue-600 p-1 rounded mx-1 hover:bg-blue-200 transition-colors" title="سجل الوقت">
                    <i class="fas fa-clock"></i>
                  </button>
                  <button onclick="event.stopPropagation(); completeVisit(${list.id}, ${emp.id})" class="bg-yellow-100 text-yellow-600 p-1 rounded mx-1 hover:bg-yellow-200 transition-colors" title="إنهاء الزيارة">
                    <i class="fas fa-check-circle"></i>
                  </button>
                  <button onclick="event.stopPropagation(); openNotes(${list.id}, ${emp.id})" class="bg-green-100 text-green-600 p-1 rounded mx-1 hover:bg-green-200 transition-colors" title="ملاحظات">
                    <i class="fas fa-comment"></i>
                  </button>
                  <button onclick="event.stopPropagation(); shareEmp(${list.id}, ${emp.id})" class="bg-teal-100 text-teal-600 p-1 rounded mx-1 hover:bg-teal-200 transition-colors" title="مشاركة">
                    <i class="fas fa-share-nodes"></i>
                  </button>
                  <button onclick="event.stopPropagation(); setRate(${list.id}, ${emp.id})" class="bg-purple-100 text-purple-600 p-1 rounded mx-1 hover:bg-purple-200 transition-colors" title="السعر بالساعة">
                    <i class="fas fa-dollar-sign"></i>
                  </button>
                  <button onclick="event.stopPropagation(); deleteEmployee(${list.id}, ${emp.id})" class="bg-red-100 text-red-600 p-1 rounded mx-1 hover:bg-red-200 transition-colors" title="حذف">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ${view.length === 0 ? `
          <p class="text-center text-gray-500 py-4">${list.employees.length ? 'لا توجد نتائج' : 'القائمة فارغة'}</p>
        ` : ''}
      </div>
      <div class="mt-3 text-xs text-gray-500 text-center">
        اسحب العناصر بين القوائم، أو استخدم ▲▼ للترتيب
      </div>
    `;
    container.appendChild(section);
  });
}

const findEmp = (lid, eid) => state.lists.find(l => l.id === lid).employees.find(e => e.id === eid);

function setSort(id, v) {
  state.lists.find(l => l.id === id).sort = v;
  save();
}

function cycleStatus(lid, eid) {
  const e = findEmp(lid, eid), k = Object.keys(ST);
  e.status = k[(k.indexOf(e.status || 'run') + 1) % k.length];
  save();
}

function setNext(lid, eid, v) {
  findEmp(lid, eid).next = v;
  save();
}

function setRate(lid, eid) {
  const e = findEmp(lid, eid);
  const v = parseNum(prompt('السعر بالساعة (0 للحذف):', e.rate || ''));
  if (isNaN(v)) return;
  e.rate = v;
  save();
}

function moveEmp(lid, eid, d) {
  const a = state.lists.find(l => l.id === lid).employees;
  const i = a.findIndex(e => e.id === eid), j = i + d;
  if (j < 0 || j >= a.length) return;
  [a[i], a[j]] = [a[j], a[i]];
  save();
}

function renameList(id, name) {
  const list = state.lists.find(l => l.id === id);
  list.name = name;
  save();
}

function changeColor(id, color) {
  const list = state.lists.find(l => l.id === id);
  list.color = color;
  save();
}

function deleteList(id) {
  if (confirm('هل أنت متأكد من حذف القائمة؟ سيتم حذف جميع الموظفين فيها.')) {
    state.lists = state.lists.filter(l => l.id !== id);
    save();
  }
}

function exportExcel() {
  const sheets = state.lists.map(list => {
    const lb = labels(list);
    const rows = [['القائمة', 'الاسم', `عدد ${lb.v}`, `آخر ${lb.v}`, 'إجمالي الوقت', 'الحالة', 'المتابعة', 'السعر/ساعة', 'المستحق', 'الملاحظات']];
    list.employees.forEach(emp => rows.push([
      list.name, emp.name, emp.visits, emp.lastVisit || '-', formatDuration(calculateTotalTime(emp.timeLogs)),
      ST[emp.status] || ST.run, emp.next || '-', emp.rate || '-', Math.round(amountVal(emp)) || '-', emp.notes.join(' | ')
    ]));
    return [list.name, rows];
  });
  const summary = [['القائمة', 'عدد العناصر', 'إجمالي الزيارات', 'متوسط الزيارات', 'إجمالي الوقت', 'المستحق']];
  state.lists.forEach(list => {
    const totalVisits = list.employees.reduce((sum, e) => sum + e.visits, 0);
    const totalTime = list.employees.reduce((sum, e) => sum + calculateTotalTime(e.timeLogs), 0);
    const avg = list.employees.length ? (totalVisits / list.employees.length).toFixed(1) : 0;
    summary.push([list.name, list.employees.length, totalVisits, avg, formatDuration(totalTime), Math.round(list.employees.reduce((t, e) => t + amountVal(e), 0))]);
  });
  xl([...sheets, ['تلخيص', summary]], 'لوحة_التتبع.xlsx');
}

function shareEmp(lid, eid) {
  const list = state.lists.find(l => l.id === lid), e = findEmp(lid, eid), lb = labels(list);
  const lines = [`📋 ${list.name} — ${e.name}`, `${lb.v}: ${e.visits} | آخر ${lb.v}: ${e.lastVisit || '-'}`, `إجمالي الوقت: ${formatDuration(calculateTotalTime(e.timeLogs))}`];
  if (amount(e)) lines.push(`المستحق: ${amount(e)}`);
  if (e.next) lines.push(`المتابعة القادمة: ${e.next}`);
  if (e.notes.length) lines.push('ملاحظات: ' + e.notes.slice(-3).join(' | '));
  shareText(lines.join('\n'));
}

function refreshLists() {
  renderLists();
  localize();
}

document.getElementById('overlay').addEventListener('click', function() {
  closeNotes();
  closeTimeLog();
});

document.getElementById('listKind').innerHTML = Object.entries(KINDS).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('');
document.getElementById('stFilter').innerHTML = '<option value="">كل الحالات</option>' + Object.entries(ST).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
renderers.push(renderLists);
