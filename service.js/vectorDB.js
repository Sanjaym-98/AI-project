const createClient = require("@supabase/supabase-js").createClient;
const crypto = require('crypto');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key must be provided in environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertDocument(document,filename) {
  try {
    console.log("docuemnt[1", document[1].embedding.length);
    console.log("filename"  , filename);
    const documentUUID = crypto.randomUUID();
    console.log("Generated UUID for document:", documentUUID);
    document =document.map(doc => ({
      ...doc,
      document_id: documentUUID,
      document_name: filename // Add UUID to each document
    }));

    console.log("first ele", document[0].content);
      const result = await supabase.from('documents').insert(document)
      console.log("Insert result:", result);
     
     return result.status;
  } catch (error) {
    console.error("Error inserting document:", error);
    throw error;
  }
}




module.exports = {
  insertDocument,
  supabase
};