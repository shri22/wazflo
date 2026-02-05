const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class ImageEngine {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async generateBackground(brand, content) {
        // 1. Check for Active Template (Override)
        if (brand.activeTemplate) {
            console.log(`🎨 Using Template for ${brand.name}: ${brand.activeTemplate}`);
            // Ensure the template path is resolved correctly if it's not an absolute path
            const templatePath = path.resolve(brand.activeTemplate);
            if (fs.existsSync(templatePath)) {
                // Assuming the template is an image file that sharp can process
                return await sharp(templatePath).toBuffer();
            } else {
                console.warn(`Template file not found at ${templatePath}. Proceeding with DALL-E generation.`);
            }
        }

        console.log(`🎨 Generating Premium Art for ${brand.name} via DALL-E 3...`);

        // 2. Construct Prompt
        let visualStyle = brand.theme; // e.g. "Dark Tech, Red Accents"

        // Smart Context Injection
        if (content.headline && (content.headline.toLowerCase().includes('step') || content.headline.toLowerCase().includes('flow') || content.headline.toLowerCase().includes('how'))) {
            visualStyle += ", Infographic style, Step-by-step flowchart visual, Data Visualization, Nodes and Arrows, Professional Diagram";
        }
        else if (content.headline && (content.headline.toLowerCase().includes('product') || content.headline.toLowerCase().includes('catalog') || content.headline.toLowerCase().includes('collection'))) {
            visualStyle += ", Product Grid Catalog Layout, Multiple Items Display, Clean E-commerce showcase, Symmetric Grid";
        }

        const prompt = `A professional background image for a social media post.
    Brand Style: ${visualStyle}.
    Brand Color: ${brand.baseColor} (${brand.colorHex}).
    Subject: ${content.headline}.
    Details: ${content.subtext}.
    Crucial: NO TEXT on the image. High quality, 4k, trending on artstation.
    Composition: Leave space in the center for text overlay.`;

        try {
            const response = await this.openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                response_format: "b64_json"
            });

            const b64 = response.data[0].b64_json;
            return Buffer.from(b64, 'base64');
        } catch (error) {
            console.error("DALL-E Failed:", error.message);
            throw error;
        }
    }
}

module.exports = new ImageEngine();
