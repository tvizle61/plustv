// Global Variables
let channels = [];
let currentChannel = null;
let currentCategory = 'all';
let favoriteChannels = JSON.parse(localStorage.getItem('favoriteChannels') || '[]');
let activeTab = 'channels';
let activeTimeouts = []; // Track all timeouts for cleanup
let hlsInstance = null; // Track HLS instance
let allCategories = new Set(); // Tüm kategorileri tutmak için
const m3uFiles = ['tv.m3u']; // Yüklenecek M3U dosyaları

// Zoom state
let zoomLevel = 1.0; // 1.0 = normal, 0.9 = %90, 0.85 = %85, 0.8 = %80
let zoomToggleBtn;
let playerPage;

// Kategori ikonları mapping
const categoryIcons = {
    'all': '📺',
    'Ulusal': '📡',
    'Haber': '📰',
    'Spor': '⚽',
    'Eglence': '🎭',
    'Eğlence': '🎭',
    'Muzik': '🎵',
    'Müzik': '🎵',
    'Belgesel': '🎬',
    'Dini': '🕌',
    'Cocuk': '👶',
    'Çocuk': '👶',
    'Ekonomi': '💰',
    'Yurt Disi': '🌍',
    'Yurt Dışı': '🌍',
    'Radyo Canlı': '▶️',
    'Radyo': '📻',
    'Diğer': '📺'
};

// Sabit kategori listesi (anasayfa ile aynı)
const STANDARD_CATEGORIES = [
    { id: 'all', name: 'Tümü', icon: '📺' },
    { id: 'Ulusal', name: 'Ulusal', icon: '📡' },
    { id: 'Haber', name: 'Haber', icon: '📰' },
    { id: 'Spor', name: 'Spor', icon: '⚽' },
    { id: 'Eğlence', name: 'Eğlence', icon: '🎭' },
    { id: 'Müzik', name: 'Müzik', icon: '🎵' },
    { id: 'Belgesel', name: 'Belgesel', icon: '🎬' },
    { id: 'Dini', name: 'Dini', icon: '🕌' },
    { id: 'Çocuk', name: 'Çocuk', icon: '👶' },
    { id: 'Ekonomi', name: 'Ekonomi', icon: '💰' },
    { id: 'Yurt Dışı', name: 'Yurt Dışı', icon: '🌍' },
    { id: 'Radyo Canlı', name: 'Radyo Canlı', icon: '▶️' }
];

// Kategori eşleştirme (eski -> yeni)
const categoryMapping = {
    'Eglence': 'Eğlence',
    'Muzik': 'Müzik',
    'Cocuk': 'Çocuk',
    'Yurt Disi': 'Yurt Dışı'
};

// Kategoriyi normalize et
function normalizeCategory(category) {
    if (!category) return 'Ulusal';
    
    // Trim ve temizle
    category = category.trim();
    
    // Önce categoryMapping'e bak (tam eşleşme)
    if (categoryMapping[category]) {
        return categoryMapping[category];
    }
    
    // Büyük/küçük harf duyarsız kontrol (ilk harf büyük, diğerleri küçük)
    const categoryLower = category.toLowerCase();
    const categoryTitleCase = category.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    // categoryMapping'de büyük/küçük harf varyantlarını kontrol et
    for (const [key, value] of Object.entries(categoryMapping)) {
        if (key.toLowerCase() === categoryLower) {
            return value;
        }
    }
    
    // STANDARD_CATEGORIES'de TAM EŞLEŞME kontrolü (büyük/küçük harf duyarsız)
    // ÖNEMLİ: Sadece tam eşleşme varsa normalize et, yoksa birleşik kategorileri koru
    const standardCat = STANDARD_CATEGORIES.find(c => 
        c.id.toLowerCase() === categoryLower || 
        c.name.toLowerCase() === categoryLower
    );
    if (standardCat) {
        return standardCat.id;
    }
    
    // Birleşik kategorileri koru (örn: "Dini Müzik" -> "Dini Müzik")
    // İlk harf büyük, diğerleri küçük formatına dönüştür (her kelime için)
    return categoryTitleCase;
}

// Uygulama içinde olup olmadığını kontrol et
function isInApp() {
    // iOS Safari standalone mode
    if (window.navigator.standalone === true) {
        return true;
    }
    
    // PWA standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    
    // Fullscreen mode
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
        return true;
    }
    
    // Android app
    if (document.referrer.includes('android-app://')) {
        return true;
    }
    
    // File protocol
    if (window.location.protocol === 'file:') {
        return true;
    }
    
    // No browser UI (window dimensions check)
    const heightDiff = window.outerHeight - window.innerHeight;
    const widthDiff = window.outerWidth - window.innerWidth;
    if (heightDiff < 5 && widthDiff < 5 && heightDiff >= 0 && widthDiff >= 0) {
        return true;
    }
    
    // User agent check for mobile apps
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(ua) && !/chrome/i.test(ua) && !/firefox/i.test(ua)) {
        return true;
    }
    
    return false;
}

// Video player controls'u ayarla
function setupVideoControls() {
    if (!videoPlayer) return;
    
    const inApp = isInApp();
    console.log('Uygulama içinde mi?', inApp);
    
    if (inApp) {
        // Uygulama içinde: controls'u tamamen kapat
        videoPlayer.controls = false;
        videoPlayer.removeAttribute('controls');
        // Data attribute ile işaretle
        videoPlayer.setAttribute('data-in-app', 'true');
        // Native controls'u tamamen devre dışı bırak
        videoPlayer.setAttribute('controlsList', 'nodownload noplaybackrate nofullscreen noremoteplayback');
        // CSS ile de gizle
        videoPlayer.classList.add('no-controls');
        console.log('Video controls kapatıldı (uygulama modu)');
    } else {
        // Normal tarayıcı: controls göster
        videoPlayer.controls = true;
        videoPlayer.removeAttribute('controlsList');
        videoPlayer.removeAttribute('data-in-app');
        videoPlayer.classList.remove('no-controls');
        console.log('Video controls açıldı (tarayıcı modu)');
    }
}

// DOM Elements
const backBtn = document.getElementById('backBtn');
const sidebarCategoryTitle = document.getElementById('sidebarCategoryTitle');
let categoryCards = document.querySelectorAll('.category-card');
const channelsSidebarList = document.getElementById('channelsSidebarList');
const categorySidebarList = document.getElementById('categorySidebarList');
const tabButtons = document.querySelectorAll('.tab-btn');
const videoPlayer = document.getElementById('videoPlayer');
playerPage = document.querySelector('.player-page');
zoomToggleBtn = document.getElementById('zoomToggleBtn');
const iframePlayer = document.getElementById('iframePlayer');
const videoContainerPlayer = document.getElementById('videoContainerPlayer');
const videoPlaceholderPlayer = document.getElementById('videoPlaceholderPlayer');
const loadingPlayer = document.getElementById('loadingPlayer');

