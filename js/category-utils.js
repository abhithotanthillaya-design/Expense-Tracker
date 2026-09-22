const categoryIcons = {
    food: "🍔",
    travel: "🚌",
    stocks: "📈",
    wage: "💼",
    shopping: "🛍"
};

function getCategoryIcon(category) {
    return categoryIcons[category] || "💸";
}

function getSmartCategoryIcon(value) {
    const text = (value || "").toLowerCase();

    if (text.includes("gym")) return "🏋️";
    if (text.includes("medicine")) return "💊";
    if (text.includes("petrol") || text.includes("fuel")) return "⛽";
    if (text.includes("movie")) return "🎬";
    if (text.includes("book")) return "📚";
    if (text.includes("coffee")) return "☕";
    if (text.includes("shopping")) return "🛍";

    return "💸";
}

function formatCategoryName(name) {
    const category = name.trim() || "Other";

    return category.charAt(0).toUpperCase() +
        category.slice(1).toLowerCase();
}

function addCategoryOption(categorySelect, name) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;

    const otherOption = categorySelect.querySelector(
        'option[value="other"]'
    );

    categorySelect.insertBefore(option, otherOption);
}

function loadCustomCategories(categorySelect) {
    getCustomCategories().forEach(category => {
        addCategoryOption(categorySelect, category.name);
    });
}