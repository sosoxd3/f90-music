// Vercel Serverless Function with your YouTube API key
import axios from 'axios';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyD3mvCx80XsvwrURRg2RwaD8HmOKqhYkek'; // Your API key
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { playlistId, videoIds, q, maxResults = 50, part = 'snippet', channelId, pageToken } = req.body;
        
        let url, params;
        
        // Channel endpoint
        if (req.url.includes('/channel') && channelId) {
            url = `${YOUTUBE_API_BASE}/channels`;
            params = {
                key: YOUTUBE_API_KEY,
                id: channelId,
                part: part || 'snippet,contentDetails,statistics,brandingSettings'
            };
        }
        // Channel statistics
        else if (req.url.includes('/channel-stats') && channelId) {
            url = `${YOUTUBE_API_BASE}/channels`;
            params = {
                key: YOUTUBE_API_KEY,
                id: channelId,
                part: 'snippet,statistics,brandingSettings'
            };
        }
        // Playlist items with pagination
        else if (req.url.includes('/playlist-items') && playlistId) {
            url = `${YOUTUBE_API_BASE}/playlistItems`;
            params = {
                key: YOUTUBE_API_KEY,
                playlistId,
                maxResults: Math.min(maxResults, 50),
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
        else if (req.url.includes('/search') && q) {
            url = `${YOUTUBE_API_BASE}/search`;
            params = {
                key: YOUTUBE_API_KEY,
                q,
                maxResults: Math.min(maxResults, 50),
                part: 'snippet',
                type: 'video',
                channelId: channelId || 'UC_x5XG1OV2P6uZZ5FSM9Ttw'
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
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        console.log('Making YouTube API request:', { url, params: { ...params, key: '***' } });
        
        const response = await axios.get(url, { params });
        
        return res.status(200).json(response.data);
        
    } catch (error) {
        console.error('YouTube API Error:', error.response?.data || error.message);
        
        return res.status(error.response?.status || 500).json({ 
            error: 'Failed to fetch data from YouTube',
            details: error.response?.data?.error?.message || error.message,
            quotaExceeded: error.response?.status === 403
        });
    }
}
