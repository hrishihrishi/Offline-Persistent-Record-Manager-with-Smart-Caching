// place to store all data
const LS_KEY = "Hrishikesh"
let students = [];  //2d array
let pendingDeleteIndex = null;
const PAGE_SIZE = 100
const currentPage = 1

// localStorage.removeItem(LS_KEY);

// short hand function
function $(id) { return document.getElementById(id); }

// save data to localStorage
function save() { localStorage.setItem(LS_KEY, JSON.stringify(students)) }

// load data to screen
function load() {
    const v = localStorage.getItem(LS_KEY)
    students = v ? JSON.parse(v) : [];
}

// TOAST message displayer
function toast(msg, timeout = 2900) {
    const t = $('toast')
    t.textContent = msg;
    t.style.opacity = '1'
    // Used some browser api functinos smart ain't I? :)
    setTimeout(() => t.style.opacity = '0', timeout)
}

// validators
function onlyLetters(str) { return /^[A-Za-z ]+$/.test(str.trim()); }
function onlyNumbers(str) { return /^\d+$/.test(str.trim()); }
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function generateId() { return 'S' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10) }


/* Initializes all event Listners*/
document.addEventListener('DOMContentLoaded', init);
function init() {
    load();
    const form = $('studentForm')
    const editForm = $('editForm')
    form.addEventListener('submit', onAdd);
      $('exportCsvBtn').addEventListener('click', exportCsv);
    $('resetBtn').addEventListener('click', () => form.reset());
    $('search').addEventListener('input', () => { currentPage = 1; renderTable(); })
    $('themeToggle').addEventListener('click', toggleTheme)
    $('closeDrawer').addEventListener('click', ()=>toggleDrawer(false));
    editForm.addEventListener('submit', onSaveEdit);
    $('confirmDelete').addEventListener('click', confirmDeleteAction);
    $('cancelDelete').addEventListener('click', ()=>toggleModal(false))
    renderTable();
}

// validates,parses and adds record
function onAdd(e) {
    e.preventDefault();
    const name = $('name').value.trim();
    console.log(name)
    let studentId = $('studentId').value.trim();
    const email = $('email').value.trim();
    const contact = $('contact').value.trim();
    const autoId = $('autoId').checked;

    // validations
    if (!name || !studentId && !autoId || !email || !contact) { toast('Please fill required fields or enable auto-generate ID'); return; }
    if (!onlyLetters(name)) { toast('Name should contain letters only'); return; }
    if (!autoId && !onlyNumbers(studentId)) { toast('Student ID must be numeric if provided'); return; }
    //if (!validEmail(email)) { toast('Invalid email'); return; }
    if (!onlyNumbers(contact) || contact.length < 10) { toast('Contact must be numeric and at least 10 digits'); return; }
    if (autoId || studentId === '') studentId = generateId();
    if (students.some(s => s.studentId === studentId)) { toast('Student ID already exists'); return; }

    // add record
    const record = { name, studentId, email, contact, created: Date.now() };
    students.push(record);
    save();

    $('studentForm').reset()
    $('autoId').checked = true;
    toast('record added')
    renderTable();
}

function getFiltered() {
    let arr = students.slice();
    return arr
}

// rendering table
function renderTable() {
    const tbody = $('tbody')
    tbody.innerHTML = ''
    const arr = getFiltered();   // place some array here
    console.log(arr)
    const total = arr.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    if (currentPage > pages) currentPage = pages;  //currentPage=1 mostly..
    const start = (currentPage - 1) * PAGE_SIZE
    const pageItems = arr.slice(start, start + PAGE_SIZE)

    pageItems.forEach((s, idx) => {
        const tr = document.createElement('tr')
        const initials = s.name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
        const avatarHtml = `<div class="avatar" title="${s.name}" style="width:36px;height:36px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:#eef2ff">${initials}</div>`;

        tr.innerHTML = `
            <td>${avatarHtml}</td>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.studentId)}</td>       
            <td>${escapeHtml(s.email)}</td>        
            <td>${escapeHtml(s.contact)}</td>        
            <td class='actions'>
                <button class='edit' data-idx="${start+idx}"> Edit </button>
                <button class="delete" data-idx="${start+idx}">Delete</button>
            <td/>
            `;
        tbody.appendChild(tr);
        tbody.querySelectorAll('button.edit').forEach(btn=>btn.addEventListener('click', e=>{
            console.log('querySelectorAll function is called')
            const idx = +e.currentTarget.dataset.idx;
            openEdit(idx);
        }))
            tbody.querySelectorAll('button.delete').forEach(btn => btn.addEventListener('click', (e)=>{
            const idx = +e.currentTarget.dataset.idx;
            requestDelete(idx);
        }));
    });
    
}





