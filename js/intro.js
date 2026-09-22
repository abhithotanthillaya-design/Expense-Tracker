window.onload = () => {
    // restart animation
    document.querySelectorAll('.coin, .note').forEach(el => {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = '';
    });

    const getDestination = () => {
        const onboarded = localStorage.getItem("et_onboarded");
        const hasUser = localStorage.getItem("username");
        if (onboarded === "true" || (hasUser && hasUser !== "User")) {
            return "html/dashboard.html";
        }
        return "html/welcome.html";
    };

    let redirected = false;
    const proceed = () => {
        if (redirected) return;
        redirected = true;
        window.location.href = getDestination();
    };

    // Auto redirect after 3.2s
    const timer = setTimeout(proceed, 3200);

    // Tap/click anywhere to skip immediately
    const splash = document.getElementById("splash-screen");
    if (splash) {
        splash.style.cursor = "pointer";
        splash.addEventListener("click", () => {
            clearTimeout(timer);
            proceed();
        });
    }
};