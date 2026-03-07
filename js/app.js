const list = document.getElementById("transactionList");

const incomeEl = document.getElementById("incomeTotal");
const expenseEl = document.getElementById("expenseTotal");
const balanceEl = document.getElementById("balanceTotal");

const fab = document.getElementById("fab");
const modal = document.getElementById("transactionModal");
const saveBtn = document.getElementById("saveTransaction");

const todayDate = document.getElementById("todayDate");

todayDate.textContent = new Date().toDateString();


fab.onclick = () => {
    modal.classList.remove("hidden");
};


saveBtn.onclick = () => {

    const type = document.getElementById("type").value;
    const amount = Number(document.getElementById("amount").value);
    const note = document.getElementById("note").value;

    if (!amount) return;

    const transaction = {
        id: crypto.randomUUID(),
        type,
        amount,
        note,
        date: new Date().toISOString()
    };

    addTransaction(transaction);

    modal.classList.add("hidden");

    render();
};


function render() {

    const transactions = getTodayTransactions();

    list.innerHTML = "";

    let income = 0;
    let expense = 0;

    transactions.reverse().forEach(t => {

        const item = document.createElement("div");

        item.className = "transaction";

        item.innerHTML = `
        <span>${t.note || "Transaction"}</span>
        <span class="${t.type}">
        ${t.type === "income" ? "+" : "-"} ₹${t.amount}
        </span>
        <button class="delete-btn" data-id="${t.id}">🗑</button>
        `;

        list.appendChild(item);

        if (t.type === "income") {
            income += t.amount;
        } else {
            expense += t.amount;
        }
        const deleteBtn = item.querySelector(".delete-btn");

        deleteBtn.onclick = () => {

        deleteTransaction(t.id);

        render();

        };

    });

    incomeEl.textContent = "₹" + income;
    expenseEl.textContent = "₹" + expense;
    balanceEl.textContent = "₹" + (income - expense);
}

render();