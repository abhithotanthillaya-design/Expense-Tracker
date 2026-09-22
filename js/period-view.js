/**
 * Shared period rendering functions for Weekly, Monthly, and Yearly trackers
 */

function setupPeriodNavigation() {
    const menuBtn = document.getElementById("menuBtn");
    const menuPopup = document.getElementById("menuPopup");
    const savedName = localStorage.getItem("username") || "User";
    const incomeType = localStorage.getItem("incomeType") || "Daily";
    const accountName = document.getElementById("accountName");

    if (accountName) {
        accountName.textContent =
            `${savedName}'s ${incomeType.charAt(0).toUpperCase() + incomeType.slice(1)} Tracker`;
    }

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
}

function renderPeriodSummary(summary) {
    const incEl = document.getElementById("incomeTotal");
    const expEl = document.getElementById("expenseTotal");
    const balEl = document.getElementById("balanceTotal");
    const balanceCard = document.querySelector(".balance");

    const balance = getBalance(summary);

    if (typeof animateCounter === "function") {
        animateCounter(incEl, summary.income, 500, "", true);
        animateCounter(expEl, summary.expense, 500, "", true);
        animateCounter(balEl, balance, 500, "", true);
    } else {
        if (incEl) incEl.textContent = formatCurrency(summary.income);
        if (expEl) expEl.textContent = formatCurrency(summary.expense);
        if (balEl) balEl.textContent = formatCurrency(balance);
    }

    if (balanceCard) {
        balanceCard.classList.remove("positive", "negative", "neutral");
        balanceCard.classList.add(balance > 0 ? "positive" : balance < 0 ? "negative" : "neutral");
    }
}

function renderCategorySummary(container, transactions) {
    if (!container) return;

    const totals = getCategoryTotals(transactions);
    const categories = Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
    const totalExp = Object.values(totals).reduce((sum, v) => sum + v, 0);

    if (categories.length === 0) {
        container.innerHTML = '<p class="period-empty">No expenses recorded in this period</p>';
        return;
    }

    container.innerHTML = categories.map(category => {
        const amt = totals[category];
        const pct = totalExp > 0 ? Math.round((amt / totalExp) * 100) : 0;
        const icon = typeof getCategoryIcon === "function" ? getCategoryIcon(category) : "💸";
        const catName = typeof formatCategoryName === "function" ? formatCategoryName(category) : category;

        return `
            <div class="period-row">
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-weight: 600;">${icon} ${catName}</span>
                        <strong style="color: var(--expense); font-family: 'Outfit', sans-serif;">${formatCurrency(amt)}</strong>
                    </div>
                    <div class="progress-track" style="margin: 0;">
                        <div class="progress-fill warning" style="width: ${pct}%;"></div>
                    </div>
                    <small style="opacity: 0.65; margin-top: 3px; font-size: 11px;">${pct}% of period expenses</small>
                </div>
            </div>
        `;
    }).join("");
}

function renderPeriodRows(container, rows, emptyText) {
    if (!container) return;
    container.innerHTML = rows.length
        ? rows.join("")
        : `<p class="period-empty">${emptyText}</p>`;
}