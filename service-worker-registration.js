here// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('SW registered: ', registration);
            
            // Check for updates periodically
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000); // Check every hour
            
        } catch (registrationError) {
            console.log('SW registration failed: ', registrationError);
        }
    });
}

// Handle app installation
let deferredPrompt;
const installButton = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button
    if (installButton) {
        installButton.style.display = 'block';
    }
});

// Handle install button click
if (installButton) {
    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        
        deferredPrompt = null;
        installButton.style.display = 'none';
    });
}

// Handle app installed
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
});
