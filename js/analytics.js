/**
 * Analytics & Interactive Charts Controller (using Chart.js)
 */

let activePeriod = "monthly";
let chartIncomeExpense = null;
let chartCategory = null;
let chartTrend = null;
let chartAccounts = null;

document.addEventListener("DOMContentLoaded", () => {
    setupChartDefaults();
    bindPeriodSelector();
    renderAnalytics();
});

function setupChartDefaults() {
    if (typeof Chart === "undefined") return;

    Chart.defaults.color = "#94a3b8";
    Chart.defaults.font.family = "'Plus Jakarta Sans', 'Outfit', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.tooltip.backgroundColor = "rgba(8, 14, 45, 0.95)";
    Chart.defaults.plugins.tooltip.titleColor = "#ffd36a";
    Chart.defaults.plugins.tooltip.borderColor = "rgba(255, 211, 106, 0.3)";
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
}

function bindPeriodSelector() {
    document.querySelectorAll(".filters button[data-period]").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".filters button[data-period]").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activePeriod = btn.dataset.period;
            renderAnalytics();
        };
    });
}

function renderAnalytics() {
    const allTxs = typeof getAllTransactions === "function" ? getAllTransactions() : [];

    const periodData = aggregatePeriodData(allTxs, activePeriod);

    renderSummaryStats(periodData.totalIncome, periodData.totalExpense);
    renderSmartInsightsGrid(allTxs, periodData);
    renderIncomeExpenseChart(periodData);
    renderCategoryDonutChart(periodData);
    renderSpendingTrendChart(periodData);
    renderAccountsBarChart();
}

function aggregatePeriodData(transactions, period) {
    const now = new Date();
    let labels = [];
    let incomeData = [];
    let expenseData = [];
    let netData = [];
    let periodTransactions = [];

    if (period === "daily") {
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = addDays(now, -i);
            const key = dateKey(d);
            const label = formatDate(d, { weekday: "short", day: "numeric" });
            labels.push(label);

            const dayTxs = transactions.filter(t => dateKey(parseTransactionDate(t)) === key);
            periodTransactions.push(...dayTxs);
            const s = summarizeTransactions(dayTxs);
            incomeData.push(s.income);
            expenseData.push(s.expense);
            netData.push(s.income - s.expense);
        }
    } else if (period === "weekly") {
        // Last 4 weeks
        const curWeekStart = getWeekStart(now);
        for (let i = 3; i >= 0; i--) {
            const wStart = addDays(curWeekStart, -i * 7);
            const wEnd = addDays(wStart, 7);
            const label = `${formatDate(wStart, { day: "numeric", month: "short" })} - ${formatDate(addDays(wEnd, -1), { day: "numeric", month: "short" })}`;
            labels.push(label);

            const wTxs = transactions.filter(t => {
                const td = parseTransactionDate(t);
                return td >= wStart && td < wEnd;
            });
            periodTransactions.push(...wTxs);
            const s = summarizeTransactions(wTxs);
            incomeData.push(s.income);
            expenseData.push(s.expense);
            netData.push(s.income - s.expense);
        }
    } else if (period === "yearly") {
        // Last 3 years
        const curYear = now.getFullYear();
        for (let i = 2; i >= 0; i--) {
            const yr = curYear - i;
            labels.push(String(yr));
            const yStart = new Date(yr, 0, 1);
            const yEnd = new Date(yr + 1, 0, 1);

            const yTxs = transactions.filter(t => {
                const td = parseTransactionDate(t);
                return td >= yStart && td < yEnd;
            });
            periodTransactions.push(...yTxs);
            const s = summarizeTransactions(yTxs);
            incomeData.push(s.income);
            expenseData.push(s.expense);
            netData.push(s.income - s.expense);
        }
    } else {
        // Monthly (Last 6 months default)
        for (let i = 5; i >= 0; i--) {
            const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mStart = getMonthStart(mDate);
            const mEnd = getMonthEnd(mDate);
            labels.push(formatDate(mStart, { month: "short", year: "2-digit" }));

            const mTxs = transactions.filter(t => {
                const td = parseTransactionDate(t);
                return td >= mStart && td < mEnd;
            });
            periodTransactions.push(...mTxs);
            const s = summarizeTransactions(mTxs);
            incomeData.push(s.income);
            expenseData.push(s.expense);
            netData.push(s.income - s.expense);
        }
    }

    const totalIncome = incomeData.reduce((a, b) => a + b, 0);
    const totalExpense = expenseData.reduce((a, b) => a + b, 0);

    return {
        labels,
        incomeData,
        expenseData,
        netData,
        totalIncome,
        totalExpense,
        transactions: periodTransactions
    };
}

