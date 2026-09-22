/**
 * Recurring Transactions Controller
 */

let recType = "expense";

document.addEventListener("DOMContentLoaded", () => {
    initRecurring();
    bindRecurringModal();
});

function initRecurring() {
    renderRecurringList();
}

function renderRecurringList() {
    const container = document.getElementById("recurringListContainer");
    const countEl = document.getElementById("recurringSummaryCount");
    if (!container || typeof DataManager === "undefined") return;

    const list = DataManager.getRecurring();
    if (countEl) countEl.textContent = `Active Subscriptions: ${list.filter(r => r.active).length} of ${list.length}`;

    if (list.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p style="font-size: 32px;">🔄</p>
                <p style="font-size: 16px; font-weight: 600;">No recurring transactions yet</p>
                <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Never forget a subscription, monthly rent, or salary entry again.</p>
                <button class="modal-submit-btn" style="margin-top: 12px; width: auto; padding: 8px 18px;" onclick="document.getElementById('addRecurringBtn').click()">+ Add First Recurring</button>
            </div>
        `;
        return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    container.innerHTML = list.map(item => {
        const isInc = item.type === "income";
        const icon = getCategoryIcon(item.category);
        const nextDue = item.nextDueDate || todayStr;

        // Due countdown calculation
        const dueDays = Math.ceil((new Date(nextDue).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24));
        let dueLabel = "";
        let dueBadgeClass = "safe";

        if (dueDays < 0) {
            dueLabel = `Overdue (${Math.abs(dueDays)} days ago)`;
            dueBadgeClass = "danger";
        } else if (dueDays === 0) {
            dueLabel = "Due Today!";
            dueBadgeClass = "warning";
        } else if (dueDays === 1) {
            dueLabel = "Due Tomorrow";
            dueBadgeClass = "warning";
        } else {
            dueLabel = `Due in ${dueDays} days`;
        }

        return `
            <div class="recurring-card" style="opacity: ${item.active ? 1 : 0.6};">
                <div style="font-size: 26px; flex-shrink: 0;">${icon}</div>

                <div class="recurring-info">
                    <div class="recurring-title">
                        <span>${item.title}</span>
                        <span class="badge-frequency">${item.frequency}</span>
                        ${!item.active ? '<span style="font-size:11px; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">Paused</span>' : ''}
                    </div>
                    <div class="recurring-details">
                        <span>📅 Next: ${formatDate(new Date(nextDue), { day: "numeric", month: "short" })}</span>
                        <span style="color: ${dueBadgeClass === 'danger' ? 'var(--expense)' : dueBadgeClass === 'warning' ? 'var(--gold)' : 'var(--income)'}; font-weight: 600;">
                            ${dueLabel}
                        </span>
                        <span>💳 ${item.account || "Cash"}</span>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                    <span class="recurring-amount ${isInc ? 'income' : 'expense'}">
                        ${isInc ? '+' : '-'} ${formatCurrency(item.amount)}
                    </span>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px;" title="Record as transaction now" onclick="recordRecurringNow('${item.id}')">Log Now ✓</button>
                        <button class="delete-btn" title="Delete" onclick="deleteRecurringItem('${item.id}')">🗑</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

window.recordRecurringNow = function(id) {
    if (typeof DataManager === "undefined") return;
    const list = DataManager.getRecurring();
    const item = list.find(r => r.id === id);
    if (!item) return;

    addTransaction({
        type: item.type,
        amount: item.amount,
        note: `${item.title} (Recurring)`,
        category: item.category,
        account: item.account,
        date: new Date().toISOString(),
        tags: ["recurring"]
    });

    // Advance next due date
    item.nextDueDate = DataManager.computeNextDate(item.nextDueDate || new Date().toISOString().slice(0, 10), item.frequency);
    item.lastProcessedDate = new Date().toISOString().slice(0, 10);
    DataManager.saveRecurring(list);

    showToast(`Logged transaction: ${item.title} (${formatCurrency(item.amount)})`, "success");
    initRecurring();
};

window.deleteRecurringItem = function(id) {
    showConfirmModal({
        title: "Delete Recurring Item?",
        message: "Are you sure you want to stop tracking this recurring transaction?",
        confirmText: "Delete",
        danger: true,
        onConfirm: () => {
            if (typeof DataManager !== "undefined") {
                DataManager.deleteRecurring(id);
                showToast("Recurring entry deleted", "info");
                initRecurring();
            }
        }
    });
};

function bindRecurringModal() {
    const modal = document.getElementById("recurringModal");
    const addBtn = document.getElementById("addRecurringBtn");
    const cancelBtn = document.getElementById("cancelRecurringBtn");
    const saveBtn = document.getElementById("saveRecurringBtn");
    const expBtn = document.getElementById("recExpenseBtn");
    const incBtn = document.getElementById("recIncomeBtn");
    const titleInput = document.getElementById("recTitleInput");
    const amtInput = document.getElementById("recAmountInput");
    const freqSelect = document.getElementById("recFrequencySelect");
    const catSelect = document.getElementById("recCategorySelect");
    const accSelect = document.getElementById("recAccountSelect");
    const dateInput = document.getElementById("recNextDateInput");
    const autoCheck = document.getElementById("recAutoRecordCheck");

    // Populate accounts
    if (accSelect && typeof DataManager !== "undefined") {
        accSelect.innerHTML = "";
        DataManager.getAccounts().forEach(a => {
            const opt = document.createElement("option");
            opt.value = a.name;
            opt.textContent = `${a.icon || "💳"} ${a.name}`;
            accSelect.appendChild(opt);
        });
    }

    if (expBtn) {
        expBtn.onclick = () => {
            recType = "expense";
            expBtn.classList.add("active");
            incBtn.classList.remove("active");
        };
    }
    if (incBtn) {
        incBtn.onclick = () => {
            recType = "income";
            incBtn.classList.add("active");
            expBtn.classList.remove("active");
        };
    }

    if (addBtn) {
        addBtn.onclick = () => {
            titleInput.value = "";
            amtInput.value = "";
            dateInput.value = new Date().toISOString().slice(0, 10);
            modal.classList.remove("hidden", "modal-hidden");
            titleInput.focus();
        };
    }

    if (cancelBtn) cancelBtn.onclick = () => modal.classList.add("modal-hidden");

    if (modal) {
        modal.addEventListener("click", e => {
            if (e.target === modal) modal.classList.add("modal-hidden");
        });
    }

    if (saveBtn) {
        saveBtn.onclick = () => {
            const title = titleInput.value.trim();
            const amt = Number(amtInput.value);

            if (!title) {
                showToast("Please enter a title (e.g. Netflix)", "warning");
                titleInput.focus();
                return;
            }
            if (!amt || amt <= 0) {
                showToast("Please enter an amount greater than 0", "warning");
                amtInput.focus();
                return;
            }

            if (typeof DataManager !== "undefined") {
                DataManager.addRecurring({
                    title,
                    amount: amt,
                    type: recType,
                    frequency: freqSelect.value,
                    category: catSelect.value,
                    account: accSelect.value,
                    startDate: new Date().toISOString().slice(0, 10),
                    nextDueDate: dateInput.value || new Date().toISOString().slice(0, 10),
                    autoRecord: autoCheck ? autoCheck.checked : true
                });
            }

            modal.classList.add("modal-hidden");
            showToast(`Added recurring: ${title}`, "success");
            initRecurring();
        };
    }
}
