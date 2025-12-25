// Enhanced App.js with full channel integration
class F90App {
    constructor() {
        this.currentPage = 'home';
        this.tracks = [];
        this.playlists = [];
        this.channelInfo = null;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupSearch();
        this.setupFilters();
        this.loadInitialData();
        this.setupInstallPrompt();
        this.bindEvents();
    }

    async loadInitialData() {
        this.showLoading(true);
        
        try {
            // Load channel information first
            await this.loadChannelInfo();
            
            // Load all channel videos
            const allVideos = await window.youtubeProxy.fetchAllChannelVideos(100);
            
            // Load specific playlists
            const playlistsData = await window.youtubeProxy.fetchPlaylistsItems();
            
            // Combine data
            this.processVideoData(allVideos, playlistsData);
            
            // Load home page data
            this.loadHomePageData();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load channel data');
        } finally {
            this.showLoading(false);
        }
    }

    async loadChannelInfo() {
        try {
            this.channelInfo = await window.youtubeProxy.getChannelStatistics();
            this.updateChannelHeader();
        } catch (error) {
            console.error('Error loading channel info:', error);
            this.channelInfo = this.getMockChannelInfo();
        }
    }

    updateChannelHeader() {
        if (!this.channelInfo) return;
        
        // Update header with channel info
        const channelTitle = document.querySelector('.logo h1');
        const channelDesc = document.querySelector('.hero-subtitle');
        
        if (channelTitle && this.channelInfo.snippet) {
            channelTitle.textContent = this.channelInfo.snippet.title || 'F90 Music Studio';
        }
        
        if (channelDesc && this.channelInfo.snippet) {
            channelDesc.textContent = this.channelInfo.snippet.description || 
                'استمتع بأحدث الأغاني والموسيقى العربية';
        }
    }

    processVideoData(allVideos, playlistsData) {
        // Process main channel videos
        this.tracks = allVideos.map(video => ({
            ...video,
            type: 'channel_video',
            source: 'channel_uploads'
        }));
        
        // Process playlist videos
        this.playlists = playlistsData.playlists.map(playlist => ({
            ...playlist,
            items: playlist.items.map(item => ({
                ...item,
                type: 'playlist_video',
                playlistId: playlist.id,
                playlistTitle: playlist.title
            }))
        }));
        
        // Combine all tracks for unified view
        const allPlaylistTracks = this.playlists.flatMap(p => p.items);
        this.allTracks = [...this.tracks, ...allPlaylistTracks];
        
        console.log(`Loaded ${this.tracks.length} channel videos and ${allPlaylistTracks.length} playlist videos`);
    }

    getMockChannelInfo() {
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

    // ... rest of the methods remain the same ...

    loadHomePageData() {
        if (this.tracks.length === 0) return;
        
        // Latest tracks from channel
        const latestTracks = this.tracks.slice(0, 6);
        this.renderTracksGrid('latest-tracks', latestTracks);
        
        // Top rated tracks
        const topRated = [...this.tracks]
            .sort((a, b) => {
                const ratingA = window.trackRatings.getAverageRating(a.id);
                const ratingB = window.trackRatings.getAverageRating(b.id);
                return ratingB - ratingA;
            })
            .slice(0, 6);
        this.renderTracksGrid('top-rated-tracks', topRated);
        
        // Update channel stats display
        this.updateChannelStatsDisplay();
    }

    updateChannelStatsDisplay() {
        if (!this.channelInfo?.statistics) return;
        
        const stats = this.channelInfo.statistics;
        const statsHtml = `
            <div class="channel-stats">
                <div class="stat-item">
                    <span class="stat-number">${parseInt(stats.videoCount).toLocaleString()}</span>
                    <span class="stat-label">فيديو</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${parseInt(stats.subscriberCount).toLocaleString()}</span>
                    <span class="stat-label">مشترك</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${parseInt(stats.viewCount).toLocaleString()}</span>
                    <span class="stat-label">مشاهدة</span>
                </div>
            </div>
        `;
        
        // Add to hero section
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && !document.querySelector('.channel-stats')) {
            heroContent.insertAdjacentHTML('beforeend', statsHtml);
        }
    }

    loadMusicPageData() {
        // Show all channel videos in music page
        this.renderTracksList('tracks-list', this.tracks);
    }
}

// Add CSS for channel stats
const channelStatsCSS = `
.channel-stats {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-top: 1.5rem;
    flex-wrap: wrap;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.stat-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-gold);
    line-height: 1;
}

.stat-label {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin-top: 0.25rem;
}

@media (max-width: 768px) {
    .channel-stats {
        gap: 1rem;
    }
    
    .stat-number {
        font-size: 1.25rem;
    }
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = channelStatsCSS;
document.head.appendChild(style);
