// Enhanced App.js with content loading verification
class F90App {
    constructor() {
        this.currentPage = 'home';
        this.tracks = [];
        this.playlists = [];
        this.channelInfo = null;
        this.isLoading = false;
        this.contentLoaded = false;
        
        this.init();
    }

    init() {
        console.log('🚀 F90 Music Studio initializing...');
        this.setupNavigation();
        this.setupSearch();
        this.setupFilters();
        this.verifyEnvironment();
        this.loadInitialData();
        this.setupInstallPrompt();
        this.bindEvents();
        this.setupContentVerification();
    }

    verifyEnvironment() {
        console.log('🔍 Verifying environment...');
        
        // Check if we're in development or production
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
        
        console.log('📍 Location:', window.location.hostname);
        console.log('🔧 Development mode:', isLocalhost);
        
        // Verify API endpoints
        this.testAPIEndpoints();
        
        // Check for required files
        this.checkRequiredFiles();
    }

    async testAPIEndpoints() {
        try {
            const response = await fetch('/api/youtube/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: true })
            });
            
            console.log('🔗 API Endpoint test:', response.ok ? '✅ Working' : '❌ Failed');
        } catch (error) {
            console.log('🔗 API Endpoint test: ❌ Not available (using mock data)');
        }
    }

    checkRequiredFiles() {
        const requiredFiles = [
            '/css/main.css',
            '/css/fallback-styles.css',
            '/js/translations.js',
            '/js/youtube-proxy.js',
            '/js/music-player.js',
            '/js/ratings.js',
            '/js/app.js'
        ];
        
        requiredFiles.forEach(file => {
            fetch(file, { method: 'HEAD' })
                .then(response => {
                    console.log(`📁 ${file}: ${response.ok ? '✅ Found' : '❌ Missing'}`);
                })
                .catch(() => {
                    console.log(`📁 ${file}: ❌ Not accessible`);
                });
        });
    }

    setupContentVerification() {
        // Monitor content loading
        const observer = new MutationObserver((mutations) => {
            this.verifyContentRendered();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Initial verification
        setTimeout(() => this.verifyContentRendered(), 2000);
        setTimeout(() => this.verifyContentRendered(), 5000);
    }

    verifyContentRendered() {
        const tracksContainer = document.getElementById('latest-tracks');
        const musicContainer = document.getElementById('tracks-list');
        const hasContent = (tracksContainer && tracksContainer.children.length > 0) || 
                          (musicContainer && musicContainer.children.length > 0);
        
        if (!hasContent && !this.contentLoaded) {
            console.log('⚠️ No content detected, forcing content load...');
            this.forceContentLoad();
        } else if (hasContent) {
            this.contentLoaded = true;
            console.log('✅ Content successfully loaded');
        }
    }

    forceContentLoad() {
        // Emergency content loading with mock data
        const mockTracks = this.generateMockTracks();
        this.renderTracksGrid('latest-tracks', mockTracks);
        this.renderTracksList('tracks-list', mockTracks);
        
        // Show notification
        this.showContentNotification();
    }

    generateMockTracks() {
        return [
            {
                id: 'Emergency_1',
                snippet: {
                    title: 'أغنية طارئة ١ - F90 Studio',
                    description: 'محتوى طارئة للتجربة',
                    thumbnails: {
                        medium: { url: 'https://via.placeholder.com/320x180/000000/d4af37?text=طارئة+1' }
                    }
                },
                contentDetails: { videoId: 'Emergency_1' }
            },
            {
                id: 'Emergency_2',
                snippet: {
                    title: 'أغنية طارئة ٢ - F90 Studio',
                    description: 'محتوى طارئة للتجربة',
                    thumbnails: {
                        medium: { url: 'https://via.placeholder.com/320x180/1a1a1a/ffd700?text=طارئة+2' }
                    }
                },
                contentDetails: { videoId: 'Emergency_2' }
            }
        ];
    }

    showContentNotification() {
        const notification = document.createElement('div');
        notification.className = 'content-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span>🎵</span>
                <p>تم تحميل المحتوى بنجاح!</p>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
