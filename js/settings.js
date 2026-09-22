/**
 * Settings & Data Management Controller
 */

document.addEventListener("DOMContentLoaded", () => {
    initSettings();
    bindSettingsEvents();
});

function initSettings() {
    if (typeof DataManager === "undefined") return;

    const settings = DataManager.getSettings();
    const userInput = document.getElementById("settingUsername");
    const currencySelect = document.getElementById("settingCurrency");
    const intervalSelect = document.getElementById("settingInterval");

    if (userInput) userInput.value = settings.username || "User";

    if (currencySelect) {
        const val = `${settings.currency || "INR"}|${settings.currencySymbol || "₹"}`;
        const match = [...currencySelect.options].find(o => o.value === val);
        if (match) currencySelect.value = val;
    }

    if (intervalSelect) {
        intervalSelect.value = settings.incomeType || "monthly";
    }
}

function bindSettingsEvents() {
    const savePrefBtn = document.getElementById("savePreferencesBtn");
    const exportJsonBtn = document.getElementById("exportJsonBtn");
    const exportCsvBtn = document.getElementById("exportCsvSettingsBtn");
    const importBtn = document.getElementById("importJsonBtn");
    const importInput = document.getElementById("importFileInput");
    const resetBtn = document.getElementById("resetAllDataBtn");

    // Save preferences
    if (savePrefBtn) {
        savePrefBtn.onclick = () => {
            const username = (document.getElementById("settingUsername")?.value || "").trim() || "User";
            const [currency, currencySymbol] = (document.getElementById("settingCurrency")?.value || "INR|₹").split("|");
            const incomeType = document.getElementById("settingInterval")?.value || "monthly";

            if (typeof DataManager !== "undefined") {
                DataManager.saveSettings({
                    username,
                    currency,
                    currencySymbol,
                    incomeType
                });
            }

            showToast("Preferences updated successfully!", "success");
        };
    }

    // Export JSON
    if (exportJsonBtn && typeof DataManager !== "undefined") {
        exportJsonBtn.onclick = () => {
            const json = DataManager.exportJSON();
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ExpenseTracker_Backup_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("JSON backup downloaded!", "success");
        };
    }

    // Export CSV
    if (exportCsvBtn && typeof DataManager !== "undefined") {
        exportCsvBtn.onclick = () => {
            const csv = DataManager.exportCSV();
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ExpenseTracker_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("CSV ledger downloaded!", "success");
        };
    }

    // Import JSON
    if (importBtn && importInput) {
        importBtn.onclick = () => importInput.click();

        importInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target.result;
                const result = DataManager.importJSON(content, false);
                if (result.success) {
                    showToast(`Successfully restored ${result.count} transactions!`, "success");
                    initSettings();
                } else {
                    showToast("Failed to parse backup file: " + result.error, "error");
                }
            };
            reader.readAsText(file);
            importInput.value = "";
        };
    }

    // Reset All Data
    if (resetBtn) {
        resetBtn.onclick = () => {
            showConfirmModal({
                title: "RESET ALL DATA?",
                message: "This will permanently erase all transactions, accounts, budgets, and custom categories. This cannot be undone.",
                confirmText: "Erase Everything",
                danger: true,
                onConfirm: () => {
                    if (typeof DataManager !== "undefined") {
                        DataManager.resetAllData();
                    }
                    showToast("All data has been reset to defaults.", "info");
                    setTimeout(() => {
                        window.location.href = "welcome.html";
                    }, 1000);
                }
            });
        };
    }
}
