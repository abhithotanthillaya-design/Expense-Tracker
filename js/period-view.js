function setupPeriodNavigation() {
    const menuBtn = document.getElementById("menuBtn");
    const menuPopup = document.getElementById("menuPopup");
    const savedName = localStorage.getItem("username") || "User";
    const incomeType = localStorage.getItem("incomeType") || "Daily";
    const accountName = document.getElementById("accountName");

    accountName.textContent =
        `${savedName}'s ${incomeType.charAt(0).toUpperCase() + incomeType.slice(1)} Tracker`;

    menuBtn.onclick = () => {
        menuPopup.classList.toggle("show");
    };

    document.addEventListener("click", event => {
        if (!menuPopup.contains(event.target) && event.target !== menuBtn) {
            menuPopup.classList.remove("show");
        }
    });
}

function renderPeriodSummary(summary) {
    document.getElementById("incomeTotal").textContent =
        formatCurrency(summary.income);
    document.getElementById("expenseTotal").textContent =
        formatCurrency(summary.expense);
    document.getElementById("balanceTotal").textContent =
        formatCurrency(getBalance(summary));

    const balanceCard = document.querySelector(".balance");
    const balance = getBalance(summary);
    balanceCard.classList.remove("positive", "negative", "neutral");
    balanceCard.classList.add(balance > 0 ? "positive" : balance < 0 ? "negative" : "neutral");
}

function renderCategorySummary(container, transactions) {
    const totals = getCategoryTotals(transactions);
    const categories = Object.keys(totals).sort((a, b) => totals[b] - totals[a]);

    container.innerHTML = categories.length
        ? categories.map(category => `
            <div class="period-row">
                <span>${getCategoryIcon(category)} ${category}</span>
                <strong>${formatCurrency(totals[category])}</strong>
            </div>
        `).join("")
        : '<p class="period-empty">No expenses in this period</p>';
}

function renderPeriodRows(container, rows, emptyText) {
    container.innerHTML = rows.length
        ? rows.join("")
        : `<p class="period-empty">${emptyText}</p>`;
}