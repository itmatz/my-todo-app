const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');

// כפתורי הסינון
const filterAll = document.getElementById('filterAll');
const filterActive = document.getElementById('filterActive');
const filterCompleted = document.getElementById('filterCompleted');

let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];

// משתנים למעקב אחרי הסינון הנוכחי
let currentFilter = 'all'; // האפשרויות: 'all', 'active', 'completed'
let searchTerm = '';

renderTasks();

function saveToLocalStorage() {
    localStorage.setItem('myTasks', JSON.stringify(tasks));
}

// פונקציית עזר לעדכון הכפתורים הפעילים
function updateFilterButtons() {
    // מסירים את הקלאס active מכולם
    [filterAll, filterActive, filterCompleted].forEach(btn => btn.classList.remove('active'));
    
    // מוסיפים לכפתור הנכון
    if (currentFilter === 'all') filterAll.classList.add('active');
    else if (currentFilter === 'active') filterActive.classList.add('active');
    else if (currentFilter === 'completed') filterCompleted.classList.add('active');
}

function renderTasks() {
    taskList.innerHTML = '';

    // --- שלב הסינון ---
    // אנחנו יוצרים רשימה זמנית רק לצורך התצוגה
    const filteredTasks = tasks.filter(task => {
        // 1. בדיקת סטטוס (האם המשימה מתאימה לפילטר?)
        const matchesStatus = 
            (currentFilter === 'all') ||
            (currentFilter === 'active' && !task.isCompleted) ||
            (currentFilter === 'completed' && task.isCompleted);
        
        // 2. בדיקת חיפוש (האם הטקסט קיים?)
        const matchesSearch = task.text.includes(searchTerm);

        // מחזירים אמת רק אם שני התנאים מתקיימים
        return matchesStatus && matchesSearch;
    });

    // --- שלב הציור (על הרשימה המסוננת) ---
    filteredTasks.forEach((task) => {
        // כאן אנחנו צריכים למצוא את האינדקס המקורי של המשימה במערך הראשי
        // כדי שהמחיקה תעבוד נכון על המשימה הנכונה
        const originalIndex = tasks.indexOf(task);

        const li = document.createElement('li');
        
        // טיפול במשימות ישנות ללא דחיפות (שיהיה להן ירוק כדיפולט)
        const priorityClass = task.priority ? `priority-${task.priority}` : 'priority-low';
        li.classList.add(priorityClass);

        const taskSpan = document.createElement('span');
        taskSpan.textContent = task.text;
        
        if (task.isCompleted) {
            taskSpan.style.textDecoration = "line-through";
            taskSpan.style.color = "#aaa";
            li.style.opacity = "0.6";
        }

        taskSpan.addEventListener('click', () => {
            task.isCompleted = !task.isCompleted;
            saveToLocalStorage();
            renderTasks();
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '✕';
        deleteBtn.className = 'delete-btn';

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            tasks.splice(originalIndex, 1); // מוחקים לפי האינדקס האמיתי
            saveToLocalStorage();
            renderTasks();
        });

        li.appendChild(taskSpan);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });
    
    // מעדכנים את עיצוב הכפתורים
    updateFilterButtons();
}

// --- אירועים חדשים ---

// אירועי לחיצה על כפתורי הסינון
filterAll.addEventListener('click', () => { currentFilter = 'all'; renderTasks(); });
filterActive.addEventListener('click', () => { currentFilter = 'active'; renderTasks(); });
filterCompleted.addEventListener('click', () => { currentFilter = 'completed'; renderTasks(); });

// אירוע הקלדה בחיפוש
searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    renderTasks();
});

// אירוע הוספה (נשאר אותו דבר)
addBtn.addEventListener('click', function() {
    const text = taskInput.value;
    const priority = prioritySelect.value;

    if (text === '') { alert('אנא כתוב משימה!'); return; }

    const newTask = {
        text: text,
        isCompleted: false,
        priority: priority
    };

    tasks.push(newTask);
    saveToLocalStorage();
    
    taskInput.value = '';
    renderTasks();
});

// --- לוגיקת Export / Import ---

const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');

// 1. ייצוא (Export)
exportBtn.addEventListener('click', () => {
    // הופכים את המערך לטקסט יפה (עם רווחים לקריאות)
    const dataStr = JSON.stringify(tasks, null, 2);
    
    // יוצרים "בלוב" (קובץ וירטואלי)
    const blob = new Blob([dataStr], { type: "application/json" });
    
    // יוצרים לינק להורדה
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "my_tasks_backup.json"; // שם הקובץ שירד
    a.click(); // מדמים לחיצה
    
    // ניקוי זיכרון
    URL.revokeObjectURL(url);
});

// 2. כפתור הייבוא - רק פותח את חלון בחירת הקובץ
importBtn.addEventListener('click', () => {
    fileInput.click();
});

// 3. הטיפול בקובץ שנבחר
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    // מה קורה כשהקובץ סיים להיקרא
    reader.onload = (event) => {
        try {
            // מנסים להפוך את הטקסט חזרה למערך
            const importedTasks = JSON.parse(event.target.result);
            
            // בדיקה בסיסית: האם זה בכלל מערך?
            if (!Array.isArray(importedTasks)) {
                throw new Error("מבנה הקובץ אינו תקין");
            }

            // שואלים את המשתמש איך למזג
            const shouldReplace = confirm(
                "קובץ נמצא! \nלחץ 'אישור' כדי להחליף את הרשימה הקיימת כולה.\nלחץ 'ביטול' כדי להוסיף את המשימות החדשות לרשימה הקיימת."
            );

            if (shouldReplace) {
                // החלפה מלאה
                tasks = importedTasks;
            } else {
                // מיזוג (הוספה לסוף)
                tasks = [...tasks, ...importedTasks];
            }

            saveToLocalStorage();
            renderTasks();
            alert("המשימות נטענו בהצלחה! 🎉");

        } catch (error) {
            alert("שגיאה בטעינת הקובץ: " + error.message);
        }
        
        // מאפסים את האינפוט כדי שאפשר יהיה לטעון את אותו קובץ שוב אם צריך
        fileInput.value = ''; 
    };

    // פקודה לקרוא את הקובץ כטקסט
    reader.readAsText(file);
});