function renderSummaryStats(income, expense) {
    const incEl = document.getElementById("analyticsIncome");
    const expEl = document.getElementById("analyticsExpense");
    const netEl = document.getElementById("analyticsNetSavings");

    if (incEl) animateCounter(incEl, income, 500, "", true);
    if (expEl) animateCounter(expEl, expense, 500, "", true);
    if (netEl) animateCounter(netEl, income - expense, 500, "", true);
}

function renderSmartInsightsGrid(allTxs, periodData) {
    const grid = document.getElementById("smartInsightsGrid");
    if (!grid) return;

    if (allTxs.length === 0) {
        grid.innerHTML = `
            <div class="glass-panel" style="grid-column: 1 / -1; text-align: center; padding: 30px;">
                <p style="font-size: 24px;">📊</p>
                <p style="font-size: 15px; font-weight: 600;">No transactions available for insights</p>
                <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Record expenses or income to generate personalized analytics.</p>
            </div>
        `;
        return;
    }

    const catTotals = getCategoryTotals(periodData.transactions, "expense");
    const topCats = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]);
    const topCatName = topCats[0] || "Other";
    const topCatAmt = catTotals[topCatName] || 0;

    // Largest expense
    const expensesOnly = periodData.transactions.filter(t => t.type === "expense");
    const biggestExp = expensesOnly.reduce((max, t) => (t.amount > (max ? max.amount : 0) ? t : max), null);

    // Savings Rate
    const savingsRate = getSavingsRate(periodData.totalIncome, periodData.totalExpense);

    // Daily Average
    const numDays = activePeriod === "daily" ? 7 : activePeriod === "weekly" ? 28 : activePeriod === "yearly" ? 365 : 180;
    const dailyAvg = Math.round(periodData.totalExpense / numDays);

    grid.innerHTML = `
        <div class="glass-panel" style="display: flex; align-items: flex-start; gap: 14px;">
            <span style="font-size: 28px;">🏆</span>
            <div>
                <h4 style="font-size: 14px; font-weight: 700; color: var(--gold);">Highest Expense Category</h4>
                <p style="font-size: 16px; font-weight: 700; margin: 4px 0;">${getCategoryIcon(topCatName)} ${formatCategoryName(topCatName)}</p>
                <p style="font-size: 12px; color: var(--text-muted);">${formatCurrency(topCatAmt)} spent in this period</p>
            </div>
        </div>

        <div class="glass-panel" style="display: flex; align-items: flex-start; gap: 14px;">
            <span style="font-size: 28px;">💎</span>
            <div>
                <h4 style="font-size: 14px; font-weight: 700; color: var(--income);">Largest Single Expense</h4>
                <p style="font-size: 16px; font-weight: 700; margin: 4px 0;">${biggestExp ? (biggestExp.note || biggestExp.category) : "None"}</p>
                <p style="font-size: 12px; color: var(--text-muted);">${biggestExp ? formatCurrency(biggestExp.amount) : "₹0"}</p>
            </div>
        </div>

        <div class="glass-panel" style="display: flex; align-items: flex-start; gap: 14px;">
            <span style="font-size: 28px;">🎯</span>
            <div>
                <h4 style="font-size: 14px; font-weight: 700; color: #38bdf8;">Savings Performance</h4>
                <p style="font-size: 16px; font-weight: 700; margin: 4px 0;">${savingsRate}% Net Savings</p>
                <p style="font-size: 12px; color: var(--text-muted);">${savingsRate >= 20 ? "On target (>20% benchmark)" : "Below recommended 20% target"}</p>
            </div>
        </div>

        <div class="glass-panel" style="display: flex; align-items: flex-start; gap: 14px;">
            <span style="font-size: 28px;">⚡</span>
            <div>
                <h4 style="font-size: 14px; font-weight: 700; color: #f43f5e;">Average Burn Rate</h4>
                <p style="font-size: 16px; font-weight: 700; margin: 4px 0;">~${formatCurrency(dailyAvg)} / day</p>
                <p style="font-size: 12px; color: var(--text-muted);">Calculated over selected period</p>
            </div>
        </div>
    `;
}

