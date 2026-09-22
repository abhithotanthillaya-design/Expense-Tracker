setupPeriodNavigation();

const requestedYear = localStorage.getItem("selectedYear");
const year = requestedYear ? Number(requestedYear) : new Date().getFullYear();
const yearStart = new Date(year, 0, 1);
const yearEnd = new Date(year + 1, 0, 1);
const yearTransactions = getRangeTransactions(yearStart, yearEnd);

document.getElementById("periodTitle").textContent = "Yearly Tracker";
document.getElementById("periodRange").textContent = String(year);

renderPeriodSummary(summarizeTransactions(yearTransactions));
renderCategorySummary(document.getElementById("categoryList"), yearTransactions);

const monthRows = [];
for (let month = 0; month < 12; month += 1) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);
    const monthTransactions = getRangeTransactions(monthStart, monthEnd);
    const summary = summarizeTransactions(monthTransactions);

    monthRows.push(`
        <a class="period-row period-link" href="monthly.html" data-month="${year}-${String(month + 1).padStart(2, "0")}">
            <span>${formatDate(monthStart, { month: "long" })}</span>
            <span>+ ${formatCurrency(summary.income)} &nbsp; - ${formatCurrency(summary.expense)}</span>
        </a>
    `);
}
renderPeriodRows(document.getElementById("breakdownList"), monthRows, "No months in this period");

document.querySelectorAll("[data-month]").forEach(link => {
    link.onclick = () => localStorage.setItem("selectedMonth", link.dataset.month);
});

document.getElementById("previousPeriod").onclick = () => {
    localStorage.setItem("selectedYear", String(year - 1));
    window.location.reload();
};

document.getElementById("nextPeriod").onclick = () => {
    localStorage.setItem("selectedYear", String(year + 1));
    window.location.reload();
};