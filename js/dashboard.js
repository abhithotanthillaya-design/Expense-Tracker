/**
 * Main Dashboard Controller
 */

let modalType = "expense";

document.addEventListener("DOMContentLoaded", () => {
    initDashboard();
    setupDashboardModal();
});

function initDashboard() {
    const settings = typeof DataManager !== "undefined" ? DataManager.getSettings() : {};
    const username = settings.username || localStorage.getItem("username") || "User";

    // Set greeting
    const greetingEl = document.getElementById("dashboardGreeting");
    if (greetingEl) {
        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
        greetingEl.textContent = `${timeOfDay}, ${username}! 👋`;
    }

    // Set date
    const dateEl = document.getElementById("dashboardDate");
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    renderDashboardMetrics();
    renderDashboardBudget();
    renderDashboardAccounts();
    renderRecentTransactions();
    renderSmartInsights();
}

function renderDashboardMetrics() {
    const allTxs = typeof getAllTransactions === "function" ? getAllTransactions() : [];
    const summary = summarizeTransactions(allTxs);

    const balance = summary.balance;
    const heroBal = document.getElementById("heroBalanceTotal");
    const heroInc = document.getElementById("heroIncomeTotal");
    const heroExp = document.getElementById("heroExpenseTotal");

    if (heroBal) animateCounter(heroBal, balance, 600, "", true);
    if (heroInc) animateCounter(heroInc, summary.income, 600, "", true);
    if (heroExp) animateCounter(heroExp, summary.expense, 600, "", true);

    const rateBadge = document.getElementById("savingsRateBadge");
    if (rateBadge) {
        const rate = getSavingsRate(summary.income, summary.expense);
        rateBadge.textContent = `Savings Rate: ${rate}%`;
        if (rate >= 30) {
            rateBadge.style.background = "var(--income-bg)";
            rateBadge.style.color = "var(--income)";
        } else if (rate > 0) {
            rateBadge.style.background = "var(--gold-muted)";
            rateBadge.style.color = "var(--gold)";
        } else {
            rateBadge.style.background = "var(--expense-bg)";
            rateBadge.style.color = "var(--expense)";
        }
    }
}

function renderDashboardBudget() {
    if (typeof DataManager === "undefined") return;

    const monthKey = new Date().toISOString().slice(0, 7);
    const overallBudget = DataManager.getOverallBudget(monthKey);

    // Current month transactions
    const monthStart = getMonthStart(new Date());
    const monthEnd = getMonthEnd(new Date());
    const monthTxs = getRangeTransactions(monthStart, monthEnd);
    const monthSummary = summarizeTransactions(monthTxs);
    const spent = monthSummary.expense;

    const numbersEl = document.getElementById("dashBudgetNumbers");
    const barEl = document.getElementById("dashBudgetBar");
    const remainingEl = document.getElementById("dashBudgetRemaining");
    const percentEl = document.getElementById("dashBudgetPercent");
    const statusHero = document.getElementById("heroBudgetStatus");

    if (overallBudget > 0) {
        const pct = Math.min(Math.round((spent / overallBudget) * 100), 100);
        const rem = overallBudget - spent;

        if (numbersEl) numbersEl.innerHTML = `<strong>${formatCurrency(spent)}</strong> / ${formatCurrency(overallBudget)}`;
        if (barEl) {
            barEl.style.width = `${pct}%`;
            barEl.className = "progress-fill " + (pct > 90 ? "danger" : pct > 75 ? "warning" : "safe");
        }
        if (remainingEl) {
            remainingEl.textContent = rem >= 0 ? `${formatCurrency(rem)} left` : `${formatCurrency(Math.abs(rem))} over budget!`;
            remainingEl.style.color = rem < 0 ? "var(--expense)" : "var(--text-muted)";
        }
        if (percentEl) percentEl.textContent = `${pct}% used`;
        if (statusHero) statusHero.textContent = `${formatCurrency(rem)} left`;
    } else {
        if (numbersEl) numbersEl.innerHTML = `<strong>${formatCurrency(spent)}</strong> spent (no limit set)`;
        if (barEl) barEl.style.width = "0%";
        if (remainingEl) remainingEl.textContent = "Tap Manage to set budget";
        if (percentEl) percentEl.textContent = "—";
        if (statusHero) statusHero.textContent = "No Budget Set";
    }
}

