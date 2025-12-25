// Enhanced YouTube API Proxy with comprehensive error handling
class YouTubeProxy {
    constructor() {
        this.baseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/youtube' 
            : '/api/youtube';
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
        this.channelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw';
        this.apiKey = 'AIzaSyD3mvCx80XsvwrURRg2RwaD8HmOKqhYkek';
        this.quotaExceeded = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.init();
    }

    init() {
        // Test API connectivity on load
        this.testAPIConnection();
    }

    async testAPIConnection() {
        try {
            console.log('Testing YouTube API connection...');
            const response = await fetch(`${this.baseUrl}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelId: this.channelId })
            });
            
            if (response.ok) {
                console.log('✅ YouTube API connection successful');
                this.loadAllContent();
            } else {
                console.warn('❌ YouTube API failed, using mock data');
                this.useMockData();
            }
        } catch (error) {
            console.error('❌ YouTube API connection error:', error);
            this.useMockData();
        }
    }

    useMockData() {
        console.log('Switching to mock data mode...');
        this.quotaExceeded = true;
        
        // Load mock data immediately
        const mockTracks = this.getMockChannelVideos();
        const mockPlaylists = this.getMockPlaylistsData();
        
        window.f90App.processVideoData(mockTracks, mockPlaylists);
        window.f90App.loadHomePageData();
        
        // Show user notification
        this.showFallbackNotification();
    }

    showFallbackNotification() {
        const notification = document.createElement('div');
        notification.className = 'api-fallback-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span>🎵</span>
                <p>يتم عرض محتوى تجريبي حالياً</p>
                <button onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    async fetchAllChannelVideos(maxResults = 100) {
        if (this.quotaExceeded) {
            return this.getMockChannelVideos();
        }

        try {
            const uploadsPlaylistId = await this.getChannelUploadsPlaylistId();
            return await this.fetchPlaylistItems(uploadsPlaylistId, maxResults);
        } catch (error) {
            console.error('Error fetching channel videos:', error);
            if (error.message.includes('quotaExceeded')) {
                this.quotaExceeded = true;
                this.useMockData();
                return this.getMockChannelVideos();
            }
            return this.getMockChannelVideos();
        }
    }

    async getChannelUploadsPlaylistId() {
        try {
            const response = await fetch(`${this.baseUrl}/channel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: this.channelId,
                    part: 'contentDetails'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.items[0].contentDetails.relatedPlaylists.uploads;
        } catch (error) {
            console.error('Error fetching uploads playlist:', error);
            return 'PL2FIA-SoBgYvY4B-0IDWTtKriVGPb1qnx'; // Fallback
        }
    }

    async fetchPlaylistItems(playlistId, maxResults = 50) {
        try {
            const allItems = [];
            let nextPageToken = null;
            let remaining = maxResults;
            
            do {
                const response = await fetch(`${this.baseUrl}/playlist-items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        playlistId,
                        maxResults: Math.min(remaining, 50),
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
                remaining -= data.items.length;
                
            } while (nextPageToken && remaining > 0 && allItems.length < maxResults);

            return allItems;
        } catch (error) {
            console.error('Error fetching playlist items:', error);
            if (error.message.includes('quotaExceeded')) {
                this.quotaExceeded = true;
            }
            return this.getMockPlaylistItems(playlistId);
        }
    }

    getMockChannelVideos() {
        return [
            {
                id: 'F90_Video_1',
                snippet: {
                    title: 'أغنية عربية حديثة - إنتاج F90 ستوديو',
                    description: 'أحدث إنتاجاتنا من الموسيقى العربية الحديثة بجودة احترافية',
                    thumbnails: {
                        medium: { url: 'https://via.placeholder.com/320x180/000000/d4af37?text=F90+أغنية+1' },
                        high: { url: 'https://via.placeholder.com/480x360/000000/d4af37?text=F90+أغنية+1' }
                    },
                    publishedAt: '2024-12-20T10:00:00Z'
                },
                contentDetails: { videoId: 'F90_Video_1' }
            },
            {
                id: 'F90_Video_2',
                snippet: {
                    title: 'موسيقى هادئة للاسترخاء - F90 Music Production',
                    description: 'موسيقى هادئة ومريحة للاسترخاء والتركيز من إنتاج F90',
                    thumbnails: {
                        medium: { url: 'https://via.placeholder.com/320x180/1a1a1a/ffd700?text=F90+موسيقى+2' },
                        high: { url: 'https://via.placeholder.com/480x360/1a1a1a/ffd700?text=F90+موسيقى+2' }
                    },
                    publishedAt: '2024-12-15T15:30:00Z'
                },
                contentDetails: { videoId: 'F90_Video_2' }
            },
            {
                id: 'F90_Video_3',
                snippet: {
                    title: 'أغنية وطنية - F90 ستوديو',
                    description: 'إنتاج حديث لأغنية وطنية عربية كلاسيكية بصوت عالي الجودة',
                    thumbnails: {
                        medium: { url: 'https://via.placeholder.com/320x180/2a2a2a/d4af37?text=F90+وطنية' },
                        high: { url: 'https://via.placeholder.com/480x360/2a2a2a/d4af37?text=F90+وطنية' }
                    },
                    publishedAt: '2024-12-10T20:15:00Z'
                },
                contentDetails: { videoId: 'F90_Video_3' }
            },
            {
                id: 'F90_Video_4',
                snippet: {
                    title: 'موسيقى عربية تقليدية - F90 Production',
                    description: 'موسيقى عربية تقليدية أصيلة بإنتاج عصري حديث',
                    thumbnails: {
                        medium: { url: 'https://via.placeholder.com/320x180/3a3a3a/ffa500?text=F90+تقليدي' },
                        high: { url: 'https://via.placeholder.com/480x360/3a3a3a/ffa500?text=F90+تقليدي' }
                    },
                    publishedAt: '2024-12-05T12:00:00Z'
                },
                contentDetails: { videoId: 'F90_Video_4' }
            }
        ];
    }

    getMockPlaylistsData() {
        return {
            playlists: [
                {
                    id: 'PL2FIA-SoBgYvY4B-0IDWTtKriVGPb1qnx',
                    title: 'أغاني عربية حديثة',
                    items: this.getMockPlaylistItems()
                },
                {
                    id: 'PL2FIA-SoBgYtotc48ZfKSYagxMd3AMmVp',
                    title: 'موسيقى هادئة',
                    items: this.getMockPlaylistItems()
                },
                {
                    id: 'PL2FIA-SoBgYuXeLdvKXaMlRJiF3B2opAP',
                    title: 'إنتاجات خاصة',
                    items: this.getMockPlaylistItems()
                }
            ]
        };
    }

    getMockPlaylistItems() {
        return [
            {
                id: 'Mock_1',
                snippet: {
                    title: 'محتوى من البلاي ليست',
                    description: 'وصف المحتوى',
                    thumbnails: {
                        medium: { url: 'https://via.placeholder.com/320x180/4a4a4a/ff6347?text=Playlist' }
                    }
                },
                contentDetails: { videoId: 'Mock_1' }
            }
        ];
    }
}

// Add fallback notification styles
const fallbackStyles = `
.api-fallback-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #d4af37;
    color: #000;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideInRight 0.3s ease;
}

.api-fallback-notification .notification-content {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.api-fallback-notification button {
    background: transparent;
    border: none;
    color: #000;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.25rem;
}

@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

[dir="rtl"] .api-fallback-notification {
    right: auto;
    left: 20px;
    animation: slideInLeft 0.3s ease;
}

@keyframes slideInLeft {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
`;

// Inject fallback styles
const style = document.createElement('style');
style.textContent = fallbackStyles;
document.head.appendChild(style);
