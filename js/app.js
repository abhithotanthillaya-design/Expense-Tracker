let currentFilter = "all";
let type = "income";

const list = document.getElementById("transactionList");
const incomeEl = document.getElementById("incomeTotal");
const expenseEl = document.getElementById("expenseTotal");
const balanceEl = document.getElementById("balanceTotal");
const balanceCard = document.querySelector(".balance");
const fab = document.getElementById("fab");
const modal = document.getElementById("transactionModal");
const incomeBtn = document.getElementById("incomeBtn");
const expenseBtn = document.getElementById("expenseBtn");
const categorySelect = document.getElementById("category");
const categoryIcon = document.getElementById("categoryIcon");
const customCategoryInput = document.getElementById("customCategory");
const saveBtn = document.getElementById("saveTransaction");
const todayDate = document.getElementById("todayDate");
const accountName = document.getElementById("accountName");
const menuBtn = document.getElementById("menuBtn");
const menuPopup = document.getElementById("menuPopup");

loadCustomCategories(categorySelect);

categorySelect.onchange = () => {
    const value = categorySelect.value;
    const savedCustom = getCustomCategories().find(
        category => category.name === value
    );

    categoryIcon.textContent = savedCustom
        ? savedCustom.icon
        : getCategoryIcon(value);

    if (value === "other") {
        if (!customCategoryInput) return;
        customCategoryInput.classList.add("show");
    } else {
        if (!customCategoryInput) return;
        customCategoryInput.classList.remove("show");
        customCategoryInput.value = "";
    }
};

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
const isToday = currentDate.toDateString() === today.toDateString();
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

todayDate.onclick = () => {
    window.location.href = "calendar.html";
};

const savedName = localStorage.getItem("username") || "User";
const incomeType = localStorage.getItem("incomeType") || "Daily";
accountName.textContent =
    `${savedName}'s ${incomeType.charAt(0).toUpperCase() + incomeType.slice(1)} Tracker`;

fab.onclick = () => {
    modal.classList.remove("hidden");
    modal.classList.remove("modal-hidden");
};

modal.addEventListener("click", event => {
    if (event.target === modal) {
        modal.classList.add("modal-hidden");
    }
});

function render() {
    renderTransactions({
        list,
        incomeEl,
        expenseEl,
        balanceEl,
        balanceCard,
        currentFilter,
        onDelete: render
    });
}

saveBtn.onclick = () => {
    const amount = Number(document.getElementById("amount").value);
    const note = document.getElementById("note").value;

    if (!amount) return;

    let category = categorySelect.value;

    if (category === "other") {
        category = formatCategoryName(customCategoryInput.value);

        const alreadyExists = [...categorySelect.options].find(option =>
            option.value.toLowerCase() === category.toLowerCase()
        );
        const customIcon = getSmartCategoryIcon(category);

        saveCustomCategory(category, customIcon);

        if (!alreadyExists) {
            addCategoryOption(categorySelect, category);
        }
    }

    addTransaction({
        id: crypto.randomUUID(),
        type,
        amount,
        note,
        category,
        date: new Date().toISOString()
    });

    document.getElementById("amount").value = "";
    document.getElementById("note").value = "";
    document.getElementById("category").value = "";
    customCategoryInput.value = "";
    customCategoryInput.classList.remove("show");
    modal.classList.add("modal-hidden");

    render();
};

render();

document.querySelectorAll(".quick-amounts button").forEach(button => {
    button.onclick = () => {
        document.getElementById("amount").value = button.dataset.amount;
    };
});

document.querySelectorAll(".filters button").forEach(button => {
    button.onclick = () => {
        document.querySelectorAll(".filters button")
            .forEach(filterButton => filterButton.classList.remove("active"));

        button.classList.add("active");
        currentFilter = button.dataset.filter;
        render();
    };
});

if (menuBtn && menuPopup) {
    menuBtn.onclick = () => {
        menuPopup.classList.toggle("show");
    };

    document.addEventListener("click", event => {
        if (!menuPopup.contains(event.target) && event.target !== menuBtn) {
            menuPopup.classList.remove("show");
        }
    });
}