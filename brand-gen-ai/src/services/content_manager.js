const OpenAI = require('openai');
const axios = require('axios');

class ContentManager {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async process(intent, userPrompt, brand) {
        let contextData = "";
        let source = "Direct Input";

        // 1. Research Phase
        if (intent.action === 'SEARCH_REQUIRED') {
            console.log(`🔎 Searching web for: ${intent.topic}`);
            // Detect key presence
            if (process.env.SERPAPI_KEY) {
                contextData = await this.performSearch(intent.topic);
                source = "Google Search (SerpApi)";
            } else {
                console.log('⚠️ No SERPAPI Key. Using AI Knowledge.');
                source = "AI Internal Knowledge (Key Missing)";
                contextData = `User topic: ${intent.topic}. (Search was requested but no API key found).`;
            }
        } else {
            contextData = userPrompt;
        }

        // 2. Copywriting Phase
        const copy = await this.generateCopy(contextData, intent.action, brand);

        // Return both content and metadata
        return { ...copy, source };
    }

    async performSearch(query) {
        try {
            console.log(`📡 Calling SerpApi for: ${query}`);
            const resp = await axios.get('https://serpapi.com/search', {
                params: {
                    q: query,
                    api_key: process.env.SERPAPI_KEY,
                    engine: 'google',
                    num: 3
                }
            });

            const results = resp.data.organic_results || [];
            const snippets = results.map((r, i) => `[Article ${i + 1}] ${r.title}: ${r.snippet}`).join('\n');
            console.log(`✅ Found ${results.length} articles.`);
            return snippets;
        } catch (e) {
            console.error("Search failed:", e.message);
            return `Search failed for ${query}`;
        }
    }

    async generateCopy(context, mode, brand) {
        const brandContext = brand ?
            `Brand: ${brand.name}. Industry/Context: ${brand.theme}.` :
            "Brand: Generic.";

        const systemPrompt = `You are a professional social media copywriter for ${brand ? brand.name : 'a brand'}.
    ${brandContext}

    Goal: Create a catchy Headline (max 5 words) and Subtext (max 10 words).
    Verify that the content aligns with the Brand's Industry (${brand ? brand.theme : 'General'}).

    Return JSON: { "headline": "...", "subtext": "...", "reasoning": "Quick explanation of why this fits the brand." }`;

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Context: ${context}` }
                ],
                response_format: { type: "json_object" }
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (e) {
            console.error("Copy Gen Error", e);
            return { headline: "Update", subtext: "Check this out", reasoning: "Fallback" };
        }
    }
}

module.exports = new ContentManager();
