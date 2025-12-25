here// Vercel Serverless Function for secure YouTube API calls
import axios from 'axios';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
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
        const { playlistId, videoIds, q, maxResults = 20, part = 'snippet' } = req.body;
        
        let url, params;
        
        if (playlistId) {
            url = `${YOUTUBE_API_BASE}/playlistItems`;
            params = {
                key: YOUTUBE_API_KEY,
                playlistId,
                maxResults,
                part: 'snippet,contentDetails'
            };
        } else if (videoIds) {
            url = `${YOUTUBE_API_BASE}/videos`;
            params = {
                key: YOUTUBE_API_KEY,
                id: Array.isArray(videoIds) ? videoIds.join(',') : videoIds,
                part: 'snippet,contentDetails,statistics'
            };
        } else if (q) {
            url = `${YOUTUBE_API_BASE}/search`;
            params = {
                key: YOUTUBE_API_KEY,
                q,
                maxResults,
                part: 'snippet',
                type: 'video',
                channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw'
            };
        } else {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        const response = await axios.get(url, { params });
        
        return res.status(200).json(response.data);
        
    } catch (error) {
        console.error('YouTube API Error:', error);
        
        return res.status(error.response?.status || 500).json({ 
            error: 'Failed to fetch data from YouTube',
            details: error.message 
        });
    }
}
