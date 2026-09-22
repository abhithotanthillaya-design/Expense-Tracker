function goBack() {
    const date = document.getElementById("datePicker").value;

    if (date) {
        localStorage.setItem("selectedDate", date);
        window.history.back();
    }
}