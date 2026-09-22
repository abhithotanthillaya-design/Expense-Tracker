function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function dateKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function parseTransactionDate(transaction) {
    const date = new Date(transaction.date);
    return startOfDay(date);
}

function getWeekStart(date) {
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    return addDays(startOfDay(date), mondayOffset);
}

function getRangeTransactions(start, end) {
    return getAllTransactions().filter(transaction => {
        const transactionDate = parseTransactionDate(transaction);
        return transactionDate >= start && transactionDate < end;
    });
}

function summarizeTransactions(transactions) {
    return transactions.reduce((summary, transaction) => {
        if (transaction.type === "income") {
            summary.income += transaction.amount;
        } else {
            summary.expense += transaction.amount;
        }

        return summary;
    }, { income: 0, expense: 0 });
}

function getBalance(summary) {
    return summary.income - summary.expense;
}

function getCategoryTotals(transactions) {
    return transactions
        .filter(transaction => transaction.type === "expense")
        .reduce((totals, transaction) => {
            const category = transaction.category || "Other";
            totals[category] = (totals[category] || 0) + transaction.amount;
            return totals;
        }, {});
}

function formatCurrency(amount) {
    return "₹" + amount;
}

function formatDate(date, options) {
    return date.toLocaleDateString("en-IN", options);
}

function transactionsForDate(transactions, date) {
    const key = dateKey(date);
    return transactions.filter(transaction =>
        dateKey(parseTransactionDate(transaction)) === key
    );
}