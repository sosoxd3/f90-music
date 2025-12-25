// Netlify Function with your YouTube API key
const axios = require('axios');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyD3mvCx80XsvwrURRg2RwaD8HmOKqhYkek'; // Your API key
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
        const { playlistId, videoIds, q, maxResults = 50, part = 'snippet', channelId, pageToken } = JSON.parse(event.body);
        
        let url, params;
        
        // Channel endpoint - get channel details including uploads playlist
        if (event.path.includes('/channel') && channelId) {
            url = `${YOUTUBE_API_BASE}/channels`;
            params = {
                key: YOUTUBE_API_KEY,
                id: channelId,
                part: part || 'snippet,contentDetails,statistics,brandingSettings'
            };
        }
        // Channel statistics
        else if (event.path.includes('/channel-stats') && channelId) {
            url = `${YOUTUBE_API_BASE}/channels`;
            params = {
                key: YOUTUBE_API_KEY,
                id: channelId,
                part: 'snippet,statistics,brandingSettings'
            };
        }
        // Playlist items with pagination
        else if (event.path.includes('/playlist-items') && playlistId) {
            url = `${YOUTUBE_API_BASE}/playlistItems`;
            params = {
                key: YOUTUBE_API_KEY,
                playlistId,
                maxResults: Math.min(maxResults, 50), // API limit
                part: part || 'snippet,contentDetails',
                pageToken: pageToken || undefined
            };
        }
        // Regular playlist items
        else if (playlistId) {
            url = `${YOUTUBE_API_BASE}/playlistItems`;
            params = {
                key: YOUTUBE_API_KEY,
                playlistId,
                maxResults: Math.min(maxResults, 50),
                part: 'snippet,contentDetails'
            };
        }
        // Video details
        else if (videoIds) {
            url = `${YOUTUBE_API_BASE}/videos`;
            params = {
                key: YOUTUBE_API_KEY,
                id: Array.isArray(videoIds) ? videoIds.join(',') : videoIds,
                part: part || 'snippet,contentDetails,statistics'
            };
        }
        // Search within channel
        else if (event.path.includes('/search') && q) {
            url = `${YOUTUBE_API_BASE}/search`;
            params = {
                key: YOUTUBE_API_KEY,
                q,
                maxResults: Math.min(maxResults, 50),
                part: 'snippet',
                type: 'video',
                channelId: channelId || 'UC_x5XG1OV2P6uZZ5FSM9Ttw' // F90 channel ID
            };
        }
        // Regular search
        else if (q) {
            url = `${YOUTUBE_API_BASE}/search`;
            params = {
                key: YOUTUBE_API_KEY,
                q,
                maxResults: Math.min(maxResults, 50),
                part: 'snippet',
                type: 'video'
            };
        }
        else {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required parameters' })
            };
        }
        
        console.log('Making YouTube API request:', { url, params: { ...params, key: '***' } });
        
        const response = await axios.get(url, { params });
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response.data)
        };
        
    } catch (error) {
        console.error('YouTube API Error:', error.response?.data || error.message);
        
        return {
            statusCode: error.response?.status || 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to fetch data from YouTube',
                details: error.response?.data?.error?.message || error.message,
                quotaExceeded: error.response?.status === 403
            })
        };
    }
};
