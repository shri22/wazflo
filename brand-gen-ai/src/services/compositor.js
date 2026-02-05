const sharp = require('sharp');
const path = require('path');

class Compositor {
    async compose(backgroundBuffer, brand, content) {
        console.log('🖼️ Composing final image...');

        // 1. Prepare Logo
        // Resize logo to be 200px wide (approx 20% of 1024 width)
        const logoBuffer = await sharp(brand.logoPath)
            .resize(200, null, { fit: 'contain' })
            .toBuffer();

        // 2. Prepare Text Overlay (as SVG)
        // 2. Prepare Text Overlay (as SVG)
        const headlineLines = this.wrapText(content.headline, 20); // ~20 chars per line for 80px font
        const subtextLines = this.wrapText(content.subtext, 40);   // ~40 chars per line for 40px font

        // Calculate vertical center
        const startY = 500 - ((headlineLines.length * 90) + (subtextLines.length * 50)) / 2;

        let svgContent = '';

        // Render Headline Lines
        headlineLines.forEach((line, i) => {
            svgContent += `<text x="512" y="${startY + (i * 90)}" class="headline shadow">${this.escapeXml(line)}</text>`;
        });

        // Render Subtext Lines
        const subtextStartY = startY + (headlineLines.length * 90) + 40; // Gap
        subtextLines.forEach((line, i) => {
            svgContent += `<text x="512" y="${subtextStartY + (i * 50)}" class="subtext shadow">${this.escapeXml(line)}</text>`;
        });

        const svgText = `
      <svg width="1024" height="1024">
        <style>
          .headline { fill: white; font-size: 80px; font-weight: bold; font-family: 'Arial', sans-serif; text-anchor: middle; }
          .subtext { fill: #f0f0f0; font-size: 40px; font-family: 'Arial', sans-serif; text-anchor: middle; }
          .shadow { filter: drop-shadow(3px 3px 2px rgba(0,0,0,0.8)); }
        </style>
        ${svgContent}
      </svg>
    `;
        const textBuffer = Buffer.from(svgText);

        // 3. Composite
        // Layer order: Background -> Logo (Top Center) -> Text
        const finalImage = await sharp(backgroundBuffer)
            .resize(1024, 1024) // Ensure base is 1024
            .composite([
                {
                    input: logoBuffer,
                    top: 50,
                    left: 412 // (1024 - 200)/2 = Centered
                },
                {
                    input: textBuffer,
                    top: 0,
                    left: 0
                }
            ])
            .png()
            .toBuffer();

        return finalImage;
    }

    escapeXml(unsafe) {
        if (!unsafe) return '';
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }

    wrapText(text, maxChars) {
        if (!text) return [];
        const words = text.split(' ');
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            if (currentLine.length + 1 + words[i].length <= maxChars) {
                currentLine += " " + words[i];
            } else {
                lines.push(currentLine);
                currentLine = words[i];
            }
        }
        lines.push(currentLine);
        return lines;
    }
}

module.exports = new Compositor();
