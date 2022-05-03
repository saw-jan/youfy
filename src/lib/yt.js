const FILTER = "EgIQAQ%253D%253D"; // only video
const Y_URL = "https://www.youtube.com";
const SEARCH_URL = `${Y_URL}/results`;
const VIDEO_URL = `${Y_URL}/watch`;
const regex = {
    playlist: /var\sytInitialData\s=\s.*{.*}(?=;(\s)?<\/script>)/,
    video: /var ytInitialPlayerResponse = {.*}(?=;[\s\S]+<\/script>)/,
    decoder: /function\(a\){a=a.split\(""\);(.*)};/,
    decrypter:
        /var [a-zA-Z]{2}={([a-zA-Z0-9]{2}:function\([a-zA-Z,]+\){.*}(,[\n\r])?){3}}(?=;)/,
    player: /(?<=src=")\/s\/player\/(.*)en_US\/base.js(?=")/,
};
const RECURSE = {
    count: 0,
    max: 5,
};

export async function search(searchText) {
    const searchParams = new URLSearchParams({
        search_query: searchText,
        sp: FILTER,
    });

    const response = await fetch(`${SEARCH_URL}?${searchParams}`);
    const html = await response.text();

    const song = {
        title: null,
        thumbnail: null,
        audio: null,
        current: null,
        next: null,
    };

    try {
        const videoId = parseFirstVideoId(html);
        const { title, thumbnail, audio, current, next } =
            await getVideoDetails(videoId);

        song.title = title;
        song.thumbnail = thumbnail;
        song.audio = audio;
        song.current = current;
        song.next = next;
    } catch (e) {}

    return song;
}

export async function getVideoDetails(videoId) {
    const response = await fetch(`${VIDEO_URL}?v=${videoId}`);
    const html = await response.text();
    const videoInfo = parseVideoDetails(html);
    const nextVideoId = getNextSong(html);

    const streams = videoInfo.streamingData.adaptiveFormats;
    const aStream = getAudioStream(streams);

    let audio_link = null;

    if (aStream.url) {
        audio_link = aStream.url;
    } else {
        const scriptUrl = getPlayerScriptLink(html);
        const {
            url,
            sigParam,
            signature: encryptedSig,
        } = getCipherParts(aStream.signatureCipher);
        const signature = await decypher(encryptedSig, scriptUrl);
        audio_link = constructStreamUrl(url, sigParam, signature);
    }

    // if no audio url then try again
    if (!audio_link) {
        RECURSE.count++;
        if (RECURSE.count < RECURSE.max) {
            const { audio: link } = await getVideoDetails(videoId);
            audio_link = link;
        }
    } else {
        RECURSE.count = 0;
    }

    return {
        title: videoInfo.videoDetails.title,
        thumbnail: videoInfo.videoDetails.thumbnail.thumbnails[0].url,
        audio: audio_link,
        current: videoId,
        next: nextVideoId,
    };
}

function parseFirstVideoId(html) {
    let firstVideoId = null;

    const found = html.match(regex.playlist)[0];
    const json = found.replace("var ytInitialData = ", "");
    const respObj = JSON.parse(json);
    const contents =
        respObj.contents.twoColumnSearchResultsRenderer.primaryContents
            .sectionListRenderer.contents[0].itemSectionRenderer.contents;
    for (const video of contents) {
        if (video.hasOwnProperty("videoRenderer")) {
            firstVideoId = video.videoRenderer.videoId;
            break;
        }
    }
    return firstVideoId;
}

function parseVideoDetails(html) {
    const found = html.match(regex.video)[0];
    // TODO: revisit the regex
    // try again: found will have extra unwanted data
    const playerResp = found.match(regex.video)[0];

    const json = playerResp.replace("var ytInitialPlayerResponse = ", "");
    const respObj = JSON.parse(json);
    const { playabilityStatus, videoDetails, streamingData } = respObj;
    return { playabilityStatus, videoDetails, streamingData };
}

function getNextSong(html) {
    const found = html.match(regex.playlist)[0];
    const json = found.replace("var ytInitialData = ", "");
    const respObj = JSON.parse(json);
    const nextSongId =
        respObj.contents.twoColumnWatchNextResults.secondaryResults
            .secondaryResults.results[0].compactVideoRenderer.videoId;
    return nextSongId;
}

function getAudioStream(streams) {
    let audioStream = {};
    for (const stream of streams) {
        if (stream.mimeType.includes("audio")) {
            audioStream = stream;
            break;
        }
    }

    return audioStream;
}

function getPlayerScriptLink(html) {
    let url = `${Y_URL}/s/player/9cdfefcf/player_ias.vflset/en_US/base.js`;

    const path = html.match(regex.player);

    if (path !== null) {
        url = `${Y_URL}${path[0]}`;
    }
    return url;
}

function getCipherParts(cipher) {
    const c = cipher.split("&");
    return {
        signature: c[0].replace("s=", ""),
        sigParam: c[1].replace(/sp=/, ""),
        url: c[c.length - 1].replace("url=", ""),
    };
}

function constructStreamUrl(url, sp, sig) {
    const streamUrl = decodeURIComponent(url);

    return `${streamUrl}&${sp}=${sig}`;
}

async function decypher(signature, scriptUrl) {
    const playerScript = await fetch(scriptUrl).then((res) => res.text());

    const decodeFuncMatch = playerScript.match(regex.decoder);
    const decryptMatch = playerScript.match(regex.decrypter);

    if (decodeFuncMatch !== null && decryptMatch !== null) {
        const objString = decryptMatch[0].replace(/\n/g, "");

        const decodeFuncString = decodeFuncMatch[0]
            .replace("function(", "function d(")
            .replace("){", `){${objString};`);
        const decode = new Function(`${decodeFuncString} return d`);
        return decode()(decodeURIComponent(signature));
    }
}
