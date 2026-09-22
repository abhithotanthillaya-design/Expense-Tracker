/**
 * Transaction rendering and list management for Daily View & History
 */

function renderTransactions({
    list,
    incomeEl,
    expenseEl,
    balanceEl,
    balanceCard,
    currentFilter = "all",
    onDelete,
    onEdit
}) {
    if (!list) return;

    const transactions = typeof getTransactions === "function" ? getTransactions() : [];

    list.innerHTML = "";

    let income = 0;
    let expense = 0;

    const filtered = transactions.filter(transaction =>
        currentFilter === "all" || transaction.type === currentFilter
    );

    if (filtered.length === 0) {
        list.innerHTML = `
        <div class="empty-state">
            <p style="font-size: 28px; margin-bottom: 8px;">📭</p>
            <p style="font-size: 16px; font-weight: 600; color: var(--text-primary);">No transactions for this date</p>
            <p style="font-size: 13px; color: var(--text-muted);">Tap the + button to record income or expense</p>
        </div>
        `;

        if (incomeEl) incomeEl.textContent = typeof formatCurrency === "function" ? formatCurrency(0) : "₹0";
        if (expenseEl) expenseEl.textContent = typeof formatCurrency === "function" ? formatCurrency(0) : "₹0";
        if (balanceEl) balanceEl.textContent = typeof formatCurrency === "function" ? formatCurrency(0) : "₹0";
        if (balanceCard) {
            balanceCard.classList.remove("positive", "negative", "neutral");
            balanceCard.classList.add("neutral");
        }
        return;
    }

    [...filtered].reverse().forEach(transaction => {
        const item = document.createElement("div");
        const standardIcon = typeof getCategoryIcon === "function"
            ? getCategoryIcon(transaction.category)
            : "💸";
        const icon = standardIcon === "💸" && typeof getSmartCategoryIcon === "function"
            ? getSmartCategoryIcon(transaction.note || transaction.category)
            : standardIcon;

        const currencySymbol = typeof DataManager !== "undefined" && DataManager.getCurrencySymbol
            ? DataManager.getCurrencySymbol()
            : "₹";

        const accountName = transaction.account || "Cash";
        const categoryName = typeof formatCategoryName === "function"
            ? formatCategoryName(transaction.category || "Other")
            : (transaction.category || "Other");

        item.className = "transaction";
        item.dataset.id = transaction.id;

        item.innerHTML = `
            <div class="note">
                <span style="font-size: 22px; flex-shrink: 0;">${icon}</span>
                <div style="overflow: hidden;">
                    <div style="font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                        ${transaction.note || categoryName}
                    </div>
                    <small style="display: flex; gap: 8px; align-items: center; margin-top: 2px;">
                        <span>🏷️ ${categoryName}</span>
                        <span>•</span>
                        <span>💳 ${accountName}</span>
                    </small>
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 6px;">
                <span class="amount ${transaction.type}">
                    ${transaction.type === "income" ? "+" : "-"} ${currencySymbol}${Number(transaction.amount).toLocaleString("en-IN")}
                </span>

                <button class="delete-btn" title="Delete transaction" aria-label="Delete">🗑</button>
            </div>
        `;

        list.appendChild(item);

        if (transaction.type === "income") {
            income += Number(transaction.amount) || 0;
        } else {
            expense += Number(transaction.amount) || 0;
        }

        // Delete with confirmation modal
        const delBtn = item.querySelector(".delete-btn");
        delBtn.onclick = (e) => {
            e.stopPropagation();
            if (typeof showConfirmModal === "function") {
                showConfirmModal({
                    title: "Delete Transaction?",
                    message: `Are you sure you want to remove "${transaction.note || categoryName}" (${currencySymbol}${transaction.amount})?`,
                    confirmText: "Delete",
                    danger: true,
                    onConfirm: () => {
                        deleteTransaction(transaction.id);
                        if (typeof showToast === "function") {
                            showToast("Transaction deleted", "info");
                        }
                        if (typeof onDelete === "function") onDelete();
                    }
                });
            } else {
                deleteTransaction(transaction.id);
                if (typeof onDelete === "function") onDelete();
            }
        };
    });

    const balance = income - expense;

    if (incomeEl) {
        if (typeof animateCounter === "function") animateCounter(incomeEl, income, 500, "", true);
        else incomeEl.textContent = formatCurrency(income);
    }
    if (expenseEl) {
        if (typeof animateCounter === "function") animateCounter(expenseEl, expense, 500, "", true);
        else expenseEl.textContent = formatCurrency(expense);
    }
    if (balanceEl) {
        if (typeof animateCounter === "function") animateCounter(balanceEl, balance, 500, "", true);
        else balanceEl.textContent = formatCurrency(balance);
    }

    if (balanceCard) {
        balanceCard.classList.remove("positive", "negative", "neutral");
        if (balance > 0) {
            balanceCard.classList.add("positive");
        } else if (balance < 0) {
            balanceCard.classList.add("negative");
        } else {
            balanceCard.classList.add("neutral");
        }
    }
}