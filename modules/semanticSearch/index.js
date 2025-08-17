const seamanticSearch = require('express').Router();
const bodyparser = require('body-parser');
const { generateSeamanticSearch } = require('./service');
const { createEmbeddingsForSearch } = require('../../service.js/embeddings');

seamanticSearch.use(bodyparser.json());
seamanticSearch.use(
  bodyparser.urlencoded({
    extended: true,
  })
);

seamanticSearch.get('/search', async (req, res) => {
  try {
    const  query  = req.query.query;
    if (!query ) {
      return res.status(400).json({ 
        success: false, 
        error: "Please provide a query for semantic search" 
      });
    }
    
    const searchResults = await createEmbeddingsForSearch(query);
    if (!searchResults.embedding || searchResults.embedding.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No results found for the given query"
      });
    }
    
    // Assuming generateSemanticSearch processes the results further
    const processedResults = await generateSeamanticSearch(searchResults.embedding);
    if (!processedResults[0].content || processedResults[0].content.length === 0  ) { 

        return res.status(404).json({
          success: false,
          error: "No matching documents found"
        });
    }

    console.log("Processed Results:", processedResults);
    
    res.json({
      success: true,
      results: processedResults,
      message: "Semantic search completed successfully"
    });

  } catch (err) {
    console.error("Error in semantic search:", err);
    res.status(500).json({
      success: false,
      error: "Semantic search failed: " + err.message
    });
  }
});

module.exports = seamanticSearch;   