// Tesla Screen Detection & Orientation Handler
function detectTeslaScreen() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    
    // Tesla ekranları genellikle 17 inç, 1920x1200 veya benzeri
    const isTeslaScreen = (
        (width >= 1700 && width <= 2200 && height >= 900 && height <= 1300) ||
        (width >= 900 && width <= 1300 && height >= 1700 && height <= 2200)
    );
    
    if (isTeslaScreen) {
        document.documentElement.classList.add('tesla-screen');
        if (isLandscape) {
            document.documentElement.classList.add('tesla-landscape');
            document.documentElement.classList.remove('tesla-portrait');
        } else {
            document.documentElement.classList.add('tesla-portrait');
            document.documentElement.classList.remove('tesla-landscape');
        }
    } else {
        document.documentElement.classList.remove('tesla-screen', 'tesla-landscape', 'tesla-portrait');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'purple';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Video player controls ayarı
    setupVideoControls();
    
    // Detect Tesla screen and orientation
    detectTeslaScreen();
    
    // Listen for orientation changes
    // Optimized resize handler with debounce
    let resizeTimeout;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            detectTeslaScreen();
        }, 50); // Reduced from immediate to 50ms for better performance
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Orientation change handler
    const handleOrientationChange = () => {
        clearTimeout(resizeTimeout);
        // Immediate update for orientation changes
        setTimeout(detectTeslaScreen, 50);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    
    if (screen.orientation) {
        screen.orientation.addEventListener('change', handleOrientationChange);
    }
    
    // Get channel ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const channelId = urlParams.get('id');
    const category = urlParams.get('category') || 'all';
    
    currentCategory = category;
    
    loadChannelsFromM3U().then(() => {
        if (channelId) {
            const channel = channels.find(ch => ch.id === parseInt(channelId));
            if (channel) {
                playChannel(channel);
            }
        }
        // Kategorileri render et
        renderDynamicCategories();
        renderSidebarChannels();
        renderCategorySidebar();
    });
    
    setupEventListeners();
    
    // Initialize zoom - DOM tamamen yüklendikten sonra
    // Önce hemen dene, sonra bir kez daha dene
    initializeZoom();
    setTimeout(() => {
        initializeZoom();
    }, 300);
});

// Zoom Functions
function loadZoomLevel() {
    try {
        const stored = localStorage.getItem('plusTv_zoomLevel');
        return stored ? parseFloat(stored) : 1.0;
    } catch (e) {
        return 1.0;
    }
}

function saveZoomLevel() {
    try {
        localStorage.setItem('plusTv_zoomLevel', zoomLevel.toString());
        // Storage event'i tetikle (diğer sayfalar için)
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'plusTv_zoomLevel',
            newValue: zoomLevel.toString(),
            oldValue: localStorage.getItem('plusTv_zoomLevel')
        }));
    } catch (e) {
        console.warn('Could not save zoom level:', e);
    }
}

function applyZoom() {
    if (!playerPage) {
        playerPage = document.querySelector('.player-page');
    }
    if (playerPage) {
        const playerContentWrapper = document.querySelector('.player-content-wrapper');
        const videoContainer = document.querySelector('.video-container-player');
        const playerMain = document.querySelector('.player-main');
        
        if (playerContentWrapper && videoContainer && playerMain) {
            // Zoom'u sadece sidebar ve kategorilere uygula
            // Video container zoom'dan tamamen muaf tutulacak
            const sidebar = document.querySelector('.player-sidebar');
            const categoriesSection = document.querySelector('.player-categories-section');
            
            // Sidebar ve kategorilere zoom uygula
            if (sidebar) {
                sidebar.style.transform = `scale(${zoomLevel})`;
                sidebar.style.transformOrigin = 'top left';
                // Sidebar genişliğini zoom seviyesine göre ayarla
                // Scale sonrası 280px görünmesi için: 280 / zoomLevel
                const sidebarBaseWidth = 280; // Varsayılan genişlik (CSS'den)
                sidebar.style.width = `${sidebarBaseWidth / zoomLevel}px`;
                sidebar.style.flexShrink = '0';
            }
            if (categoriesSection) {
                categoriesSection.style.transform = `scale(${zoomLevel})`;
                categoriesSection.style.transformOrigin = 'top left';
                // Categories section genişliğini ayarla - tam genişliğe yayılsın
                categoriesSection.style.width = `${100 / zoomLevel}%`;
                categoriesSection.style.maxWidth = 'none';
            }
            
            // Player main'in genişliğini ayarla - kalan alanı doldursun
            const sidebarWidth = sidebar ? (280 / zoomLevel) : 0;
            const availableWidth = `calc(100% - ${sidebarWidth}px)`;
            playerMain.style.width = availableWidth;
            playerMain.style.maxWidth = availableWidth;
            
            // Content wrapper'a zoom uygulama (video container'ı korumak için)
            playerContentWrapper.style.transform = 'none';
            playerContentWrapper.style.width = '100%';
            playerContentWrapper.style.height = '100%';
            playerContentWrapper.style.maxWidth = '100%';
            
            // Player page'in boyutlarını koru - tam genişliğe yayılsın
            playerPage.style.transform = 'none';
            playerPage.style.width = '100%';
            playerPage.style.maxWidth = '100%';
            playerPage.style.height = '100vh';
            playerPage.style.margin = '0';
            playerPage.style.padding = '0';
            
            // Video container'ı zoom'dan tamamen muaf tut
            videoContainer.style.transform = 'none';
            videoContainer.style.width = '100%';
            videoContainer.style.height = '100%';
            videoContainer.style.maxWidth = '100%';
            videoContainer.style.maxHeight = '100%';
            videoContainer.style.minHeight = '300px';
            videoContainer.style.overflow = 'hidden';
            videoContainer.style.boxSizing = 'border-box';
            
            // Player main'in boyutlarını ayarla - tam genişliğe yayılsın
            playerMain.style.flex = '1';
            playerMain.style.minHeight = '0';
            playerMain.style.overflow = 'hidden';
            playerMain.style.width = '100%';
            playerMain.style.maxWidth = '100%';
            playerMain.style.height = '100%';
            
            console.log('Zoom applied:', zoomLevel, 'to sidebar and categories, page width: 100%');
        } else {
            // Fallback: Eski yöntem (tüm sayfaya zoom)
            playerPage.style.transform = `scale(${zoomLevel})`;
            playerPage.style.transformOrigin = 'top left';
            const scalePercent = (1 / zoomLevel) * 100;
            playerPage.style.width = `${scalePercent}%`;
            playerPage.style.height = `${scalePercent}%`;
            console.log('Zoom applied (fallback):', zoomLevel, 'to playerPage');
        }
    } else {
        console.warn('playerPage not found for zoom application');
    }
}

function toggleZoom() {
    // Zoom levels: 1.0 (100%) -> 0.9 (90%) -> 0.85 (85%) -> 0.8 (80%) -> 1.0 (100%)
    const zoomLevels = [1.0, 0.9, 0.85, 0.8];
    const currentIndex = zoomLevels.findIndex(level => Math.abs(level - zoomLevel) < 0.01);
    const nextIndex = (currentIndex + 1) % zoomLevels.length;
    
    zoomLevel = zoomLevels[nextIndex];
    saveZoomLevel();
    applyZoom();
    updateZoomIcon();
}

function updateZoomIcon() {
    if (!zoomToggleBtn) return;
    
    const fullscreenIcon = zoomToggleBtn.querySelector('.fullscreen-icon');
    const fullscreenExitIcon = zoomToggleBtn.querySelector('.fullscreen-exit-icon');
    
    if (fullscreenIcon && fullscreenExitIcon) {
        if (zoomLevel < 1.0) {
            fullscreenIcon.style.display = 'none';
            fullscreenExitIcon.style.display = 'block';
            zoomToggleBtn.title = `Tam ekran (${Math.round(zoomLevel * 100)}%)`;
        } else {
            fullscreenIcon.style.display = 'block';
            fullscreenExitIcon.style.display = 'none';
            zoomToggleBtn.title = 'Tam ekran';
        }
    }
}

