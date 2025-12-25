here// Advanced Music Player with YouTube integration
class MusicPlayer {
    constructor() {
        this.currentTrack = null;
        this.tracks = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffled = false;
        this.isRepeating = false;
        this.volume = 0.7;
        this.audio = null;
        this.youtubePlayer = null;
        
        this.init();
    }

    init() {
        this.setupElements();
        this.bindEvents();
        this.loadSavedState();
    }

    setupElements() {
        this.elements = {
            player: document.getElementById('music-player'),
            playPauseBtn: document.getElementById('play-pause-btn'),
            previousBtn: document.getElementById('previous-btn'),
            nextBtn: document.getElementById('next-btn'),
            shuffleBtn: document.getElementById('shuffle-btn'),
            repeatBtn: document.getElementById('repeat-btn'),
            volumeBtn: document.getElementById('volume-btn'),
            progressBar: document.getElementById('progress-bar'),
            progressFill: document.getElementById('progress-fill'),
            progressHandle: document.getElementById('progress-handle'),
            volumeSlider: document.getElementById('volume-slider'),
            volumeFill: document.getElementById('volume-fill'),
            volumeHandle: document.getElementById('volume-handle'),
            timeCurrent: document.getElementById('time-current'),
            timeTotal: document.getElementById('time-total'),
            playerTitle: document.getElementById('player-title'),
            playerArtist: document.getElementById('player-artist'),
            playerThumbnail: document.getElementById('player-thumbnail'),
            youtubeBtn: document.getElementById('youtube-btn')
        };
    }

    bindEvents() {
        // Playback controls
        this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.elements.previousBtn.addEventListener('click', () => this.playPrevious());
        this.elements.nextBtn.addEventListener('click', () => this.playNext());
        this.elements.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.elements.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        
        // Progress bar
        this.elements.progressBar.addEventListener('click', (e) => this.seekTo(e));
        this.elements.progressHandle.addEventListener('mousedown', () => this.startProgressDrag());
        
        // Volume control
        this.elements.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.elements.volumeSlider.addEventListener('click', (e) => this.setVolume(e));
        this.elements.volumeHandle.addEventListener('mousedown', () => this.startVolumeDrag());
        
        // YouTube button
        this.elements.youtubeBtn.addEventListener('click', () => this.openInYouTube());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Drag and drop
        document.addEventListener('mousemove', (e) => this.handleDrag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
        
        // Touch events for mobile
        this.elements.progressBar.addEventListener('touchstart', (e) => this.seekTo(e.touches[0]));
        this.elements.volumeSlider.addEventListener('touchstart', (e) => this.setVolume(e.touches[0]));
    }

    loadTrack(track) {
        if (!track) return;
        
        this.currentTrack = track;
        this.updatePlayerUI();
        this.showPlayer();
        
        // Save to localStorage for resume
        this.saveCurrentTrack();
        
        // Auto-play if already playing
        if (this.isPlaying) {
            this.play();
        }
    }

    updatePlayerUI() {
        if (!this.currentTrack) return;
        
        const { snippet } = this.currentTrack;
        
        this.elements.playerTitle.textContent = snippet.title;
        this.elements.playerArtist.textContent = 'F90 Music Studio';
        
        // Update thumbnail
        if (snippet.thumbnails?.medium?.url) {
            this.elements.playerThumbnail.style.backgroundImage = `url(${snippet.thumbnails.medium.url})`;
            this.elements.playerThumbnail.style.backgroundSize = 'cover';
            this.elements.playerThumbnail.style.backgroundPosition = 'center';
        }
        
        // Update YouTube button
        if (this.currentTrack.contentDetails?.videoId) {
            this.elements.youtubeBtn.style.display = 'flex';
        }
        
        // Update progress
        this.elements.progressFill.style.width = '0%';
        this.elements.timeCurrent.textContent = '0:00';
        
        // Show in mini player
        this.updateMiniPlayer();
    }

    play() {
        if (!this.currentTrack) return;
        
        this.isPlaying = true;
        this.elements.playPauseBtn.querySelector('.play-icon').style.display = 'none';
        this.elements.playPauseBtn.querySelector('.pause-icon').style.display = 'block';
        
        // Simulate playback with progress
        this.startProgressSimulation();
        
        // Add to recently played
        this.addToRecentlyPlayed();
    }

    pause() {
        this.isPlaying = false;
        this.elements.playPauseBtn.querySelector('.play-icon').style.display = 'block';
        this.elements.playPauseBtn.querySelector('.pause-icon').style.display = 'none';
        
        this.stopProgressSimulation();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            if (this.currentTrack) {
                this.play();
            } else {
                // Play first track if none selected
                this.playFirstTrack();
            }
        }
    }

