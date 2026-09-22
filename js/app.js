let currentFilter = "all";
let type = "income";

const list = document.getElementById("transactionList");
const incomeEl = document.getElementById("incomeTotal");
const expenseEl = document.getElementById("expenseTotal");
const balanceEl = document.getElementById("balanceTotal");
const balanceCard = document.querySelector(".balance");
const fab = document.getElementById("fab");
const modal = document.getElementById("transactionModal");
const incomeBtn = document.getElementById("incomeBtn");
const expenseBtn = document.getElementById("expenseBtn");
const categorySelect = document.getElementById("category");
const categoryIcon = document.getElementById("categoryIcon");
const customCategoryInput = document.getElementById("customCategory");
const accountSelect = document.getElementById("accountSelect");
const saveBtn = document.getElementById("saveTransaction");
const todayDate = document.getElementById("todayDate");
const accountName = document.getElementById("accountName");
const menuBtn = document.getElementById("menuBtn");
const menuPopup = document.getElementById("menuPopup");
const prevDayBtn = document.getElementById("prevDayBtn");
const nextDayBtn = document.getElementById("nextDayBtn");

// Populate custom categories into select
if (categorySelect && typeof loadCustomCategories === "function") {
    loadCustomCategories(categorySelect);
}

// Populate accounts into account select
function populateAccountSelect() {
    if (!accountSelect || typeof DataManager === "undefined") return;
    const accounts = DataManager.getAccounts();
    accountSelect.innerHTML = "";
    accounts.forEach(acc => {
        const opt = document.createElement("option");
        opt.value = acc.name;
        opt.textContent = `${acc.icon || "💳"} ${acc.name}`;
        accountSelect.appendChild(opt);
    });
}
populateAccountSelect();

if (categorySelect) {
    categorySelect.onchange = () => {
        const value = categorySelect.value;
        const savedCustom = typeof getCustomCategories === "function"
            ? getCustomCategories().find(category => category.name.toLowerCase() === value.toLowerCase())
            : null;

        if (categoryIcon) {
            categoryIcon.textContent = savedCustom
                ? savedCustom.icon
                : (typeof getCategoryIcon === "function" ? getCategoryIcon(value) : "💸");
        }

        if (value === "other") {
            if (!customCategoryInput) return;
            customCategoryInput.classList.add("show");
            customCategoryInput.focus();
        } else {
            if (!customCategoryInput) return;
            customCategoryInput.classList.remove("show");
            customCategoryInput.value = "";
        }
    };
}

if (incomeBtn) {
    incomeBtn.onclick = () => {
        type = "income";
        incomeBtn.classList.add("active");
        if (expenseBtn) expenseBtn.classList.remove("active");
    };
}

if (expenseBtn) {
    expenseBtn.onclick = () => {
        type = "expense";
        expenseBtn.classList.add("active");
        if (incomeBtn) incomeBtn.classList.remove("active");
    };
}

// Date Handling
function updateDateDisplay() {
    const selectedDate = localStorage.getItem("selectedDate");
    const currentDate = selectedDate ? new Date(selectedDate) : new Date();
    const today = new Date();
    const isToday = currentDate.toDateString() === today.toDateString();
    const formattedDate = currentDate.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    if (todayDate) {
        todayDate.innerHTML = `
        <span style="font-size:12px; opacity:0.8; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
            📅 ${isToday ? "Today" : "Selected Date"}
        </span>
        <span style="font-size:16px; font-weight:700; font-family:'Outfit', sans-serif;">
            ${formattedDate}
        </span>
        `;

        todayDate.onclick = () => {
            window.location.href = "calendar.html";
        };
    }
}

updateDateDisplay();

if (prevDayBtn) {
    prevDayBtn.onclick = () => {
        const curStr = localStorage.getItem("selectedDate");
        const curD = curStr ? new Date(curStr) : new Date();
        curD.setDate(curD.getDate() - 1);
        localStorage.setItem("selectedDate", curD.toISOString().slice(0, 10));
        updateDateDisplay();
        render();
    };
}

if (nextDayBtn) {
    nextDayBtn.onclick = () => {
        const curStr = localStorage.getItem("selectedDate");
        const curD = curStr ? new Date(curStr) : new Date();
        curD.setDate(curD.getDate() + 1);
        localStorage.setItem("selectedDate", curD.toISOString().slice(0, 10));
        updateDateDisplay();
        render();
    };
}

