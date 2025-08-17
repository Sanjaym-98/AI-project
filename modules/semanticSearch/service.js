const createClient = require("@supabase/supabase-js").createClient;
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key must be provided in environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateSeamanticSearch(embedding){
    try{
        if(!embedding || embedding.length === 0){
            throw new Error("Embedding must be a non-empty array");
        }

        console.log("Searching for similar documents with embedding length:", embedding.length);
        
        // Ensure the embedding is an array of numbers
       

        const { data } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: 0.50,
            match_count: 1
        });

        if (!data || data.length === 0) {
            throw new Error("No matching documents found");
        }

        console.log("Search results:", data);
        return data;
    }catch(err){

    }
}

module.exports = {
    generateSeamanticSearch
};


