
require("dotenv").config();
const express = require('express');
const imageGeneration = express.Router();
const bodyparser = require('body-parser');
const { generateImage } = require('./service');



imageGeneration.use(bodyparser.json());
imageGeneration.use(
  bodyparser.urlencoded({
    extended: true,
  })
);

imageGeneration.get('/generateImage', async (req, res) => {
  try{
    let userPrompt = req.query.userPrompt;
    if (!userPrompt) {
      return res.status(400).json({ 
        success: false, 
        error: "Please provide your input for image generation" 
      });
    }
    let imageResponse = await generateImage(userPrompt);

    //  return sharp(buffer)
        //   .png()  // Convert to PNG
        //   .resize(768, 768)  // Downsample for web
        //   .toBuffer();
    res.json({
      success: true,
      image: imageResponse.toString('base64'), // Convert buffer to base64 string for JSON response
      message: "Image generated successfully"
    });

  }catch(err){
console.error("Error generating image:", err);
    res.status(500).json({
      success: false,
      error: "Image generation failed: " + err.message
    });
  }
})

module.exports = imageGeneration;