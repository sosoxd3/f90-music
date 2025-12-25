here// Main Application Controller
class F90App {
    constructor() {
        this.currentPage = 'home';
        this.tracks = [];
        this.playlists = [];
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

    setupNavigation() {
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link[data-page]')) {
                e.preventDefault();
                const page = e.target.dataset.page;
                this.navigateToPage(page);
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const page = e.state?.page || 'home';
            this.showPage(page);
        });
    }

    navigateToPage(page) {
        if (page === this.currentPage) return;
        
        // Update URL
        const url = page === 'home' ? '/' : `#${page}`;
        history.pushState({ page }, '', url);
        
        // Show page
        this.showPage(page);
        
        // Update active nav
        this.updateActiveNav(page);
    }

    showPage(page) {
        // Hide current page
        const currentPageEl = document.querySelector('.page.active');
        if (currentPageEl) {
            currentPageEl.classList.remove('active');
        }
        
        // Show new page
        const newPageEl = document.getElementById(page);
        if (newPageEl) {
            newPageEl.classList.add('active');
            this.currentPage = page;
            
            // Load page-specific data
            this.loadPageData(page);
        }
    }

    updateActiveNav(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
    }

    loadPageData(page) {
        switch (page) {
            case 'home':
                this.loadHomePageData();
                break;
            case 'music':
                this.loadMusicPageData();
                break;
            case 'playlists':
                this.loadPlaylistsPageData();
                break;
            case 'requests':
                this.setupRequestForm();
                break;
        }
    }

    async loadInitialData() {
        this.showLoading(true);
        
        try {
            // Load playlists from YouTube
            const playlistIds = [
                'PL2FIA-SoBgYvY4B-0IDWTtKriVGPb1qnx',
                'PL2FIA-SoBgYtotc48ZfKSYagxMd3AMmVp',
                'PL2FIA-SoBgYuXeLdvKXaMlRJiF3B2opAP'
            ];
            
            const playlistPromises = playlistIds.map(id => 
                window.youtubeProxy.fetchPlaylistItems(id)
            );
            
            const playlistsData = await Promise.all(playlistPromises);
            
            this.playlists = playlistIds.map((id, index) => ({
                id,
                title: `Playlist ${index + 1}`,
                items: playlistsData[index] || []
            }));
            
            // Combine all tracks
            this.tracks = this.playlists.flatMap(playlist => 
                playlist.items.map(item => ({
                    ...item,
                    playlistId: playlist.id,
                    playlistTitle: playlist.title
                }))
            );
            
            // Load home page data
            this.loadHomePageData();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load music data');
        } finally {
            this.showLoading(false);
        }
    }

    loadHomePageData() {
        if (this.tracks.length === 0) return;
        
        // Latest tracks
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
    }

    loadMusicPageData() {
        this.renderTracksList('tracks-list', this.tracks);
    }

    loadPlaylistsPageData() {
        const container = document.getElementById('playlists-grid');
        if (!container) return;
        
        container.innerHTML = this.playlists.map(playlist => `
            <div class="playlist-card" data-playlist-id="${playlist.id}">
                <div class="playlist-thumbnail">
                    <div class="playlist-icon">🎵</div>
                    <div class="playlist-count">${playlist.items.length} songs</div>
                </div>
                <h3>${playlist.title}</h3>
                <p>${playlist.items.length} tracks</p>
                <button class="play-playlist-btn" data-playlist-id="${playlist.id}">
                    Play All
                </button>
            </div>
        `).join('');
        
        // Bind play playlist events
        container.addEventListener('click', (e) => {
            if (e.target.matches('.play-playlist-btn')) {
                const playlistId = e.target.dataset.playlistId;
                this.playPlaylist(playlistId);
            }
        });
    }

    renderTracksGrid(containerId, tracks) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = tracks.map(track => this.createTrackCard(track)).join('');
    }

    renderTracksList(containerId, tracks) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = tracks.map(track => this.createTrackListItem(track)).join('');
    }

    createTrackCard(track) {
        const avgRating = window.trackRatings.getAverageRating(track.id);
        const userRating = window.trackRatings.getRating(track.id);
        const isLiked = window.trackRatings.isLiked(track.id);
        const likeCount = Math.floor(Math.random() * 1000) + 100; // Mock like count
        
        return `
            <div class="track-card" data-track-id="${track.id}">
                <div class="track-thumbnail">
                    <img src="${track.snippet.thumbnails?.medium?.url || 'https://via.placeholder.com/320x180/000000/d4af37?text=F90'}" 
                         alt="${track.snippet.title}" loading="lazy">
                    <div class="play-overlay">
                        <div class="play-icon-large">▶</div>
                    </div>
                </div>
                <div class="track-info">
                    <h3 class="track-title">${track.snippet.title}</h3>
                    <p class="track-artist">F90 Music Studio</p>
                </div>
                <div class="track-meta">
                    <div class="track-rating">
                        <span class="average-rating">${avgRating.toFixed(1)} ★</span>
                    </div>
                    <div class="track-actions">
                        <button class="like-btn ${isLiked ? 'liked' : ''}" data-track-id="${track.id}">
                            <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
                            <span class="like-count">${likeCount}</span>
                        </button>
                    </div>
                </div>
                <div class="star-rating" data-track-id="${track.id}">
                    ${[1,2,3,4,5].map(i => `
                        <span class="star ${userRating >= i ? 'filled' : ''}" data-value="${i}">★</span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createTrackListItem(track) {
        const avgRating = window.trackRatings.getAverageRating(track.id);
        const userRating = window.trackRatings.getRating(track.id);
        const isLiked = window.trackRatings.isLiked(track.id);
        
        return `
            <div class="track-item" data-track-id="${track.id}">
                <div class="track-thumbnail">
                    <img src="${track.snippet.thumbnails?.default?.url || 'https://via.placeholder.com/120x90/000000/d4af37?text=F90'}" 
                         alt="${track.snippet.title}" loading="lazy">
                </div>
                <div class="track-details">
                    <h3 class="track-title">${track.snippet.title}</h3>
                    <p class="track-artist">F90 Music Studio</p>
                    <div class="track-meta">
                        <span class="track-duration">3:45</span>
                        <span class="average-rating">${avgRating.toFixed(1)} ★</span>
                    </div>
                </div>
                <div class="track-actions">
                    <button class="play-track-btn" data-track-id="${track.id}">▶</button>
                    <button class="like-btn ${isLiked ? 'liked' : ''}" data-track-id="${track.id}">
                        <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
                    </button>
                    <div class="star-rating" data-track-id="${track.id}">
                        ${[1,2,3,4,5].map(i => `
                            <span class="star ${userRating >= i ? 'filled' : ''}" data-value="${i}">★</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    setupSearch() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;
        
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });
    }

    performSearch(query) {
        if (!query.trim()) {
            this.renderTracksList('tracks-list', this.tracks);
            return;
        }
        
        const filtered = this.tracks.filter(track => 
            track.snippet.title.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderTracksList('tracks-list', filtered);
    }

    setupFilters() {
        const playlistFilter = document.getElementById('playlist-filter');
        const sortFilter = document.getElementById('sort-filter');
        
        if (playlistFilter) {
            playlistFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (sortFilter) {
            sortFilter.addEventListener('change', () => this.applyFilters());
        }
    }

    applyFilters() {
        const playlistFilter = document.getElementById('playlist-filter')?.value;
        const sortFilter = document.getElementById('sort-filter')?.value;
        
        let filtered = [...this.tracks];
        
        // Filter by playlist
        if (playlistFilter) {
            filtered = filtered.filter(track => track.playlistId === playlistFilter);
        }
        
        // Sort
        switch (sortFilter) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.snippet.publishedAt) - new Date(b.snippet.publishedAt));
                break;
            case 'title':
                filtered.sort((a, b) => a.snippet.title.localeCompare(b.snippet.title));
                break;
            case 'rating':
                filtered.sort((a, b) => {
                    const ratingA = window.trackRatings.getAverageRating(a.id);
                    const ratingB = window.trackRatings.getAverageRating(b.id);
                    return ratingB - ratingA;
                });
                break;
        }
        
        this.renderTracksList('tracks-list', filtered);
    }

    setupRequestForm() {
        const form = document.getElementById('song-request-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSongRequest(e.target);
        });
    }

    handleSongRequest(form) {
        const name = form.querySelector('#requester-name').value;
        const request = form.querySelector('#song-request').value;
        
        // Send via WhatsApp
        const whatsappMessage = `طلب أغنية جديد من ${name}:\n\n${request}`;
        const whatsappUrl = `https://wa.me/970568181910?text=${encodeURIComponent(whatsappMessage)}`;
        
        // Also send email
        const emailSubject = `طلب أغنية جديد - ${name}`;
        const emailBody = `الاسم: ${name}\n\nالطلب: ${request}`;
        const emailUrl = `mailto:f90gimme@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        
        // Open both options
        if (confirm('سيتم إرسال طلبك عبر واتساب. هل تريد المتابعة؟')) {
            window.open(whatsappUrl, '_blank');
        }
        
        // Reset form
        form.reset();
        
        // Show success message
        this.showSuccess('تم إرسال طلبك بنجاح!');
    }

    playTrack(trackId) {
        const track = this.tracks.find(t => t.id === trackId);
        if (track) {
            window.musicPlayer.loadTrack(track);
            window.musicPlayer.play();
        }
    }

    playPlaylist(playlistId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (playlist && playlist.items.length > 0) {
            window.musicPlayer.setPlaylist(playlist.items, 0);
            window.musicPlayer.play();
        }
    }

    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallPrompt(deferredPrompt);
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallPrompt();
        });
    }

    showInstallPrompt(deferredPrompt) {
        const prompt = document.getElementById('install-prompt');
        if (!prompt) return;
        
        prompt.classList.add('show');
        
        const installBtn = document.getElementById('install-btn');
        const dismissBtn = document.getElementById('install-dismiss');
        
        installBtn.onclick = async () => {
            prompt.classList.remove('show');
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);
        };
        
        dismissBtn.onclick = () => {
            prompt.classList.remove('show');
        };
    }

    hideInstallPrompt() {
        const prompt = document.getElementById('install-prompt');
        if (prompt) {
            prompt.classList.remove('show');
        }
    }

    bindEvents() {
        // Track clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.play-track-btn')) {
                e.preventDefault();
                const trackId = e.target.dataset.trackId;
                this.playTrack(trackId);
            }
            
            if (e.target.closest('.track-card, .track-item')) {
                const trackElement = e.target.closest('.track-card, .track-item');
                const trackId = trackElement.dataset.trackId;
                
                // Don't trigger if clicking on interactive elements
                if (e.target.closest('.star-rating, .like-btn, .play-track-btn')) {
                    return;
                }
                
                // Navigate to track page
                this.navigateToTrackPage(trackId);
            }
        });
        
        // Language switching
        if (window.languageManager) {
            document.addEventListener('language-changed', () => {
                this.updatePageContent();
            });
        }
    }

    navigateToTrackPage(trackId) {
        const track = this.tracks.find(t => t.id === trackId);
        if (!track) return;
        
        // Create track page dynamically
        this.showTrackPage(track);
    }

    showTrackPage(track) {
        const pageContent = `
            <div class="container">
                <div class="track-page-header">
                    <div class="track-thumbnail-large">
                        <img src="${track.snippet.thumbnails?.high?.url || track.snippet.thumbnails?.medium?.url}" 
                             alt="${track.snippet.title}" loading="lazy">
                    </div>
                    <div class="track-info-large">
                        <h1>${track.snippet.title}</h1>
                        <p>F90 Music Studio</p>
                        <div class="track-actions-large">
                            <button class="play-track-large" data-track-id="${track.id}">
                                <span>▶</span> تشغيل
                            </button>
                            <button class="like-btn-large ${window.trackRatings.isLiked(track.id) ? 'liked' : ''}" 
                                    data-track-id="${track.id}">
                                <span class="like-icon-large">${window.trackRatings.isLiked(track.id) ? '❤️' : '🤍'}</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="track-page-content">
                    <div class="track-rating-section">
                        <h3>تقييم الأغنية</h3>
                        <div class="star-rating-large" data-track-id="${track.id}">
                            ${[1,2,3,4,5].map(i => {
                                const userRating = window.trackRatings.getRating(track.id);
                                return `<span class="star-large ${userRating >= i ? 'filled' : ''}" data-value="${i}">★</span>`;
                            }).join('')}
                        </div>
                        <div class="average-rating-large">
                            ${window.trackRatings.getAverageRating(track.id).toFixed(1)} ★
                        </div>
                    </div>
                    
                    <div class="track-comments-section">
                        <h3>التعليقات</h3>
                        <div class="comments-list" data-track-id="${track.id}">
                            ${this.renderComments(track.id)}
                        </div>
                        <form class="comment-form" data-track-id="${track.id}">
                            <textarea class="comment-input" placeholder="اكتب تعليقك..." rows="3"></textarea>
                            <button type="submit" class="comment-submit">إضافة تعليق</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Create temporary track page
        const trackPage = document.createElement('section');
        trackPage.id = 'track';
        trackPage.className = 'page';
        trackPage.innerHTML = pageContent;
        
        // Hide current page
        document.querySelector('.page.active').classList.remove('active');
        
        // Add and show track page
        document.getElementById('main').appendChild(trackPage);
        trackPage.classList.add('active');
        
        // Initialize ratings for this page
        setTimeout(() => window.trackRatings.initializeRatings(), 100);
    }

    renderComments(trackId) {
        const comments = window.trackRatings.getComments(trackId);
        return comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-time">${window.trackRatings.formatTimeAgo(comment.timestamp)}</span>
                </div>
                <div class="comment-text">${window.trackRatings.escapeHtml(comment.text)}</div>
            </div>
        `).join('');
    }

    updatePageContent() {
        // Update any dynamic content when language changes
        if (this.currentPage === 'home') {
            this.loadHomePageData();
        } else if (this.currentPage === 'music') {
            this.loadMusicPageData();
        }
    }

    // Utility functions
    showLoading(show) {
        this.isLoading = show;
        document.body.classList.toggle('loading', show);
    }

    showError(message) {
        // Simple error display - could be enhanced with a toast system
        alert(`Error: ${message}`);
    }

    showSuccess(message) {
        // Simple success display - could be enhanced with a toast system
        alert(message);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.f90App = new F90App();
    
    // Hide loading screen
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }, 1000);
});
