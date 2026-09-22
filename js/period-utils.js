/**
 * Period calculations, date ranges, and aggregation utilities
 */

function startOfDay(date) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function dateKey(date) {
    const d = new Date(date);
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");
}

function parseTransactionDate(transaction) {
    if (!transaction || !transaction.date) return startOfDay(new Date());
    const date = new Date(transaction.date);
    if (isNaN(date.getTime())) return startOfDay(new Date());
    return startOfDay(date);
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    return addDays(startOfDay(d), mondayOffset);
}

function getMonthStart(date) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function getMonthEnd(date) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

function getYearStart(date) {
    const d = new Date(date);
    return new Date(d.getFullYear(), 0, 1);
}

function getYearEnd(date) {
    const d = new Date(date);
    return new Date(d.getFullYear() + 1, 0, 1);
}

function getRangeTransactions(start, end) {
    const all = typeof getAllTransactions === "function" ? getAllTransactions() : [];
    return all.filter(transaction => {
        const transactionDate = parseTransactionDate(transaction);
        return transactionDate >= start && transactionDate < end;
    });
}

function summarizeTransactions(transactions) {
    if (!Array.isArray(transactions)) return { income: 0, expense: 0, balance: 0 };
    const summary = transactions.reduce((acc, transaction) => {
        const amt = Number(transaction.amount) || 0;
        if (transaction.type === "income") {
            acc.income += amt;
        } else {
            acc.expense += amt;
        }
        return acc;
    }, { income: 0, expense: 0 });

    summary.balance = summary.income - summary.expense;
    return summary;
}

function getBalance(summary) {
    if (!summary) return 0;
    return (summary.income || 0) - (summary.expense || 0);
}

function getCategoryTotals(transactions, type = "expense") {
    if (!Array.isArray(transactions)) return {};
    return transactions
        .filter(transaction => transaction.type === type)
        .reduce((totals, transaction) => {
            const category = transaction.category || "Other";
            totals[category] = (totals[category] || 0) + (Number(transaction.amount) || 0);
            return totals;
        }, {});
}

function formatCurrency(amount) {
    const num = Number(amount) || 0;
    let symbol = "₹";
    try {
        if (typeof DataManager !== "undefined" && DataManager.getCurrencySymbol) {
            symbol = DataManager.getCurrencySymbol();
        } else {
            const raw = localStorage.getItem("et_settings");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.currencySymbol) symbol = parsed.currencySymbol;
            }
        }
    } catch (e) {}

    // Clean Indian / International formatting
    const formatted = Math.abs(num).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

    return (num < 0 ? "-" : "") + symbol + formatted;
}

function formatDate(date, options) {
    const d = new Date(date);
    return d.toLocaleDateString("en-IN", options || {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function transactionsForDate(transactions, date) {
    const key = dateKey(date);
    if (!Array.isArray(transactions)) return [];
    return transactions.filter(transaction =>
        dateKey(parseTransactionDate(transaction)) === key
    );
}

function getSavingsRate(income, expense) {
    const inc = Number(income) || 0;
    const exp = Number(expense) || 0;
    if (inc <= 0) return 0;
    const rate = Math.round(((inc - exp) / inc) * 100);
    return Math.max(0, rate);
}

function getPercentageChange(current, previous) {
    const cur = Number(current) || 0;
    const prev = Number(previous) || 0;
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
}