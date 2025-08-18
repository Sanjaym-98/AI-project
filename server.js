const http = require('http');
const express = require('express');
require('dotenv').config();
const bodyparser =require('body-parser');
const routes = require('./routes');

const app = express();


app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }})


  routes(app)


const server = http.createServer(app);
  const { HfInference } = require('@huggingface/inference');

    const hf =  new HfInference("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");

server.listen(process.env.port,function(err){
    if(err){
        console.log("eror",err)
    }else{
        console.log("server Up!")
    }
});
