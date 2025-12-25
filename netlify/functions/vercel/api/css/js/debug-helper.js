// Debug Helper for F90 Music Studio
class DebugHelper {
    constructor() {
        this.init();
    }

    init() {
        console.log('🔧 Debug Helper initialized');
        this.setupConsoleLogging();
        this.checkCommonIssues();
        this.createDebugPanel();
    }

    setupConsoleLogging() {
        // Override console methods to capture all logs
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        this.logs = [];
        
        console.log = (...args) => {
            this.logs.push({ type: 'log', message: args.join(' '), timestamp: Date.now() });
            originalLog.apply(console, args);
        };
        
        console.error = (...args) => {
            this.logs.push({ type: 'error', message: args.join(' '), timestamp: Date.now() });
            originalError.apply(console, args);
        };
        
        console.warn = (...args) => {
            this.logs.push({ type: 'warn', message: args.join(' '), timestamp: Date.now() });
            originalWarn.apply(console, args);
        };
    }

    checkCommonIssues() {
        // Check for CSS loading issues
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        stylesheets.forEach(link => {
            if (!link.href.includes(window.location.hostname)) {
                console.log(`🎨 External stylesheet: ${link.href}`);
            }
        });
        
        // Check for JavaScript errors
        window.addEventListener('error', (e) => {
            console.error('🚨 Global error:', e.message, e.filename, e.lineno);
            this.logs.push({ 
                type: 'global-error', 
                message: `${e.message} at ${e.filename}:${e.lineno}`, 
                timestamp: Date.now() 
            });
        });
        
        // Check for unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('🚨 Unhandled promise rejection:', e.reason);
            this.logs.push({ 
                type: 'promise-rejection', 
                message: String(e.reason), 
                timestamp: Date.now() 
            });
        });
    }

    createDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.innerHTML = `
            <div class="debug-header">
                <span>🔧 Debug Panel</span>
                <button onclick="this.parentElement.parentElement.style.display='none'">✕</button>
            </div>
            <div class="debug-content">
                <div class="debug-section">
                    <h4>📊 Status</h4>
                    <div id="debug-status">Loading...</div>
                </div>
                <div class="debug-section">
                    <h4>📝 Recent Logs</h4>
                    <div id="debug-logs"></div>
                </div>
                <div class="debug-section">
                    <h4>🎵 Content Status</h4>
                    <div id="debug-content"></div>
                </div>
            </div>
        `;
        
        const debugStyles = `
            #debug-panel {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 300px;
                background: #1a1a1a;
                border: 1px solid #d4af37;
                border-radius: 8px;
                color: #fff;
                font-family: monospace;
                font-size: 12px;
                z-index: 10001;
                max-height: 400px;
                overflow: hidden;
            }
            
            .debug-header {
                background: #d4af37;
                color: #000;
                padding: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: bold;
            }
            
            .debug-header button {
                background: transparent;
                border: none;
                color: #000;
                cursor: pointer;
                font-size: 16px;
            }
            
            .debug-content {
                padding: 10px;
                max-height: 350px;
                overflow-y: auto;
            }
            
            .debug-section {
                margin-bottom: 15px;
            }
            
            .debug-section h4 {
                color: #d4af37;
                margin-bottom: 5px;
                font-size: 11px;
            }
            
            .debug-log {
                padding: 2px 0;
                font-size: 10px;
                border-bottom: 1px solid #333;
            }
            
            .debug-log.error { color: #ff6b6b; }
            .debug-log.warn { color: #ffa726; }
            .debug-log.log { color: #81c784; }
        `;
        
        const style = document.createElement('style');
        style.textContent = debugStyles;
        document.head.appendChild(style);
        
        document.body.appendChild(debugPanel);
        
        // Update debug panel every 2 seconds
        setInterval(() => this.updateDebugPanel(), 2000);
        
        // Toggle with Ctrl+Shift+D
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    updateDebugPanel() {
        const statusEl = document.getElementById('debug-status');
        const logsEl = document.getElementById('debug-logs');
        const contentEl = document.getElementById('debug-content');
        
        if (!statusEl || !logsEl || !contentEl) return;
        
        // Update status
        const tracksCount = document.querySelectorAll('.track-card, .track-item').length;
        const apiStatus = window.youtubeProxy?.quotaExceeded ? 'Mock Data' : 'API Active';
        const cssLoaded = document.querySelector('link[href*="main.css"]') ? 'Loaded' : 'Missing';
        
        statusEl.innerHTML = `
            <div>Tracks: ${tracksCount}</div>
            <div>API: ${apiStatus}</div>
            <div>CSS: ${cssLoaded}</div>
        `;
        
        // Update logs
        const recentLogs = this.logs.slice(-10).reverse();
        logsEl.innerHTML = recentLogs.map(log => `
            <div class="debug-log ${log.type}">
                ${new Date(log.timestamp).toLocaleTimeString()}: ${log.message}
            </div>
        `).join('');
        
        // Update content status
        const hasContent = tracksCount > 0;
        const loadingEl = document.getElementById('loading-screen');
        const loadingStatus = loadingEl ? (loadingEl.style.display === 'none' ? 'Hidden' : 'Visible') : 'Missing';
        
        contentEl.innerHTML = `
            <div>Content: ${hasContent ? '✅ Loaded' : '❌ Missing'}</div>
            <div>Loading: ${loadingStatus}</div>
        `;
    }
}

// Initialize debug helper
window.debugHelper = new DebugHelper();