function initializeZoom() {
    // DOM elementlerini tekrar kontrol et (DOM yüklenmiş olmalı)
    if (!playerPage) {
        playerPage = document.querySelector('.player-page');
    }
    if (!zoomToggleBtn) {
        zoomToggleBtn = document.getElementById('zoomToggleBtn');
    }
    
    // Debug: buton bulunamadıysa log
    if (!zoomToggleBtn) {
        console.warn('Zoom toggle button not found! Retrying...');
        // Bir kez daha dene
        setTimeout(() => {
            zoomToggleBtn = document.getElementById('zoomToggleBtn');
            if (zoomToggleBtn) {
                initializeZoom();
            } else {
                console.error('Zoom toggle button still not found after retry!');
            }
        }, 200);
        return;
    }
    
    if (!playerPage) {
        console.warn('Player page not found!');
        return;
    }
    
    // Load and apply saved zoom level
    zoomLevel = loadZoomLevel();
    
    // Eğer zoom 1.0 ise (varsayılan), otomatik optimal zoom ayarla
    if (zoomLevel === 1.0) {
        const width = window.innerWidth;
        let autoZoom = 1.0;
        
        if (width < 768) {
            autoZoom = Math.min(0.9, Math.max(0.75, width / 800));
        } else if (width >= 768 && width < 1024) {
            autoZoom = Math.min(0.95, Math.max(0.85, width / 1000));
        } else if (width >= 1024 && width < 1440) {
            autoZoom = Math.min(0.95, Math.max(0.9, width / 1200));
        }
        
        if (autoZoom !== 1.0) {
            zoomLevel = autoZoom;
            saveZoomLevel();
            console.log('Default optimal zoom applied:', autoZoom);
        }
    }
    
    applyZoom();
    updateZoomIcon();
    
    // Zoom toggle event listener - mevcut listener'ları temizle
    const newBtn = zoomToggleBtn.cloneNode(true);
    if (zoomToggleBtn.parentNode) {
        zoomToggleBtn.parentNode.replaceChild(newBtn, zoomToggleBtn);
    }
    zoomToggleBtn = newBtn;
    
    // Event listener ekle - uygulama modunda da çalışması için
    zoomToggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Zoom button clicked, current zoom:', zoomLevel);
        toggleZoom();
        return false;
    });
    
    // Touch event'leri de ekle (mobil/uygulama için)
    zoomToggleBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Zoom button touched, current zoom:', zoomLevel);
        toggleZoom();
        return false;
    });
    
    // Mouse event'leri de ekle (bazı durumlarda click çalışmayabilir)
    zoomToggleBtn.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
    });
    
    console.log('Zoom initialized successfully, button:', zoomToggleBtn, 'zoomLevel:', zoomLevel);
    
    // Responsive zoom: ekran boyutuna göre otomatik ayarla
    setupResponsiveZoom();
    
    // Storage event listener: diğer sayfalardaki zoom değişikliklerini dinle
    setupZoomSync();
}

function setupResponsiveZoom() {
    // Ekran boyutuna göre otomatik zoom ayarlama
    function adjustZoomForScreen() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Varsayılan ölçek: Ekran boyutuna göre en uygun zoom seviyesini hesapla
        const savedZoom = loadZoomLevel();
        
        // Eğer kullanıcı manuel zoom yapmamışsa (1.0 ise), otomatik ayarla
        if (savedZoom === 1.0) {
            let autoZoom = 1.0;
            
            // Küçük ekranlar için otomatik zoom
            if (width < 768) {
                // Mobil: Ekran genişliğine göre optimal zoom
                autoZoom = Math.min(0.9, Math.max(0.75, width / 800));
            } else if (width >= 768 && width < 1024) {
                // Tablet: Ekran genişliğine göre optimal zoom
                autoZoom = Math.min(0.95, Math.max(0.85, width / 1000));
            } else if (width >= 1024 && width < 1440) {
                // Küçük laptop: Biraz küçült
                autoZoom = Math.min(0.95, Math.max(0.9, width / 1200));
            } else {
                // Büyük ekranlar: Normal boyut
                autoZoom = 1.0;
            }
            
            // Zoom seviyesini ayarla ve kaydet
            if (Math.abs(autoZoom - zoomLevel) > 0.01) {
                zoomLevel = autoZoom;
                saveZoomLevel();
                applyZoom();
                updateZoomIcon();
                console.log('Auto zoom applied:', autoZoom, 'for screen width:', width);
            }
        }
    }
    
    // İlk yüklemede ve ekran boyutu değiştiğinde ayarla
    adjustZoomForScreen();
    
    // Optimized resize handler
    let zoomResizeTimeout;
    const handleZoomResize = () => {
        clearTimeout(zoomResizeTimeout);
        zoomResizeTimeout = setTimeout(adjustZoomForScreen, 100); // Reduced from 250ms to 100ms
    };
    
    window.addEventListener('resize', handleZoomResize, { passive: true });
    
    // Orientation change'de de ayarla
    window.addEventListener('orientationchange', () => {
        clearTimeout(zoomResizeTimeout);
        setTimeout(adjustZoomForScreen, 50); // Reduced from 100ms to 50ms
    }, { passive: true });
}

function setupZoomSync() {
    // Storage event listener: diğer sayfalardaki zoom değişikliklerini dinle
    window.addEventListener('storage', (e) => {
        if (e.key === 'plusTv_zoomLevel' && e.newValue) {
            const newZoom = parseFloat(e.newValue);
            if (newZoom !== zoomLevel) {
                zoomLevel = newZoom;
                applyZoom();
                updateZoomIcon();
            }
        }
    });
    
    // Sayfa görünür olduğunda zoom seviyesini kontrol et
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            const savedZoom = loadZoomLevel();
            if (Math.abs(savedZoom - zoomLevel) > 0.01) {
                zoomLevel = savedZoom;
                applyZoom();
                updateZoomIcon();
            }
        }
    });
    
    // Focus olduğunda da kontrol et
    window.addEventListener('focus', () => {
        const savedZoom = loadZoomLevel();
        if (Math.abs(savedZoom - zoomLevel) > 0.01) {
            zoomLevel = savedZoom;
            applyZoom();
            updateZoomIcon();
        }
    });
}

// Cleanup function
function cleanup() {
    // Clear all timeouts
    activeTimeouts.forEach(timeout => {
        try {
            clearTimeout(timeout);
        } catch (e) {
            console.warn('Timeout cleanup error:', e);
        }
    });
    activeTimeouts = [];
    
    // Destroy HLS instance
    if (hlsInstance) {
        try {
            hlsInstance.destroy();
        } catch (e) {
            console.warn('HLS cleanup error:', e);
        }
        hlsInstance = null;
    }
    
    if (videoPlayer && videoPlayer.hls) {
        try {
            videoPlayer.hls.destroy();
            videoPlayer.hls = null;
        } catch (e) {
            console.warn('Video player HLS cleanup error:', e);
        }
    }
    
    // Stop video
    if (videoPlayer) {
        try {
            videoPlayer.pause();
            videoPlayer.src = '';
            videoPlayer.load();
        } catch (e) {
            console.warn('Video player cleanup error:', e);
        }
    }
    
    if (iframePlayer) {
        try {
            iframePlayer.src = '';
        } catch (e) {
            console.warn('Iframe cleanup error:', e);
        }
    }
    
    // Remove touch event handlers if they exist
    if (videoContainerPlayer && videoContainerPlayer._touchStartHandler) {
        try {
            videoContainerPlayer.removeEventListener('touchstart', videoContainerPlayer._touchStartHandler);
            videoContainerPlayer.removeEventListener('touchend', videoContainerPlayer._touchEndHandler);
            delete videoContainerPlayer._touchStartHandler;
            delete videoContainerPlayer._touchEndHandler;
        } catch (e) {
            console.warn('Touch handler cleanup error:', e);
        }
    }
}

// Safe timeout wrapper
function safeSetTimeout(callback, delay) {
    const timeout = setTimeout(() => {
        activeTimeouts = activeTimeouts.filter(t => t !== timeout);
        callback();
    }, delay);
    activeTimeouts.push(timeout);
    return timeout;
}

