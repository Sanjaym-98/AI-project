const http = require('http');
const express = require('express');
require('dotenv').config();
const bodyparser =require('body-parser');
const routes = require('./routes');

const app = express();

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
