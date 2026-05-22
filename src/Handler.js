const axios = require('axios');
const fs = require('fs');
const { YtDlp } = require('ytdlp-nodejs');
const ytdlp = new YtDlp();
const { createWriteStream } = require('fs');
require('dotenv').config();
const youtube = require('googleapis').google.youtube({
    version: 'v3',
    auth: process.env.API_KEY,
});

class YTHandler{
    async download(url){
        const result = await ytdlp
        .download(url)
        .filter('mergevideo')
        .quality('1080p')
        .type('mp4')
        .output(process.env.DIRECTORY+'/src/videos')
        .on('progress', (p) => console.log(`${p.percentage_str}`))
/*         .on('finish', ()=>{console.log(343434)})
        .on('error', e=>{console.log(e.message)}) */
        .run();
        return result;
    }
    async pipeload(url){
        const result = await ytdlp
        .stream(url)
        .filter('audioandvideo')
        .quality('1080p')
        .type('mp4')
        .on('progress', (p) => console.log(`${p.percentage_str}`))
        .pipeAsync(createWriteStream('video.mp4'));
        return result;
    }
    async getList(query, maxResults=10, type="video"){
/*         const request = `GET https://www.googleapis.com/youtube/v3/search?`+
        `part=snippet` +
        `&q=${encodeURIComponent(query)}` +
        `&maxResults=${maxResults}` +
        `&type=${type}` +
        `&key=${process.env.API_KEY}`;         */
        const request = `https://www.googleapis.com/youtube/v3/search`
        const params = {
            part: 'snippet',
            q: query,
            maxResults: maxResults,
            type: type,
        };

        try{
            //const responce = await axios.get(request, {params: params});
            const responce = await youtube.search.list(params)
            return responce.data;
        } catch(e){
            console.log("Вот такая ошибка: " + e.message)
            console.log("Вот такой ответ: " + e.responce?.data)
        }
    }
    async getVideoInfo(id){
        const responce = await youtube.videos.list({
            part: ['snippet'],
            id: id,
        })
        return responce.data.items[0];
    }
    async getChannelInfo(id){
        const responce = await youtube.channels.list({
            part: ['snippet'],
            id: id,
        })
        return responce.data.items[0];
    }
    async getChannelVideos(id, maxResults=10, order="date"){
        const responce = await youtube.search.list({
            channelId: /* "UCmSImlPUez2i1wvsctTB0Gw" */id,
            part: "snippet",
            maxResults: maxResults,
            type: "video",
            order: order,
        })
        return responce.data;
    }
}

module.exports = { YTHandler };