function renderDashboardAccounts() {
    const list = document.getElementById("dashAccountsList");
    if (!list || typeof DataManager === "undefined") return;

    const accounts = DataManager.getAccounts();
    list.innerHTML = accounts.slice(0, 4).map(acc => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255, 255, 255, 0.03); border-radius: var(--radius-sm); border: 1px solid rgba(255, 255, 255, 0.05);">
            <span style="font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                <span>${acc.icon || "💳"}</span> ${acc.name}
            </span>
            <strong style="font-family: 'Outfit', sans-serif; font-size: 14px; color: ${acc.balance < 0 ? 'var(--expense)' : 'var(--text-primary)'};">
                ${formatCurrency(acc.balance)}
            </strong>
        </div>
    `).join("");
}

function renderRecentTransactions() {
    const list = document.getElementById("dashRecentList");
    if (!list) return;

    const allTxs = typeof getAllTransactions === "function" ? getAllTransactions() : [];
    const recent = allTxs.slice(0, 5);

    if (recent.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="padding: 24px;">
                <p style="font-size: 24px;">📭</p>
                <p style="font-size: 14px; color: var(--text-muted);">No transactions recorded yet.</p>
                <button class="modal-submit-btn" style="margin-top: 10px; width: auto; padding: 8px 20px;" onclick="document.getElementById('quickAddExpenseBtn').click()">+ Record First Expense</button>
            </div>
        `;
        return;
    }

    list.innerHTML = recent.map(tx => {
        const icon = typeof getCategoryIcon === "function" ? getCategoryIcon(tx.category) : "💸";
        const isInc = tx.type === "income";
        const dateStr = formatDate(new Date(tx.date || Date.now()), { day: "numeric", month: "short" });

        return `
            <div class="transaction" style="margin-bottom: 8px;">
                <div class="note">
                    <span style="font-size: 20px;">${icon}</span>
                    <div style="overflow: hidden;">
                        <div style="font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                            ${tx.note || tx.category || "Transaction"}
                        </div>
                        <small style="opacity: 0.65; display: flex; gap: 6px;">
                            <span>${dateStr}</span>
                            <span>•</span>
                            <span>${tx.account || "Cash"}</span>
                        </small>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="amount ${isInc ? 'income' : 'expense'}">
                        ${isInc ? '+' : '-'} ${formatCurrency(tx.amount)}
                    </span>
                    <button class="delete-btn" title="Delete" onclick="deleteRecentTx('${tx.id}')">🗑</button>
                </div>
            </div>
        `;
    }).join("");
}

window.deleteRecentTx = function(id) {
    if (typeof showConfirmModal === "function") {
        showConfirmModal({
            title: "Delete Transaction?",
            message: "Are you sure you want to remove this transaction?",
            confirmText: "Delete",
            danger: true,
            onConfirm: () => {
                deleteTransaction(id);
                showToast("Transaction removed", "info");
                initDashboard();
            }
        });
    } else {
        deleteTransaction(id);
        initDashboard();
    }
};

function renderSmartInsights() {
    const iconEl = document.getElementById("insightIcon");
    const titleEl = document.getElementById("insightTitle");
    const textEl = document.getElementById("insightText");
    if (!titleEl || !textEl) return;

    const allTxs = typeof getAllTransactions === "function" ? getAllTransactions() : [];
    if (allTxs.length === 0) {
        iconEl.textContent = "💡";
        titleEl.textContent = "Welcome to Expense Tracker!";
        textEl.textContent = "Track income and expenses to unlock real-time financial health analytics, savings rate calculators, and spending patterns.";
        return;
    }

    // Calculate actual category breakdown
    const categoryTotals = getCategoryTotals(allTxs, "expense");
    const categories = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a]);

    const summary = summarizeTransactions(allTxs);
    const savingsRate = getSavingsRate(summary.income, summary.expense);

    // Pick most relevant insight
    if (categories.length > 0 && categoryTotals[categories[0]] > 0) {
        const topCat = categories[0];
        const topAmount = categoryTotals[topCat];
        const catIcon = typeof getCategoryIcon === "function" ? getCategoryIcon(topCat) : "🍔";

        iconEl.textContent = catIcon;
        titleEl.textContent = `Top Expense: ${formatCategoryName(topCat)}`;
        textEl.textContent = `You've spent ${formatCurrency(topAmount)} on ${formatCategoryName(topCat)}. It represents your single largest spending category.`;
    } else if (savingsRate > 25) {
        iconEl.textContent = "🌟";
        titleEl.textContent = "Healthy Savings Rate!";
        textEl.textContent = `You are saving ${savingsRate}% of your total income. Financial experts recommend saving at least 20%.`;
    } else {
        iconEl.textContent = "📊";
        titleEl.textContent = "Active Tracking";
        textEl.textContent = `You have recorded ${allTxs.length} transactions totaling ${formatCurrency(summary.expense)} in expenses.`;
    }
}