// User & Account Title
const savedName = localStorage.getItem("username") || "User";
const incomeType = localStorage.getItem("incomeType") || "Daily";
if (accountName) {
    accountName.textContent =
        `${savedName}'s ${incomeType.charAt(0).toUpperCase() + incomeType.slice(1)} Tracker`;
}

// Modal open & close
if (fab) {
    fab.onclick = () => {
        if (modal) {
            modal.classList.remove("hidden");
            modal.classList.remove("modal-hidden");
            const amtInput = document.getElementById("amount");
            if (amtInput) amtInput.focus();
        }
    };
}

if (modal) {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            modal.classList.add("modal-hidden");
        }
    });
}

function render() {
    if (typeof renderTransactions === "function") {
        renderTransactions({
            list,
            incomeEl,
            expenseEl,
            balanceEl,
            balanceCard,
            currentFilter,
            onDelete: render
        });
    }
}

// Save transaction
if (saveBtn) {
    saveBtn.onclick = () => {
        const amountInput = document.getElementById("amount");
        const noteInput = document.getElementById("note");
        const amount = Number(amountInput.value);
        const note = (noteInput.value || "").trim();

        if (!amount || isNaN(amount) || amount <= 0) {
            if (typeof showToast === "function") {
                showToast("Please enter a valid amount greater than 0", "warning");
            }
            amountInput.focus();
            return;
        }

        let category = categorySelect ? categorySelect.value : "other";

        if (category === "other" && customCategoryInput && customCategoryInput.value.trim()) {
            category = formatCategoryName(customCategoryInput.value);

            const alreadyExists = [...categorySelect.options].find(option =>
                option.value.toLowerCase() === category.toLowerCase()
            );
            const customIcon = getSmartCategoryIcon(category);

            if (typeof saveCustomCategory === "function") {
                saveCustomCategory(category, customIcon);
            }

            if (!alreadyExists && typeof addCategoryOption === "function") {
                addCategoryOption(categorySelect, category);
            }
        } else if (!category) {
            category = type === "income" ? "Salary" : "Other";
        }

        const selectedAccount = accountSelect ? accountSelect.value : "Cash";

        // Current selected date with current time
        const curDateKey = typeof getSelectedDateKey === "function" ? getSelectedDateKey() : new Date().toISOString().slice(0, 10);
        const timePart = new Date().toTimeString().split(" ")[0]; // HH:MM:SS
        const isoDate = `${curDateKey}T${timePart}.000Z`;

        const newTx = addTransaction({
            type,
            amount,
            note,
            category,
            account: selectedAccount,
            date: isoDate
        });

        // Clear modal form
        amountInput.value = "";
        noteInput.value = "";
        if (categorySelect) categorySelect.value = "";
        if (customCategoryInput) {
            customCategoryInput.value = "";
            customCategoryInput.classList.remove("show");
        }
        if (modal) modal.classList.add("modal-hidden");

        if (typeof showToast === "function") {
            const sym = typeof DataManager !== "undefined" ? DataManager.getCurrencySymbol() : "₹";
            showToast(`Added ${type}: ${sym}${amount.toLocaleString()}`, "success");
        }

        render();
    };
}

render();

// Quick amounts buttons
document.querySelectorAll(".quick-amounts button").forEach(button => {
    button.onclick = () => {
        const amtInput = document.getElementById("amount");
        if (amtInput) amtInput.value = button.dataset.amount;
    };
});

// Filters
document.querySelectorAll(".filters button").forEach(button => {
    button.onclick = () => {
        document.querySelectorAll(".filters button")
            .forEach(filterButton => filterButton.classList.remove("active"));

        button.classList.add("active");
        currentFilter = button.dataset.filter;
        render();
    };
});

// Menu button fallback (in case nav.js didn't already bind)
if (menuBtn && menuPopup) {
    menuBtn.onclick = (e) => {
        e.stopPropagation();
        menuPopup.classList.toggle("show");
    };

    document.addEventListener("click", event => {
        if (!menuPopup.contains(event.target) && event.target !== menuBtn) {
            menuPopup.classList.remove("show");
        }
    });
}