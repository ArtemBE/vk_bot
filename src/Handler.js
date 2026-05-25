const axios = require('axios');
const fs = require('fs');
const { YtDlp } = require('ytdlp-nodejs');
const ytdlp = new YtDlp();
const { createWriteStream } = require('fs');
require('dotenv').config();
const {Keyboard} = require('vk-io')
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
    async handleMessage(body){
        const userMessage = body.object.message.text;
        const userId = body.object.message.from_id;
        const peerId = body.object.message.peer_id;
        const kb = Keyboard.builder()
        .textButton({
            label: '📸 Фото',
        })
        .textButton({
            label: '🎵 Музыка',
        }).inline(false) // false - обычная клавиатура (всегда видна)
        .toString();
        console.log(kb)
        console.log(userMessage);
        
        if(userMessage=="Клава"){
            const reply = {
                peer_id: peerId,
                message: `Привет! Пока что я отвечаю только стандартным текстом. ${userId}`,
                random_id: Math.floor(Math.random() * 1000000), // Уникальный ID для избежания дублей
                keyboard: kb
            }
            return reply;
        }
        else{
            const reply = {
                peer_id: peerId,
                message: `Привет! Пока что я отвечаю только стандартным текстом. ${userId}`,
                random_id: Math.floor(Math.random() * 1000000), // Уникальный ID для избежания дублей
                /* keyboard: kb */
            }
            return reply;
        }
    }
}

module.exports = { YTHandler };