// Event Listeners
function setupEventListeners() {
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);
    
    // Back button
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            cleanup();
            // Zoom seviyesini kaydet (anasayfaya geçmeden önce)
            saveZoomLevel();
            window.location.href = 'index.html';
        });
    }
    
    // Tab switching
    if (tabButtons && tabButtons.length > 0) {
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                activeTab = btn.dataset.tab;
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderSidebarChannels();
            });
        });
    }
    
    // Category selection - setupCategoryEventListeners() tarafından yapılıyor
    setupCategoryEventListeners();
    
    // Zoom button - direkt burada da ekle
    if (zoomToggleBtn) {
        zoomToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Zoom button clicked from setupEventListeners, current zoom:', zoomLevel);
            toggleZoom();
            return false;
        });
    }
    
    // Fullscreen on double click (desktop) - only add once
    if (videoContainerPlayer && !videoContainerPlayer.hasAttribute('data-dblclick-bound')) {
        videoContainerPlayer.setAttribute('data-dblclick-bound', 'true');
        videoContainerPlayer.addEventListener('dblclick', toggleFullscreen);
    }
    
    // Also allow double click on video/iframe (desktop)
    if (videoPlayer && !videoPlayer.hasAttribute('data-dblclick-bound')) {
        videoPlayer.setAttribute('data-dblclick-bound', 'true');
        videoPlayer.addEventListener('dblclick', toggleFullscreen);
    }
    
    if (iframePlayer && !iframePlayer.hasAttribute('data-dblclick-bound')) {
        iframePlayer.setAttribute('data-dblclick-bound', 'true');
        iframePlayer.addEventListener('dblclick', toggleFullscreen);
    }
    
    // Fullscreen on double tap (mobile/touch devices)
    if (videoContainerPlayer && !videoContainerPlayer.hasAttribute('data-touch-bound')) {
        videoContainerPlayer.setAttribute('data-touch-bound', 'true');
        setupDoubleTapFullscreen(videoContainerPlayer);
    }
    
    // Keyboard shortcuts - only add once
    if (!document.hasAttribute('data-keydown-bound')) {
        document.setAttribute('data-keydown-bound', 'true');
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                cleanup();
                // Zoom seviyesini kaydet (anasayfaya geçmeden önce)
                saveZoomLevel();
                window.location.href = 'index.html';
            }
        });
    }
}

// Load M3U file
async function loadChannelsFromM3U() {
    try {
        channels = [];
        allCategories.clear();
        let channelId = 1;
        
        // Tüm M3U dosyalarını yükle
        for (const m3uFile of m3uFiles) {
            try {
                const response = await fetch(m3uFile);
                if (!response.ok) {
                    console.warn(`⚠️ ${m3uFile} dosyası bulunamadı, atlanıyor...`);
                    continue;
                }
                const text = await response.text();
                const lines = text.split('\n');
                
                let currentChannel = null;
                let fileChannelCount = 0;
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    
                    if (!line) continue;
                    
                    if (line.startsWith('#EXTINF:')) {
                        const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
                        const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
                        const groupTitleMatch = line.match(/group-title="([^"]*)"/);
                        
                        const channelNameMatch = line.match(/,(.*)$/);
                        let channelName = channelNameMatch ? channelNameMatch[1].trim() : '';
                        
                        let groupTitle = groupTitleMatch ? groupTitleMatch[1].trim() : 'Ulusal';
                        
                        // Clean category name - birleşik kategorileri ayır
                        // "Ulusal - Yurt Disi" -> "Ulusal" ve "Yurt Dışı" olarak işle
                        let category = groupTitle.split(' - ')[0].trim();
                        
                        // Eğer kategori boşsa veya geçersizse "Ulusal" yap
                        if (!category || category === '' || category === 'undefined') {
                            category = 'Ulusal';
                        }
                        
                        // Normalize category (normalizeCategory fonksiyonu kullan - büyük/küçük harf duyarsız)
                        category = normalizeCategory(category);
                        
                        // Tüm kategorileri ekle (normalize edilmiş haliyle - çiftlemeyi önlemek için)
                        if (category) {
                            allCategories.add(category);
                        }
                        
                        // Eğer birleşik kategori varsa (örn: "Ulusal - Yurt Disi"), ikinci kategoriyi de ekle
                        if (groupTitle.includes(' - ')) {
                            const secondCategory = groupTitle.split(' - ')[1]?.trim();
                            if (secondCategory && secondCategory !== category) {
                                const normalizedSecond = normalizeCategory(secondCategory);
                                if (normalizedSecond) {
                                    allCategories.add(normalizedSecond);
                                }
                            }
                        }
                        
                        currentChannel = {
                            id: channelId++,
                            name: channelName,
                            url: '',
                            category: category,
                            tvgId: tvgIdMatch ? tvgIdMatch[1] : '',
                            tvgLogo: tvgLogoMatch ? tvgLogoMatch[1] : ''
                        };
                    }
                    else if ((line.startsWith('http://') || line.startsWith('https://') || line.startsWith('www.')) && currentChannel) {
                        currentChannel.url = line;
                        channels.push(currentChannel);
                        fileChannelCount++;
                        currentChannel = null;
                    }
                }
                
                console.log(`✅ ${m3uFile}: ${fileChannelCount} kanal eklendi`);
            } catch (fileError) {
                console.warn(`⚠️ ${m3uFile} yüklenirken hata:`, fileError);
            }
        }
        
        // YouTube Radyo kanallarını ekle
        const radioChannels = [
            { name: 'Kral POP Radyo', url: 'https://www.youtube.com/watch?v=5J-w9AHKHsc' },
            { name: "Radyo 45'lik", url: 'https://www.youtube.com/watch?v=dk_uf4o2atY' },
            { name: 'Slow Türk', url: 'https://www.youtube.com/watch?v=tWTHF0r2oEw' },
            { name: 'Kral FM', url: 'https://www.youtube.com/watch?v=A49bKX8gb-8' },
            { name: 'Fenomen Türk', url: 'https://www.youtube.com/watch?v=lYq5eFZp2GQ' },
            { name: 'Kalp FM', url: 'https://www.youtube.com/watch?v=_V8XXGBh_kw' },
            { name: 'Akustik Türkü', url: 'https://www.youtube.com/watch?v=_qm_JqY-6OI' },
            { name: 'Radyo Damar', url: 'https://www.youtube.com/watch?v=gbNBCvSkFlg' },
            { name: 'Radyo 44', url: 'https://www.youtube.com/watch?v=gsD3xoM8v3k' },
            { name: 'Radyo 7', url: 'https://www.youtube.com/watch?v=Nnn6OWQ6kk0' },
            { name: 'Radyo Seymen', url: 'https://www.youtube.com/watch?v=D-bO7oD8xNk' },
            { name: 'Karadeniz Akustik', url: 'https://www.youtube.com/watch?v=Fru_Ss-TqgY' },
            { name: 'Radyo 2000', url: 'https://www.youtube.com/watch?v=ydJGw5tjJyA&list=RDydJGw5tjJyA&start_radio=1' },
            { name: 'Hit Remix', url: 'https://www.youtube.com/watch?v=4j0GAzbACjk' },
            { name: 'Viva Arabesk', url: 'https://www.youtube.com/watch?v=Vie289ngRO8' },
            { name: 'Arabesk Türk', url: 'https://www.youtube.com/watch?v=IshBtT-tdxQ' },
            { name: 'En Çok Dinlenen Türküler', url: 'https://www.youtube.com/watch?v=vhOeV8QsVzo&list=RDvhOeV8QsVzo&start_radio=1' }
        ];
        
        radioChannels.forEach(radio => {
            channels.push({
                id: channelId++,
                name: radio.name,
                url: radio.url,
                category: 'Radyo Canlı',
                tvgId: '',
                tvgLogo: ''
            });
        });
        
        allCategories.add('Radyo Canlı');
        
        console.log(`✅ Toplam ${channels.length} kanal yüklendi!`);
        console.log(`✅ ${allCategories.size} kategori bulundu:`, Array.from(allCategories).sort());
        
        // Render dynamic categories (anasayfa ile aynı) - DOM hazır olduğunda
        setTimeout(() => {
            renderDynamicCategories();
        }, 100);
    } catch (error) {
        console.error('M3U dosyası yüklenemedi:', error);
        // Hata mesajı kaldırıldı - sessiz çalış
        console.warn('Kanal listesi yüklenemedi');
    }
}

