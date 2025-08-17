// step  1 - creating chuncking and save to vecto db with document id as common identifyer
// step 2 - once saved provide the txt to llm to get summary
// step 3 - create it in chat manner

require("dotenv").config();
const express = require('express');
const bodyparser = require('body-parser');
const documentSummary = express.Router();
const fileParser = require('../../service.js/fileParser');
const textChuncking = require('../../service.js/textChuncking');
const {generateSummary} = require('../documentSummary/service');
const fs= require('fs').promises;
const multer = require('multer');
const tmp = require('tmp-promise');


const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

documentSummary.use(bodyparser.json());

documentSummary.use(
  bodyparser.urlencoded({
    extended: true,
  })
);


documentSummary.post('/createSummary', upload.single('file'), async (req, res) => {
  try {
    console.log('=== Document Summary Request Started ===');
    if (!req.file || !req.body.userPrompt) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing file or userPrompt" 
      });
    }

    const { buffer, originalname } = req.file;
    const { userPrompt } = req.body;

    // Create temp file for formats that require disk access
    const { path: tempFilePath, cleanup } = await tmp.file();
    await fs.writeFile(tempFilePath, buffer);

    try {
      // Extract text from file
      const extractText = await fileParser.parseDocumentToText(tempFilePath, originalname);
      
      if (!extractText || extractText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Failed to extract text from document"
        });
      }
      const processed = await textChuncking.splitDocument(extractText,originalname);
      console.log("Processed Document:", processed);
      
      if(processed===201){

   const cleanedContent = extractText.replace(/'\s*\+\s*'/g, '')
    .replace(/\0/g, '')  // Remove null characters
    .replace(/[\u0000-\u001F]/g, '')  // Remove all control characters
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

              const summary = await generateSummary(cleanedContent, userPrompt,"You are an assistant who makes information easy to understand. Summarize the document in bullet points using simple and clear language.");
              res.json({
        success: true,
        summary,
        chunks: processed.chunks,
        embeddings: processed.embeddings,
        metadata: processed.metadata
      });

      }
      
      
    } finally {
      await cleanup(); // Remove temp file
    }
  } catch (error) {
    console.error("error", error.message);
    res.status(500).json({
      success: false,
      error: "Processing failed",
      message: error.message
    });
  }
});

module.exports = documentSummary;