let isLoop = false;
let isInit = true;

window.addEventListener("load", () => {
    const playBtn = document.getElementById("play");
    const pauseBtn = document.getElementById("pause");
    const prevBtn = document.getElementById("previous");
    const nextBtn = document.getElementById("next");

    // disable previous button
    if (isInit) {
        prevBtn.classList.add("inactive");
    }
    // previous button click event
    prevBtn.addEventListener("click", (event) => {
        if (!isInit) {
            clickEffect(event);
        }
    });
    // next button click event
    nextBtn.addEventListener("click", (event) => {
        clickEffect(event);
    });
    // play button click event
    playBtn.addEventListener("click", (event) => {
        event.target.classList.add("hidden");
        pauseBtn.classList.remove("hidden");
    });
    // pause button click event
    pauseBtn.addEventListener("click", (event) => {
        event.target.classList.add("hidden");
        playBtn.classList.remove("hidden");
    });
    // loop button click event
    const loopBtn = document.getElementById("loop");
    loopBtn.addEventListener("click", (event) => {
        if (isLoop) {
            event.target.classList.remove("loop-active");
        } else {
            event.target.classList.add("loop-active");
        }
        isLoop = !isLoop;
    });

    // search
    const searchInput = document.getElementById("search");
    searchInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const searchTerm = event.target.value;

            // clear value and focus out
            event.target.value = "";
            event.target.blur();
        }
    });
});

function clickEffect(event) {
    event.target.classList.add("clicked");
    setTimeout(() => {
        event.target.classList.remove("clicked");
    }, 200);
}
