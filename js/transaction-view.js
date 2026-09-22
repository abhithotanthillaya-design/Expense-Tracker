function renderTransactions({
    list,
    incomeEl,
    expenseEl,
    balanceEl,
    balanceCard,
    currentFilter,
    onDelete
}) {
    const transactions = getTransactions();

    list.innerHTML = "";

    let income = 0;
    let expense = 0;

    if (transactions.length === 0) {
        list.innerHTML = `
        <div class="empty-state">
            <p style="font-size:18px;">📭 No transactions yet</p>
            <p style="opacity:0.6;">Tap + to add your first entry</p>
        </div>
        `;

        incomeEl.textContent = "₹0";
        expenseEl.textContent = "₹0";
        balanceEl.textContent = "₹0";
        return;
    }

    transactions
        .filter(transaction =>
            currentFilter === "all" || transaction.type === currentFilter
        )
        .reverse()
        .forEach(transaction => {
            const item = document.createElement("div");
            const standardIcon = getCategoryIcon(transaction.category);
            const icon = standardIcon === "💸"
                ? getSmartCategoryIcon(
                    transaction.note || transaction.category
                )
                : standardIcon;

            item.className = "transaction";
            item.innerHTML = `
        <span class="note">
        ${icon} ${transaction.note || transaction.category || "Transaction"}
        </span>

        <span class="amount ${transaction.type}">
        ${transaction.type === "income" ? "+" : "-"} ₹${transaction.amount}
        </span>

        <button class="delete-btn" title="Delete transaction">🗑</button>
        `;

            list.appendChild(item);

            if (transaction.type === "income") {
                income += transaction.amount;
            } else {
                expense += transaction.amount;
            }

            item.querySelector(".delete-btn").onclick = () => {
                deleteTransaction(transaction.id);
                onDelete();
            };
        });

    const balance = income - expense;

    incomeEl.textContent = "₹" + income;
    expenseEl.textContent = "₹" + expense;
    balanceEl.textContent = "₹" + balance;

    balanceCard.classList.remove("positive", "negative", "neutral");

    if (balance > 0) {
        balanceCard.classList.add("positive");
    } else if (balance < 0) {
        balanceCard.classList.add("negative");
    } else {
        balanceCard.classList.add("neutral");
    }
}