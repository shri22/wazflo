# BrandGen-AI: Automated Social Media Manager

## 1. Project Overview
BrandGen-AI is an intelligent automation tool designed to generate on-brand social media assets for multiple diverse brands (Wazflo, Dakroot, S3T). It combines LLM-based intent classification, automated web research, AI image generation, and programmatic image compositing to deliver production-ready marketing posts.

## 2. Key Features
*   **Multi-Brand Support**: Configurable profiles for different brands (Colors, Themes, Logos).
*   **Intent Classification**: "Brain" that decides if a post needs external research or manual formatting.
*   **Smart Content**: Automatically searches the web for trends vs. formatting user-provided updates.
*   **Hybrid Design Engine**:
    *   **Creative Mode**: Generates fresh AI backgrounds every time.
    *   **Template Mode**: Uses "Locked" layouts for consistency.
*   **Auto-Branding**: Programmatically stamps high-res logos onto generated images using `sharp`.

## 3. Architecture

### Core Components
1.  **Orchestrator (Server)**: Node.js Express server handling API requests.
2.  **The Brain (Intent Classifier)**: LLM (OpenAI/Gemini) to parse user prompts.
3.  **Researcher**: Integration with Search APIs (e.g., Tavily/SerpAPI).
4.  **Painter (Image Engine)**: Integration with DALL-E 3 / Stability AI.
5.  **Compositor**: `sharp` library to merge Background + Logo + Text Overlay.

### Data Flow
`User Input` -> `Intent Classifier` -> (`Search` OR `Format Text`) -> `Brand Config` -> `Image Generator` -> `Compositor` -> `Final Image`

## 4. Configuration (`config/brands.js`)
The system is driven by a single config file. Adding a brand is as simple as adding an object:

```javascript
{
  id: 'wazflo',
  name: 'Wazflo',
  baseColor: 'Blue',
  theme: 'Tech, SaaS, Modern',
  logoPath: './assets/logos/wazflo.png',
  activeTemplate: null // Set path to lock design
}
```

## 5. Setup Instructions

### Prerequisites
*   Node.js (v18+)
*   API Keys: OpenAI (or compatible LLM provider), Image Gen Provider.

### Installation
1.  `npm install`
2.  Set up `.env` file with `OPENAI_API_KEY`, etc.
3.  Place brand logos in `assets/logos/`.

### Running
*   Start Server: `node src/index.js`
*   Generate Post: POST to `/api/generate` with `{ brandId: 'wazflo', prompt: 'Summer Sale' }`

## 6. Future Expansion
*   **UI Dashboard**: A React frontend to visualize the generation process.
*   **Scheduler**: Auto-post to Instagram/LinkedIn API.
