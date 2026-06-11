console.log(343);

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const { YtDlp } = require('ytdlp-nodejs');
const ytdlp = new YtDlp();
const { createWriteStream } = require('fs');
const express = require('express')
const app = express();
const port = 3000;
const { YTHandler, VKHandler } = require('./src/Handler.js')
const yth = new YTHandler();
const vkh = new VKHandler();
const {VK} = require('vk-io')
const vk = new VK({ token: process.env.VK_TOKEN });
const {User}=require(process.env.DIRECTORY+"/src/User.js")
const {DataSaver} = require(process.env.DIRECTORY+"/src/DataSaver.js")
const saver = new DataSaver();
const {sendMessages} = require('./utils/SendMessages')

const youtube = require('googleapis').google.youtube({
    version: 'v3',
    auth: process.env.API_KEY,
});

app.use(express.json());

app.get('/', (req, res)=>{
  res.send("<h1 style='color: red'>Ok</h1>")
})

app.post('/vk/callback', (req, res)=>{
  if(req.body.type=="confirmation" && req.body.group_id==239299529)
    res.send("21e50ba2")
  if(req.body.type === 'message_new') {
    res.send('ok');
    console.log("Текст: "+req.body.object.message.text)
    vkh.handleMessage(req.body)
    .then(r=>{
      if(r.user) saver.createUserSync(r.user);
      if(Array.isArray(r.reply)){
        sendMessages(r.reply)
        .catch(e=>vk.api.messages.send(
          vkh.reportError("ъуъу "+e.message, req.body.object.message.peer_id, e.stack)
        ))
      } else {
        vk.api.messages.send(r.reply)
        .catch(e=>vk.api.messages.send(
          vkh.reportError("ъуъ "+e.message, req.body.object.message.peer_id, e.stack)
        ))
      }
    })
    .catch(e=>{
      vk.api.messages.send(vkh.reportError(e.message, req.body.object.message.peer_id, e.stack));
      //throw e;
    });
  }
})

app.get('/download', (req, res)=>{
  yth.download('https://youtu.be/fdvof0iRJf8?si=JghsviFD6bMsUcP3')
  .then(resp=>{
    console.log(resp)
    res.send("<h1 style='color: red'>Ok download</h1>")
  })
})

app.get('/pipeload', async (req, res)=>{
  yth.pipeload('https://youtu.be/fdvof0iRJf8?si=JghsviFD6bMsUcP3')
  .then(resp=>{
    console.log(resp)
    res.send("<h1 style='color: red'>Ok pipeload</h1>")
  })
})

app.get('/list', (req, res)=>{
  yth.getList("Cheesecake", 3, "video").then(data=>console.log(data) || res.json(data))
})

app.get('/info', (req, res)=>{
  yth.getVideoInfo('r6JyVyUxgBs').then(data=>console.log(data) || res.json(data))
})
app.get('/user', (req, res)=>{
  const user = new User(123, "state2");
  saver.createUserSync(user);
  res.send(244433)
})
app.get('/channelInfo', (req, res)=>{
  yth.getChannelInfo('UCmSImlPUez2i1wvsctTB0Gw').then(data=>console.log(data) || res.json(data))
})

app.get('/channelVideo', (req, res)=>{
  yth.getChannelVideos('UCmSImlPUez2i1wvsctTB0Gw', 5).then(data=>console.log(data) || res.json(data))
})

app.listen(process.env.PORT, process.env.IP, () => {
  console.log(`Сервер запущен на http://${process.env.IP}:${process.env.PORT}`);
});
