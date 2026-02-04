const taskInput = document.getElementById('taskInput');
const dateInput = document.getElementById('dateInput'); // חדש
const prioritySelect = document.getElementById('prioritySelect');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');

// כפתורי פילטר
const filterAll = document.getElementById('filterAll');
const filterActive = document.getElementById('filterActive');
const filterCompleted = document.getElementById('filterCompleted');

// כפתורי ייבוא ייצוא
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');

let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];
let currentFilter = 'all'; 
let searchTerm = '';

renderTasks();

function saveToLocalStorage() {
    localStorage.setItem('myTasks', JSON.stringify(tasks));
}

function updateFilterButtons() {
    [filterAll, filterActive, filterCompleted].forEach(btn => btn.classList.remove('active'));
    if (currentFilter === 'all') filterAll.classList.add('active');
    else if (currentFilter === 'active') filterActive.classList.add('active');
    else if (currentFilter === 'completed') filterCompleted.classList.add('active');
}

function renderTasks() {
    taskList.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
        const matchesStatus = 
            (currentFilter === 'all') ||
            (currentFilter === 'active' && !task.isCompleted) ||
            (currentFilter === 'completed' && task.isCompleted);
        const matchesSearch = task.text.includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    filteredTasks.forEach((task) => {
        const originalIndex = tasks.indexOf(task);
        const li = document.createElement('li');
        
        // צבע דחיפות
        const priorityClass = task.priority ? `priority-${task.priority}` : 'priority-low';
        li.classList.add(priorityClass);

        // --- חלק 1: הצ'ק בוקס החדש ---
        const checkbox = document.createElement('div');
        checkbox.className = 'custom-checkbox';
        if (task.isCompleted) {
            checkbox.classList.add('checked');
            li.style.opacity = "0.6";
        }
        
        // רק לחיצה על הצ'ק בוקס משנה סטטוס!
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation(); // חשוב! מונע באגים
            task.isCompleted = !task.isCompleted;
            saveToLocalStorage();
            renderTasks();
        });

        // --- חלק 2: הטקסט והתאריך ---
        const contentDiv = document.createElement('div');
        contentDiv.style.flexGrow = "1";
        contentDiv.style.textAlign = "right";
        contentDiv.style.marginRight = "10px";

        const textSpan = document.createElement('span');
        textSpan.textContent = task.text;
        textSpan.style.display = "block"; // שורה נפרדת
        if (task.isCompleted) textSpan.style.textDecoration = "line-through";

        // הצגת התאריך (אם קיים)
        if (task.dueDate) {
            const dateSpan = document.createElement('span');
            dateSpan.className = 'task-date';
            // הופך תאריך אמריקאי (2025-02-04) לישראלי (04/02/2025)
            const dateObj = new Date(task.dueDate);
            dateSpan.textContent = "📅 " + dateObj.toLocaleDateString('he-IL');
            contentDiv.appendChild(dateSpan);
        }
        contentDiv.appendChild(textSpan);

        // --- חלק 3: כפתורי פעולה (עריכה ומחיקה) ---
        const actionsDiv = document.createElement('div');
        
        // כפתור עריכה ✏️
        const editBtn = document.createElement('button');
        editBtn.textContent = '✏️';
        editBtn.className = 'edit-btn';
        editBtn.title = "ערוך משימה";
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // פותח חלונית פשוטה לעריכה
            const newText = prompt("ערוך את המשימה:", task.text);
            if (newText !== null && newText.trim() !== "") {
                task.text = newText.trim();
                saveToLocalStorage();
                renderTasks();
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '✕';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            tasks.splice(originalIndex, 1);
            saveToLocalStorage();
            renderTasks();
        });

        // הרכבת המשימה
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(checkbox); // צ'ק בוקס מימין
        li.appendChild(contentDiv); // טקסט באמצע
        li.appendChild(actionsDiv); // כפתורים משמאל
        
        taskList.appendChild(li);
    });
    
    updateFilterButtons();
}

// אירועים (ללא שינוי מהותי, רק הוספת התאריך)
filterAll.addEventListener('click', () => { currentFilter = 'all'; renderTasks(); });
filterActive.addEventListener('click', () => { currentFilter = 'active'; renderTasks(); });
filterCompleted.addEventListener('click', () => { currentFilter = 'completed'; renderTasks(); });

searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    renderTasks();
});

addBtn.addEventListener('click', function() {
    const text = taskInput.value;
    const priority = prioritySelect.value;
    const date = dateInput.value; // לוקחים את התאריך

    if (text === '') { alert('אנא כתוב משימה!'); return; }

    const newTask = {
        id: crypto.randomUUID(), // מזהה ייחודי (טוב לעתיד)
        text: text,
        isCompleted: false,
        priority: priority,
        dueDate: date // שומרים את התאריך
    };

    tasks.push(newTask);
    saveToLocalStorage();
    
    taskInput.value = '';
    dateInput.value = ''; // מאפסים גם את התאריך
    renderTasks();
});

// --- כאן מדביקים את קוד ה-Export/Import שהיה לך קודם ---
// (תעתיק אותו מהקובץ הקודם שלך, הוא נשאר אותו דבר)