/**
 * Budgets Management Controller
 */

const monthKey = new Date().toISOString().slice(0, 7);

document.addEventListener("DOMContentLoaded", () => {
    initBudgets();
    bindBudgetModal();
});

function initBudgets() {
    renderOverallBudget();
    renderCategoryBudgets();
}

function renderOverallBudget() {
    if (typeof DataManager === "undefined") return;

    const overallBudget = DataManager.getOverallBudget(monthKey);

    // Current month transactions
    const monthStart = getMonthStart(new Date());
    const monthEnd = getMonthEnd(new Date());
    const monthTxs = getRangeTransactions(monthStart, monthEnd);
    const monthSummary = summarizeTransactions(monthTxs);
    const spent = monthSummary.expense;

    const spentEl = document.getElementById("overallBudgetSpent");
    const limitEl = document.getElementById("overallBudgetLimit");
    const barEl = document.getElementById("overallProgressBar");
    const remainingEl = document.getElementById("overallRemainingText");
    const percentEl = document.getElementById("overallPercentText");

    if (spentEl) spentEl.textContent = formatCurrency(spent);

    if (overallBudget > 0) {
        const pct = Math.min(Math.round((spent / overallBudget) * 100), 100);
        const rem = overallBudget - spent;

        if (limitEl) limitEl.textContent = `Limit: ${formatCurrency(overallBudget)}`;
        if (barEl) {
            barEl.style.width = `${pct}%`;
            barEl.className = "progress-fill " + (spent > overallBudget ? "danger" : pct >= 75 ? "warning" : "safe");
        }
        if (remainingEl) {
            remainingEl.textContent = rem >= 0 ? `Remaining: ${formatCurrency(rem)}` : `Over Budget by: ${formatCurrency(Math.abs(rem))}!`;
            remainingEl.style.color = rem < 0 ? "var(--expense)" : "var(--income)";
        }
        if (percentEl) percentEl.textContent = `${Math.round((spent / overallBudget) * 100)}% used`;
    } else {
        if (limitEl) limitEl.textContent = "No limit configured";
        if (barEl) barEl.style.width = "0%";
        if (remainingEl) remainingEl.textContent = "Click Edit Target to set overall monthly budget";
        if (percentEl) percentEl.textContent = "—";
    }
}

function renderCategoryBudgets() {
    const list = document.getElementById("categoryBudgetsList");
    if (!list || typeof DataManager === "undefined") return;

    const allBudgets = DataManager.getBudgets().filter(b =>
        b.monthKey === monthKey && (b.category || "").toLowerCase() !== "overall"
    );

    // Current month transactions
    const monthStart = getMonthStart(new Date());
    const monthEnd = getMonthEnd(new Date());
    const monthTxs = getRangeTransactions(monthStart, monthEnd);
    const categoryTotals = getCategoryTotals(monthTxs, "expense");

    if (allBudgets.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <p style="font-size: 28px;">🎯</p>
                <p style="font-size: 15px; font-weight: 600;">No category budgets set yet</p>
                <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Set specific limits for Food, Shopping, or Travel to keep expenses under control.</p>
                <button class="modal-submit-btn" style="margin-top: 12px; width: auto; padding: 8px 18px;" onclick="document.getElementById('addCategoryBudgetBtn').click()">+ Add First Budget</button>
            </div>
        `;
        return;
    }

    list.innerHTML = allBudgets.map(b => {
        const catKey = (b.category || "").toLowerCase();
        const spent = categoryTotals[catKey] || 0;
        const limit = b.amount;
        const pct = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
        const rem = limit - spent;
        const isOver = spent > limit;
        const icon = getCategoryIcon(b.category);

        return `
            <div class="budget-card">
                <div class="budget-header">
                    <div class="budget-category">
                        <span>${icon}</span>
                        <span>${formatCategoryName(b.category)}</span>
                    </div>
                    <div class="budget-amounts">
                        <strong style="color: ${isOver ? 'var(--expense)' : 'var(--text-primary)'};">${formatCurrency(spent)}</strong> / ${formatCurrency(limit)}
                    </div>
                </div>

                <div class="progress-track">
                    <div class="progress-fill ${isOver ? 'danger' : pct >= 75 ? 'warning' : 'safe'}" style="width: ${pct}%;"></div>
                </div>

                <div class="budget-footer" style="margin-top: 6px;">
                    <span style="color: ${isOver ? 'var(--expense)' : 'var(--text-muted)'}; font-weight: 500;">
                        ${isOver ? '🚨 Over by ' + formatCurrency(Math.abs(rem)) : formatCurrency(rem) + ' remaining'}
                    </span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span>${limit > 0 ? Math.round((spent / limit) * 100) : 0}%</span>
                        <button class="delete-btn" style="padding: 2px; font-size: 13px;" title="Remove Budget" onclick="deleteBudgetGoal('${b.id}')">🗑</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

window.deleteBudgetGoal = function(id) {
    showConfirmModal({
        title: "Remove Budget?",
        message: "Are you sure you want to remove this budget target?",
        confirmText: "Remove",
        danger: true,
        onConfirm: () => {
            if (typeof DataManager !== "undefined") {
                DataManager.deleteBudget(id);
                showToast("Budget target removed", "info");
                initBudgets();
            }
        }
    });
};

function bindBudgetModal() {
    const modal = document.getElementById("budgetModal");
    const overallBtn = document.getElementById("setOverallBudgetBtn");
    const addCatBtn = document.getElementById("addCategoryBudgetBtn");
    const cancelBtn = document.getElementById("cancelBudgetBtn");
    const saveBtn = document.getElementById("saveBudgetBtn");
    const catSelect = document.getElementById("budgetCategorySelect");
    const amtInput = document.getElementById("budgetAmountInput");
    const titleEl = document.getElementById("budgetModalTitle");

    const openForOverall = () => {
        titleEl.textContent = "Set Overall Monthly Budget";
        catSelect.value = "Overall";
        const cur = DataManager.getOverallBudget(monthKey);
        amtInput.value = cur > 0 ? cur : "";
        modal.classList.remove("hidden", "modal-hidden");
        amtInput.focus();
    };

    const openForCategory = () => {
        titleEl.textContent = "Set Category Budget";
        catSelect.value = "food";
        amtInput.value = "";
        modal.classList.remove("hidden", "modal-hidden");
        amtInput.focus();
    };

    if (overallBtn) overallBtn.onclick = openForOverall;
    if (addCatBtn) addCatBtn.onclick = openForCategory;
    if (cancelBtn) cancelBtn.onclick = () => modal.classList.add("modal-hidden");

    if (modal) {
        modal.addEventListener("click", e => {
            if (e.target === modal) modal.classList.add("modal-hidden");
        });
    }

    if (saveBtn) {
        saveBtn.onclick = () => {
            const cat = catSelect.value;
            const amt = Number(amtInput.value);

            if (!amt || amt <= 0) {
                showToast("Please enter a valid budget amount", "warning");
                return;
            }

            DataManager.setBudget(cat, amt, monthKey);
            if (cat.toLowerCase() === "overall") {
                DataManager.saveSettings({ monthlyBudget: amt });
            }

            modal.classList.add("modal-hidden");
            showToast(`Budget for ${formatCategoryName(cat)} saved: ${formatCurrency(amt)}`, "success");
            initBudgets();
        };
    }
}
