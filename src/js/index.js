const { ipcRenderer: ipc } = require("electron");
const { search, getVideoDetails } = require("../lib/yt");
const {
    PLAYER,
    updatePlayer,
    historyOverflow,
    addToHistory,
    removeOldestHistory,
    hasHistory,
    hasPreviousHistory,
    getNextHistory,
    getPreviousHistory,
    getCurrent,
} = require("./player");
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

    searchInput.focus();

    // previous button click event
    prevBtn.addEventListener("click", async (event) => {
        if (hasPreviousHistory()) {
            clickEffect(event);
            await previousSong();

            // disable if no any previous song
            if (!hasPreviousHistory()) {
                prevBtn.classList.add("inactive");
            }
        }
    });
    // next button click event
    nextBtn.addEventListener("click", (event) => {
        if (hasHistory()) {
            clickEffect(event);
            prevBtn.classList.remove("inactive");
            nextSong();
        }
    });
    // play button click event
    playBtn.addEventListener("click", () => {
        if (hasHistory()) {
            play(playerEl);
        }
    });
    // pause button click event
    pauseBtn.addEventListener("click", () => {
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

        if (event.key === "Enter" && event.target.value !== "") {
            const searchTerm = event.target.value;

            if (!isFirstReq && !reqResolved) {
                return;
            } else {
                reqResolved = false;
            }
            isFirstReq = false;

            searching();

            // search on YouTube
            const { title, thumbnail, audio, id, next } = await search(
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
            updatePlayer({
                id,
                next,
            });
            checkAndAddToHistory({ id, title, thumbnail, audio });

            // activate controllers
            playBtn.classList.remove("inactive");
            nextBtn.classList.remove("inactive");

            // clear value and focus out
            event.target.value = "";
            event.target.blur();
        }
    });

    // audio player events
    playerEl.addEventListener("playing", () => {
        spin(thumbnailEl);
    });
    playerEl.addEventListener("pause", () => {
        changeAnimationState(thumbnailEl, "paused");
    });
    playerEl.addEventListener("ended", async () => {
        stopSpin(thumbnailEl);
        if (PLAYER.loop) {
            const { audio } = getCurrent();
            streamAudio(audio);
        } else {
            nextSong();
            prevBtn.classList.remove("inactive");
        }
    });

    // try next if error to play
    playerEl.onerror = function () {
        PLAYER.errorCount++;
        if (PLAYER.errorCount <= PLAYER.maxErrorCount) nextSong();
    };

    // title bar controls
    document.getElementById("ico-minimize").addEventListener("click", () => {
        ipc.invoke("minimize");
    });
    document.getElementById("ico-close").addEventListener("click", () => {
        ipc.invoke("close");
    });
    
    // Auto-update listeners
    setupUpdateListeners();
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
    // wait for 30 seconds
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
            setSongTitle("[Network Error] Check your internet connection!");
        }
    }, 500);
}

function spin(element) {
    element.classList.add("spin");
    changeAnimationState(element, "running");
}

function changeAnimationState(element, state = "paused") {
    element.style.animationPlayState = state;
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

async function nextSong() {
    let fromHistory = true;
    let song = getNextHistory();
    if (!song) {
        fromHistory = false;
        song = await getVideoDetails(PLAYER.next);
    }

    const { title, thumbnail, audio, id } = song;

    setSongTitle(title);
    setThumbnail(thumbnail);
    streamAudio(audio);

    if (!fromHistory) {
        checkAndAddToHistory({
            id,
            title,
            thumbnail,
            audio,
        });
    }

    return updatePlayer({
        id,
        next: song.next ? song.next : PLAYER.next,
    });
}

async function previousSong() {
    const song = getPreviousHistory();
    if (!song) {
        return;
    }

    const { title, thumbnail, audio, id } = song;
    setSongTitle(title);
    setThumbnail(thumbnail);
    streamAudio(audio);

    return updatePlayer({
        id,
    });
}

function checkAndAddToHistory(song) {
    if (historyOverflow()) {
        removeOldestHistory();
        addToHistory(song);
    } else {
        addToHistory(song);
    }
}

function setupUpdateListeners() {
    ipc.on("update-available", (event, info) => {
        showUpdateNotification(
            `New version ${info.version} is available! Click to download.`,
            () => {
                showUpdateNotification("Downloading update...", null, false);
                ipc.invoke("download-update").then((result) => {
                    if (result.error) {
                        showUpdateNotification(
                            "Failed to download update. Please try again later.",
                            null,
                            true
                        );
                    }
                });
            }
        );
    });
    
    ipc.on("update-download-progress", (event, progressInfo) => {
        const percent = Math.round(progressInfo.percent);
        showUpdateNotification(
            `Downloading update: ${percent}%`,
            null,
            false
        );
    });
    
    ipc.on("update-downloaded", (event, info) => {
        showUpdateNotification(
            `Update ${info.version} downloaded! Click to install and restart.`,
            () => {
                ipc.invoke("install-update");
            }
        );
    });
    
    ipc.on("update-error", (event, error) => {
        console.error("Update error:", error);
    });
}

function showUpdateNotification(message, onClick = null, autoHide = true) {
    const titleEl = document.getElementById("title");
    const placeholderEl = document.getElementById("title-placeholder");
    
    // Save current state
    const wasHidden = titleEl.classList.contains("hidden");
    const originalText = titleEl.innerText;
    
    // Show notification
    placeholderEl.classList.add("hidden");
    titleEl.classList.remove("hidden");
    titleEl.innerText = message;
    titleEl.style.cursor = onClick ? "pointer" : "default";
    
    // Remove previous click handler by storing it in a dataset attribute
    if (titleEl.updateClickHandler) {
        titleEl.removeEventListener("click", titleEl.updateClickHandler);
    }
    
    if (onClick) {
        titleEl.updateClickHandler = onClick;
        titleEl.addEventListener("click", onClick);
    }
    
    // Auto-hide after 10 seconds if specified
    if (autoHide) {
        setTimeout(() => {
            const currentTitleEl = document.getElementById("title");
            if (currentTitleEl.innerText === message) {
                if (wasHidden) {
                    currentTitleEl.classList.add("hidden");
                    placeholderEl.classList.remove("hidden");
                } else {
                    currentTitleEl.innerText = originalText;
                }
                currentTitleEl.style.cursor = "default";
                if (currentTitleEl.updateClickHandler) {
                    currentTitleEl.removeEventListener("click", currentTitleEl.updateClickHandler);
                    delete currentTitleEl.updateClickHandler;
                }
            }
        }, 10000);
    }
}
