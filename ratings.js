// Ratings, Likes, and Comments System
class TrackRatings {
    constructor() {
        this.storageKey = 'f90-track-ratings';
        this.commentsKey = 'f90-track-comments';
        this.favoritesKey = 'f90-favorite-tracks';
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            // Star rating
            if (e.target.closest('.star-rating')) {
                this.handleStarClick(e);
            }
            
            // Like button
            if (e.target.closest('.like-btn')) {
                this.handleLikeClick(e);
            }
            
            // Comment form
            if (e.target.closest('.comment-submit')) {
                this.handleCommentSubmit(e);
            }
        });
    }

    // Rating system (1-5 stars)
    handleStarClick(e) {
        e.preventDefault();
        const ratingContainer = e.target.closest('.star-rating');
        const trackId = ratingContainer.dataset.trackId;
        const starValue = parseInt(e.target.dataset.value);
        
        this.setRating(trackId, starValue);
        this.updateStarDisplay(ratingContainer, starValue);
        this.updateAverageRating(trackId);
    }

    setRating(trackId, rating) {
        const ratings = this.getRatings();
        ratings[trackId] = rating;
        localStorage.setItem(this.storageKey, JSON.stringify(ratings));
        
        // Dispatch event for UI updates
        document.dispatchEvent(new CustomEvent('rating-changed', {
            detail: { trackId, rating }
        }));
    }

    getRating(trackId) {
        const ratings = this.getRatings();
        return ratings[trackId] || 0;
    }

    getRatings() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        } catch (e) {
            return {};
        }
    }

    getAverageRating(trackId) {
        // For demo purposes, generate random ratings if none exist
        const ratings = this.getRatings();
        if (ratings[trackId]) {
            return ratings[trackId];
        }
        
        // Generate consistent random rating based on track ID
        const hash = this.hashCode(trackId);
        const avgRating = ((hash % 5) + 3) / 2; // Between 1.5 and 4
        return Math.min(5, Math.max(1, avgRating));
    }

    updateStarDisplay(container, rating) {
        const stars = container.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('filled');
                star.innerHTML = '★';
            } else {
                star.classList.remove('filled');
                star.innerHTML = '☆';
            }
        });
        
        // Update average rating display
        const avgElement = container.parentElement.querySelector('.average-rating');
        if (avgElement) {
            avgElement.textContent = `${rating.toFixed(1)} ★`;
        }
    }

    updateAverageRating(trackId) {
        const avgRating = this.getAverageRating(trackId);
        const elements = document.querySelectorAll(`[data-track-id="${trackId}"] .average-rating`);
        elements.forEach(el => {
            el.textContent = `${avgRating.toFixed(1)} ★`;
        });
    }

    // Like/Favorite system
    handleLikeClick(e) {
        e.preventDefault();
        const likeBtn = e.target.closest('.like-btn');
        const trackId = likeBtn.dataset.trackId;
        
        const isLiked = this.toggleLike(trackId);
        this.updateLikeButton(likeBtn, isLiked);
        
        // Update like count
        this.updateLikeCount(trackId);
    }

    toggleLike(trackId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(trackId);
        
        if (index > -1) {
            favorites.splice(index, 1);
            var isLiked = false;
        } else {
            favorites.push(trackId);
            var isLiked = true;
        }
        
        localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
        
        document.dispatchEvent(new CustomEvent('like-toggled', {
            detail: { trackId, isLiked }
        }));
        
        return isLiked;
    }

    isLiked(trackId) {
        const favorites = this.getFavorites();
        return favorites.includes(trackId);
    }

    getFavorites() {
        try {
            return JSON.parse(localStorage.getItem(this.favoritesKey) || '[]');
        } catch (e) {
            return [];
        }
    }

    updateLikeButton(button, isLiked) {
        const icon = button.querySelector('.like-icon');
        const count = button.querySelector('.like-count');
        
        if (isLiked) {
            button.classList.add('liked');
            icon.textContent = '❤️';
        } else {
            button.classList.remove('liked');
            icon.textContent = '🤍';
        }
        
        // Update count
        if (count) {
            const currentCount = parseInt(count.textContent) || 0;
            count.textContent = isLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
        }
    }

    updateLikeCount(trackId) {
        const isLiked = this.isLiked(trackId);
        const elements = document.querySelectorAll(`[data-track-id="${trackId}"] .like-count`);
        
        elements.forEach(el => {
            const currentCount = parseInt(el.textContent) || 0;
            el.textContent = isLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
        });
    }

    // Comment system
    handleCommentSubmit(e) {
        e.preventDefault();
        const form = e.target.closest('.comment-form');
        const trackId = form.dataset.trackId;
        const textarea = form.querySelector('.comment-input');
        const comment = textarea.value.trim();
        
        if (!comment) return;
        
        this.addComment(trackId, comment);
        textarea.value = '';
        this.displayComments(trackId);
    }

    addComment(trackId, comment) {
        const comments = this.getComments();
        if (!comments[trackId]) {
            comments[trackId] = [];
        }
        
        comments[trackId].unshift({
            id: Date.now().toString(),
            text: comment,
            author: 'مستخدم', // Default author name
            timestamp: Date.now()
        });
        
        // Keep only last 20 comments per track
        comments[trackId] = comments[trackId].slice(0, 20);
        
        localStorage.setItem(this.commentsKey, JSON.stringify(comments));
        
        document.dispatchEvent(new CustomEvent('comment-added', {
            detail: { trackId, comment }
        }));
    }

    getComments(trackId = null) {
        try {
            const comments = JSON.parse(localStorage.getItem(this.commentsKey) || '{}');
            return trackId ? (comments[trackId] || []) : comments;
        } catch (e) {
            return trackId ? [] : {};
        }
    }

    displayComments(trackId) {
        const comments = this.getComments(trackId);
        const container = document.querySelector(`[data-track-id="${trackId}"] .comments-list`);
        
        if (!container) return;
        
        container.innerHTML = comments.map(comment => `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-time">${this.formatTimeAgo(comment.timestamp)}</span>
                </div>
                <div class="comment-text">${this.escapeHtml(comment.text)}</div>
            </div>
        `).join('');
        
        // Update comment count
        const countElement = document.querySelector(`[data-track-id="${trackId}"] .comment-count`);
        if (countElement) {
            countElement.textContent = comments.length;
        }
    }

    // Utility functions
    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `قبل ${minutes} دقيقة`;
        if (hours < 24) return `قبل ${hours} ساعة`;
        return `قبل ${days} يوم`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    // Initialize ratings on page load
    initializeRatings() {
        // Update all star ratings
        document.querySelectorAll('.star-rating').forEach(rating => {
            const trackId = rating.dataset.trackId;
            const userRating = this.getRating(trackId);
            const avgRating = this.getAverageRating(trackId);
            
            // Update user rating display
            if (userRating > 0) {
                this.updateStarDisplay(rating, userRating);
            }
            
            // Update average rating display
            const avgElement = rating.parentElement.querySelector('.average-rating');
            if (avgElement) {
                avgElement.textContent = `${avgRating.toFixed(1)} ★`;
            }
        });
        
        // Update all like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            const trackId = btn.dataset.trackId;
            const isLiked = this.isLiked(trackId);
            this.updateLikeButton(btn, isLiked);
        });
        
        // Display comments for all tracks
        document.querySelectorAll('.comments-list').forEach(list => {
            const trackId = list.closest('[data-track-id]').dataset.trackId;
            this.displayComments(trackId);
        });
    }
}

// Initialize ratings system
window.trackRatings = new TrackRatings();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.trackRatings.initializeRatings();
});
