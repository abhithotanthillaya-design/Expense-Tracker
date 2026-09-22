/**
 * Financial Accounts Controller
 */

let selectedAccountName = null;

document.addEventListener("DOMContentLoaded", () => {
    initAccounts();
    bindAccountModal();
});

function initAccounts() {
    if (typeof DataManager !== "undefined") {
        DataManager.recalculateAllAccountBalances();
    }
    renderAccountsList();
}

function renderAccountsList() {
    const grid = document.getElementById("accountsListGrid");
    const totalBalEl = document.getElementById("accountsTotalBalance");
    if (!grid || typeof DataManager === "undefined") return;

    const accounts = DataManager.getAccounts();
    const totalCombined = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

    if (totalBalEl) animateCounter(totalBalEl, totalCombined, 500, "", true);

    grid.innerHTML = accounts.map(acc => {
        const bal = Number(acc.balance) || 0;
        const isNeg = bal < 0;

        return `
            <div class="account-card" onclick="viewAccountStatement('${acc.name}')">
                <div class="account-card-header">
                    <span class="account-icon">${acc.icon || "💳"}</span>
                    <span class="account-type-badge">${acc.type}</span>
                </div>
                <div class="account-name">${acc.name}</div>
                <div class="account-balance" style="color: ${isNeg ? 'var(--expense)' : 'var(--text-primary)'};">
                    ${formatCurrency(bal)}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.06); font-size: 11px; color: var(--text-muted);">
                    <span>Tap to view history</span>
                    <div style="display: flex; gap: 6px;">
                        <button class="edit-btn" style="padding: 2px;" title="Edit Account" onclick="event.stopPropagation(); editAccountItem('${acc.id}')">✏️</button>
                        ${accounts.length > 1 ? `<button class="delete-btn" style="padding: 2px;" title="Delete Account" onclick="event.stopPropagation(); deleteAccountItem('${acc.id}', '${acc.name}')">🗑</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

window.viewAccountStatement = function(accountName) {
    selectedAccountName = accountName;
    const panel = document.getElementById("accountStatementPanel");
    const title = document.getElementById("statementTitle");
    const list = document.getElementById("statementList");
    if (!panel || !list) return;

    panel.style.display = "block";
    title.textContent = `Statement: ${accountName}`;

    const allTxs = typeof getAllTransactions === "function" ? getAllTransactions() : [];
    const accTxs = allTxs.filter(t => (t.account || "").toLowerCase() === accountName.toLowerCase());

    if (accTxs.length === 0) {
        list.innerHTML = `<p class="empty-state" style="padding: 20px;">No transactions linked to this account yet.</p>`;
        panel.scrollIntoView({ behavior: "smooth" });
        return;
    }

    list.innerHTML = accTxs.slice(0, 10).map(t => {
        const isInc = t.type === "income";
        const icon = getCategoryIcon(t.category);
        const dateStr = formatDate(new Date(t.date || Date.now()), { day: "numeric", month: "short" });

        return `
            <div class="transaction" style="margin-bottom: 8px;">
                <div class="note">
                    <span style="font-size: 20px;">${icon}</span>
                    <div style="overflow: hidden;">
                        <div style="font-weight: 600;">${t.note || t.category}</div>
                        <small style="opacity: 0.65;">${dateStr} &bull; ${formatCategoryName(t.category)}</small>
                    </div>
                </div>
                <span class="amount ${isInc ? 'income' : 'expense'}">
                    ${isInc ? '+' : '-'} ${formatCurrency(t.amount)}
                </span>
            </div>
        `;
    }).join("");

    panel.scrollIntoView({ behavior: "smooth" });
};

window.closeStatement = function() {
    const panel = document.getElementById("accountStatementPanel");
    if (panel) panel.style.display = "none";
};

window.deleteAccountItem = function(id, name) {
    showConfirmModal({
        title: `Delete ${name}?`,
        message: "Are you sure you want to remove this account? Historical transactions will be retained.",
        confirmText: "Delete",
        danger: true,
        onConfirm: () => {
            if (typeof DataManager !== "undefined") {
                const ok = DataManager.deleteAccount(id);
                if (ok) {
                    showToast(`Account "${name}" deleted`, "info");
                    closeStatement();
                    initAccounts();
                } else {
                    showToast("Cannot delete the only remaining account", "warning");
                }
            }
        }
    });
};

window.editAccountItem = function(id) {
    if (typeof DataManager === "undefined") return;
    const accounts = DataManager.getAccounts();
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;

    const modal = document.getElementById("accountModal");
    const idInput = document.getElementById("editAccountId");
    const nameInput = document.getElementById("accNameInput");
    const typeSelect = document.getElementById("accTypeSelect");
    const balInput = document.getElementById("accInitialBalanceInput");
    const title = document.getElementById("accountModalTitle");

    idInput.value = acc.id;
    nameInput.value = acc.name;
    balInput.value = acc.initialBalance || 0;
    title.textContent = "Edit Account";

    modal.classList.remove("hidden", "modal-hidden");
};

function bindAccountModal() {
    const modal = document.getElementById("accountModal");
    const addBtn = document.getElementById("addAccountBtn");
    const cancelBtn = document.getElementById("cancelAccBtn");
    const saveBtn = document.getElementById("saveAccBtn");
    const idInput = document.getElementById("editAccountId");
    const nameInput = document.getElementById("accNameInput");
    const typeSelect = document.getElementById("accTypeSelect");
    const balInput = document.getElementById("accInitialBalanceInput");
    const title = document.getElementById("accountModalTitle");

    if (addBtn) {
        addBtn.onclick = () => {
            idInput.value = "";
            nameInput.value = "";
            balInput.value = "0";
            title.textContent = "Add New Account";
            modal.classList.remove("hidden", "modal-hidden");
            nameInput.focus();
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
            const name = nameInput.value.trim();
            const [type, icon] = typeSelect.value.split("|");
            const initialBalance = Number(balInput.value) || 0;
            const editId = idInput.value;

            if (!name) {
                showToast("Please enter an account name", "warning");
                nameInput.focus();
                return;
            }

            if (typeof DataManager !== "undefined") {
                if (editId) {
                    DataManager.updateAccount(editId, {
                        name,
                        type,
                        icon,
                        initialBalance
                    });
                    showToast(`Updated account: ${name}`, "success");
                } else {
                    DataManager.addAccount({
                        name,
                        type,
                        icon,
                        initialBalance
                    });
                    showToast(`Added account: ${name}`, "success");
                }
            }

            modal.classList.add("modal-hidden");
            initAccounts();
        };
    }
}