function renderIncomeExpenseChart(data) {
    const canvas = document.getElementById("incomeExpenseChart");
    if (!canvas || typeof Chart === "undefined") return;

    if (chartIncomeExpense) chartIncomeExpense.destroy();

    const ctx = canvas.getContext("2d");
    chartIncomeExpense = new Chart(ctx, {
        type: "bar",
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: "Income",
                    data: data.incomeData,
                    backgroundColor: "rgba(34, 197, 94, 0.75)",
                    borderColor: "#22c55e",
                    borderWidth: 1,
                    borderRadius: 6
                },
                {
                    label: "Expense",
                    data: data.expenseData,
                    backgroundColor: "rgba(239, 68, 68, 0.75)",
                    borderColor: "#ef4444",
                    borderWidth: 1,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false } },
                y: {
                    grid: { color: "rgba(255, 255, 255, 0.06)" },
                    ticks: { callback: v => formatCurrency(v) }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
                    }
                }
            }
        }
    });
}

function renderCategoryDonutChart(data) {
    const canvas = document.getElementById("categoryDonutChart");
    if (!canvas || typeof Chart === "undefined") return;

    if (chartCategory) chartCategory.destroy();

    const catTotals = getCategoryTotals(data.transactions, "expense");
    const labels = Object.keys(catTotals);
    const values = Object.values(catTotals);

    if (labels.length === 0) {
        labels.push("No Expenses");
        values.push(1);
    }

    const colors = labels.map(c => getCategoryColor(c));

    const ctx = canvas.getContext("2d");
    chartCategory = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels.map(c => formatCategoryName(c)),
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: "#08102d",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "right", labels: { boxWidth: 12, padding: 10 } },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.label}: ${formatCurrency(ctx.raw)}`
                    }
                }
            }
        }
    });
}

function renderSpendingTrendChart(data) {
    const canvas = document.getElementById("spendingTrendChart");
    if (!canvas || typeof Chart === "undefined") return;

    if (chartTrend) chartTrend.destroy();

    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, "rgba(239, 68, 68, 0.35)");
    gradient.addColorStop(1, "rgba(239, 68, 68, 0.0)");

    chartTrend = new Chart(ctx, {
        type: "line",
        data: {
            labels: data.labels,
            datasets: [{
                label: "Expense Trend",
                data: data.expenseData,
                borderColor: "#ef4444",
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: "#ffd36a",
                pointBorderColor: "#ef4444",
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false } },
                y: {
                    grid: { color: "rgba(255, 255, 255, 0.06)" },
                    ticks: { callback: v => formatCurrency(v) }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => ` Spending: ${formatCurrency(ctx.raw)}`
                    }
                }
            }
        }
    });
}

function renderAccountsBarChart() {
    const canvas = document.getElementById("accountsBarChart");
    if (!canvas || typeof Chart === "undefined" || typeof DataManager === "undefined") return;

    if (chartAccounts) chartAccounts.destroy();

    const accounts = DataManager.getAccounts();
    const labels = accounts.map(a => `${a.icon || "💳"} ${a.name}`);
    const balances = accounts.map(a => a.balance);

    const ctx = canvas.getContext("2d");
    chartAccounts = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Account Balance",
                data: balances,
                backgroundColor: balances.map(b => b < 0 ? "rgba(239, 68, 68, 0.7)" : "rgba(56, 189, 248, 0.7)"),
                borderColor: balances.map(b => b < 0 ? "#ef4444" : "#38bdf8"),
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { color: "rgba(255, 255, 255, 0.06)" },
                    ticks: { callback: v => formatCurrency(v) }
                },
                y: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` Balance: ${formatCurrency(ctx.raw)}`
                    }
                }
            }
        }
    });
}
