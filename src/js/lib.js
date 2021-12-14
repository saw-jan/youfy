const fetch = require("cross-fetch");

// globals
const FILTER = "EgIQAQ%253D%253D"; // only video
const SEARCH_URL = "https://www.youtube.com/results";
const VIDEO_URL = "https://www.youtube.com/watch";
let isLoop = false;
let isInit = true;
const playlist = {
    current: "",
    previous: "",
    next: "",
    loop: false,
};

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
            if (playlist.previous) {
                getVideoInfo(playlist.previous);
            } else {
                isInit = true;
            }
        }
    });
    // next button click event
    nextBtn.addEventListener("click", (event) => {
        clickEffect(event);
        prevBtn.classList.remove("inactive");
        getVideoInfo(playlist.next);
    });
    // play button click event
    playBtn.addEventListener("click", (event) => {
        play();
    });
    // pause button click event
    pauseBtn.addEventListener("click", (event) => {
        pause();
    });
    // loop button click event
    const loopBtn = document.getElementById("loop");
    loopBtn.addEventListener("click", (event) => {
        if (isLoop) {
            event.target.classList.remove("loop-active");
            playlist.loop = false;
        } else {
            event.target.classList.add("loop-active");
            playlist.loop = true;
        }
        isLoop = !isLoop;
    });

    // search
    const searchInput = document.getElementById("search");
    searchInput.addEventListener("keyup", async (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const searchTerm = event.target.value;

            // clear value and focus out
            event.target.value = "";
            event.target.blur();

            // search on YouTube
            await YTsearch(searchTerm);
        }
    });

    // audio player
    const player = document.getElementById("audio-player");
    player.addEventListener("ended", () => {
        if (playlist.loop) {
            getVideoInfo(playlist.current);
        } else {
            getVideoInfo(playlist.next);
        }
    });
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

function spin(element) {
    element.classList.add("spin");
}

function pause() {
    togglePause();
    const thumbnailEl = document.getElementById("cover");
    const player = document.getElementById("audio-player");
    thumbnailEl.classList.remove("spin");
    player.pause();
}

function play() {
    togglePlay();
    const thumbnailEl = document.getElementById("cover");
    const player = document.getElementById("audio-player");
    thumbnailEl.classList.add("spin");
    player.play();
}

function streamAudio(audio) {
    const player = document.getElementById("audio-player");
    player.src = audio;
    player.play();
}

async function YTsearch(searchText) {
    const searchParams = new URLSearchParams({
        search_query: searchText,
        sp: FILTER,
    });

    const response = await fetch(`${SEARCH_URL}?${searchParams}`);
    const html = await response.text();
    const videoId = getFirstVideo(html);
    getVideoInfo(videoId);
}

function getFirstVideo(html) {
    let firstVideoId = null;
    let nextVideoId = null;

    const regex = /var\sytInitialData\s=\s.*{.*}(?=;(\s)?<\/script>)/g;
    const found = html.match(regex)[0];
    const json = found.replace("var ytInitialData = ", "");
    const respObj = JSON.parse(json);
    const contents =
        respObj.contents.twoColumnSearchResultsRenderer.primaryContents
            .sectionListRenderer.contents[0].itemSectionRenderer.contents;
    let count = 0;
    for (const video of contents) {
        if (count < 2) {
            if (video.hasOwnProperty("videoRenderer")) {
                if (count === 0) {
                    firstVideoId = video.videoRenderer.videoId;
                } else {
                    nextVideoId = video.videoRenderer.videoId;
                }
                count++;
            }
        } else {
            break;
        }
    }
    playlist.current = firstVideoId;
    playlist.next = nextVideoId;
    return firstVideoId;
}

async function getVideoInfo(videoId) {
    const response = await fetch(`${VIDEO_URL}?v=${videoId}`);
    const html = await response.text();
    videoInfo = getVideoDetails(html);

    setSongTitle(videoInfo.videoDetails.title);
    const thumbnail = videoInfo.videoDetails.thumbnail.thumbnails[0].url;
    const thumbnailEl = setThumbnail(thumbnail);

    const streams = videoInfo.streamingData.adaptiveFormats;
    let audio_link = null;
    for (const format of streams) {
        if (format.mimeType.includes("audio")) {
            // audio stream url
            audio_link = format.url;
            break;
        }
    }
    if (!audio_link) {
        setTimeout(() => getVideoInfo(videoId), 300);
    } else {
        streamAudio(audio_link);
        togglePlay();
        spin(thumbnailEl);
    }
}

function getVideoDetails(html) {
    const regex = /var ytInitialPlayerResponse = {.*}(?=;[\s\S]+<\/script>)/;
    const found = html.match(regex)[0];
    // try again: found will have extra unwanted data
    const playerResp = found.match(regex)[0];

    const json = playerResp.replace("var ytInitialPlayerResponse = ", "");
    const respObj = JSON.parse(json);
    const { playabilityStatus, videoDetails, streamingData } = respObj;
    return { playabilityStatus, videoDetails, streamingData };
}