// Kategorileri birleştir ve normalize et
function mergeAndNormalizeCategories() {
    const categoryMap = new Map(); // normalized -> { name, icon, id, count, isStandard }
    
    // Tüm kanalları kategorilere göre grupla
    const channelCategoryMap = new Map(); // normalized category -> channels[]
    
    channels.forEach(ch => {
        const normalized = normalizeCategory(ch.category).toLowerCase();
        if (!channelCategoryMap.has(normalized)) {
            channelCategoryMap.set(normalized, []);
        }
        channelCategoryMap.get(normalized).push(ch);
    });
    
    // STANDARD_CATEGORIES'i öncelikli olarak ekle
    STANDARD_CATEGORIES.forEach(cat => {
        if (cat.id === 'all') return;
        
        const normalized = cat.id.toLowerCase();
        const matchingChannels = [];
        
        // Bu kategoriye ait tüm kanalları bul
        for (const [catKey, catChannels] of channelCategoryMap.entries()) {
            if (catKey === normalized || 
                catKey.includes(normalized) || 
                normalized.includes(catKey) ||
                catKey.split(' ').some(word => word === normalized) ||
                normalized.split(' ').some(word => catKey === word)) {
                matchingChannels.push(...catChannels);
            }
        }
        
        // Tekrarları kaldır
        const uniqueChannels = Array.from(new Set(matchingChannels.map(ch => ch.id))).map(id => 
            matchingChannels.find(ch => ch.id === id)
        );
        
        if (uniqueChannels.length > 0) {
            categoryMap.set(normalized, {
                name: cat.name,
                icon: cat.icon,
                id: cat.id,
                count: uniqueChannels.length,
                isStandard: true
            });
            
            // Bu kategoriye ait kanalları işaretle (tekrar işlenmesin)
            uniqueChannels.forEach(ch => {
                const chNormalized = normalizeCategory(ch.category).toLowerCase();
                channelCategoryMap.delete(chNormalized);
            });
        }
    });
    
    // "Diğer" kategorisindeki kanalları "Ulusal"a taşı
    if (channelCategoryMap.has('diğer')) {
        const digerChannels = channelCategoryMap.get('diğer');
        const ulusalNormalized = 'ulusal';
        if (!channelCategoryMap.has(ulusalNormalized)) {
            channelCategoryMap.set(ulusalNormalized, []);
        }
        channelCategoryMap.get(ulusalNormalized).push(...digerChannels);
        channelCategoryMap.delete('diğer');
        
        // Ulusal kategorisini güncelle
        if (categoryMap.has(ulusalNormalized)) {
            categoryMap.get(ulusalNormalized).count += digerChannels.length;
        }
    }
    
    // Kalan kategorileri ekle (sadece benzersiz olanlar)
    for (const [normalized, catChannels] of channelCategoryMap.entries()) {
        if (normalized === 'all' || normalized === 'tümü' || normalized === 'diğer') continue;
        if (categoryMap.has(normalized)) continue; // Zaten eklenmiş
        
        // Kategori ismini düzelt
        const originalCategory = catChannels[0]?.category || normalized;
        const displayName = originalCategory.split(' ').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join(' ');
        
        categoryMap.set(normalized, {
            name: displayName,
            icon: categoryIcons[normalized] || categoryIcons[normalizeCategory(originalCategory)] || '📺',
            id: normalized,
            count: catChannels.length,
            isStandard: false
        });
    }
    
    return Array.from(categoryMap.values()).sort((a, b) => {
        // Önce standart kategoriler, sonra diğerleri
        if (a.isStandard && !b.isStandard) return -1;
        if (!a.isStandard && b.isStandard) return 1;
        // Sonra isme göre sırala
        return a.name.localeCompare(b.name, 'tr');
    });
}

// Dinamik kategori kartlarını oluştur (anasayfa ile aynı)
function renderDynamicCategories() {
    const categoriesContainer = document.querySelector('.player-categories-container');
    if (!categoriesContainer) return;
    
    // TÜM kartları temizle (Tümü dahil - yeniden oluşturacağız)
    categoriesContainer.innerHTML = '';
    
    // Kategorileri birleştir ve normalize et
    const mergedCategories = mergeAndNormalizeCategories();
    
    // "Tümü" kategorisini ekle
    const allCard = document.createElement('div');
    allCard.className = 'category-card';
    allCard.dataset.category = 'all';
    if (currentCategory === 'all') {
        allCard.classList.add('active');
    }
    
    const allIcon = document.createElement('div');
    allIcon.className = 'category-icon';
    allIcon.textContent = '📺';
    
    const allName = document.createElement('div');
    allName.className = 'category-name';
    allName.textContent = 'Tümü';
    
    allCard.appendChild(allIcon);
    allCard.appendChild(allName);
    categoriesContainer.appendChild(allCard);
    
    // "Ulusal" kategorisini "Tümü"nün sağına ekle
    const ulusalCat = mergedCategories.find(cat => cat.id.toLowerCase() === 'ulusal');
    if (ulusalCat) {
        const ulusalCard = document.createElement('div');
        ulusalCard.className = 'category-card';
        ulusalCard.dataset.category = ulusalCat.id;
        if (currentCategory === ulusalCat.id) {
            ulusalCard.classList.add('active');
        }
        
        const ulusalIcon = document.createElement('div');
        ulusalIcon.className = 'category-icon';
        ulusalIcon.textContent = ulusalCat.icon;
        
        const ulusalName = document.createElement('div');
        ulusalName.className = 'category-name';
        ulusalName.textContent = ulusalCat.name;
        
        ulusalCard.appendChild(ulusalIcon);
        ulusalCard.appendChild(ulusalName);
        categoriesContainer.appendChild(ulusalCard);
    }
    
    // Diğer kategorileri ekle (Ulusal ve Diğer hariç)
    mergedCategories.forEach(cat => {
        if (cat.id.toLowerCase() === 'ulusal') return; // Ulusal zaten eklendi
        if (cat.id.toLowerCase() === 'diğer') return; // Diğer kategorisini gösterme
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.dataset.category = cat.id;
        if (currentCategory === cat.id) {
            categoryCard.classList.add('active');
        }
        
        const icon = document.createElement('div');
        icon.className = 'category-icon';
        icon.textContent = cat.icon;
        
        const name = document.createElement('div');
        name.className = 'category-name';
        name.textContent = cat.name;
        
        categoryCard.appendChild(icon);
        categoryCard.appendChild(name);
        
        categoriesContainer.appendChild(categoryCard);
    });
    
    // Event listener'ları yeniden bağla
    setupCategoryEventListeners();
}

