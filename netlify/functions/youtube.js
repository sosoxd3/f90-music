here// Netlify Function for secure YouTube API calls
const axios = require('axios');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // Store in Netlify environment variables
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// CORS headers
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers
        };
    }

    try {
        const { playlistId, videoIds, q, maxResults = 20, part = 'snippet' } = JSON.parse(event.body);
        
        let url, params;
        
        if (playlistId) {
            // Fetch playlist items
            url = `${YOUTUBE_API_BASE}/playlistItems`;
            params = {
                key: YOUTUBE_API_KEY,
                playlistId,
                maxResults,
                part: 'snippet,contentDetails'
            };
        } else if (videoIds) {
            // Fetch video details
            url = `${YOUTUBE_API_BASE}/videos`;
            params = {
                key: YOUTUBE_API_KEY,
                id: Array.isArray(videoIds) ? videoIds.join(',') : videoIds,
                part: 'snippet,contentDetails,statistics'
            };
        } else if (q) {
            // Search videos
            url = `${YOUTUBE_API_BASE}/search`;
            params = {
                key: YOUTUBE_API_KEY,
                q,
                maxResults,
                part: 'snippet',
                type: 'video',
                channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw' // F90 channel ID
            };
        } else {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required parameters' })
            };
        }
        
        const response = await axios.get(url, { params });
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response.data)
        };
        
    } catch (error) {
        console.error('YouTube API Error:', error);
        
        return {
            statusCode: error.response?.status || 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to fetch data from YouTube',
                details: error.message 
            })
        };
    }
};
