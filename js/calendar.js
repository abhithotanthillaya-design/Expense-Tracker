window.addEventListener("DOMContentLoaded", () => {
    const picker = document.getElementById("datePicker");
    const saved = localStorage.getItem("selectedDate");
    if (picker) {
        picker.value = saved ? saved.split("T")[0] : new Date().toISOString().slice(0, 10);
    }
});

function setPresetDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const key = d.toISOString().slice(0, 10);
    const picker = document.getElementById("datePicker");
    if (picker) picker.value = key;
}

function setFirstOfMonth() {
    const d = new Date();
    d.setDate(1);
    const key = d.toISOString().slice(0, 10);
    const picker = document.getElementById("datePicker");
    if (picker) picker.value = key;
}

function goBack() {
    const date = document.getElementById("datePicker").value;

    if (date) {
        localStorage.setItem("selectedDate", date);
        window.location.href = "daily.html";
    } else {
        window.history.back();
    }
}