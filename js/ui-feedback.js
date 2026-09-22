/**
 * UI Feedback: Toasts, Confirmations, Animated Counters, and Micro-interactions
 */

// Toast Notifications System
function showToast(message, type = "info", duration = 3200) {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icons = {
        success: "✓",
        error: "✕",
        warning: "⚠",
        info: "ℹ"
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || "ℹ"}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Animation trigger
    requestAnimationFrame(() => {
        toast.classList.add("toast-show");
    });

    const removeToast = () => {
        toast.classList.remove("toast-show");
        toast.classList.add("toast-hide");
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };

    const timer = setTimeout(removeToast, duration);

    toast.onclick = () => {
        clearTimeout(timer);
        removeToast();
    };
}

// Custom Glassmorphic Confirmation Modal
function showConfirmModal({
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = "Delete",
    cancelText = "Cancel",
    danger = true,
    onConfirm
}) {
    // Remove any existing confirm modals
    const existing = document.getElementById("et-confirm-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "et-confirm-modal";
    modal.className = "custom-modal-overlay";

    modal.innerHTML = `
        <div class="custom-modal-box">
            <div class="modal-icon-circle ${danger ? "danger" : "primary"}">
                ${danger ? "🗑️" : "❓"}
            </div>
            <h3 class="modal-title">${title}</h3>
            <p class="modal-message">${message}</p>
            <div class="modal-actions">
                <button class="modal-btn modal-btn-secondary" id="confirmCancelBtn">${cancelText}</button>
                <button class="modal-btn ${danger ? "modal-btn-danger" : "modal-btn-primary"}" id="confirmActionBtn">${confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => modal.classList.add("open"));

    const close = () => {
        modal.classList.remove("open");
        setTimeout(() => modal.remove(), 250);
    };

    modal.querySelector("#confirmCancelBtn").onclick = close;
    modal.querySelector("#confirmActionBtn").onclick = () => {
        close();
        if (typeof onConfirm === "function") onConfirm();
    };

    modal.addEventListener("click", e => {
        if (e.target === modal) close();
    });

    // Keyboard support
    const handleKey = e => {
        if (e.key === "Escape") {
            close();
            document.removeEventListener("keydown", handleKey);
        }
    };
    document.addEventListener("keydown", handleKey);
}

// Animated Numerical Counter
function animateCounter(element, targetValue, duration = 750, prefix = "", isCurrency = false) {
    if (!element) return;
    const end = Number(targetValue) || 0;
    const startText = element.textContent.replace(/[^0-9.-]+/g, "");
    const start = Number(startText) || 0;
    const range = end - start;
    if (range === 0) {
        element.textContent = isCurrency && typeof formatCurrency === "function" ? formatCurrency(end) : (prefix + end.toLocaleString());
        return;
    }

    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out quad
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + range * ease);

        if (isCurrency && typeof formatCurrency === "function") {
            element.textContent = formatCurrency(current);
        } else {
            element.textContent = prefix + current.toLocaleString();
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            if (isCurrency && typeof formatCurrency === "function") {
                element.textContent = formatCurrency(end);
            } else {
                element.textContent = prefix + end.toLocaleString();
            }
        }
    }

    requestAnimationFrame(update);
}
