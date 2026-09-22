/* elements */
const welcomeText = document.getElementById("welcomeText");
const incomeSection = document.getElementById("incomeSection");
const username = document.getElementById("username");
const cards = document.querySelectorAll(".card");
const currencySelect = document.getElementById("currencySelect");
const initialBalanceInput = document.getElementById("initialBalance");
const monthlyBudgetInput = document.getElementById("monthlyBudget");
const continueBtn = document.getElementById("continueBtn");
const skipBtn = document.getElementById("skipBtn");

let selectedIncomeType = localStorage.getItem("incomeType") || "monthly";

/* load saved preferences when page opens */
window.addEventListener("DOMContentLoaded", () => {
    const savedName = localStorage.getItem("username");
    if (savedName) {
        username.value = savedName;
    }

    if (typeof DataManager !== "undefined") {
        const settings = DataManager.getSettings();
        if (settings.currency && settings.currencySymbol && currencySelect) {
            const val = `${settings.currency}|${settings.currencySymbol}`;
            const opt = [...currencySelect.options].find(o => o.value === val);
            if (opt) currencySelect.value = val;
        }
        if (settings.monthlyBudget && monthlyBudgetInput) {
            monthlyBudgetInput.value = settings.monthlyBudget;
        }
    }

    // Highlight current active card
    cards.forEach(c => {
        if (c.dataset.type === selectedIncomeType) {
            c.classList.add("active-card");
        } else {
            c.classList.remove("active-card");
        }
    });

    resizeInput();
});

/* confetti on load */
window.addEventListener("load", () => {
    if (typeof confetti === "function") {
        confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 }
        });
    }
});

/* auto resize username input */
function resizeInput() {
    if (!username) return;
    const len = Math.max(username.value.length, 4);
    username.style.width = len + "ch";
}

username.addEventListener("input", () => {
    const name = username.value.trim();
    if (name) {
        localStorage.setItem("username", name);
    }
    resizeInput();
});

/* slide welcome text up */
setTimeout(() => {
    if (welcomeText) welcomeText.classList.add("moveUp");
    if (incomeSection) incomeSection.classList.remove("hidden");
}, 1200);

function saveAllSettings() {
    const name = (username.value || "").trim() || "User";
    localStorage.setItem("username", name);
    localStorage.setItem("incomeType", selectedIncomeType);
    localStorage.setItem("et_onboarded", "true");

    let currencyCode = "INR";
    let currencySymbol = "₹";
    if (currencySelect) {
        const [cCode, cSym] = currencySelect.value.split("|");
        currencyCode = cCode || "INR";
        currencySymbol = cSym || "₹";
    }

    const budget = Number(monthlyBudgetInput ? monthlyBudgetInput.value : 0) || 0;
    const initialBal = Number(initialBalanceInput ? initialBalanceInput.value : 0) || 0;

    if (typeof DataManager !== "undefined") {
        DataManager.saveSettings({
            username: name,
            incomeType: selectedIncomeType,
            currency: currencyCode,
            currencySymbol: currencySymbol,
            monthlyBudget: budget,
            onboarded: true
        });

        if (initialBal > 0) {
            const accounts = DataManager.getAccounts();
            if (accounts.length > 0) {
                accounts[0].initialBalance = initialBal;
                accounts[0].balance = initialBal;
                DataManager.saveAccounts(accounts);
            }
        }

        if (budget > 0) {
            DataManager.setBudget("Overall", budget);
        }
    }
}

/* select income type */
cards.forEach(card => {
    card.addEventListener("click", () => {
        cards.forEach(c => c.classList.remove("active-card"));
        card.classList.add("active-card");
        selectedIncomeType = card.dataset.type;
        localStorage.setItem("incomeType", selectedIncomeType);

        // Visual feedback
        if (typeof confetti === "function") {
            confetti({
                particleCount: 40,
                spread: 50,
                origin: { y: 0.7 }
            });
        }
    });
});

if (continueBtn) {
    continueBtn.addEventListener("click", () => {
        saveAllSettings();
        window.location.href = "dashboard.html";
    });
}

if (skipBtn) {
    skipBtn.addEventListener("click", () => {
        saveAllSettings();
        window.location.href = "dashboard.html";
    });
}