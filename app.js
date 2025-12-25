// Enhanced App.js with Diagnostic Checklist
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
        // 🔍 DIAGNOSTIC CHECKLIST - Add this at the very beginning
        console.log('🔍 Running diagnostic checklist...');
        
        // 1. Check API Key
        console.log('1. API Key:', 'AIzaSyD3mvCx80XsvwrURRg2RwaD8HmOKqhYkek'.length > 20 ? '✅ Present' : '❌ Missing');
        
        // 2. Check Channel ID
        console.log('2. Channel ID:', 'UC_x5XG1OV2P6uZZ5FSM9Ttw' ? '✅ Set' : '❌ Missing');
        
        // 3. Check Service Worker
        console.log('3. Service Worker:', 'serviceWorker' in navigator ? '✅ Supported' : '❌ Not supported');
        
        // 4. Check LocalStorage
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            console.log('4. LocalStorage: ✅ Working');
        } catch (e) {
            console.log('4. LocalStorage: ❌ Blocked');
        }
        
        // 5. Check Fetch API
        console.log('5. Fetch API:', typeof fetch === 'function' ? '✅ Available' : '❌ Missing');
        
        // 6. Check Environment
        console.log('6. Environment:', window.location.hostname);
        console.log('7. Protocol:', window.location.protocol);
        console.log('8. User Agent:', navigator.userAgent.substring(0, 50) + '...');
        
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

    // ... rest of your existing methods ...
}
