/**
 * Expense Tracker — Centralized Data & Storage Layer
 * Preserves 100% backward-compatibility with legacy keys while providing
 * a robust, Firebase-ready schema for accounts, budgets, recurring transactions, and settings.
 */

// ==========================================
// CONSTANTS & STORAGE KEYS
// ==========================================
const STORAGE_KEYS = {
    CUSTOM_CATEGORIES: "customCategories",
    SELECTED_DATE: "selectedDate",
    SELECTED_WEEK_START: "selectedWeekStart",
    SELECTED_MONTH: "selectedMonth",
    SELECTED_YEAR: "selectedYear",
    USERNAME: "username",
    INCOME_TYPE: "incomeType",
    ACCOUNTS: "et_accounts",
    BUDGETS: "et_budgets",
    RECURRING: "et_recurring",
    SETTINGS: "et_settings",
    MASTER_TRANSACTIONS: "transactions_master",
    ONBOARDED: "et_onboarded"
};

// Default Accounts Seed
const DEFAULT_ACCOUNTS = [
    { id: "acc_cash", name: "Cash", type: "cash", icon: "💵", balance: 0, initialBalance: 0, isDefault: true },
    { id: "acc_bank", name: "Bank Account", type: "bank", icon: "🏦", balance: 0, initialBalance: 0, isDefault: false },
    { id: "acc_upi", name: "UPI / Wallet", type: "wallet", icon: "⚡", balance: 0, initialBalance: 0, isDefault: false },
    { id: "acc_savings", name: "Savings", type: "savings", icon: "💰", balance: 0, initialBalance: 0, isDefault: false }
];

// Default Settings
const DEFAULT_SETTINGS = {
    username: "User",
    currency: "INR",
    currencySymbol: "₹",
    incomeType: "monthly",
    defaultAccountId: "acc_cash",
    theme: "midnight",
    onboarded: false,
    monthlyBudget: 0
};

// ==========================================
// LEGACY COMPATIBILITY API
// (Preserves exact signature & behavior for existing code)
// ==========================================

function getCustomCategories() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES)) || [];
    } catch (e) {
        console.error("Error reading customCategories", e);
        return [];
    }
}

function saveCustomCategory(name, icon) {
    if (!name) return;
    const categories = getCustomCategories();
    const alreadyExists = categories.find(category =>
        category.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (!alreadyExists) {
        categories.push({
            name: name.trim(),
            icon: icon || "💸"
        });

        localStorage.setItem(
            STORAGE_KEYS.CUSTOM_CATEGORIES,
            JSON.stringify(categories)
        );
    }
}

function getSelectedDateKey() {
    const selectedDate = localStorage.getItem(STORAGE_KEYS.SELECTED_DATE);
    if (selectedDate) {
        const part = selectedDate.split("T")[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
            return part;
        }
        const d = new Date(selectedDate);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split("T")[0];
        }
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getTransactions() {
    const key = "transactions_" + getSelectedDateKey();
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
        console.error("Error reading " + key, e);
        return [];
    }
}

function addTransaction(transaction) {
    if (!transaction) return;

    // Ensure complete fields
    const safeTx = {
        id: transaction.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)),
        type: transaction.type === "expense" ? "expense" : "income",
        amount: Math.abs(Number(transaction.amount)) || 0,
        note: (transaction.note || "").trim(),
        category: transaction.category || "Other",
        date: transaction.date || new Date().toISOString(),
        account: transaction.account || "Cash",
        paymentMethod: transaction.paymentMethod || "Direct",
        tags: Array.isArray(transaction.tags) ? transaction.tags : [],
        createdAt: transaction.createdAt || new Date().toISOString()
    };

    // Determine target date key from transaction's own date
    let dateKey = getSelectedDateKey();
    if (safeTx.date) {
        const txD = new Date(safeTx.date);
        if (!isNaN(txD.getTime())) {
            const y = txD.getFullYear();
            const m = String(txD.getMonth() + 1).padStart(2, "0");
            const d = String(txD.getDate()).padStart(2, "0");
            dateKey = `${y}-${m}-${d}`;
        }
    }

    const key = "transactions_" + dateKey;
    let dayTxs = [];
    try {
        dayTxs = JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
        dayTxs = [];
    }

    // Add to daily list
    dayTxs.push(safeTx);
    localStorage.setItem(key, JSON.stringify(dayTxs));

    // Also update master index
    DataManager.syncMasterRecord(safeTx);

    // Update account balance
    DataManager.adjustAccountBalance(safeTx.account, safeTx.type === "income" ? safeTx.amount : -safeTx.amount);

    return safeTx;
}

