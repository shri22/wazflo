const OpenAI = require('openai');

class IntentClassifier {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async analyze(userPrompt) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("Missing OPENAI_API_KEY. Please add it to your .env file.");
        }

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are an AI automated assistant. Classify the user's request.
            
            - SEARCH_REQUIRED: If the user asks for "news", "trends", "facts", "history", or generic topics (e.g., "Post about AI trends").
            - MANUAL_GENERATION: If the user provides specific content/updates (e.g., "Welcome our new client", "50% off sale").

            Return ONLY JSON: { "action": "SEARCH_REQUIRED" | "MANUAL_GENERATION", "topic": "extracted topic" }`
                    },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" }
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error("Intent Classifier Error:", error.message);
            // Fallback
            return { action: 'MANUAL_GENERATION', topic: userPrompt };
        }
    }
}

module.exports = new IntentClassifier();