// Kategori event listener'larını yeniden bağla
function setupCategoryEventListeners() {
    categoryCards = document.querySelectorAll('.category-card');
    
    if (categoryCards && categoryCards.length > 0) {
        categoryCards.forEach(card => {
            // Önceki listener'ları kaldır
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            // Touch scrolling için - sadece gerçek click'te tetiklenmeli
            let touchStartX = 0;
            let touchStartY = 0;
            let isScrolling = false;
            
            // Touch start - scroll tespiti için
            newCard.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isScrolling = false;
            }, { passive: true });
            
            // Touch move - scroll olup olmadığını kontrol et
            newCard.addEventListener('touchmove', (e) => {
                if (!touchStartX || !touchStartY) return;
                
                const touchEndX = e.touches[0].clientX;
                const touchEndY = e.touches[0].clientY;
                const diffX = Math.abs(touchEndX - touchStartX);
                const diffY = Math.abs(touchEndY - touchStartY);
                
                // Yatay kaydırma varsa scroll olarak işaretle
                if (diffX > 10 || diffY > 10) {
                    isScrolling = true;
                }
            }, { passive: true });
            
            // Click event - sadece scroll değilse tetikle
            newCard.addEventListener('click', (e) => {
                // Eğer scroll yapıldıysa click'i yok say
                if (isScrolling) {
                    isScrolling = false;
                    return;
                }
                
                const category = newCard.dataset.category;
                currentCategory = category;
                
                // Update active state
                categoryCards = document.querySelectorAll('.category-card');
                categoryCards.forEach(c => c.classList.remove('active'));
                newCard.classList.add('active');
                
                renderSidebarChannels();
            }, { passive: false });
            
            // Touch end - scroll durumunu sıfırla
            newCard.addEventListener('touchend', () => {
                // Kısa bir gecikme sonra scroll durumunu sıfırla
                setTimeout(() => {
                    isScrolling = false;
                }, 100);
            }, { passive: true });
        });
    }
}

