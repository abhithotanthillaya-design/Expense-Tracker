function getSelectedDateKey() {

    const selectedDate = localStorage.getItem("selectedDate");

    const date = selectedDate ? new Date(selectedDate) : new Date();

    return date.toISOString().split("T")[0]; // format: YYYY-MM-DD
}


/* GET transactions for that date */

function getTransactions() {

    const key = "transactions_" + getSelectedDateKey();

    return JSON.parse(localStorage.getItem(key)) || [];
}


/* ADD transaction */

function addTransaction(transaction) {

    const key = "transactions_" + getSelectedDateKey();

    const transactions = getTransactions();

    transactions.push(transaction);

    localStorage.setItem(key, JSON.stringify(transactions));
}


/* DELETE transaction */

function deleteTransaction(id) {

    const key = "transactions_" + getSelectedDateKey();

    let transactions = getTransactions();

    transactions = transactions.filter(t => t.id !== id);

    localStorage.setItem(key, JSON.stringify(transactions));
}