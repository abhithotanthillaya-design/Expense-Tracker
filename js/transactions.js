/**
 * Transactions History & Management Controller
 */

let allTransactions = [];
let filteredTransactions = [];
let editingType = "expense";

document.addEventListener("DOMContentLoaded", () => {
    initTransactionsPage();
});

function initTransactionsPage() {
    loadTransactions();
    populateFilters();
    bindFilterEvents();
    bindEditModalEvents();
    renderTransactionsTable();
}

function loadTransactions() {
    allTransactions = typeof getAllTransactions === "function" ? getAllTransactions() : [];
}

function populateFilters() {
    const catFilter = document.getElementById("categoryFilter");
    const accFilter = document.getElementById("accountFilter");

    // Categories
    if (catFilter) {
        catFilter.innerHTML = '<option value="all">All Categories</option>';
        const seenCats = new Set();
        allTransactions.forEach(t => {
            if (t.category) seenCats.add(t.category);
        });
        [...seenCats].sort().forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat.toLowerCase();
            opt.textContent = `${getCategoryIcon(cat)} ${formatCategoryName(cat)}`;
            catFilter.appendChild(opt);
        });
    }

    // Accounts
    if (accFilter && typeof DataManager !== "undefined") {
        accFilter.innerHTML = '<option value="all">All Accounts</option>';
        DataManager.getAccounts().forEach(acc => {
            const opt = document.createElement("option");
            opt.value = acc.name.toLowerCase();
            opt.textContent = `${acc.icon || "💳"} ${acc.name}`;
            accFilter.appendChild(opt);
        });
    }
}

function applyFilters() {
    const query = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
    const type = document.getElementById("typeFilter")?.value || "all";
    const category = document.getElementById("categoryFilter")?.value || "all";
    const account = document.getElementById("accountFilter")?.value || "all";
    const period = document.getElementById("periodFilter")?.value || "all";
    const sort = document.getElementById("sortFilter")?.value || "date-desc";

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekStart = getWeekStart(now);
    const monthStart = getMonthStart(now);
    const yearStart = getYearStart(now);

    filteredTransactions = allTransactions.filter(tx => {
        // Search query
        if (query) {
            const matchNote = (tx.note || "").toLowerCase().includes(query);
            const matchCat = (tx.category || "").toLowerCase().includes(query);
            const matchAcc = (tx.account || "").toLowerCase().includes(query);
            if (!matchNote && !matchCat && !matchAcc) return false;
        }

        // Type
        if (type !== "all" && tx.type !== type) return false;

        // Category
        if (category !== "all" && (tx.category || "").toLowerCase() !== category) return false;

        // Account
        if (account !== "all" && (tx.account || "").toLowerCase() !== account) return false;

        // Period
        if (period !== "all") {
            const txDate = new Date(tx.date || Date.now());
            if (period === "today") {
                if (tx.date && !tx.date.startsWith(todayStr)) return false;
            } else if (period === "week") {
                if (txDate < weekStart) return false;
            } else if (period === "month") {
                if (txDate < monthStart) return false;
            } else if (period === "year") {
                if (txDate < yearStart) return false;
            }
        }

        return true;
    });

    // Sorting
    filteredTransactions.sort((a, b) => {
        const da = new Date(a.date || 0).getTime();
        const db = new Date(b.date || 0).getTime();
        const amta = Number(a.amount) || 0;
        const amtb = Number(b.amount) || 0;

        if (sort === "date-desc") return db - da;
        if (sort === "date-asc") return da - db;
        if (sort === "amount-desc") return amtb - amta;
        if (sort === "amount-asc") return amta - amtb;
        return 0;
    });

    renderTransactionsTable();
}

