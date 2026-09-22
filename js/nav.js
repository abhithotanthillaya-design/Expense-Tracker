/**
 * Expense Tracker — Unified Navigation Component
 * Injects and manages Desktop Top Nav, Mobile Bottom Nav, and Side Drawer Menu
 */

const AppNav = {
    // Current route detection
    isInsideHtmlDir() {
        return window.location.pathname.includes("/html/");
    },

    getPagePath(pageFile) {
        if (this.isInsideHtmlDir()) {
            return pageFile;
        }
        return "html/" + pageFile;
    },

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.substring(path.lastIndexOf("/") + 1) || "index.html";
        return filename;
    },

    init() {
        this.renderDesktopNav();
        this.renderSideMenu();
        this.renderMobileNav();
        this.highlightActiveLinks();
        this.bindQuickAdd();
    },

    renderDesktopNav() {
        let existing = document.getElementById("desktopNav");
        if (existing) return;

        const nav = document.createElement("nav");
        nav.id = "desktopNav";
        nav.className = "desktop-nav-bar";

        const homeLink = this.getPagePath("dashboard.html");

        nav.innerHTML = `
            <a href="${homeLink}" class="desktop-brand">
                <span style="font-size:22px;">⚡</span>
                <span class="desktop-brand-title">Expense Tracker</span>
                <span class="desktop-brand-tag">BY ATS</span>
            </a>

            <div class="desktop-nav-links">
                <a href="${this.getPagePath("dashboard.html")}" class="desktop-nav-link" data-page="dashboard.html">Dashboard</a>
                <a href="${this.getPagePath("transactions.html")}" class="desktop-nav-link" data-page="transactions.html">Transactions</a>
                <a href="${this.getPagePath("daily.html")}" class="desktop-nav-link" data-page="daily.html">Daily</a>
                <a href="${this.getPagePath("weekly.html")}" class="desktop-nav-link" data-page="weekly.html">Weekly</a>
                <a href="${this.getPagePath("monthly.html")}" class="desktop-nav-link" data-page="monthly.html">Monthly</a>
                <a href="${this.getPagePath("yearly.html")}" class="desktop-nav-link" data-page="yearly.html">Yearly</a>
                <a href="${this.getPagePath("analytics.html")}" class="desktop-nav-link" data-page="analytics.html">Analytics</a>
                <a href="${this.getPagePath("budgets.html")}" class="desktop-nav-link" data-page="budgets.html">Budgets</a>
                <a href="${this.getPagePath("recurring.html")}" class="desktop-nav-link" data-page="recurring.html">Recurring</a>
                <a href="${this.getPagePath("accounts.html")}" class="desktop-nav-link" data-page="accounts.html">Accounts</a>
                <a href="${this.getPagePath("settings.html")}" class="desktop-nav-link" data-page="settings.html">Settings</a>
            </div>

            <div class="desktop-actions">
                <button class="desktop-add-btn" id="navQuickAddBtn">
                    <span>+</span> Add Entry
                </button>
            </div>
        `;

        document.body.insertBefore(nav, document.body.firstChild);
    },

    renderSideMenu() {
        let menu = document.getElementById("menuPopup");
        if (!menu) {
            menu = document.createElement("div");
            menu.id = "menuPopup";
            menu.className = "home-menu hidden";
            document.body.appendChild(menu);
        }

        // Full set of links ensuring NO dead links
        menu.innerHTML = `
            <a href="${this.getPagePath("welcome.html")}" data-page="welcome.html">👋 Setup / Onboarding</a>
            <a href="${this.getPagePath("dashboard.html")}" data-page="dashboard.html">🏠 Dashboard</a>
            <a href="${this.getPagePath("transactions.html")}" data-page="transactions.html">💳 Transactions</a>
            <a href="${this.getPagePath("daily.html")}" data-page="daily.html">📅 Daily Tracker</a>
            <a href="${this.getPagePath("weekly.html")}" data-page="weekly.html">📆 Weekly Tracker</a>
            <a href="${this.getPagePath("monthly.html")}" data-page="monthly.html">🗓 Monthly Tracker</a>
            <a href="${this.getPagePath("yearly.html")}" data-page="yearly.html">📊 Yearly Tracker</a>
            <a href="${this.getPagePath("analytics.html")}" data-page="analytics.html">📈 Analytics</a>
            <a href="${this.getPagePath("budgets.html")}" data-page="budgets.html">🎯 Budgets</a>
            <a href="${this.getPagePath("recurring.html")}" data-page="recurring.html">🔄 Recurring</a>
            <a href="${this.getPagePath("accounts.html")}" data-page="accounts.html">🏦 Accounts</a>
            <a href="${this.getPagePath("settings.html")}" data-page="settings.html">⚙ Settings</a>
            <div class="menu-byline">
                <span>BY ATS • TRACK. SAVE. GROW.</span>
            </div>
        `;

        // Bind hamburger button
        const menuBtn = document.getElementById("menuBtn");
        if (menuBtn) {
            menuBtn.onclick = (e) => {
                e.stopPropagation();
                menu.classList.toggle("show");
            };
        }

        document.addEventListener("click", (e) => {
            if (menu.classList.contains("show") && !menu.contains(e.target) && e.target !== menuBtn) {
                menu.classList.remove("show");
            }
        });
    },

    renderMobileNav() {
        let existing = document.getElementById("mobileNav");
        if (existing) return;

        const nav = document.createElement("nav");
        nav.id = "mobileNav";
        nav.className = "mobile-nav-bar";

        nav.innerHTML = `
            <a href="${this.getPagePath("dashboard.html")}" class="mobile-nav-item" data-page="dashboard.html">
                <span class="nav-icon">🏠</span>
                <span>Home</span>
            </a>
            <a href="${this.getPagePath("daily.html")}" class="mobile-nav-item" data-page="daily.html">
                <span class="nav-icon">📅</span>
                <span>Daily</span>
            </a>
            <button class="mobile-nav-item fab-item" id="mobileNavAddBtn" title="Quick Add">
                <span class="nav-icon">+</span>
            </button>
            <a href="${this.getPagePath("analytics.html")}" class="mobile-nav-item" data-page="analytics.html">
                <span class="nav-icon">📈</span>
                <span>Insights</span>
            </a>
            <button class="mobile-nav-item" id="mobileNavMenuBtn">
                <span class="nav-icon">☰</span>
                <span>More</span>
            </button>
        `;

        document.body.appendChild(nav);

        const moreBtn = nav.querySelector("#mobileNavMenuBtn");
        const menu = document.getElementById("menuPopup");
        if (moreBtn && menu) {
            moreBtn.onclick = (e) => {
                e.stopPropagation();
                menu.classList.toggle("show");
            };
        }
    },

    highlightActiveLinks() {
        const cur = this.getCurrentPage();
        document.querySelectorAll("[data-page]").forEach(el => {
            if (el.dataset.page === cur) {
                el.classList.add("active");
            } else {
                el.classList.remove("active");
            }
        });
    },

    bindQuickAdd() {
        const openModal = () => {
            const modal = document.getElementById("transactionModal");
            if (modal) {
                modal.classList.remove("hidden");
                modal.classList.remove("modal-hidden");
                const amtInput = document.getElementById("amount");
                if (amtInput) amtInput.focus();
            } else {
                // If on a page without the modal, navigate to daily or dashboard with #add
                window.location.href = this.getPagePath("daily.html#add");
            }
        };

        const deskBtn = document.getElementById("navQuickAddBtn");
        if (deskBtn) deskBtn.onclick = openModal;

        const mobBtn = document.getElementById("mobileNavAddBtn");
        if (mobBtn) mobBtn.onclick = openModal;

        // Auto open if URL has #add
        if (window.location.hash === "#add") {
            setTimeout(openModal, 200);
        }
    }
};

window.addEventListener("DOMContentLoaded", () => {
    AppNav.init();
});
