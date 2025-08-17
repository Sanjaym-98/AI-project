require('dotenv').config();
const { HfInference } = require('@huggingface/inference');
const {insertDocument} = require('./vectorDB');
async function createEmbeddings(text,filename) {
  try {
    if (!process.env.HF_TOKEN) {
      throw new Error("HF_TOKEN environment variable is not set");
    }

    const hf = new HfInference(process.env.HF_TOKEN);
  

   const cleanedContent = text.map(doc =>
  doc.pageContent
    .replace(/'\s*\+\s*'/g, '')
    .replace(/\0/g, '')  // Remove null characters
    .replace(/[\u0000-\u001F]/g, '')  // Remove all control characters
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);


    const extractionPromise = await Promise.all(
      cleanedContent.map(async text => {
        const embedding = await hf.featureExtraction({
          model: 'BAAI/bge-small-en-v1.5',
          inputs: text
        })
        return {
          content: text,
          embedding: embedding
        }
      })
    )
    console.log("extractionPromise", extractionPromise);

    if (extractionPromise.length === 0) {
      throw new Error("No embeddings were created from the document");
    }
    console.log("extractionPromise[0]", extractionPromise[0].embedding.length);
   
      console.log("Inserting embeddings into vector DB");
       const insertToVectotrDB =await insertDocument(extractionPromise,filename)
      return insertToVectotrDB;
    
   

  } catch (err) {
    console.error("Error while creating embeddings:", err);
    console.error("Error stack:", err.stack);
    throw err;
  }
}

async function createEmbeddingsForSearch(text) {
  try {
    if (!process.env.HF_TOKEN) {
      throw new Error("HF_TOKEN environment variable is not set");
    }

    const hf = new HfInference(process.env.HF_TOKEN);
  

  


        const embedding = await hf.featureExtraction({
          model: 'BAAI/bge-small-en-v1.5',
          inputs: text
        })

        return {
          content: text,
          embedding: embedding
        }
      
   
  } catch (err) {
    console.error("Error while creating embeddings:", err);
    console.error("Error stack:", err.stack);
    throw err;
  }
}

module.exports = { createEmbeddings,createEmbeddingsForSearch };