function renderTransactionsTable() {
    const list = document.getElementById("transactionsFullList");
    const stats = document.getElementById("filteredStats");
    if (!list) return;

    if (filteredTransactions.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <p style="font-size: 32px;">🔍</p>
                <p style="font-size: 16px; font-weight: 600;">No matching transactions found</p>
                <p style="font-size: 13px; color: var(--text-muted);">Try adjusting your search terms or filter selections</p>
            </div>
        `;
        if (stats) stats.textContent = "0 transactions found";
        return;
    }

    let incTotal = 0;
    let expTotal = 0;

    list.innerHTML = filteredTransactions.map(tx => {
        const isInc = tx.type === "income";
        const amt = Number(tx.amount) || 0;
        if (isInc) incTotal += amt;
        else expTotal += amt;

        const icon = getCategoryIcon(tx.category);
        const catName = formatCategoryName(tx.category || "Other");
        const dateStr = formatDate(new Date(tx.date || Date.now()), {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

        return `
            <div class="transaction" data-id="${tx.id}">
                <div class="note">
                    <span style="font-size: 24px; flex-shrink: 0;">${icon}</span>
                    <div style="overflow: hidden;">
                        <div style="font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                            ${tx.note || catName}
                        </div>
                        <small style="opacity: 0.7; display: flex; gap: 8px; align-items: center; margin-top: 2px;">
                            <span>📅 ${dateStr}</span>
                            <span>•</span>
                            <span>🏷️ ${catName}</span>
                            <span>•</span>
                            <span>💳 ${tx.account || "Cash"}</span>
                        </small>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="amount ${isInc ? 'income' : 'expense'}">
                        ${isInc ? '+' : '-'} ${formatCurrency(amt)}
                    </span>
                    <button class="edit-btn" title="Edit" onclick="openEditModal('${tx.id}')">✏️</button>
                    <button class="delete-btn" title="Delete" onclick="confirmDeleteTx('${tx.id}')">🗑</button>
                </div>
            </div>
        `;
    }).join("");

    if (stats) {
        stats.innerHTML = `Showing <strong>${filteredTransactions.length}</strong> transactions &bull; Income: <span style="color:var(--income);">${formatCurrency(incTotal)}</span> &bull; Expenses: <span style="color:var(--expense);">${formatCurrency(expTotal)}</span>`;
    }
}

function bindFilterEvents() {
    const ids = ["searchInput", "typeFilter", "categoryFilter", "accountFilter", "periodFilter", "sortFilter"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", applyFilters);
            el.addEventListener("change", applyFilters);
        }
    });

    const exportBtn = document.getElementById("exportCsvBtn");
    if (exportBtn && typeof DataManager !== "undefined") {
        exportBtn.onclick = () => {
            const csv = DataManager.exportCSV();
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ExpenseTracker_Transactions_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("CSV Export downloaded!", "success");
        };
    }
}

window.confirmDeleteTx = function(id) {
    const tx = allTransactions.find(t => t.id === id);
    const label = tx ? (tx.note || tx.category || "transaction") : "transaction";
    const amtStr = tx ? formatCurrency(tx.amount) : "";

    showConfirmModal({
        title: "Delete Transaction?",
        message: `Permanently delete "${label}" (${amtStr})?`,
        confirmText: "Delete",
        danger: true,
        onConfirm: () => {
            deleteTransaction(id);
            showToast("Transaction deleted", "info");
            loadTransactions();
            populateFilters();
            applyFilters();
        }
    });
};

window.openEditModal = function(id) {
    const tx = allTransactions.find(t => t.id === id);
    if (!tx) return;

    const modal = document.getElementById("editModal");
    const idInput = document.getElementById("editTxId");
    const amtInput = document.getElementById("editAmount");
    const noteInput = document.getElementById("editNote");
    const dateInput = document.getElementById("editDate");
    const catSelect = document.getElementById("editCategory");
    const accSelect = document.getElementById("editAccount");
    const incBtn = document.getElementById("editIncomeBtn");
    const expBtn = document.getElementById("editExpenseBtn");

    idInput.value = tx.id;
    amtInput.value = tx.amount;
    noteInput.value = tx.note || "";
    dateInput.value = tx.date ? tx.date.slice(0, 10) : new Date().toISOString().slice(0, 10);

    editingType = tx.type || "expense";
    if (editingType === "income") {
        incBtn.classList.add("active");
        expBtn.classList.remove("active");
    } else {
        expBtn.classList.add("active");
        incBtn.classList.remove("active");
    }

    // Populate categories in edit modal
    catSelect.innerHTML = "";
    const cats = editingType === "income" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
    cats.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.icon} ${c.name}`;
        catSelect.appendChild(opt);
    });
    // Add custom categories
    getCustomCategories().forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.name.toLowerCase();
        opt.textContent = `${c.icon || "💸"} ${c.name}`;
        catSelect.appendChild(opt);
    });
    catSelect.value = (tx.category || "").toLowerCase();

    // Accounts
    accSelect.innerHTML = "";
    if (typeof DataManager !== "undefined") {
        DataManager.getAccounts().forEach(a => {
            const opt = document.createElement("option");
            opt.value = a.name;
            opt.textContent = `${a.icon || "💳"} ${a.name}`;
            accSelect.appendChild(opt);
        });
        accSelect.value = tx.account || "Cash";
    }

    modal.classList.remove("hidden", "modal-hidden");
};

function bindEditModalEvents() {
    const modal = document.getElementById("editModal");
    const incBtn = document.getElementById("editIncomeBtn");
    const expBtn = document.getElementById("editExpenseBtn");
    const saveBtn = document.getElementById("saveEditBtn");
    const cancelBtn = document.getElementById("cancelEditBtn");

    if (incBtn) {
        incBtn.onclick = () => {
            editingType = "income";
            incBtn.classList.add("active");
            expBtn.classList.remove("active");
        };
    }
    if (expBtn) {
        expBtn.onclick = () => {
            editingType = "expense";
            expBtn.classList.add("active");
            incBtn.classList.remove("active");
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = () => modal.classList.add("modal-hidden");
    }

    if (modal) {
        modal.addEventListener("click", e => {
            if (e.target === modal) modal.classList.add("modal-hidden");
        });
    }

    if (saveBtn) {
        saveBtn.onclick = () => {
            const id = document.getElementById("editTxId").value;
            const amt = Number(document.getElementById("editAmount").value);
            const note = document.getElementById("editNote").value.trim();
            const dateVal = document.getElementById("editDate").value;
            const category = document.getElementById("editCategory").value;
            const account = document.getElementById("editAccount").value;

            if (!amt || amt <= 0) {
                showToast("Please enter an amount greater than 0", "warning");
                return;
            }

            const isoDate = dateVal ? `${dateVal}T12:00:00.000Z` : new Date().toISOString();

            if (typeof DataManager !== "undefined") {
                DataManager.updateTransaction(id, {
                    type: editingType,
                    amount: amt,
                    note,
                    category,
                    account,
                    date: isoDate
                });
            }

            modal.classList.add("modal-hidden");
            showToast("Transaction updated successfully", "success");
            loadTransactions();
            populateFilters();
            applyFilters();
        };
    }
}
