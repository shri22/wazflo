import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;

// Helper to get headers for a specific store
const getHeaders = (accessToken) => ({
    'Authorization': `Bearer ${accessToken || process.env.WHATSAPP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
});

// Helper to get URL for a specific store
const getUrl = (phoneNumberId) => {
    const id = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    return `${WHATSAPP_API_URL}/${id}/messages`;
};

export const sendTextMessage = async (to, message, storeConfig = {}) => {
    try {
        const response = await axios.post(
            getUrl(storeConfig.phoneNumberId),
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: message }
            },
            { headers: getHeaders(storeConfig.accessToken) }
        );
        return response.data;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response?.data || error.message);
        throw error;
    }
};

export const sendInteractiveButtons = async (to, bodyText, buttons, storeConfig = {}) => {
    try {
        const response = await axios.post(
            getUrl(storeConfig.phoneNumberId),
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    body: { text: bodyText },
                    action: {
                        buttons: buttons.map((btn, idx) => ({
                            type: 'reply',
                            reply: {
                                id: btn.id || `btn_${idx}`,
                                title: btn.title.substring(0, 20) // Max 20 chars
                            }
                        }))
                    }
                }
            },
            { headers: getHeaders(storeConfig.accessToken) }
        );
        return response.data;
    } catch (error) {
        console.error('Error sending interactive buttons:', error.response?.data || error.message);
        throw error;
    }
};

export const sendInteractiveList = async (to, bodyText, buttonText, sections, storeConfig = {}) => {
    try {
        const response = await axios.post(
            getUrl(storeConfig.phoneNumberId),
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'interactive',
                interactive: {
                    type: 'list',
                    body: { text: bodyText },
                    action: {
                        button: buttonText,
                        sections: sections
                    }
                }
            },
            { headers: getHeaders(storeConfig.accessToken) }
        );
        return response.data;
    } catch (error) {
        console.error('Error sending interactive list:', error.response?.data || error.message);
        throw error;
    }
};

export const sendImageMessage = async (to, imageUrl, caption = '', storeConfig = {}) => {
    try {
        const response = await axios.post(
            getUrl(storeConfig.phoneNumberId),
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'image',
                image: {
                    link: imageUrl,
                    caption: caption
                }
            },
            { headers: getHeaders(storeConfig.accessToken) }
        );
        return response.data;
    } catch (error) {
        console.error('Error sending image:', error.response?.data || error.message);
        throw error;
    }
};

export const sendTemplateMessage = async (to, templateName, languageCode = 'en', storeConfig = {}) => {
    try {
        const response = await axios.post(
            getUrl(storeConfig.phoneNumberId),
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: languageCode }
                }
            },
            { headers: getHeaders(storeConfig.accessToken) }
        );
        return response.data;
    } catch (error) {
        console.error('Error sending template:', error.response?.data || error.message);
        throw error;
    }
};

export const markAsRead = async (messageId, storeConfig = {}) => {
    try {
        await axios.post(
            getUrl(storeConfig.phoneNumberId),
            {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId
            },
            { headers: getHeaders(storeConfig.accessToken) }
        );
    } catch (error) {
        console.error('Error marking message as read:', error.response?.data || error.message);
    }
};
