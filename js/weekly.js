setupPeriodNavigation();

const requestedWeek = localStorage.getItem("selectedWeekStart");
const weekStart = requestedWeek
    ? new Date(requestedWeek + "T00:00:00")
    : getWeekStart(new Date());
const weekEnd = addDays(weekStart, 7);
const weekTransactions = getRangeTransactions(weekStart, weekEnd);

document.getElementById("periodTitle").textContent = "Weekly Tracker";
document.getElementById("periodRange").textContent =
    `${formatDate(weekStart, { day: "numeric", month: "short" })} - ` +
    `${formatDate(addDays(weekEnd, -1), { day: "numeric", month: "short", year: "numeric" })}`;

renderPeriodSummary(summarizeTransactions(weekTransactions));
renderCategorySummary(document.getElementById("categoryList"), weekTransactions);

const dayRows = [];
for (let offset = 0; offset < 7; offset += 1) {
    const day = addDays(weekStart, offset);
    const dayTransactions = transactionsForDate(weekTransactions, day);
    const summary = summarizeTransactions(dayTransactions);

    dayRows.push(`
        <a class="period-row period-link" href="daily.html" data-date="${dateKey(day)}">
            <div>
                <span style="font-weight: 600;">${formatDate(day, { weekday: "long" })}</span>
                <small style="opacity: 0.65;">${formatDate(day, { day: "numeric", month: "short" })}</small>
            </div>
            <div style="font-family: 'Outfit', sans-serif; font-size: 14px;">
                <span style="color: var(--income); font-weight: 600;">+ ${formatCurrency(summary.income)}</span>
                <span style="opacity: 0.4; margin: 0 4px;">&bull;</span>
                <span style="color: var(--expense); font-weight: 600;">- ${formatCurrency(summary.expense)}</span>
            </div>
        </a>
    `);
}
renderPeriodRows(document.getElementById("breakdownList"), dayRows, "No days in this period");

document.querySelectorAll("[data-date]").forEach(link => {
    link.addEventListener("click", () => {
        localStorage.setItem("selectedDate", link.dataset.date);
    });
});

document.getElementById("previousPeriod").onclick = () => {
    localStorage.setItem("selectedWeekStart", dateKey(addDays(weekStart, -7)));
    window.location.reload();
};

document.getElementById("nextPeriod").onclick = () => {
    localStorage.setItem("selectedWeekStart", dateKey(addDays(weekStart, 7)));
    window.location.reload();
};