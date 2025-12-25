// Enhanced YouTube API Proxy with Channel Integration
class YouTubeProxy {
    constructor() {
        this.baseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/youtube' 
            : '/api/youtube';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.channelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw'; // F90 channel ID from your URL
    }

    // Get channel uploads playlist ID
    async getChannelUploadsPlaylistId() {
        const cacheKey = `channel_${this.channelId}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${this.baseUrl}/channel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    channelId: this.channelId,
                    part: 'contentDetails'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const uploadsPlaylistId = data.items[0].contentDetails.relatedPlaylists.uploads;
            
            this.cache.set(cacheKey, {
                data: uploadsPlaylistId,
                timestamp: Date.now()
            });

            return uploadsPlaylistId;
        } catch (error) {
            console.error('Error fetching channel uploads playlist:', error);
            return 'PL2FIA-SoBgYvY4B-0IDWTtKriVGPb1qnx'; // Fallback to your first playlist
        }
    }

    // Fetch all channel videos
    async fetchAllChannelVideos(maxResults = 50) {
        try {
            const uploadsPlaylistId = await this.getChannelUploadsPlaylistId();
            return await this.fetchPlaylistItems(uploadsPlaylistId, maxResults);
        } catch (error) {
            console.error('Error fetching channel videos:', error);
            return this.getMockChannelVideos();
        }
    }

    // Fetch playlist items with pagination support
    async fetchPlaylistItems(playlistId, maxResults = 50) {
        const cacheKey = `playlist_${playlistId}_${maxResults}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        const allItems = [];
        let nextPageToken = null;
        
        do {
            try {
                const response = await fetch(`${this.baseUrl}/playlist-items`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        playlistId,
                        maxResults: 50, // Maximum per request
                        part: 'snippet,contentDetails',
                        pageToken: nextPageToken
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                allItems.push(...data.items);
                
                nextPageToken = data.nextPageToken;
                
                // Limit total results
                if (allItems.length >= maxResults) {
                    allItems.splice(maxResults);
                    break;
                }
                
            } catch (error) {
                console.error('Error fetching playlist page:', error);
                break;
            }
        } while (nextPageToken);

        // Cache the result
        this.cache.set(cacheKey, {
            data: allItems,
            timestamp: Date.now()
        });

        return allItems;
    }

    // Fetch specific playlists (your existing playlists)
    async fetchPlaylistsItems() {
        const playlistIds = [
            'PL2FIA-SoBgYvY4B-0IDWTtKriVGPb1qnx',
            'PL2FIA-SoBgYtotc48ZfKSYagxMd3AMmVp',
            'PL2FIA-SoBgYuXeLdvKXaMlRJiF3B2opAP'
        ];
        
        const playlistPromises = playlistIds.map(id => this.fetchPlaylistItems(id, 50));
        const playlistsData = await Promise.all(playlistPromises);
        
        return {
            playlists: playlistIds.map((id, index) => ({
                id,
                title: `Playlist ${index + 1}`,
                items: playlistsData[index] || []
            })),
            allItems: playlistsData.flat()
        };
    }

    // Fetch video details
    async fetchVideoDetails(videoIds) {
        const cacheKey = `videos_${Array.isArray(videoIds) ? videoIds.join(',') : videoIds}`;
        
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
                    videoIds: Array.isArray(videoIds) ? videoIds : [videoIds],
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
            return this.getMockVideoDetails(Array.isArray(videoIds) ? videoIds : [videoIds]);
        }
    }

    // Search videos in your channel
    async searchChannelVideos(query, maxResults = 20) {
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
                    channelId: this.channelId
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
            console.error('Error searching channel videos:', error);
            return this.getMockSearchResults(query);
        }
    }

    // Get channel statistics
    async getChannelStatistics() {
        const cacheKey = `channel_stats_${this.channelId}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${this.baseUrl}/channel-stats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    channelId: this.channelId,
                    part: 'snippet,statistics,brandingSettings'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const stats = data.items[0];
            
            this.cache.set(cacheKey, {
                data: stats,
                timestamp: Date.now()
            });

            return stats;
        } catch (error) {
            console.error('Error fetching channel statistics:', error);
            return this.getMockChannelStats();
        }
    }

    // Mock data for development/testing
    getMockChannelVideos() {
        return [
            {
                id: 'video1',
                snippet: {
                    title: 'أغنية عربية رائعة - F90 Studio Production',
                    description: 'أحدث إنتاجات ستوديو F90 من الموسيقى العربية الحديثة',
                    thumbnails: {
                        medium: { url: 'https://via.placeholder.com/320x180/000000/d4af37?text=F90+Song+1' }
                    },
                    publishedAt: '2024-01-15T10:00:00Z'
                },
                contentDetails: { videoId: 'video1' }
            },
            {
                id: 'video2',
                snippet: {
                    title: 'موسيقى هادئة للاسترخاء - F90 Music',
                    description: 'موسيقى هادئة ومريحة من إنتاج F90 ستوديو',
                    thumbnails: {
                        medium: { url: 'https://via.placeholder.com/320x180/1a1a1a/ffd700?text=F90+Song+2' }
                    },
                    publishedAt: '2024-01-10T15:30:00Z'
                },
                contentDetails: { videoId: 'video2' }
            },
            {
                id: 'video3',
                snippet: {
                    title: 'أغنية وطنية عربية - F90 Production',
                    description: 'إنتاج حديث لأغنية وطنية عربية كلاسيكية',
                    thumbnails: {
                        medium: { url: 'https://via.placeholder.com/320x180/2a2a2a/d4af37?text=F90+Song+3' }
                    },
                    publishedAt: '2024-01-05T20:15:00Z'
                },
                contentDetails: { videoId: 'video3' }
            }
        ];
    }

    getMockVideoDetails(videoIds) {
        return videoIds.map(id => ({
            id,
            snippet: {
                title: `F90 Studio Song ${id}`,
                description: 'Professional Arabic music production by F90 Studio',
                thumbnails: {
                    medium: { url: `https://via.placeholder.com/320x180/000000/d4af37?text=F90+Song+${id}` }
                }
            },
            contentDetails: {
                duration: 'PT3M45S'
            },
            statistics: {
                viewCount: Math.floor(Math.random() * 100000) + 10000,
                likeCount: Math.floor(Math.random() * 5000) + 1000,
                commentCount: Math.floor(Math.random() * 500) + 50
            }
        }));
    }

    getMockSearchResults(query) {
        return [
            {
                id: { videoId: 'search1' },
                snippet: {
                    title: `نتائج البحث عن: ${query}`,
                    description: 'نتائج البحث في قناة F90',
                    thumbnails: {
                        medium: { url: 'https://via.placeholder.com/320x180/000000/d4af37?text=Search+Result' }
                    }
                }
            }
        ];
    }

    getMockChannelStats() {
        return {
            snippet: {
                title: 'F90 Music Studio',
                description: 'ستوديو موسيقى عربي احترافي - Professional Arabic Music Studio',
                thumbnails: {
                    medium: { url: 'https://via.placeholder.com/320x180/000000/d4af37?text=F90+Channel' }
                }
            },
            statistics: {
                viewCount: '1250000',
                subscriberCount: '15000',
                videoCount: '85'
            }
        };
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

// Initialize enhanced YouTube proxy
window.youtubeProxy = new YouTubeProxy();

// Clear expired cache periodically
setInterval(() => window.youtubeProxy.clearExpiredCache(), 60000);
