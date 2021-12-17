const FILTER = "EgIQAQ%253D%253D"; // only video
const SEARCH_URL = "https://www.youtube.com/results";
const VIDEO_URL = "https://www.youtube.com/watch";
const regex = {
    playlist: /var\sytInitialData\s=\s.*{.*}(?=;(\s)?<\/script>)/,
    video: /var ytInitialPlayerResponse = {.*}(?=;[\s\S]+<\/script>)/,
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
    const videoId = parseFirstVideoId(html);
    const song = getVideoDetails(videoId);
    return song;
}

export async function getVideoDetails(videoId) {
    const response = await fetch(`${VIDEO_URL}?v=${videoId}`);
    const html = await response.text();
    const videoInfo = parseVideoDetails(html);
    const nextVideoId = getNextSong(html);

    const streams = videoInfo.streamingData.adaptiveFormats;
    let audio_link = null;
    for (const format of streams) {
        if (format.mimeType.includes("audio")) {
            // audio stream url
            audio_link = format.url;
            break;
        }
    }

    // if no audio url then try again
    if (!audio_link) {
        if (RECURSE.count < RECURSE.max) {
            RECURSE.count++;
            const { audio_link: link } = await getVideoDetails(videoId);
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
    // console.log(respObj.contents.twoColumnWatchNextResults);
    const nextSongId =
        respObj.contents.twoColumnWatchNextResults.secondaryResults
            .secondaryResults.results[0].compactVideoRenderer.videoId;
    return nextSongId;
}