function deleteTransaction(id) {
    if (!id) return;

    let removedTx = null;

    // Search and remove across all date keys
    Object.keys(localStorage)
        .filter(k => k.startsWith("transactions_") && k !== STORAGE_KEYS.MASTER_TRANSACTIONS)
        .forEach(k => {
            try {
                let txs = JSON.parse(localStorage.getItem(k)) || [];
                const found = txs.find(t => t.id === id);
                if (found) {
                    removedTx = found;
                    txs = txs.filter(t => t.id !== id);
                    if (txs.length === 0) {
                        localStorage.removeItem(k);
                    } else {
                        localStorage.setItem(k, JSON.stringify(txs));
                    }
                }
            } catch (e) {
                // ignore
            }
        });

    // Remove from master if exists
    let master = DataManager.getMasterTransactions();
    const beforeLen = master.length;
    master = master.filter(t => t.id !== id);
    if (master.length !== beforeLen) {
        localStorage.setItem(STORAGE_KEYS.MASTER_TRANSACTIONS, JSON.stringify(master));
    }

    // Reverse account balance if removed
    if (removedTx) {
        DataManager.adjustAccountBalance(removedTx.account, removedTx.type === "income" ? -removedTx.amount : removedTx.amount);
    }

    return removedTx;
}

function getAllTransactions() {
    const list = Object.keys(localStorage)
        .filter(key => key.startsWith("transactions_") && key !== STORAGE_KEYS.MASTER_TRANSACTIONS)
        .flatMap(key => {
            try {
                return JSON.parse(localStorage.getItem(key)) || [];
            } catch (e) {
                return [];
            }
        });

    // Deduplicate by ID just in case
    const seen = new Set();
    const unique = [];
    for (const item of list) {
        if (item && item.id && !seen.has(item.id)) {
            seen.add(item.id);
            unique.push(item);
        }
    }

    // Sort descending by date
    return unique.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

// ==========================================
// CENTRAL DATA MANAGER (SERVICE / REPOSITORY)
// ==========================================
const DataManager = {
    // Master Transactions
    getMasterTransactions() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.MASTER_TRANSACTIONS);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        // Fallback to reading all transactions and caching in master
        const all = getAllTransactions();
        localStorage.setItem(STORAGE_KEYS.MASTER_TRANSACTIONS, JSON.stringify(all));
        return all;
    },

    syncMasterRecord(transaction) {
        let master = this.getMasterTransactions();
        const idx = master.findIndex(t => t.id === transaction.id);
        if (idx >= 0) {
            master[idx] = transaction;
        } else {
            master.unshift(transaction);
        }
        localStorage.setItem(STORAGE_KEYS.MASTER_TRANSACTIONS, JSON.stringify(master));
    },

    updateTransaction(id, updates) {
        if (!id || !updates) return null;

        let existing = null;
        let oldDateKey = null;

        // Find existing
        Object.keys(localStorage)
            .filter(k => k.startsWith("transactions_") && k !== STORAGE_KEYS.MASTER_TRANSACTIONS)
            .forEach(k => {
                try {
                    const txs = JSON.parse(localStorage.getItem(k)) || [];
                    const found = txs.find(t => t.id === id);
                    if (found) {
                        existing = found;
                        oldDateKey = k.replace("transactions_", "");
                    }
                } catch (e) {}
            });

        if (!existing) return null;

        const oldAmount = existing.amount;
        const oldType = existing.type;
        const oldAccount = existing.account || "Cash";

        // Merge updates
        const updated = {
            ...existing,
            ...updates,
            id, // preserve id
            amount: Math.abs(Number(updates.amount !== undefined ? updates.amount : existing.amount)) || 0,
            updatedAt: new Date().toISOString()
        };

        // Date key check
        const newD = new Date(updated.date);
        const newDateKey = !isNaN(newD.getTime())
            ? `${newD.getFullYear()}-${String(newD.getMonth() + 1).padStart(2, "0")}-${String(newD.getDate()).padStart(2, "0")}`
            : oldDateKey;

        // If date moved to another day, remove from old day and put in new day
        if (oldDateKey && oldDateKey !== newDateKey) {
            try {
                const oldKey = "transactions_" + oldDateKey;
                let oldTxs = JSON.parse(localStorage.getItem(oldKey)) || [];
                oldTxs = oldTxs.filter(t => t.id !== id);
                if (oldTxs.length === 0) localStorage.removeItem(oldKey);
                else localStorage.setItem(oldKey, JSON.stringify(oldTxs));
            } catch (e) {}

            const newKey = "transactions_" + newDateKey;
            let newTxs = [];
            try { newTxs = JSON.parse(localStorage.getItem(newKey)) || []; } catch (e) {}
            newTxs.push(updated);
            localStorage.setItem(newKey, JSON.stringify(newTxs));
        } else {
            // Update in place in the current day
            const curKey = "transactions_" + oldDateKey;
            try {
                let curTxs = JSON.parse(localStorage.getItem(curKey)) || [];
                const idx = curTxs.findIndex(t => t.id === id);
                if (idx >= 0) curTxs[idx] = updated;
                else curTxs.push(updated);
                localStorage.setItem(curKey, JSON.stringify(curTxs));
            } catch (e) {}
        }

        // Sync master record
        this.syncMasterRecord(updated);

        // Balance adjustment
        const oldDelta = oldType === "income" ? oldAmount : -oldAmount;
        const newDelta = updated.type === "income" ? updated.amount : -updated.amount;

        if (oldAccount === updated.account) {
            this.adjustAccountBalance(oldAccount, newDelta - oldDelta);
        } else {
            this.adjustAccountBalance(oldAccount, -oldDelta);
            this.adjustAccountBalance(updated.account, newDelta);
        }

        return updated;
    },

    // ==========================================
    // ACCOUNTS MANAGEMENT
    // ==========================================
    getAccounts() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        // Initialize with default accounts
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
        return DEFAULT_ACCOUNTS;
    },

    saveAccounts(accounts) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    },

    addAccount(account) {
        const accounts = this.getAccounts();
        const newAcc = {
            id: "acc_" + Date.now(),
            name: account.name.trim(),
            type: account.type || "bank",
            icon: account.icon || "💳",
            balance: Number(account.initialBalance) || 0,
            initialBalance: Number(account.initialBalance) || 0,
            isDefault: accounts.length === 0,
            isArchived: false,
            createdAt: new Date().toISOString()
        };
        accounts.push(newAcc);
        this.saveAccounts(accounts);
        return newAcc;
    },

    updateAccount(id, updates) {
        const accounts = this.getAccounts();
        const idx = accounts.findIndex(a => a.id === id);
        if (idx >= 0) {
            accounts[idx] = { ...accounts[idx], ...updates };
            this.saveAccounts(accounts);
            return accounts[idx];
        }
        return null;
    },

    deleteAccount(id) {
        let accounts = this.getAccounts();
        if (accounts.length <= 1) return false;
        accounts = accounts.filter(a => a.id !== id);
        this.saveAccounts(accounts);
        return true;
    },

    adjustAccountBalance(accountNameOrId, delta) {
        if (!delta || isNaN(delta)) return;
        const accounts = this.getAccounts();
        const target = accounts.find(a =>
            a.name.toLowerCase() === (accountNameOrId || "").toLowerCase() ||
            a.id === accountNameOrId
        );
        if (target) {
            target.balance = (Number(target.balance) || 0) + Number(delta);
            this.saveAccounts(accounts);
        }
    },

    recalculateAllAccountBalances() {
        const accounts = this.getAccounts();
        const allTxs = getAllTransactions();

        // Reset to initial balance
        accounts.forEach(acc => {
            acc.balance = Number(acc.initialBalance) || 0;
        });

        // Sum up transactions
        allTxs.forEach(tx => {
            const acc = accounts.find(a =>
                a.name.toLowerCase() === (tx.account || "Cash").toLowerCase() ||
                a.id === tx.account
            );
            if (acc) {
                if (tx.type === "income") acc.balance += tx.amount;
                else acc.balance -= tx.amount;
            }
        });

        this.saveAccounts(accounts);
        return accounts;
    },

    // ==========================================
    // BUDGETS MANAGEMENT
    // ==========================================
    getBudgets() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    },

    saveBudgets(budgets) {
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    },

    setBudget(category, amount, monthKey) {
        const budgets = this.getBudgets();
        const key = monthKey || new Date().toISOString().slice(0, 7); // YYYY-MM
        const idx = budgets.findIndex(b =>
            (b.category || "").toLowerCase() === (category || "overall").toLowerCase() &&
            b.monthKey === key
        );

        const entry = {
            id: idx >= 0 ? budgets[idx].id : "bdg_" + Date.now(),
            category: category || "Overall",
            amount: Math.abs(Number(amount)) || 0,
            monthKey: key,
            updatedAt: new Date().toISOString()
        };

        if (idx >= 0) budgets[idx] = entry;
        else budgets.push(entry);

        this.saveBudgets(budgets);
        return entry;
    },

    deleteBudget(id) {
        let budgets = this.getBudgets();
        budgets = budgets.filter(b => b.id !== id);
        this.saveBudgets(budgets);
    },

    getOverallBudget(monthKey) {
        const key = monthKey || new Date().toISOString().slice(0, 7);
        const budgets = this.getBudgets();
        const found = budgets.find(b =>
            b.category.toLowerCase() === "overall" && b.monthKey === key
        );
        if (found) return found.amount;
        const settings = this.getSettings();
        return Number(settings.monthlyBudget) || 0;
    },

    // ==========================================
    // RECURRING TRANSACTIONS
    // ==========================================
    getRecurring() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.RECURRING);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    },

    saveRecurring(recurringList) {
        localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurringList));
    },

    addRecurring(item) {
        const list = this.getRecurring();
        const newRec = {
            id: "rec_" + Date.now(),
            title: (item.title || "Recurring").trim(),
            amount: Math.abs(Number(item.amount)) || 0,
            type: item.type === "expense" ? "expense" : "income",
            category: item.category || "Subscriptions",
            account: item.account || "Cash",
            frequency: item.frequency || "monthly", // daily, weekly, monthly, yearly
            startDate: item.startDate || new Date().toISOString().slice(0, 10),
            nextDueDate: item.nextDueDate || item.startDate || new Date().toISOString().slice(0, 10),
            lastProcessedDate: null,
            active: item.active !== false,
            autoRecord: !!item.autoRecord,
            createdAt: new Date().toISOString()
        };
        list.push(newRec);
        this.saveRecurring(list);
        return newRec;
    },

    updateRecurring(id, updates) {
        const list = this.getRecurring();
        const idx = list.findIndex(r => r.id === id);
        if (idx >= 0) {
            list[idx] = { ...list[idx], ...updates };
            this.saveRecurring(list);
            return list[idx];
        }
        return null;
    },

    deleteRecurring(id) {
        let list = this.getRecurring();
        list = list.filter(r => r.id !== id);
        this.saveRecurring(list);
    },

    computeNextDate(currentDateStr, frequency) {
        const d = new Date(currentDateStr);
        if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
        switch (frequency) {
            case "daily":
                d.setDate(d.getDate() + 1);
                break;
            case "weekly":
                d.setDate(d.getDate() + 7);
                break;
            case "yearly":
                d.setFullYear(d.getFullYear() + 1);
                break;
            case "monthly":
            default:
                d.setMonth(d.getMonth() + 1);
                break;
        }
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    },

    processDueRecurring() {
        const list = this.getRecurring();
        const todayStr = new Date().toISOString().slice(0, 10);
        let processedCount = 0;

        list.forEach(rec => {
            if (!rec.active) return;
            if (rec.nextDueDate && rec.nextDueDate <= todayStr) {
                if (rec.autoRecord) {
                    addTransaction({
                        type: rec.type,
                        amount: rec.amount,
                        note: rec.title + " (Recurring)",
                        category: rec.category,
                        account: rec.account,
                        date: rec.nextDueDate + "T09:00:00.000Z",
                        tags: ["recurring"]
                    });
                    rec.lastProcessedDate = rec.nextDueDate;
                    rec.nextDueDate = this.computeNextDate(rec.nextDueDate, rec.frequency);
                    processedCount++;
                }
            }
        });

        if (processedCount > 0) {
            this.saveRecurring(list);
        }
        return processedCount;
    },

    // ==========================================
    // SETTINGS MANAGEMENT
    // ==========================================
    getSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (raw) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
            }
        } catch (e) {}
        const savedName = localStorage.getItem(STORAGE_KEYS.USERNAME);
        const savedIncomeType = localStorage.getItem(STORAGE_KEYS.INCOME_TYPE);
        const settings = {
            ...DEFAULT_SETTINGS,
            username: savedName || DEFAULT_SETTINGS.username,
            incomeType: savedIncomeType || DEFAULT_SETTINGS.incomeType
        };
        return settings;
    },

    saveSettings(newSettings) {
        const current = this.getSettings();
        const updated = { ...current, ...newSettings };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));

        if (updated.username) localStorage.setItem(STORAGE_KEYS.USERNAME, updated.username);
        if (updated.incomeType) localStorage.setItem(STORAGE_KEYS.INCOME_TYPE, updated.incomeType);

        return updated;
    },

    getCurrencySymbol() {
        const s = this.getSettings();
        return s.currencySymbol || "₹";
    },

    // ==========================================
    // DATA BACKUP, IMPORT, EXPORT, RESET
    // ==========================================
    exportJSON() {
        const data = {
            version: "2.0.0",
            exportedAt: new Date().toISOString(),
            app: "Expense Tracker by ATS",
            settings: this.getSettings(),
            accounts: this.getAccounts(),
            budgets: this.getBudgets(),
            recurring: this.getRecurring(),
            customCategories: getCustomCategories(),
            transactions: getAllTransactions()
        };
        return JSON.stringify(data, null, 2);
    },

    importJSON(jsonString, overwrite = false) {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed) throw new Error("Invalid JSON structure");

            if (parsed.settings) this.saveSettings(parsed.settings);
            if (parsed.accounts && Array.isArray(parsed.accounts)) this.saveAccounts(parsed.accounts);
            if (parsed.budgets && Array.isArray(parsed.budgets)) this.saveBudgets(parsed.budgets);
            if (parsed.recurring && Array.isArray(parsed.recurring)) this.saveRecurring(parsed.recurring);
            if (parsed.customCategories && Array.isArray(parsed.customCategories)) {
                localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(parsed.customCategories));
            }

            if (parsed.transactions && Array.isArray(parsed.transactions)) {
                if (overwrite) {
                    Object.keys(localStorage)
                        .filter(k => k.startsWith("transactions_"))
                        .forEach(k => localStorage.removeItem(k));
                }
                parsed.transactions.forEach(tx => addTransaction(tx));
            }

            this.recalculateAllAccountBalances();
            return { success: true, count: parsed.transactions ? parsed.transactions.length : 0 };
        } catch (err) {
            console.error("Import error", err);
            return { success: false, error: err.message };
        }
    },

    exportCSV() {
        const txs = getAllTransactions();
        const headers = ["ID", "Date", "Type", "Category", "Amount", "Account", "Note"];
        const rows = txs.map(t => [
            `"${t.id || ""}"`,
            `"${t.date || ""}"`,
            `"${t.type || ""}"`,
            `"${(t.category || "").replace(/"/g, '""')}"`,
            t.amount || 0,
            `"${(t.account || "Cash").replace(/"/g, '""')}"`,
            `"${(t.note || "").replace(/"/g, '""')}"`
        ]);

        return [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    },

    resetAllData() {
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith("transactions_") ||
                k === STORAGE_KEYS.ACCOUNTS ||
                k === STORAGE_KEYS.BUDGETS ||
                k === STORAGE_KEYS.RECURRING ||
                k === STORAGE_KEYS.CUSTOM_CATEGORIES ||
                k === STORAGE_KEYS.SELECTED_DATE ||
                k === STORAGE_KEYS.SELECTED_WEEK_START ||
                k === STORAGE_KEYS.SELECTED_MONTH ||
                k === STORAGE_KEYS.SELECTED_YEAR) {
                localStorage.removeItem(k);
            }
        });
        this.saveAccounts(DEFAULT_ACCOUNTS);
    }
};

// Auto check recurring transactions on load
if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
        try {
            DataManager.processDueRecurring();
        } catch (e) {}
    });
}