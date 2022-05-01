const { search, getVideoDetails } = require("../lib/yt");
const { PLAYER, updatePlayer } = require("./player");
let searchingInterval = null;
let reqResolved = false;
let isFirstReq = true;

window.addEventListener("load", () => {
    // player controllers
    const playBtn = document.getElementById("play");
    const pauseBtn = document.getElementById("pause");
    const prevBtn = document.getElementById("previous");
    const nextBtn = document.getElementById("next");
    // audio player
    const playerEl = document.getElementById("audio-player");
    // thumbnail
    const thumbnailEl = document.getElementById("cover");
    const searchInput = document.getElementById("search");

    // disable previous button
    if (!PLAYER.previous) {
        prevBtn.classList.add("inactive");
        searchInput.focus();
    }
    // previous button click event
    prevBtn.addEventListener("click", (event) => {
        if (!PLAYER.previous) {
            clickEffect(event);
            previousSong(PLAYER.previous);
        }
    });
    // next button click event
    nextBtn.addEventListener("click", (event) => {
        clickEffect(event);
        prevBtn.classList.remove("inactive");
        nextSong(PLAYER.next);
    });
    // play button click event
    playBtn.addEventListener("click", (event) => {
        play(playerEl);
    });
    // pause button click event
    pauseBtn.addEventListener("click", (event) => {
        pause(playerEl);
    });
    // loop button click event
    const loopBtn = document.getElementById("loop");
    loopBtn.addEventListener("click", (event) => {
        if (PLAYER.loop) {
            event.target.classList.remove("loop-active");
            PLAYER.loop = !PLAYER.loop;
        } else {
            event.target.classList.add("loop-active");
            PLAYER.loop = !PLAYER.loop;
        }
    });

    // search
    searchInput.addEventListener("keyup", async (event) => {
        event.preventDefault();

        if (event.key === "Enter") {
            // [TODO] stop player

            if (!isFirstReq && !reqResolved) {
                return;
            } else {
                reqResolved = false;
            }
            isFirstReq = false;

            const searchTerm = event.target.value;

            // clear value and focus out
            event.target.value = "";
            event.target.blur();

            searching();

            // search on YouTube
            const { title, thumbnail, audio, current, next } = await search(
                searchTerm
            );

            clearInterval(searchingInterval);
            reqResolved = true;

            if (!title) {
                setSongTitle("[Not Found] Try Again!");
                searchInput.focus();
                return;
            }

            setSongTitle(title);
            setThumbnail(thumbnail);
            streamAudio(audio);
            updatePlayer({ previous: PLAYER.current, current, next });
        }
    });

    // audio player events
    playerEl.addEventListener("playing", () => {
        spin(thumbnailEl);
    });
    playerEl.addEventListener("pause", () => {
        stopSpin(thumbnailEl);
    });
    playerEl.addEventListener("ended", async () => {
        stopSpin(thumbnailEl);
        if (PLAYER.loop) {
            await getVideoDetails(PLAYER.current);
        } else {
            nextSong(PLAYER.next);
        }
    });

    // TODO: limit next song
    // playerEl.onerror = function () {
    //     nextSong(PLAYER.next);
    // };
});

function clickEffect(event) {
    event.target.classList.add("clicked");
    setTimeout(() => {
        event.target.classList.remove("clicked");
    }, 200);
}

function togglePlay() {
    const playBtn = document.getElementById("play");
    const pauseBtn = document.getElementById("pause");
    playBtn.classList.add("hidden");
    pauseBtn.classList.remove("hidden");
}

function togglePause() {
    const playBtn = document.getElementById("play");
    const pauseBtn = document.getElementById("pause");
    playBtn.classList.remove("hidden");
    pauseBtn.classList.add("hidden");
}

function setSongTitle(song) {
    const titleEl = document.getElementById("title");
    const placeholderEl = document.getElementById("title-placeholder");
    placeholderEl.classList.add("hidden");
    titleEl.classList.remove("hidden");
    titleEl.innerText = song;
}

function setThumbnail(thumbnail) {
    const thumbnailEl = document.getElementById("cover");
    thumbnailEl.style.background = `url('${thumbnail}')`;
    return thumbnailEl;
}

function searching() {
    // search for 30 seconds
    const searchTimeout = 30 * 1000;
    let count = 0;
    const startTime = new Date();
    let elapsedTime = new Date();

    searchingInterval = setInterval(function () {
        setSongTitle("Searching" + ".".repeat(count));
        count++;
        if (count === 4) {
            count = 0;
        }
        elapsedTime = new Date();

        if (elapsedTime - startTime > searchTimeout) {
            clearInterval(searchingInterval);
            setSongTitle("[Error] Try again!");
        }
    }, 500);
}

function spin(element) {
    element.classList.add("spin");
}

function stopSpin(element) {
    element.classList.remove("spin");
}

function pause(player) {
    togglePause();
    player.pause();
}

function play(player) {
    togglePlay();
    player.play();
}

function streamAudio(audio) {
    const player = document.getElementById("audio-player");
    player.src = audio;
    play(player);
}

async function nextSong(songId) {
    const { title, thumbnail, audio, current, next } = await getVideoDetails(
        songId
    );
    setSongTitle(title);
    setThumbnail(thumbnail);
    streamAudio(audio);
    updatePlayer({ previous: PLAYER.current, current, next });
}

async function previousSong(songId) {
    const { title, thumbnail, audio, current } = await getVideoDetails(songId);
    setSongTitle(title);
    setThumbnail(thumbnail);
    streamAudio(audio);
    updatePlayer({ previous: null, current: PLAYER.previous, next: current });
}
