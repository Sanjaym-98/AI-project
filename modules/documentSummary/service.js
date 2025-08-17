require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

async function generateSummary(documentText,userPrompt, options = {}) {
  try {
    if (!process.env.HF_TOKEN) {
      throw new Error("HF_TOKEN environment variable is not set");
    }
    console.log("documentText", documentText);
    const hf = new HfInference(process.env.HF_TOKEN);

    console.log("🤖 Generating summary with BART...");

    const summaryResponse = await hf.summarization({
      model: 'facebook/bart-large-cnn',
      inputs: documentText,
      parameters: {
        max_length: options.maxTokens || 2500,
        min_length: options.minTokens || 30,
        do_sample: true
      }
    });

    console.log("✅ Summary generated successfully",summaryResponse);

    return {
      success: true,
      summary: summaryResponse.summary_text,
      model: 'facebook/bart-large-cnn',
      tokens_used: summaryResponse.summary_text.split(/\s+/).length,
      input_length: documentText.length
    };

  } catch (error) {
    console.error("❌ Error generating summary:", error);
    return {
      success: false,
      error: error.message,
      summary: `Error generating summary: ${error.message}`
    };
  }
}
    

module.exports = {
  generateSummary
};

