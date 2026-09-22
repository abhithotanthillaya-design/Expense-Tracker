setupPeriodNavigation();

const requestedMonth = localStorage.getItem("selectedMonth");
const monthDate = requestedMonth
    ? new Date(requestedMonth + "-01T00:00:00")
    : new Date();
const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
const monthTransactions = getRangeTransactions(monthStart, monthEnd);

document.getElementById("periodTitle").textContent = "Monthly Tracker";
document.getElementById("periodRange").textContent = formatDate(monthStart, {
    month: "long",
    year: "numeric"
});

renderPeriodSummary(summarizeTransactions(monthTransactions));
renderCategorySummary(document.getElementById("categoryList"), monthTransactions);

const weekRows = [];
let weekStart = getWeekStart(monthStart);
while (weekStart < monthEnd) {
    const weekEnd = addDays(weekStart, 7);
    const weekTransactions = getRangeTransactions(weekStart, weekEnd)
        .filter(transaction => {
            const date = parseTransactionDate(transaction);
            return date >= monthStart && date < monthEnd;
        });
    const summary = summarizeTransactions(weekTransactions);

    weekRows.push(`
        <a class="period-row period-link" href="weekly.html" data-week="${dateKey(weekStart)}">
            <span>Week ${weekRows.length + 1}<small>${formatDate(weekStart, { day: "numeric", month: "short" })} - ${formatDate(addDays(weekEnd, -1), { day: "numeric", month: "short" })}</small></span>
            <span>+ ${formatCurrency(summary.income)} &nbsp; - ${formatCurrency(summary.expense)}</span>
        </a>
    `);
    weekStart = weekEnd;
}
renderPeriodRows(document.getElementById("breakdownList"), weekRows, "No weeks in this period");

document.querySelectorAll("[data-week]").forEach(link => {
    link.onclick = () => localStorage.setItem("selectedWeekStart", link.dataset.week);
});

document.getElementById("previousPeriod").onclick = () => {
    const previous = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
    localStorage.setItem("selectedMonth", `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`);
    window.location.reload();
};

document.getElementById("nextPeriod").onclick = () => {
    const next = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    localStorage.setItem("selectedMonth", `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
    window.location.reload();
};