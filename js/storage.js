function getTransactions() {
    const data = localStorage.getItem("transactions");
    return data ? JSON.parse(data) : [];
}

function saveTransactions(transactions) {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

function addTransaction(transaction) {
    const transactions = getTransactions();
    transactions.push(transaction);
    saveTransactions(transactions);
}

function getTodayTransactions() {

    const transactions = getTransactions();

    const today = new Date().toISOString().split("T")[0];

    return transactions.filter(t => t.date.startsWith(today));
}
function deleteTransaction(id) {

const transactions = getTransactions();

const updated = transactions.filter(t => t.id !== id);

saveTransactions(updated);

}