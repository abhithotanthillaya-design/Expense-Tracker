const list = document.getElementById("transactionList");

const incomeEl = document.getElementById("incomeTotal");
const expenseEl = document.getElementById("expenseTotal");
const balanceEl = document.getElementById("balanceTotal");

const fab = document.getElementById("fab");
const modal = document.getElementById("transactionModal");

let type = "income";

const incomeBtn = document.getElementById("incomeBtn");
const expenseBtn = document.getElementById("expenseBtn");

const saveBtn = document.getElementById("saveTransaction");

const todayDate = document.getElementById("todayDate");
const accountName = document.getElementById("accountName");


/* toggle income / expense */

incomeBtn.onclick = () => {
    type = "income";
    incomeBtn.classList.add("active");
    expenseBtn.classList.remove("active");
};

expenseBtn.onclick = () => {
    type = "expense";
    expenseBtn.classList.add("active");
    incomeBtn.classList.remove("active");
};


/* show today's date */

todayDate.textContent = new Date().toDateString();


/* show username + income type */

const savedName = localStorage.getItem("username") || "User";
const incomeType = localStorage.getItem("incomeType") || "Daily";

accountName.textContent =
`${savedName}'s ${incomeType.charAt(0).toUpperCase() + incomeType.slice(1)} Tracker`;


/* open modal */

fab.onclick = () => {
    modal.classList.remove("hidden");
};


/* close modal if background clicked */

modal.addEventListener("click",(e)=>{

    if(e.target === modal){
        modal.classList.add("hidden");
    }

});


/* save transaction */

saveBtn.onclick = () => {

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

    /* clear inputs */

    document.getElementById("amount").value = "";
    document.getElementById("note").value = "";

    /* close modal */

    modal.classList.add("hidden");

    render();
};


/* render transactions */

function render() {

    const transactions = getTodayTransactions();

    list.innerHTML = "";

    let income = 0;
    let expense = 0;

    transactions.reverse().forEach(t => {

        const item = document.createElement("div");

        item.className = "transaction";

        item.innerHTML = `
        <span class="note">${t.note || "Transaction"}</span>

        <span class="amount ${t.type}">
        ${t.type === "income" ? "+" : "-"} ₹${t.amount}
        </span>

        <button class="delete-btn" title="Delete transaction">🗑</button>
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


/* quick amount buttons */

document.querySelectorAll(".quick-amounts button").forEach(btn=>{
btn.onclick=()=>{
document.getElementById("amount").value=btn.dataset.amount
}
});