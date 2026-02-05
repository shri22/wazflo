const { BRANDS } = require('./config/brands');
const IntentClassifier = require('./src/services/intent_classifier');
const ContentManager = require('./src/services/content_manager');
const ImageEngine = require('./src/services/image_engine');
const Compositor = require('./src/services/compositor');
const fs = require('fs');
const path = require('path');

// MOCK ENV for standalone run if needed, or rely on dotenv
require('dotenv').config();

async function runDailyJob() {
    console.log("🌞 Starting Daily Marketing Generator...");

    // Create output folder
    const today = new Date().toISOString().split('T')[0];
    const outDir = path.join(__dirname, 'output', `daily_${today}`);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // Topics to rotate
    const topics = [
        "Future Innovation Trends",
        "Customer Appreciation",
        "Weekly Best Sellers",
        "Behind the Scenes"
    ];

    for (const brand of BRANDS) {
        try {
            // Pick random topic
            const topic = topics[Math.floor(Math.random() * topics.length)];
            const userPrompt = `Create a daily post about: ${topic}`;

            console.log(`\n🤖 Processing ${brand.name} -> ${topic}...`);

            // 1. Identify Intent
            const intent = await IntentClassifier.analyze(userPrompt);

            // 2. Content
            const content = await ContentManager.process(intent, userPrompt);
            console.log(`   📝 Copy: "${content.headline}"`);

            // 3. Image
            const bgBuffer = await ImageEngine.generateBackground(brand, content);

            // 4. Compose
            const finalImg = await Compositor.compose(bgBuffer, brand, content);

            // Save
            const filename = `${brand.id}_post.png`;
            fs.writeFileSync(path.join(outDir, filename), finalImg);
            console.log(`   ✅ Saved to ${path.join(outDir, filename)}`);

        } catch (e) {
            console.error(`   ❌ Failed for ${brand.name}:`, e.message);
        }
    }
    console.log("\n✨ Daily Job Complete!");
}

runDailyJob();
