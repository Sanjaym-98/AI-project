const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const embeddingsService = require('./embeddings');

async function splitDocument(extractText,filename) {
  try {
    if (typeof extractText !== 'string') {
      throw new Error("extractText must be a string. Received: " + typeof extractText);
    }

    if (extractText.trim().length === 0) {
      throw new Error("extractText is empty");
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 150,
      chunkOverlap: 15,
    });

    const chunks = await splitter.createDocuments([extractText]);

    if (chunks.length === 0) {
      throw new Error("No chunks were created from the document");
    }
    const embeddings = await embeddingsService.createEmbeddings(chunks,filename);
    console.log("Embeddings created successfully:", embeddings);

    return embeddings

  } catch (error) {
    console.error("Error", error.message);
    throw new Error(`Document splitting failed: ${error.message}`);
  }
}


module.exports = { 
  splitDocument  
}