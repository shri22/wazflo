const path = require('path');

/**
 * BRAND CONFIGURATION
 * 
 * This file controls the "Identity" of the generator.
 * To add a new brand, simply add a new object to this array.
 */

const BRANDS = [
    {
        id: 'wazflo',
        name: 'Wazflo',
        baseColor: 'Blue',
        colorHex: '#2563EB',
        theme: 'Tech, SaaS, Professional, Futuristic, Clean Lines',
        // We assume the logo is stored here. 
        logoPath: path.join(__dirname, '../assets/logos/wazflo.png'),
        // If activeTemplate is set to a path, the AI will skip generation 
        // and use this image as the background.
        activeTemplate: null
    },
    {
        id: 'dakroot',
        name: 'Dakroot',
        baseColor: 'Red',
        colorHex: '#DC2626',
        theme: 'Bold, Industrial, Energetic, High Contrast',
        logoPath: path.join(__dirname, '../assets/logos/dakroot.png'),
        activeTemplate: null
    },
    {
        id: 's3t',
        name: 'Sri Sai Senthil Travels',
        baseColor: 'Black',
        colorHex: '#000000',
        theme: 'Luxury, Premium, Sleek, Gold Accents, Travel',
        logoPath: path.join(__dirname, '../assets/logos/s3t.png'),
        activeTemplate: null
    }
];

module.exports = { BRANDS };
