window.onload = () => {

    // restart animation
    document.querySelectorAll('.coin, .note').forEach(el => {
        el.style.animation = 'none'
        el.offsetHeight
        el.style.animation = ''
    })

    // redirect to welcome page
    setTimeout(() => {
        window.location.href = "html/welcome.html"
    }, 3500)

}