function escapeHtml(text) { return ('' + text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

// prepopulating the side drawer
function openEdit(index) {
    console.log('openEdit function is called')
    const s =students[index];
    if (!s) return;
    $('edit_index').value = index;
    $('edit_name').value = s.name;
    $('edit_studentId').value = s.studentId;
    $('edit_email').value = s.email;
    $('edit_contact').value = s.contact;
    toggleDrawer(true)
}

// bringing side drawer to the screen by creating ".open" class
function toggleDrawer(open) {
    console.log('toggleDrawer function is called')
    const d = $('editDrawer');
    d.classList.toggle('open', !!open);
    d.setAttribute('aria-hidden', open ? 'false' : 'true');
}


// called when we click save button in edit sidebar
function onSaveEdit(e){
    e.preventDefault();
    const idx = +$('edit_index').value.trim();
    const name = $('edit_name').value.trim();
    const studentId = $('edit_studentId').value.trim();
    const email = $('edit_email').value.trim();
    const contact = $('edit_contact').value.trim();

    if(!name || !studentId || !email || !contact){ toast('Please fill all fields'); return; }
    if(!onlyLetters(name)){ toast('Name should only contain letters'); return; }
    //if(!onlyNumbers(studentId)){ toast('Student ID must be numeric'); return; }
    if(!validEmail(email)){ toast('Invalid email'); return; }
    if(!onlyNumbers(contact) || contact.length < 10){ toast('Contact must be numeric and at least 10 digits'); return; }
    if(students.some((s, i) => s.studentId===studentId && i !== idx)){ toast('another student has same studentId'); return; }
    // "..." operator only edits the needed keys while keeping the rest..
    students[idx] = { ...students[idx], name, studentId, email, contact };
    save();
    toggleDrawer(false);
    toast('Record updated');
    renderTable();
}



// called when user asks for deletion
function requestDelete(idx){
    console.log('requestDelete called')
    pendingDeleteIndex = idx;
    toggleModal(true);
}

//  modal will open
function toggleModal(show){
    const m = $('confirmModal');
    if(show){
        m.style.visibility = 'visible';
        m.style.opacity = '1';
    } else {
        m.style.visibility = 'hidden';
        m.style.opacity = '0';
    }
    // m.setAttribute('aria-hidden', show ? 'false' : 'true');
}

//called when user confirms deletion
function confirmDeleteAction(){
    if(pendingDeleteIndex === null) return;
    students.splice(pendingDeleteIndex, 1);
    pendingDeleteIndex = null;
    save();
    toggleModal(false);
    toast('Record deleted');
    renderTable();
    adjustScrollbar();
}
    
    
// adjust scrollbar

// toggleTheme for Dark mode
function toggleTheme(){
    document.body.classList.toggle('dark');
    const btn = $('themeToggle')
    btn.textContent = document.body.classList.contains('dark') ? '🌞' : '🌙';
}

function exportCsv(){
    const headers = ['Student_Id, Student_Name, Student_email, Student_Ph']
    const rows = students.map(s => [s.name, s.studentId, s.email, s.contact]);
    const csv = [headers, ...rows].map(r => r.map(cell => `"${(''+cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    // Blob is browser api for storage for some short time
    const blob = new Blob([csv], {type:'text/csv; charset=utf-8;'})
    //URL is also browser API
    const url = URL.createObjectURL(blob)

    // creates a element, auto-clicks, deletes itself
    const a = document.createElement('a')
    a.href = url;
    a.download = 'students.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('CSV Exported')
}


// function getFiltered(){
//   const q = $('search').value.trim().toLowerCase();
//   let arr = students.slice();
//   if(q){
//     arr = arr.filter(s => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
//   }
//   // Sorting
//   if(sortState.key){
//     arr.sort((a,b)=>{
//       const A = (a[sortState.key]||'').toString().toLowerCase();
//       const B = (b[sortState.key]||'').toString().toLowerCase();
//       if(A < B) return -1 * sortState.dir;
//       if(A > B) return 1 * sortState.dir;
//       return 0;
//     });
//   }
//   return arr;
// }