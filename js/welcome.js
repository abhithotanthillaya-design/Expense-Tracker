/* confetti on load */

window.addEventListener("load", () => {

    confetti({
        particleCount:120,
        spread:90,
        origin:{ y:0.6 }
    })

})
const welcomeText = document.getElementById("welcomeText")
const incomeSection = document.getElementById("incomeSection")
const username = document.getElementById("username")
const cards = document.querySelectorAll(".card")

/* slide welcome text up */

setTimeout(() => {

    welcomeText.classList.add("moveUp")
    incomeSection.classList.remove("hidden")

},1500)


/* select income type */

cards.forEach(card => {

    card.addEventListener("click", () => {

        const type = card.dataset.type
        const name = username.innerText.trim()

        localStorage.setItem("username", name)
        localStorage.setItem("incomeType", type)

        window.location.href = "app.html"

    })

})