    playPrevious() {
        if (this.tracks.length === 0) return;
        
        let newIndex = this.currentIndex - 1;
        if (newIndex < 0) newIndex = this.tracks.length - 1;
        
        this.currentIndex = newIndex;
        this.loadTrack(this.tracks[newIndex]);
        if (this.isPlaying) this.play();
    }

    playNext() {
        if (this.tracks.length === 0) return;
        
        let newIndex;
        
        if (this.isShuffled) {
            newIndex = Math.floor(Math.random() * this.tracks.length);
        } else {
            newIndex = this.currentIndex + 1;
            if (newIndex >= this.tracks.length) {
                if (this.isRepeating) {
                    newIndex = 0;
                } else {
                    this.pause();
                    return;
                }
            }
        }
        
        this.currentIndex = newIndex;
        this.loadTrack(this.tracks[newIndex]);
        if (this.isPlaying) this.play();
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.elements.shuffleBtn.style.color = this.isShuffled ? 'var(--color-gold)' : 'var(--color-text-secondary)';
        this.savePlayerState();
    }

    toggleRepeat() {
        this.isRepeating = !this.isRepeating;
        this.elements.repeatBtn.style.color = this.isRepeating ? 'var(--color-gold)' : 'var(--color-text-secondary)';
        this.savePlayerState();
    }

    // Progress simulation (since we're using YouTube videos)
    startProgressSimulation() {
        if (this.progressInterval) clearInterval(this.progressInterval);
        
        let progress = 0;
        const duration = 180; // 3 minutes default
        
        this.progressInterval = setInterval(() => {
            progress += 1;
            const percentage = (progress / duration) * 100;
            
            this.elements.progressFill.style.width = `${percentage}%`;
            this.elements.progressHandle.style.left = `${percentage}%`;
            this.elements.timeCurrent.textContent = this.formatTime(progress);
            this.elements.timeTotal.textContent = this.formatTime(duration);
            
            if (progress >= duration) {
                this.onTrackEnd();
            }
        }, 1000);
    }

    stopProgressSimulation() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    seekTo(e) {
        const rect = this.elements.progressBar.getBoundingClientRect();
        const percentage = (e.clientX - rect.left) / rect.width;
        const duration = 180; // 3 minutes default
        const time = percentage * duration;
        
        this.elements.progressFill.style.width = `${percentage * 100}%`;
        this.elements.progressHandle.style.left = `${percentage * 100}%`;
        this.elements.timeCurrent.textContent = this.formatTime(time);
    }

    // Volume control
    setVolume(e) {
        const rect = this.elements.volumeSlider.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        
        this.volume = percentage;
        this.elements.volumeFill.style.width = `${percentage * 100}%`;
        this.elements.volumeHandle.style.left = `${percentage * 100}%`;
        
        this.savePlayerState();
    }

    toggleMute() {
        if (this.volume > 0) {
            this.previousVolume = this.volume;
            this.volume = 0;
        } else {
            this.volume = this.previousVolume || 0.7;
        }
        
        this.elements.volumeFill.style.width = `${this.volume * 100}%`;
        this.elements.volumeHandle.style.left = `${this.volume * 100}%`;
        
        this.savePlayerState();
    }

    // Drag handling
    startProgressDrag() {
        this.isDraggingProgress = true;
    }

    startVolumeDrag() {
        this.isDraggingVolume = true;
    }

    handleDrag(e) {
        if (this.isDraggingProgress) {
            this.seekTo(e);
        } else if (this.isDraggingVolume) {
            this.setVolume(e);
        }
    }

    stopDrag() {
        this.isDraggingProgress = false;
        this.isDraggingVolume = false;
    }