function setupDashboardModal() {
    const modal = document.getElementById("transactionModal");
    const fab = document.getElementById("fab");
    const incomeBtn = document.getElementById("incomeBtn");
    const expenseBtn = document.getElementById("expenseBtn");
    const saveBtn = document.getElementById("saveTransaction");
    const categorySelect = document.getElementById("category");
    const customInput = document.getElementById("customCategory");
    const accountSelect = document.getElementById("accountSelect");
    const quickExpenseBtn = document.getElementById("quickAddExpenseBtn");
    const quickIncomeBtn = document.getElementById("quickAddIncomeBtn");

    if (accountSelect && typeof DataManager !== "undefined") {
        accountSelect.innerHTML = "";
        DataManager.getAccounts().forEach(acc => {
            const opt = document.createElement("option");
            opt.value = acc.name;
            opt.textContent = `${acc.icon || "💳"} ${acc.name}`;
            accountSelect.appendChild(opt);
        });
    }

    if (categorySelect && typeof loadCustomCategories === "function") {
        loadCustomCategories(categorySelect);
    }

    const openModal = (type) => {
        modalType = type;
        if (type === "income") {
            incomeBtn.classList.add("active");
            expenseBtn.classList.remove("active");
        } else {
            expenseBtn.classList.add("active");
            incomeBtn.classList.remove("active");
        }
        modal.classList.remove("hidden", "modal-hidden");
        const amtInput = document.getElementById("amount");
        if (amtInput) amtInput.focus();
    };

    if (quickExpenseBtn) quickExpenseBtn.onclick = () => openModal("expense");
    if (quickIncomeBtn) quickIncomeBtn.onclick = () => openModal("income");
    if (fab) fab.onclick = () => openModal("expense");

    if (incomeBtn) {
        incomeBtn.onclick = () => {
            modalType = "income";
            incomeBtn.classList.add("active");
            expenseBtn.classList.remove("active");
        };
    }

    if (expenseBtn) {
        expenseBtn.onclick = () => {
            modalType = "expense";
            expenseBtn.classList.add("active");
            incomeBtn.classList.remove("active");
        };
    }

    if (categorySelect) {
        categorySelect.onchange = () => {
            const val = categorySelect.value;
            const iconEl = document.getElementById("categoryIcon");
            if (iconEl) iconEl.textContent = getCategoryIcon(val);
            if (val === "other") {
                if (customInput) customInput.classList.add("show");
            } else {
                if (customInput) customInput.classList.remove("show");
            }
        };
    }

    if (modal) {
        modal.addEventListener("click", e => {
            if (e.target === modal) modal.classList.add("modal-hidden");
        });
    }

    // Quick amount buttons
    document.querySelectorAll(".quick-amounts button").forEach(btn => {
        btn.onclick = () => {
            const amtInput = document.getElementById("amount");
            if (amtInput) amtInput.value = btn.dataset.amount;
        };
    });

    if (saveBtn) {
        saveBtn.onclick = () => {
            const amtInput = document.getElementById("amount");
            const noteInput = document.getElementById("note");
            const amt = Number(amtInput.value);

            if (!amt || amt <= 0) {
                showToast("Please enter an amount greater than 0", "warning");
                amtInput.focus();
                return;
            }

            let cat = categorySelect ? categorySelect.value : "other";
            if (cat === "other" && customInput && customInput.value.trim()) {
                cat = formatCategoryName(customInput.value);
                saveCustomCategory(cat, getSmartCategoryIcon(cat));
            } else if (!cat) {
                cat = modalType === "income" ? "Salary" : "Other";
            }

            const acc = accountSelect ? accountSelect.value : "Cash";

            addTransaction({
                type: modalType,
                amount: amt,
                note: noteInput ? noteInput.value.trim() : "",
                category: cat,
                account: acc,
                date: new Date().toISOString()
            });

            amtInput.value = "";
            if (noteInput) noteInput.value = "";
            modal.classList.add("modal-hidden");

            showToast(`Added ${modalType}: ${formatCurrency(amt)}`, "success");
            initDashboard();
        };
    }
}
