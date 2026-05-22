console.log(343);

const axios = require('axios');
const fs = require('fs');
const { YtDlp } = require('ytdlp-nodejs');
const ytdlp = new YtDlp();
const { createWriteStream } = require('fs');
const express = require('express')
const app = express();
const port = 3000;
const { YTHandler } = require('../bot/src/Handler.js')
const yth = new YTHandler();
require('dotenv').config();


const youtube = require('googleapis').google.youtube({
    version: 'v3',
    auth: process.env.API_KEY,
});

app.get('/', (req, res)=>{
  res.send("<h1 style='color: red'>Пошел нахуй</h1>")
})

app.get('/download', (req, res)=>{
  yth.download('https://youtu.be/fdvof0iRJf8?si=JghsviFD6bMsUcP3')
  .then(resp=>{
    console.log(resp)
    res.send("<h1 style='color: red'>Пошел нахуй download</h1>")
  })
})

app.get('/pipeload', async (req, res)=>{
  yth.pipeload('https://youtu.be/fdvof0iRJf8?si=JghsviFD6bMsUcP3')
  .then(resp=>{
    console.log(resp)
    res.send("<h1 style='color: red'>Пошел нахуй pipeload</h1>")
  })
})

app.get('/list', (req, res)=>{
  yth.getList("Жмиль", 3, "channel").then(data=>console.log(data) || res.json(data))
})

app.get('/info', (req, res)=>{
  yth.getVideoInfo('r6JyVyUxgBs').then(data=>console.log(data) || res.json(data))
})
app.get('/channelInfo', (req, res)=>{
  yth.getChannelInfo('UCmSImlPUez2i1wvsctTB0Gw').then(data=>console.log(data) || res.json(data))
})

app.get('/channelVideo', (req, res)=>{
  yth.getChannelVideos('UCmSImlPUez2i1wvsctTB0Gw', 5).then(data=>console.log(data) || res.json(data))
})

app.listen(process.env.PORT, process.env.IP, () => {
  console.log(`Сервер запущен на http://${process.env.IP}:${port}`);
});