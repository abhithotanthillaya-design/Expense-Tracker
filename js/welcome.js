/* load saved username when page opens */

window.addEventListener("DOMContentLoaded", () => {

    const username = document.getElementById("username")
    const savedName = localStorage.getItem("username")

    if (savedName) {
        username.textContent = savedName
    }

})

/* confetti on load */

window.addEventListener("load", () => {

    confetti({
        particleCount:120,
        spread:90,
        origin:{ y:0.6 }
    })

})

/* elements */

const welcomeText = document.getElementById("welcomeText")
const incomeSection = document.getElementById("incomeSection")
const username = document.getElementById("username")
const cards = document.querySelectorAll(".card")

/* save username while typing */

username.addEventListener("input", () => {

    const name = username.textContent.trim()

    if (name) {
        localStorage.setItem("username", name)
    }

})

/* slide welcome text up */

setTimeout(() => {

    welcomeText.classList.add("moveUp")
    incomeSection.classList.remove("hidden")

},1500)

/* select income type */

cards.forEach(card => {

    card.addEventListener("click", () => {

        const type = card.dataset.type
        const name = username.textContent.trim()

        if (name) {
            localStorage.setItem("username", name)
        }

        localStorage.setItem("incomeType", type)

        window.location.href = "app.html"

    })

})