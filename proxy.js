here// YouTube API Proxy - Secure serverless implementation
class YouTubeProxy {
    constructor() {
        this.baseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/youtube' 
            : '/api/youtube';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Fetch playlist items securely
    async fetchPlaylistItems(playlistId, maxResults = 50) {
        const cacheKey = `playlist_${playlistId}_${maxResults}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${this.baseUrl}/playlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playlistId,
                    maxResults,
                    part: 'snippet,contentDetails'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: data.items,
                timestamp: Date.now()
            });

            return data.items;
        } catch (error) {
            console.error('Error fetching playlist:', error);
            // Fallback to mock data for demo
            return this.getMockPlaylistItems(playlistId);
        }
    }

    // Fetch video details
    async fetchVideoDetails(videoIds) {
        const cacheKey = `videos_${videoIds.join(',')}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${this.baseUrl}/videos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoIds,
                    part: 'snippet,contentDetails,statistics'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            this.cache.set(cacheKey, {
                data: data.items,
                timestamp: Date.now()
            });

            return data.items;
        } catch (error) {
            console.error('Error fetching video details:', error);
            return this.getMockVideoDetails(videoIds);
        }
    }

    // Search videos
    async searchVideos(query, maxResults = 20) {
        const cacheKey = `search_${query}_${maxResults}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${this.baseUrl}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: query,
                    maxResults,
                    part: 'snippet',
                    type: 'video',
                    channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw' // F90 channel ID
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            this.cache.set(cacheKey, {
                data: data.items,
                timestamp: Date.now()
            });

            return data.items;
        } catch (error) {
            console.error('Error searching videos:', error);
            return this.getMockSearchResults(query);
        }
    }

    // Mock data for demo purposes
    getMockPlaylistItems(playlistId) {
        const mockData = {
            'PL2FIA-SoBgYvY4B-0IDWTtKriVGPb1qnx': [
                {
                    id: 'video1',
                    snippet: {
                        title: 'أغنية عربية جميلة - F90 Studio',
                        thumbnails: {
                            medium: { url: 'https://via.placeholder.com/320x180/000000/d4af37?text=Song+1' }
                        }
                    },
                    contentDetails: { videoId: 'video1' }
                },
                {
                    id: 'video2',
                    snippet: {
                        title: 'موسيقى هادئة - F90 Production',
                        thumbnails: {
                            medium: { url: 'https://via.placeholder.com/320x180/1a1a1a/ffd700?text=Song+2' }
                        }
                    },
                    contentDetails: { videoId: 'video2' }
                }
            ]
        };
        
        return mockData[playlistId] || [];
    }

    getMockVideoDetails(videoIds) {
        return videoIds.map(id => ({
            id,
            snippet: {
                title: `Song ${id}`,
                description: 'Beautiful Arabic music from F90 Studio',
                thumbnails: {
                    medium: { url: `https://via.placeholder.com/320x180/000000/d4af37?text=Song+${id}` }
                }
            },
            contentDetails: {
                duration: 'PT3M45S'
            },
            statistics: {
                viewCount: Math.floor(Math.random() * 1000000).toString()
            }
        }));
    }

    getMockSearchResults(query) {
        return [
            {
                id: { videoId: 'search1' },
                snippet: {
                    title: `نتائج البحث عن: ${query}`,
                    thumbnails: {
                        medium: { url: 'https://via.placeholder.com/320x180/000000/d4af37?text=Search+Result' }
                    }
                }
            }
        ];
    }

    // Clear expired cache entries
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
            }
        }
    }
}

// Initialize YouTube proxy
window.youtubeProxy = new YouTubeProxy();

// Clear expired cache periodically
setInterval(() => window.youtubeProxy.clearExpiredCache(), 60000); // Every minute