// Render Sidebar Channels
function renderSidebarChannels() {
    let filteredChannels = [];
    
    if (activeTab === 'favorites') {
        filteredChannels = channels.filter(ch => favoriteChannels.includes(ch.id));
        sidebarCategoryTitle.textContent = 'Favori Kanallar';
    } else {
        // Show channels from current category
        if (currentCategory === 'all') {
            filteredChannels = channels;
        } else {
            filteredChannels = channels.filter(ch => {
                const chCategory = normalizeCategory(ch.category).toLowerCase();
                const targetCategory = currentCategory.toLowerCase();
                // Tam eşleşme veya içerme kontrolü (birleştirilmiş kategoriler için)
                return chCategory === targetCategory || 
                       chCategory.includes(targetCategory) || 
                       targetCategory.includes(chCategory);
            });
        }
        
        const categoryNames = {
            'all': 'Tüm Kanallar',
            'Ulusal': 'Ulusal Kanallar',
            'Haber': 'Haber Kanalları',
            'Spor': 'Spor Kanalları',
            'Eğlence': 'Eğlence Kanalları',
            'Müzik': 'Müzik Kanalları',
            'Belgesel': 'Belgesel Kanalları',
            'Dini': 'Dini Kanallar',
            'Çocuk': 'Çocuk Kanalları',
            'Ekonomi': 'Ekonomi Kanalları',
            'Yurt Dışı': 'Yurt Dışı Kanallar',
            'Radyo Canlı': 'Radyo Canlı'
        };
        sidebarCategoryTitle.textContent = categoryNames[currentCategory] || 'Kanallar';
        // Update active category
        if (categoryCards && categoryCards.length > 0) {
            categoryCards.forEach(card => {
                card.classList.remove('active');
                if (card.dataset.category === currentCategory) {
                    card.classList.add('active');
                }
            });
        }
    }
    
    channelsSidebarList.innerHTML = '';
    
    if (filteredChannels.length === 0) {
        channelsSidebarList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <p>Kanal bulunamadı</p>
            </div>
        `;
        return;
    }
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    filteredChannels.forEach(channel => {
        const channelItem = document.createElement('div');
        channelItem.className = 'channel-sidebar-item';
        channelItem.dataset.channelId = channel.id;
        if (currentChannel && currentChannel.id === channel.id) {
            channelItem.classList.add('active');
        }
        
        const isFavorite = favoriteChannels.includes(channel.id);
        
        // Create structure with DOM methods (better performance than innerHTML)
        const contentDiv = document.createElement('div');
        contentDiv.className = 'channel-sidebar-content';
        
        const logoContainer = document.createElement('div');
        logoContainer.className = 'channel-sidebar-logo-container';
        
        if (channel.tvgLogo) {
            const img = document.createElement('img');
            img.src = channel.tvgLogo;
            img.alt = channel.name;
            img.className = 'channel-sidebar-logo';
            img.loading = 'lazy'; // Lazy loading
            img.onerror = function() {
                this.style.display = 'none';
                if (this.nextElementSibling) {
                    this.nextElementSibling.style.display = 'flex';
                }
            };
            logoContainer.appendChild(img);
            
            const placeholder = document.createElement('div');
            placeholder.className = 'channel-sidebar-logo-placeholder';
            placeholder.style.display = 'none';
            placeholder.textContent = '📺';
            logoContainer.appendChild(placeholder);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'channel-sidebar-logo-placeholder';
            placeholder.textContent = '📺';
            logoContainer.appendChild(placeholder);
        }
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'channel-sidebar-info';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'channel-sidebar-name';
        nameDiv.textContent = channel.name;
        
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'channel-sidebar-category';
        categoryDiv.textContent = channel.category;
        
        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(categoryDiv);
        
        contentDiv.appendChild(logoContainer);
        contentDiv.appendChild(infoDiv);
        
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'favorite-sidebar-btn';
        favoriteBtn.dataset.channelId = channel.id;
        favoriteBtn.title = isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle';
        favoriteBtn.textContent = isFavorite ? '⭐' : '☆';
        
        channelItem.appendChild(contentDiv);
        channelItem.appendChild(favoriteBtn);
        
        fragment.appendChild(channelItem);
    });
    
    channelsSidebarList.appendChild(fragment);
    
    // Use event delegation (better performance) - only add once
    if (channelsSidebarList && !channelsSidebarList.hasAttribute('data-delegated')) {
        channelsSidebarList.setAttribute('data-delegated', 'true');
        channelsSidebarList.addEventListener('click', (e) => {
            const favoriteBtn = e.target.closest('.favorite-sidebar-btn');
            if (favoriteBtn) {
                e.stopPropagation();
                const channelId = parseInt(favoriteBtn.dataset.channelId);
                toggleFavorite(channelId);
                // Use requestAnimationFrame to prevent render loops
                requestAnimationFrame(() => {
                    renderSidebarChannels();
                });
                return;
            }
            
            const channelItem = e.target.closest('.channel-sidebar-item');
            if (channelItem && channelItem.dataset.channelId) {
                const channelId = parseInt(channelItem.dataset.channelId);
                const channel = channels.find(ch => ch.id === channelId);
                if (channel) {
                    playChannel(channel);
                }
            }
        });
    }
}

// Render Category Sidebar
function renderCategorySidebar() {
    if (!categorySidebarList) return;
    
    const categories = ['all', 'Ulusal', 'Haber', 'Spor', 'Eğlence', 'Müzik', 'Belgesel', 'Dini', 'Çocuk', 'Ekonomi', 'Yurt Dışı', 'Radyo Canlı'];
    const categoryNames = {
        'all': 'Tümü',
        'Ulusal': 'Ulusal',
        'Haber': 'Haber',
        'Spor': 'Spor',
        'Eğlence': 'Eğlence',
        'Müzik': 'Müzik',
        'Belgesel': 'Belgesel',
        'Dini': 'Dini',
        'Çocuk': 'Çocuk',
        'Ekonomi': 'Ekonomi',
        'Yurt Dışı': 'Yurt Dışı',
        'Radyo Canlı': 'Radyo Canlı'
    };
    
    categorySidebarList.innerHTML = '';
    
    categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-sidebar-item';
        if (currentCategory === category) {
            categoryItem.classList.add('active');
        }
        
        categoryItem.innerHTML = `
            <div class="category-sidebar-name">${categoryNames[category]}</div>
        `;
        
        categoryItem.addEventListener('click', () => {
            currentCategory = category;
            renderSidebarChannels();
            renderCategorySidebar();
            
            // Update category cards
            if (categoryCards && categoryCards.length > 0) {
                categoryCards.forEach(card => {
                    card.classList.remove('active');
                    if (card.dataset.category === category) {
                        card.classList.add('active');
                    }
                });
            }
        });
        
        categorySidebarList.appendChild(categoryItem);
    });
}

// Play Channel
function playChannel(channel) {
    if (!channel || !channel.url) {
        // Hata mesajı kaldırıldı - sessiz çalış
        console.warn('Geçersiz kanal bilgisi');
        return;
    }
    
    currentChannel = channel;
    
    // Update document title and video title (hide URL)
    document.title = `${channel.name} - PlusTV`;
    if (videoPlayer) {
        videoPlayer.title = channel.name;
        // Controls'u tekrar ayarla (uygulama içinde olabilir)
        setupVideoControls();
    }
    
    // Update active channel in sidebar (optimized)
    const items = channelsSidebarList.querySelectorAll('.channel-sidebar-item');
    items.forEach(item => {
        if (parseInt(item.dataset.channelId) === channel.id) {
            item.classList.add('active');
            // Use requestAnimationFrame for smooth scrolling
            requestAnimationFrame(() => {
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        } else {
            item.classList.remove('active');
        }
    });
    
    // Cleanup previous playback
    cleanup();
    
    // Reset displays
    if (iframePlayer) {
        iframePlayer.style.display = 'none';
    }
    
    // Play video
    if (channel.url.includes('.m3u8')) {
        // M3U8 için loading göster
        videoPlaceholderPlayer.style.display = 'flex';
        loadingPlayer.classList.add('active');
        playM3U8(channel.url);
    } else if (channel.url.includes('youtube.com') || channel.url.includes('youtu.be')) {
        // YouTube linkleri için loading'i gösterme (iframe hızlı yüklenir)
        videoPlaceholderPlayer.style.display = 'none';
        loadingPlayer.classList.remove('active');
        // YouTube linklerini embed formatına çevir
        const youtubeUrl = convertYouTubeToEmbed(channel.url);
        playIframe(youtubeUrl);
    } else {
        // Diğer iframe linkleri için loading göster
        videoPlaceholderPlayer.style.display = 'flex';
        loadingPlayer.classList.add('active');
        playIframe(channel.url);
    }
}

// Play M3U8
function playM3U8(url) {
    videoPlayer.style.display = 'block';
    iframePlayer.style.display = 'none';
    if (currentChannel && videoPlayer) {
        videoPlayer.title = currentChannel.name;
    }
    
    // Video element'ini optimize et
    videoPlayer.preload = 'auto';
    videoPlayer.playsInline = true;
    
    // Controls'u ayarla (uygulama içinde olabilir)
    setupVideoControls();
    
    if (typeof Hls === 'undefined') {
        // Hata mesajı kaldırıldı - sessiz çalış
        console.warn('HLS.js yüklenemedi');
        loadingPlayer.classList.remove('active');
        return;
    }
    
    if (Hls.isSupported()) {
        // Cleanup previous HLS instance
        if (hlsInstance) {
            try {
                hlsInstance.destroy();
            } catch (e) {
                console.warn('Previous HLS cleanup error:', e);
            }
        }
        
        if (videoPlayer.hls) {
            try {
                videoPlayer.hls.destroy();
            } catch (e) {
                console.warn('Video player HLS cleanup error:', e);
            }
            videoPlayer.hls = null;
        }
        
        const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true, // Enable for faster loading
            debug: false,
            maxBufferLength: 10, // Reduced buffer for faster start
            maxMaxBufferLength: 20,
            maxBufferSize: 30 * 1000 * 1000, // 30MB max buffer (reduced for faster start)
            startLevel: -1, // Auto start level
            capLevelToPlayerSize: true, // Auto adjust quality
            startFragPrefetch: true, // Prefetch first fragment
            testBandwidth: false, // Disable bandwidth testing for faster start
            progressive: false, // Use HLS.js instead of native
            xhrSetup: function(xhr, url) {
                xhr.withCredentials = false;
                // Set timeout for faster failure detection
                xhr.timeout = 8000; // 8 seconds timeout
            }
        });
        
        hlsInstance = hls;
        videoPlayer.hls = hls;
        
        // VideoPlayer'ı temizle ve optimize et
        videoPlayer.src = '';
        videoPlayer.load();
        
        // HLS'yi yükle
        hls.loadSource(url);
        hls.attachMedia(videoPlayer);
        
        let manifestParsed = false;
        let timeout;
        
        // Loading'i daha erken kaldırmak için fragment loading event'lerini dinle
        let firstFragmentLoaded = false;
        hls.on(Hls.Events.FRAG_LOADED, () => {
            // İlk fragment yüklendiğinde loading'i kaldır
            if (!firstFragmentLoaded && loadingPlayer && loadingPlayer.classList.contains('active')) {
                firstFragmentLoaded = true;
                loadingPlayer.classList.remove('active');
                if (videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'none';
            }
        });
        
        hls.on(Hls.Events.LEVEL_LOADED, () => {
            // Level yüklendiğinde de loading'i kaldır (fallback)
            if (loadingPlayer && loadingPlayer.classList.contains('active')) {
                loadingPlayer.classList.remove('active');
                if (videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'none';
            }
        });
        
        // VideoPlayer'ın canplay event'ini dinle (daha erken loading kaldırma)
        const canPlayHandler = () => {
            if (loadingPlayer && loadingPlayer.classList.contains('active')) {
                loadingPlayer.classList.remove('active');
                if (videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'none';
            }
            videoPlayer.removeEventListener('canplay', canPlayHandler);
        };
        videoPlayer.addEventListener('canplay', canPlayHandler);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            manifestParsed = true;
            if (timeout) {
                clearTimeout(timeout);
                activeTimeouts = activeTimeouts.filter(t => t !== timeout);
            }
            // Loading'i kaldır
            if (loadingPlayer) loadingPlayer.classList.remove('active');
            if (videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'none';
            
            // Controls'u tekrar ayarla (video yüklendiğinde)
            setupVideoControls();
            
            videoPlayer.play().catch(err => {
                console.error('Playback error:', err);
                // Hata mesajı kaldırıldı - sessiz çalış
                console.warn('Video oynatılamadı');
            });
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS Error:', data);
            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        try {
                            hls.startLoad();
                        } catch(e) {
                            if (loadingPlayer) loadingPlayer.classList.remove('active');
                            try {
                                hls.destroy();
                            } catch (destroyErr) {
                                console.warn('HLS destroy error:', destroyErr);
                            }
                            // Hata mesajı kaldırıldı - sessiz çalış
                console.warn('Ağ hatası');
                        }
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        try {
                            hls.recoverMediaError();
                        } catch(e) {
                            if (loadingPlayer) loadingPlayer.classList.remove('active');
                            try {
                                hls.destroy();
                            } catch (destroyErr) {
                                console.warn('HLS destroy error:', destroyErr);
                            }
                            // Hata mesajı kaldırıldı - sessiz çalış
                            console.warn('Video çözümlenemedi');
                        }
                        break;
                    default:
                        if (timeout) {
                            clearTimeout(timeout);
                            activeTimeouts = activeTimeouts.filter(t => t !== timeout);
                        }
                        if (loadingPlayer) loadingPlayer.classList.remove('active');
                        try {
                            hls.destroy();
                        } catch (destroyErr) {
                            console.warn('HLS destroy error:', destroyErr);
                        }
                        // Hata mesajı kaldırıldı - sessiz çalış
                        console.warn('Kanal yüklenemedi');
                        break;
                }
            }
        });
        
        timeout = safeSetTimeout(() => {
            if (!manifestParsed) {
                if (loadingPlayer) loadingPlayer.classList.remove('active');
                try {
                    hls.destroy();
                } catch (destroyErr) {
                    console.warn('HLS destroy error:', destroyErr);
                }
                // Hata mesajı kaldırıldı - sessiz çalış
                console.warn('Kanal yükleme zaman aşımı');
            }
        }, 10000); // 10 saniye timeout (15'ten 10'a düşürüldü)
        
    } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        // Controls'u ayarla (Safari için)
        setupVideoControls();
        
        videoPlayer.src = url;
        
        // Safari için loading'i daha erken kaldırmak için canplay event'ini dinle
        const canPlayHandler = () => {
            if (loadingPlayer) loadingPlayer.classList.remove('active');
            if (videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'none';
            // Controls'u tekrar ayarla
            setupVideoControls();
            videoPlayer.removeEventListener('canplay', canPlayHandler);
            if (safariTimeout) {
                clearTimeout(safariTimeout);
                activeTimeouts = activeTimeouts.filter(t => t !== safariTimeout);
            }
        };
        videoPlayer.addEventListener('canplay', canPlayHandler);
        
        const playPromise = videoPlayer.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Play başarılı olduğunda loading'i kaldır
                if (loadingPlayer) loadingPlayer.classList.remove('active');
                if (videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'none';
            }).catch(err => {
                console.error('Playback error:', err);
                if (loadingPlayer) loadingPlayer.classList.remove('active');
                // Hata mesajı kaldırıldı - sessiz çalış
                console.warn('Video oynatılamadı');
            });
        }
        
        const safariTimeout = safeSetTimeout(() => {
            if (videoPlayer.readyState === 0) {
                if (loadingPlayer) loadingPlayer.classList.remove('active');
                // Hata mesajı kaldırıldı - sessiz çalış
                console.warn('Kanal yükleme zaman aşımı');
            }
        }, 10000); // 10 saniye timeout (15'ten 10'a düşürüldü)
        
        const loadedDataHandler = () => {
            if (safariTimeout) {
            clearTimeout(safariTimeout);
            activeTimeouts = activeTimeouts.filter(t => t !== safariTimeout);
            }
            videoPlayer.removeEventListener('loadeddata', loadedDataHandler);
        };
        videoPlayer.addEventListener('loadeddata', loadedDataHandler, { once: true });
    } else {
        loadingPlayer.classList.remove('active');
        // Hata mesajı kaldırıldı - sessiz çalış
        console.warn('Tarayıcı bu video formatını desteklemiyor');
    }
}

// Convert YouTube URL to embed format
function convertYouTubeToEmbed(url) {
    let videoId = '';
    
    // YouTube URL formatlarını kontrol et
    if (url.includes('youtube.com/watch?v=')) {
        const match = url.match(/[?&]v=([^&]+)/);
        if (match) {
            videoId = match[1];
        }
    } else if (url.includes('youtu.be/')) {
        const match = url.match(/youtu\.be\/([^?&]+)/);
        if (match) {
            videoId = match[1];
        }
    } else if (url.includes('youtube.com/embed/')) {
        // Zaten embed formatında
        return url;
    }
    
    if (videoId) {
        // URL parametrelerini temizle (list, start_radio vb.)
        videoId = videoId.split('&')[0].split('?')[0];
        // YouTube embed URL'ini optimize et: autoplay, rel=0, modestbranding, controls=1
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&playsinline=1&enablejsapi=1`;
    }
    
    return url;
}

