/* CUSTOM CATEGORY STORAGE */

function getCustomCategories(){

    return JSON.parse(
        localStorage.getItem("customCategories")
    ) || [];

}

function saveCustomCategory(name, icon){

    const categories = getCustomCategories();

    const alreadyExists =
    categories.find(c =>
        c.name.toLowerCase() === name.toLowerCase()
    );

    if(!alreadyExists){

        categories.push({
            name,
            icon
        });

        localStorage.setItem(
            "customCategories",
            JSON.stringify(categories)
        );

    }

}
let currentFilter = "all";
const list = document.getElementById("transactionList");

const incomeEl = document.getElementById("incomeTotal");
const expenseEl = document.getElementById("expenseTotal");
const balanceEl = document.getElementById("balanceTotal");

const fab = document.getElementById("fab");
const modal = document.getElementById("transactionModal");

let type = "income";

const incomeBtn = document.getElementById("incomeBtn");
const expenseBtn = document.getElementById("expenseBtn");
const categorySelect =
document.getElementById("category");
/* LOAD SAVED CUSTOM CATEGORIES */

const savedCategories =
getCustomCategories();

savedCategories.forEach(cat => {

    const option =
    document.createElement("option");

    option.value = cat.name;

    /* remove emoji from dropdown */

    option.textContent = cat.name;

    /* keep OTHER at bottom */

    const otherOption =
    categorySelect.querySelector(
        'option[value="other"]'
    );

    categorySelect.insertBefore(
        option,
        otherOption
    );

});

const categoryIcon =
document.getElementById("categoryIcon");

const customCategoryInput =
document.getElementById("customCategory");

const saveBtn = document.getElementById("saveTransaction");

const todayDate = document.getElementById("todayDate");
const accountName = document.getElementById("accountName");
const homeBtn =
document.getElementById("homeBtn");

const homeMenu =
document.getElementById("homeMenu");

const iconMap = {
    food: "🍔",
    travel: "🚌",
    stocks: "📈",
    wage: "💼",
    shopping: "🛍"
};
categorySelect.onchange = () => {

    const value = categorySelect.value;

    /* check custom categories */

    const savedCustom =
    getCustomCategories().find(
        c => c.name === value
    );

    if(savedCustom){

        categoryIcon.textContent =
        savedCustom.icon;

    }
    else{

        categoryIcon.textContent =
        iconMap[value] || "💸";

    }

    if(value === "other"){

        customCategoryInput
        .classList.remove("hidden");

    }
    else{

        customCategoryInput
        .classList.add("hidden");

        customCategoryInput.value = "";

    }

};

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


const selectedDate = localStorage.getItem("selectedDate");

const currentDate = selectedDate ? new Date(selectedDate) : new Date();

const today = new Date();

const isToday =
    currentDate.toDateString() === today.toDateString();

const formattedDate = currentDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
});

todayDate.innerHTML = `
<span style="font-size:14px; opacity:0.7;">
    📅 ${isToday ? "Today" : ""}
</span><br>
<span style="font-size:18px; font-weight:600;">
    ${formattedDate}
</span>
`;

/* click to open calendar */

todayDate.onclick = () => {
    window.location.href = "calendar.html";
};


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

    let category = categorySelect.value;

if(category === "other"){

    category =
    customCategoryInput.value.trim() || "Other";

    /* SMART CAPITALIZATION */

    category =
    category.charAt(0).toUpperCase() +
    category.slice(1).toLowerCase();

    /* prevent duplicates */

    const alreadyExists =
    [...categorySelect.options].find(
        option =>
        option.value.toLowerCase() ===
        category.toLowerCase()
    );

    /* detect smart icon */

    let customIcon = "💸";

    const text = category.toLowerCase();

    if(text.includes("gym")){
        customIcon = "🏋️";
    }
    else if(text.includes("medicine")){
        customIcon = "💊";
    }
    else if(text.includes("petrol") ||
            text.includes("fuel")){
        customIcon = "⛽";
    }
    else if(text.includes("movie")){
        customIcon = "🎬";
    }
    else if(text.includes("book")){
        customIcon = "📚";
    }
    else if(text.includes("coffee")){
        customIcon = "☕";
    }

    saveCustomCategory(category, customIcon);

    /* ADD TO DROPDOWN */

    if(!alreadyExists){

        const option =
        document.createElement("option");

        option.value = category;

        /* no emoji in dropdown */

        option.textContent = category;

        /* keep OTHER at bottom */

        const otherOption =
        categorySelect.querySelector(
            'option[value="other"]'
        );

        categorySelect.insertBefore(
            option,
            otherOption
        );

    }
}

const transaction = {
    id: crypto.randomUUID(),
    type,
    amount,
    note,
    category,
    date: new Date().toISOString()
};

    addTransaction(transaction);

    /* clear inputs */

    document.getElementById("amount").value = "";
    document.getElementById("note").value = "";
    document.getElementById("category").value = "";

    /* close modal */

    modal.classList.add("hidden");

    render();
};


/* render transactions */

function render() {

    const transactions = getTransactions();

    list.innerHTML = "";

    let income = 0;
    let expense = 0;

    /* EMPTY STATE */

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

    /* NORMAL RENDER */

    transactions
.filter(t => currentFilter === "all" || t.type === currentFilter)
.reverse()
.forEach(t => {

        const item = document.createElement("div");

        item.className = "transaction";

        const icons = {
            food: "🍔",
            travel: "🚌",
            stocks: "📈",
            wage: "💼",
            shopping: "🛍"
        };

        let icon = icons[t.category];

/* smart custom icons */

const text =
(t.note || t.category || "").toLowerCase();

if(!icon){

    if(text.includes("gym")){
        icon = "🏋️";
    }
    else if(text.includes("medicine")){
        icon = "💊";
    }
    else if(text.includes("petrol") ||
            text.includes("fuel")){
        icon = "⛽";
    }
    else if(text.includes("movie")){
        icon = "🎬";
    }
    else if(text.includes("book")){
        icon = "📚";
    }
    else if(text.includes("coffee")){
        icon = "☕";
    }
    else if(text.includes("shopping")){
        icon = "🛍";
    }
    else{
        icon = "💸";
    }

}

        item.innerHTML = `
        <span class="note">
        ${icon} ${t.note || t.category || "Transaction"}
        </span>

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

    /* UPDATE TOTALS */

    const balance = income - expense;

    incomeEl.textContent = "₹" + income;
    expenseEl.textContent = "₹" + expense;
    balanceEl.textContent = "₹" + balance;

    /* GLOW LOGIC */

    const balanceCard = document.querySelector(".balance");

    balanceCard.classList.remove("positive", "negative", "neutral");

    if (balance > 0) {
        balanceCard.classList.add("positive");
    } else if (balance < 0) {
        balanceCard.classList.add("negative");
    } else {
        balanceCard.classList.add("neutral");
    }
}

render();


/* quick amount buttons */

document.querySelectorAll(".quick-amounts button").forEach(btn=>{
btn.onclick=()=>{
document.getElementById("amount").value=btn.dataset.amount
}
});

/* FILTER BUTTONS */

document.querySelectorAll(".filters button").forEach(btn => {

    btn.onclick = () => {

        document.querySelectorAll(".filters button")
        .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        currentFilter = btn.dataset.filter;

        render();
    };

});
/* HOME MENU TOGGLE */

homeBtn.onclick = () => {

    homeMenu.classList.toggle("hidden");

};

/* close when clicking outside */

document.addEventListener("click",(e)=>{

    if(
        !homeMenu.contains(e.target) &&
        e.target !== homeBtn
    ){

        homeMenu.classList.add("hidden");

    }

});