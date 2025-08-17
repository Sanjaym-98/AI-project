
const { HfInference } = require('@huggingface/inference');
const sharp = require('sharp');
const fs = require('fs');

const HF_TOKEN = process.env.HF_TOKEN; // Replace with your token
const hf = new HfInference(HF_TOKEN);

async function generateImage(prompt) {
  try {
    // Generate image using top model
    const response = await hf.textToImage({
      model: 'stabilityai/stable-diffusion-xl-base-1.0',
      inputs: prompt,
      parameters: {
        negative_prompt: 'blurry, low quality, deformed, text',
        width: 1024,
        height: 1024,
        num_inference_steps: 25
      }
    });

    console.log("Image generation response:", response);
    // Convert blob to buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    
    return sharp(buffer)
      .png()  // Convert to PNG
      .resize(768, 768)  // Downsample for web
      .toBuffer();
      
  } catch (error) {
    console.error('Generation failed:', error);
    throw new Error('Image generation failed: ' + error.message);
  }
}

module.exports = {
  generateImage
};