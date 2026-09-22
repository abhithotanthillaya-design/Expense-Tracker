/**
 * Category utilities and smart icon mapping
 */

const categoryIcons = {
    // Expense
    food: "🍔",
    travel: "🚌",
    transport: "🚗",
    stocks: "📈",
    wage: "💼",
    salary: "💰",
    shopping: "🛍️",
    bills: "🧾",
    utilities: "💡",
    entertainment: "🎬",
    education: "📚",
    health: "💊",
    medical: "🏥",
    subscriptions: "📺",
    groceries: "🛒",
    gym: "🏋️",
    personal: "✨",
    rent: "🏠",
    insurance: "🛡️",
    fuel: "⛽",
    coffee: "☕",
    // Income
    freelance: "💻",
    business: "🏢",
    allowance: "💵",
    gift: "🎁",
    investment: "📈",
    bonus: "🌟",
    interest: "🏦",
    other: "💸"
};

const categoryColors = {
    food: "#f97316",
    travel: "#06b6d4",
    transport: "#0ea5e9",
    stocks: "#10b981",
    wage: "#22c55e",
    salary: "#10b981",
    shopping: "#ec4899",
    bills: "#eab308",
    utilities: "#eab308",
    entertainment: "#a855f7",
    education: "#3b82f6",
    health: "#ef4444",
    medical: "#ef4444",
    subscriptions: "#8b5cf6",
    groceries: "#14b8a6",
    gym: "#f43f5e",
    rent: "#6366f1",
    fuel: "#f59e0b",
    freelance: "#3b82f6",
    business: "#0284c7",
    gift: "#d946ef",
    other: "#64748b"
};

function getCategoryIcon(category) {
    if (!category) return "💸";
    const key = category.toLowerCase().trim();
    if (categoryIcons[key]) return categoryIcons[key];

    // Check custom categories
    if (typeof getCustomCategories === "function") {
        const custom = getCustomCategories().find(c => c.name.toLowerCase() === key);
        if (custom && custom.icon) return custom.icon;
    }

    return getSmartCategoryIcon(key);
}

function getCategoryColor(category) {
    if (!category) return "#64748b";
    const key = category.toLowerCase().trim();
    return categoryColors[key] || "#64748b";
}

function getSmartCategoryIcon(value) {
    const text = (value || "").toLowerCase();

    if (text.includes("gym") || text.includes("workout") || text.includes("fitness")) return "🏋️";
    if (text.includes("medicine") || text.includes("doctor") || text.includes("health") || text.includes("pharmacy")) return "💊";
    if (text.includes("petrol") || text.includes("fuel") || text.includes("gas") || text.includes("diesel")) return "⛽";
    if (text.includes("movie") || text.includes("cinema") || text.includes("netflix") || text.includes("theatre")) return "🎬";
    if (text.includes("book") || text.includes("tuition") || text.includes("course") || text.includes("study")) return "📚";
    if (text.includes("coffee") || text.includes("cafe") || text.includes("starbucks")) return "☕";
    if (text.includes("shopping") || text.includes("clothes") || text.includes("amazon") || text.includes("flipkart")) return "🛍️";
    if (text.includes("food") || text.includes("restaurant") || text.includes("swiggy") || text.includes("zomato") || text.includes("dinner") || text.includes("lunch")) return "🍔";
    if (text.includes("groceries") || text.includes("market") || text.includes("vegetables") || text.includes("milk")) return "🛒";
    if (text.includes("bill") || text.includes("electricity") || text.includes("water") || text.includes("wifi") || text.includes("internet")) return "🧾";
    if (text.includes("uber") || text.includes("ola") || text.includes("bus") || text.includes("metro") || text.includes("train") || text.includes("flight") || text.includes("travel")) return "🚌";
    if (text.includes("rent") || text.includes("house") || text.includes("flat") || text.includes("pg")) return "🏠";
    if (text.includes("salary") || text.includes("wage") || text.includes("payroll")) return "💰";
    if (text.includes("freelance") || text.includes("client") || text.includes("project")) return "💻";
    if (text.includes("gift") || text.includes("birthday") || text.includes("present")) return "🎁";
    if (text.includes("stock") || text.includes("share") || text.includes("crypto") || text.includes("mutual fund") || text.includes("dividend")) return "📈";

    return "💸";
}

function formatCategoryName(name) {
    if (!name) return "Other";
    const category = name.trim();
    if (!category) return "Other";
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

function addCategoryOption(categorySelect, name) {
    if (!categorySelect || !name) return;
    const option = document.createElement("option");
    option.value = name.toLowerCase();
    option.textContent = formatCategoryName(name);

    const otherOption = categorySelect.querySelector('option[value="other"]');
    if (otherOption) {
        categorySelect.insertBefore(option, otherOption);
    } else {
        categorySelect.appendChild(option);
    }
}

function loadCustomCategories(categorySelect) {
    if (!categorySelect) return;
    if (typeof getCustomCategories === "function") {
        getCustomCategories().forEach(category => {
            const exists = [...categorySelect.options].some(opt => opt.value.toLowerCase() === category.name.toLowerCase());
            if (!exists) {
                addCategoryOption(categorySelect, category.name);
            }
        });
    }
}

// Available Default Categories for selection
const DEFAULT_EXPENSE_CATEGORIES = [
    { id: "food", name: "Food", icon: "🍔" },
    { id: "transport", name: "Transport", icon: "🚗" },
    { id: "shopping", name: "Shopping", icon: "🛍️" },
    { id: "bills", name: "Bills & Utilities", icon: "🧾" },
    { id: "entertainment", name: "Entertainment", icon: "🎬" },
    { id: "health", name: "Health & Medical", icon: "💊" },
    { id: "education", name: "Education", icon: "📚" },
    { id: "groceries", name: "Groceries", icon: "🛒" },
    { id: "subscriptions", name: "Subscriptions", icon: "📺" },
    { id: "travel", name: "Travel", icon: "✈️" },
    { id: "other", name: "Other", icon: "💸" }
];

const DEFAULT_INCOME_CATEGORIES = [
    { id: "salary", name: "Salary", icon: "💰" },
    { id: "wage", name: "Wage", icon: "💼" },
    { id: "freelance", name: "Freelance", icon: "💻" },
    { id: "business", name: "Business", icon: "🏢" },
    { id: "stocks", name: "Investments", icon: "📈" },
    { id: "allowance", name: "Allowance", icon: "💵" },
    { id: "gift", name: "Gift", icon: "🎁" },
    { id: "other", name: "Other", icon: "💸" }
];