// Play Iframe
function playIframe(url) {
    videoPlayer.style.display = 'none';
    iframePlayer.style.display = 'block';
    iframePlayer.src = url;
    
    if (currentChannel && iframePlayer) {
        iframePlayer.title = currentChannel.name;
    }
    
    // YouTube olmayan linkler için load event'ini bekle
    if (!url.includes('youtube.com')) {
        iframePlayer.onload = () => {
    loadingPlayer.classList.remove('active');
    videoPlaceholderPlayer.style.display = 'none';
        };
    }
}

// Setup double tap for fullscreen (mobile)
function setupDoubleTapFullscreen(element) {
    if (!element) return;
    
    let lastTap = 0;
    let tapTimeout = null;
    let touchStartX = 0;
    let touchStartY = 0;
    
    const touchStartHandler = function(e) {
        // Store touch start position
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    };
    
    const touchEndHandler = function(e) {
        // Only handle single finger taps
        if (e.changedTouches.length !== 1) return;
        
        const touch = e.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        
        // Check if it's a tap (not a swipe) - movement should be less than 10px
        const deltaX = Math.abs(touchEndX - touchStartX);
        const deltaY = Math.abs(touchEndY - touchStartY);
        
        if (deltaX > 10 || deltaY > 10) {
            // It's a swipe, not a tap - ignore
            lastTap = 0;
            if (tapTimeout) {
                clearTimeout(tapTimeout);
                activeTimeouts = activeTimeouts.filter(t => t !== tapTimeout);
                tapTimeout = null;
            }
            return;
        }
        
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapTimeout) {
            clearTimeout(tapTimeout);
            activeTimeouts = activeTimeouts.filter(t => t !== tapTimeout);
            tapTimeout = null;
        }
        
        if (tapLength < 400 && tapLength > 0) {
            // Double tap detected
            e.preventDefault();
            e.stopPropagation();
            toggleFullscreen();
            lastTap = 0; // Reset to prevent triple tap
        } else {
            // Single tap - wait to see if there's another tap
            tapTimeout = safeSetTimeout(() => {
                // Single tap confirmed, do nothing
                tapTimeout = null;
            }, 400);
        }
        
        lastTap = currentTime;
    };
    
    element.addEventListener('touchstart', touchStartHandler, { passive: true });
    element.addEventListener('touchend', touchEndHandler, { passive: false });
    
    // Store handlers for potential cleanup
    element._touchStartHandler = touchStartHandler;
    element._touchEndHandler = touchEndHandler;
}

// Toggle Fullscreen
function toggleFullscreen() {
    const container = videoContainerPlayer;
    
    try {
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && 
            !document.msFullscreenElement) {
            // Enter fullscreen
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.mozRequestFullScreen) {
                container.mozRequestFullScreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    } catch (error) {
        console.error('Tam ekran hatası:', error);
        showError('Tam ekran modu açılamadı.');
    }
}


// Toggle Favorite
function toggleFavorite(channelId) {
    const index = favoriteChannels.indexOf(channelId);
    if (index > -1) {
        favoriteChannels.splice(index, 1);
    } else {
        favoriteChannels.push(channelId);
    }
    localStorage.setItem('favoriteChannels', JSON.stringify(favoriteChannels));
}

// Show Error
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--danger);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        z-index: 10000;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        font-size: 0.9375rem;
        max-width: 400px;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    // Zaman aşımı mesajları 2 saniye, diğerleri 5 saniye sonra kaybolsun
    const timeoutDuration = message.includes('zaman aşımı') ? 2000 : 5000;
    
    const fadeTimeout = safeSetTimeout(() => {
        errorDiv.style.opacity = '0';
        errorDiv.style.transition = 'opacity 0.3s ease';
        const removeTimeout = safeSetTimeout(() => {
            errorDiv.remove();
        }, 300);
    }, timeoutDuration);
}