    // Keyboard shortcuts
    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.playPrevious();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.playNext();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.volume = Math.min(1, this.volume + 0.1);
                this.setVolume({ clientX: this.elements.volumeSlider.getBoundingClientRect().left + (this.volume * this.elements.volumeSlider.offsetWidth) });
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.volume = Math.max(0, this.volume - 0.1);
                this.setVolume({ clientX: this.elements.volumeSlider.getBoundingClientRect().left + (this.volume * this.elements.volumeSlider.offsetWidth) });
                break;
        }
    }

    // Track end handling
    onTrackEnd() {
        if (this.isRepeating) {
            this.play();
        } else {
            this.playNext();
        }
    }

    // Open in YouTube
    openInYouTube() {
        if (this.currentTrack?.contentDetails?.videoId) {
            window.open(`https://youtube.com/watch?v=${this.currentTrack.contentDetails.videoId}`, '_blank');
        }
    }

    // Utility functions
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showPlayer() {
        this.elements.player.classList.add('active');
    }

    hidePlayer() {
        this.elements.player.classList.remove('active');
    }

    // Playlist management
    setPlaylist(tracks, startIndex = 0) {
        this.tracks = tracks;
        this.currentIndex = startIndex;
        if (tracks.length > 0) {
            this.loadTrack(tracks[startIndex]);
        }
    }

    playFirstTrack() {
        if (this.tracks.length > 0) {
            this.loadTrack(this.tracks[0]);
            this.play();
        }
    }

    // LocalStorage management
    savePlayerState() {
        const state = {
            volume: this.volume,
            isShuffled: this.isShuffled,
            isRepeating: this.isRepeating,
            currentTrack: this.currentTrack,
            currentIndex: this.currentIndex
        };
        localStorage.setItem('f90-player-state', JSON.stringify(state));
    }

    loadSavedState() {
        try {
            const saved = localStorage.getItem('f90-player-state');
            if (saved) {
                const state = JSON.parse(saved);
                this.volume = state.volume || 0.7;
                this.isShuffled = state.isShuffled || false;
                this.isRepeating = state.isRepeating || false;
                
                // Apply volume
                this.elements.volumeFill.style.width = `${this.volume * 100}%`;
                this.elements.volumeHandle.style.left = `${this.volume * 100}%`;
                
                // Update UI
                this.elements.shuffleBtn.style.color = this.isShuffled ? 'var(--color-gold)' : 'var(--color-text-secondary)';
                this.elements.repeatBtn.style.color = this.isRepeating ? 'var(--color-gold)' : 'var(--color-text-secondary)';
            }
        } catch (e) {
            console.log('Could not load player state');
        }
    }

    saveCurrentTrack() {
        if (this.currentTrack) {
            localStorage.setItem('f90-current-track', JSON.stringify({
                track: this.currentTrack,
                index: this.currentIndex,
                timestamp: Date.now()
            }));
        }
    }

    loadCurrentTrack() {
        try {
            const saved = localStorage.getItem('f90-current-track');
            if (saved) {
                const data = JSON.parse(saved);
                // Only restore if recent (within 24 hours)
                if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                    this.currentTrack = data.track;
                    this.currentIndex = data.index;
                    this.updatePlayerUI();
                    this.showPlayer();
                }
            }
        } catch (e) {
            console.log('Could not load current track');
        }
    }

    // Recently played
    addToRecentlyPlayed() {
        if (!this.currentTrack) return;
        
        let recentlyPlayed = JSON.parse(localStorage.getItem('f90-recently-played') || '[]');
        
        // Remove if already exists
        recentlyPlayed = recentlyPlayed.filter(item => item.id !== this.currentTrack.id);
        
        // Add to beginning
        recentlyPlayed.unshift({
            ...this.currentTrack,
            playedAt: Date.now()
        });
        
        // Keep only last 50
        recentlyPlayed = recentlyPlayed.slice(0, 50);
        
        localStorage.setItem('f90-recently-played', JSON.stringify(recentlyPlayed));
    }

    // Mini player update
    updateMiniPlayer() {
        // Update any mini player instances
        const miniPlayerEvent = new CustomEvent('miniplayer-update', {
            detail: {
                track: this.currentTrack,
                isPlaying: this.isPlaying
            }
        });
        document.dispatchEvent(miniPlayerEvent);
    }
}

// Initialize music player
window.musicPlayer = new MusicPlayer();
