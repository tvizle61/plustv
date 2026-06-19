/**
 * PlusTV - player.js (Birleştirilmiş & Optimize Edilmiş Tam Sürüm)
 */

// Global Değişken Tanımlamaları (Eğer ana dosyada yoksa güvenli kılmak için)
if (typeof activeTimeouts === 'undefined') window.activeTimeouts = [];
if (typeof hlsInstance === 'undefined') window.hlsInstance = null;
if (typeof currentChannel === 'undefined') window.currentChannel = null;
if (typeof currentCategory === 'undefined') window.currentCategory = 'all';
if (typeof favoriteChannels === 'undefined') window.favoriteChannels = [];
if (typeof channels === 'undefined') window.channels = [];
if (typeof allCategories === 'undefined') window.allCategories = new Set();
if (typeof channelId === 'undefined') window.channelId = 1;

// Standart Kategoriler Sabiti
const STANDARD_CATEGORIES = [
    { id: 'all', name: 'Tümü', icon: '📺' },
    { id: 'Ulusal', name: 'Ulusal', icon: '🏛️' },
    { id: 'Haber', name: 'Haber', icon: '📰' },
    { id: 'Spor', name: 'Spor', icon: '⚽' },
    { id: 'Eğlence', name: 'Eğlence', icon: '🎭' },
    { id: 'Müzik', name: 'Müzik', icon: '🎵' },
    { id: 'Belgesel', name: 'Belgesel', icon: '🌍' },
    { id: 'Dini', name: 'Dini', icon: '🕌' },
    { id: 'Çocuk', name: 'Çocuk', icon: '🧸' },
    { id: 'Ekonomi', name: 'Ekonomi', icon: '📊' },
    { id: 'Yurt Dışı', name: 'Yurt Dışı', icon: '🌐' },
    { id: 'Youtube', name: 'Youtube', icon: '❤️' }
];

const categoryIcons = {
    'ulusal': '🏛️', 'haber': '📰', 'spor': '⚽', 'eğlence': '🎭', 
    'müzik': '🎵', 'belgesel': '🌍', 'dini': '🕌', 'çocuk': '🧸', 
    'ekonomi': '📊', 'yurt dışı': '🌐', 'youtube': '❤️'
};

// 1. PARÇA: YOUTUBE RADYO KANALLARININ YÜKLENMESİ VE KATEGORİ ENTEGRASYONU
try {
    const radioChannels = [
        { name: 'Hayri Yaşar Karagülle-Geldi Bahar Ayları', url: 'https://www.youtube.com/watch?v=0RziZxRimS0' },
        { name: "Koliva - Oy Oy Güzelum", url: 'https://www.youtube.com/watch?v=j6n_EFtyi5s' },
        { name: 'Fatih Reyhan - Eski Hemşin', url: 'https://www.youtube.com/watch?v=hcTZw4Q57HI' },
        { name: 'Hayri Yaşar Karagülle Vur Elleri Ellere', url: 'https://www.youtube.com/watch?v=zzE_SG7_XcE' },
        { name: 'Krdnz Mahsup 1', url: 'https://www.youtube.com/watch?v=HtjN3qFzMok' },
        { name: 'Krdnz Mahsup 2', url: 'https://www.youtube.com/watch?v=SZp-OERwFbQ' },
        { name: 'Krdnz Mahsup 3', url: 'https://www.youtube.com/watch?v=W8_O05NhE2g' },
        { name: 'Krdnz Mahsup 4', url: 'https://www.youtube.com/watch?v=O93oqCdJGao' },
        { name: 'Krdnz Mahsup 5', url: 'https://www.youtube.com/watch?v=8M1aKEQggNw' },
        { name: 'Krdnz Mahsup 6', url: 'https://www.youtube.com/watch?v=Sq1c2ZB6gfA' },
        { name: 'İmera', url: 'https://www.youtube.com/watch?v=62vDl5dWl8' },
        { name: 'Turan Topçuoğlu Karasevda', url: 'https://www.youtube.com/watch?v=5iVjVzuVOQY' },
        { name: 'Turan Topçuoğlu Ben Ağlarım El Güler', url: 'https://www.youtube.com/watch?v=dXO9RfT8tww' },
        { name: 'Turan Topçuoğlu Horan', url: 'https://www.youtube.com/watch?v=ryfx-jYO8Ro' },
        { name: 'Turan Topçuoğlu Ayşem Destanı', url: 'https://www.youtube.com/watch?v=iyvJpA2yZ-k' },
        { name: 'Turan Topçuoğlu Dumanlı Başım Bugün', url: 'https://www.youtube.com/watch?v=1PtFOo94KDY' },
        { name: 'Turan Topçuoğlu Yemin Etti Bu Ofli', url: 'https://www.youtube.com/watch?v=hUghUWV8lpI' },
        { name: 'Turan Topçuoğlu Gaybana Dünya', url: 'https://www.youtube.com/watch?v=PnEaxDYbGCQ' },
        { name: 'Karadeniz 2', url: 'https://www.youtube.com/watch?v=kQ8RDCrZ_qg' },
        { name: 'Karadeniz', url: 'https://www.youtube.com/watch?v=PV1kDalcvVE' },
        { name: 'Karadeniz Akustik', url: 'https://www.youtube.com/watch?v=Fru_Ss-TqgY' },
        { name: 'Onay Şahin bi baktım', url: 'https://www.youtube.com/watch?v=T8MFKICcJF8' },
        { name: 'Fuat Saka Torul', url: 'https://www.youtube.com/watch?v=-XNoI12npcg' },
        { name: 'Kemençe', url: 'https://www.youtube.com/watch?v=bEwyzIEoD5M' },
        { name: 'Şükrü Güler- horon', url: 'https://www.youtube.com/watch?v=Q0khMZWqyW4' },
        { name: 'Sinan Sami - Gene Yaranamadım', url: 'https://www.youtube.com/watch?v=jJ-V4r3LPC4' },
        { name: 'Hayri Yaşar Karagülle - Selam Trabzonuma', url: 'https://www.youtube.com/watch?v=NGJGZvG4Ra8' },
        { name: 'Asırlık Şu Çınara', url: 'https://www.youtube.com/watch?v=lQ5QBlF85Hc' },
        { name: 'Hilmi Yerekaban-Virane Kıranlara', url: 'https://www.youtube.com/watch?v=mXx6h1B3mY8' },
        { name: 'Zeynep Başkan - Çayluk', url: 'https://www.youtube.com/watch?v=f6LrFjj9agI' },
        { name: 'Selim Bölükbaşı - Kapıya Sandalye', url: 'https://www.youtube.com/watch?v=XWNGrb97P8c' },
        { name: 'Hülya Polat - Gaybana', url: 'https://www.youtube.com/watch?v=X5z2K-S0WbU' },
        { name: 'Aylin Demir - Müjgan', url: 'https://www.youtube.com/watch?v=nZhfo7G_JfY' },
        { name: 'Tulum Horon Potpori', url: 'https://www.youtube.com/watch?v=olgBiI1sY9o' },
        { name: 'Apolas Lermi - Bir Baktım', url: 'https://www.youtube.com/watch?v=HTMGLfBX_7g' },
        { name: 'Resul Dindar - Gümüşhane Kızları', url: 'https://www.youtube.com/watch?v=VPNx4UDohUk' },
        { name: 'O.Şahin Kalem Çektim', url: 'https://www.youtube.com/watch?v=T6wbun1gpMs' },
        { name: 'O.Şahin Eygidi günler', url: 'https://www.youtube.com/watch?v=gOVYxDS_l_w' },
        { name: 'O.Şahin Yama', url: 'https://www.youtube.com/watch?v=8s_Xhv6Zvlk' },
        { name: 'O.Şahin Bi Kız Var Nişan Eden', url: 'https://www.youtube.com/watch?v=4ZYY4_7Vhhg' },
        { name: 'O.ŞAhin Bu Zamanın Kızlari', url: 'https://www.youtube.com/watch?v=7Ya3MNQTGgM' },
        { name: 'Yalnız Değilsin', url: 'https://www.youtube.com/watch?v=aZCpmiUGYcw' },
        { name: 'Nem Kaldı', url: 'https://www.youtube.com/watch?v=na1kcFLe1Yo' },
        { name: 'Minnet Eylemem', url: 'https://www.youtube.com/watch?v=N7VlPV7mLMM' },
        { name: 'Çeşmi Siyahım', url: 'https://www.youtube.com/watch?v=eJCDdjOodUE' },
        { name: 'Yolun Sonu', url: 'https://www.youtube.com/watch?v=cuHH0kComrU' },
        { name: 'Giresun İçinde', url: 'https://www.youtube.com/watch?v=x-Qmlb1pd5A' },
        { name: 'Şşu Kanlı Zalimin', url: 'https://www.youtube.com/watch?v=qv5pT7Qw01c' },
        { name: 'Üryan Geldim', url: 'https://www.youtube.com/watch?v=gYZMtjPk8jc' },
        { name: 'Böyledir Bizim Sevdamız', url: 'https://www.youtube.com/watch?v=TtwgA1r8mPo' },
        { name: 'Dolanı Dolanı', url: 'https://www.youtube.com/watch?v=YI7LfBKpdM0' },
        { name: 'Susarak Özlüyorum', url: 'https://www.youtube.com/watch?v=fYOXs7pjirA' }
    ];
        
    radioChannels.forEach(radio => {
        channels.push({
            id: channelId++,
            name: radio.name,
            url: radio.url,
            category: 'Youtube',
            tvgId: '',
            tvgLogo: ''
        });
    });
        
    allCategories.add('Youtube');
        
    console.log(`✅ Toplam ${channels.length} kanal yüklendi!`);
    
    setTimeout(() => {
        renderDynamicCategories();
    }, 100);
} catch (error) {
    console.error('M3U dosyası yüklenemedi:', error);
    console.warn('Kanal listesi yüklenemedi');
}

// Kategorileri birleştir ve normalize et
function mergeAndNormalizeCategories() {
    const categoryMap = new Map();
    const channelCategoryMap = new Map();
    
    channels.forEach(ch => {
        const normalized = normalizeCategory(ch.category).toLowerCase();
        if (!channelCategoryMap.has(normalized)) {
            channelCategoryMap.set(normalized, []);
        }
        channelCategoryMap.get(normalized).push(ch);
    });
    
    STANDARD_CATEGORIES.forEach(cat => {
        if (cat.id === 'all') return;
        
        const normalized = cat.id.toLowerCase();
        const matchingChannels = [];
        
        for (const [catKey, catChannels] of channelCategoryMap.entries()) {
            if (catKey === normalized || 
                catKey.includes(normalized) || 
                normalized.includes(catKey) ||
                catKey.split(' ').some(word => word === normalized) ||
                normalized.split(' ').some(word => catKey === word)) {
                matchingChannels.push(...catChannels);
            }
        }
        
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
            
            uniqueChannels.forEach(ch => {
                const chNormalized = normalizeCategory(ch.category).toLowerCase();
                channelCategoryMap.delete(chNormalized);
            });
        }
    });
    
    if (channelCategoryMap.has('diğer')) {
        const digerChannels = channelCategoryMap.get('diğer');
        const ulusalNormalized = 'ulusal';
        if (!channelCategoryMap.has(ulusalNormalized)) {
            channelCategoryMap.set(ulusalNormalized, []);
        }
        channelCategoryMap.get(ulusalNormalized).push(...digerChannels);
        channelCategoryMap.delete('diğer');
        
        if (categoryMap.has(ulusalNormalized)) {
            categoryMap.get(ulusalNormalized).count += digerChannels.length;
        }
    }
    
    for (const [normalized, catChannels] of channelCategoryMap.entries()) {
        if (normalized === 'all' || normalized === 'tümü' || normalized === 'diğer') continue;
        if (categoryMap.has(normalized)) continue;
        
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
        if (a.isStandard && !b.isStandard) return -1;
        if (!a.isStandard && b.isStandard) return 1;
        return a.name.localeCompare(b.name, 'tr');
    });
}

// Dinamik kategori kartlarını oluştur
function renderDynamicCategories() {
    const categoriesContainer = document.querySelector('.player-categories-container');
    if (!categoriesContainer) return;
    
    categoriesContainer.innerHTML = '';
    const mergedCategories = mergeAndNormalizeCategories();
    
    // "Tümü" kartı
    const allCard = document.createElement('div');
    allCard.className = 'category-card';
    allCard.dataset.category = 'all';
    if (currentCategory === 'all') allCard.classList.add('active');
    
    const allIcon = document.createElement('div');
    allIcon.className = 'category-icon';
    allIcon.textContent = '📺';
    
    const allName = document.createElement('div');
    allName.className = 'category-name';
    allName.textContent = 'Tümü';
    
    allCard.appendChild(allIcon);
    allCard.appendChild(allName);
    categoriesContainer.appendChild(allCard);
    
    // "Ulusal" kartı
    const ulusalCat = mergedCategories.find(cat => cat.id.toLowerCase() === 'ulusal');
    if (ulusalCat) {
        const ulusalCard = document.createElement('div');
        ulusalCard.className = 'category-card';
        ulusalCard.dataset.category = ulusalCat.id;
        if (currentCategory === ulusalCat.id) ulusalCard.classList.add('active');
        
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
    
    // Diğer dinamik kartlar
    mergedCategories.forEach(cat => {
        if (cat.id.toLowerCase() === 'ulusal') return;
        if (cat.id.toLowerCase() === 'diğer') return;
        
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.dataset.category = cat.id;
        if (currentCategory === cat.id) categoryCard.classList.add('active');
        
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
    
    setupCategoryEventListeners();
}

// Kategori olay dinleyicilerini yapılandır
function setupCategoryEventListeners() {
    const cards = document.querySelectorAll('.category-card');
    
    if (cards && cards.length > 0) {
        cards.forEach(card => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            let touchStartX = 0;
            let touchStartY = 0;
            let isScrolling = false;
            
            newCard.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isScrolling = false;
            }, { passive: true });
            
            newCard.addEventListener('touchmove', (e) => {
                if (!touchStartX || !touchStartY) return;
                const touchEndX = e.touches[0].clientX;
                const touchEndY = e.touches[0].clientY;
                if (Math.abs(touchEndX - touchStartX) > 10 || Math.abs(touchEndY - touchStartY) > 10) {
                    isScrolling = true;
                }
            }, { passive: true });
            
            newCard.addEventListener('click', (e) => {
                if (isScrolling) {
                    isScrolling = false;
                    return;
                }
                
                const category = newCard.dataset.category;
                currentCategory = category;
                
                const allCards = document.querySelectorAll('.category-card');
                allCards.forEach(c => c.classList.remove('active'));
                newCard.classList.add('active');
                
                renderSidebarChannels();
            }, { passive: false });
            
            newCard.addEventListener('touchend', () => {
                setTimeout(() => { isScrolling = false; }, 100);
            }, { passive: true });
        });
    }
}

// Yan menü kanallarını listele
function renderSidebarChannels() {
    let filteredChannels = [];
    
    if (typeof activeTab !== 'undefined' && activeTab === 'favorites') {
        filteredChannels = channels.filter(ch => favoriteChannels.includes(ch.id));
        if (typeof sidebarCategoryTitle !== 'undefined' && sidebarCategoryTitle) {
            sidebarCategoryTitle.textContent = 'Favori Kanallar';
        }
    } else {
        if (currentCategory === 'all') {
            filteredChannels = channels;
        } else {
            filteredChannels = channels.filter(ch => {
                const chCategory = normalizeCategory(ch.category).toLowerCase();
                const targetCategory = currentCategory.toLowerCase();
                return chCategory === targetCategory || 
                       chCategory.includes(targetCategory) || 
                       targetCategory.includes(chCategory);
            });
        }
        
        const categoryNames = {
            'all': 'Tüm Kanallar', 'Ulusal': 'Ulusal Kanallar', 'Haber': 'Haber Kanalları',
            'Spor': 'Spor Kanalları', 'Eğlence': 'Eğlence Kanalları', 'Müzik': 'Müzik Kanalları',
            'Belgesel': 'Belgesel Kanalları', 'Dini': 'Dini Kanallar', 'Çocuk': 'Çocuk Kanalları',
            'Ekonomi': 'Ekonomi Kanalları', 'Yurt Dışı': 'Yurt Dışı Kanallar', 'Youtube': 'Youtube'
        };
        
        if (typeof sidebarCategoryTitle !== 'undefined' && sidebarCategoryTitle) {
            sidebarCategoryTitle.textContent = categoryNames[currentCategory] || 'Kanallar';
        }
        
        const allCards = document.querySelectorAll('.category-card');
        if (allCards && allCards.length > 0) {
            allCards.forEach(card => {
                card.classList.remove('active');
                if (card.dataset.category === currentCategory) {
                    card.classList.add('active');
                }
            });
        }
    }
    
    if (!typeof channelsSidebarList !== 'undefined' || !channelsSidebarList) return;
    channelsSidebarList.innerHTML = '';
    
    if (filteredChannels.length === 0) {
        channelsSidebarList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted, #888);">
                <p>Kanal bulunamadı</p>
            </div>
        `;
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    filteredChannels.forEach(channel => {
        const channelItem = document.createElement('div');
        channelItem.className = 'channel-sidebar-item';
        channelItem.dataset.channelId = channel.id;
        if (currentChannel && currentChannel.id === channel.id) {
            channelItem.classList.add('active');
        }
        
        const isFavorite = favoriteChannels.includes(channel.id);
        const contentDiv = document.createElement('div');
        contentDiv.className = 'channel-sidebar-content';
        
        const logoContainer = document.createElement('div');
        logoContainer.className = 'channel-sidebar-logo-container';
        
        if (channel.tvgLogo) {
            const img = document.createElement('img');
            img.src = channel.tvgLogo;
            img.alt = channel.name;
            img.className = 'channel-sidebar-logo';
            img.loading = 'lazy';
            img.onerror = function() {
                this.style.display = 'none';
                if (this.nextElementSibling) this.nextElementSibling.style.display = 'flex';
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
    
    if (!channelsSidebarList.hasAttribute('data-delegated')) {
        channelsSidebarList.setAttribute('data-delegated', 'true');
        channelsSidebarList.addEventListener('click', (e) => {
            const favoriteBtn = e.target.closest('.favorite-sidebar-btn');
            if (favoriteBtn) {
                e.stopPropagation();
                const id = parseInt(favoriteBtn.dataset.channelId);
                toggleFavorite(id);
                requestAnimationFrame(() => { renderSidebarChannels(); });
                return;
            }
            
            const channelItem = e.target.closest('.channel-sidebar-item');
            if (channelItem && channelItem.dataset.channelId) {
                const id = parseInt(channelItem.dataset.channelId);
                const ch = channels.find(c => c.id === id);
                if (ch) playChannel(ch);
            }
        });
    }
}

// Yan menü kategori listesini oluştur
function renderCategorySidebar() {
    if (typeof categorySidebarList === 'undefined' || !categorySidebarList) return;
    
    const categories = ['all', 'Ulusal', 'Haber', 'Spor', 'Eğlence', 'Müzik', 'Belgesel', 'Dini', 'Çocuk', 'Ekonomi', 'Yurt Dışı', 'Youtube'];
    const categoryNames = {
        'all': 'Tümü', 'Ulusal': 'Ulusal', 'Haber': 'Haber', 'Spor': 'Spor', 'Eğlence': 'Eğlence',
        'Müzik': 'Müzik', 'Belgesel': 'Belgesel', 'Dini': 'Dini', 'Çocuk': 'Çocuk', 'Ekonomi': 'Ekonomi',
        'Yurt Dışı': 'Yurt Dışı', 'Youtube': 'Youtube'
    };
    
    categorySidebarList.innerHTML = '';
    
    categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-sidebar-item';
        if (currentCategory === category) categoryItem.classList.add('active');
        
        categoryItem.innerHTML = `<div class="category-sidebar-name">${categoryNames[category]}</div>`;
        
        categoryItem.addEventListener('click', () => {
            currentCategory = category;
            renderSidebarChannels();
            renderCategorySidebar();
            
            const allCards = document.querySelectorAll('.category-card');
            if (allCards && allCards.length > 0) {
                allCards.forEach(card => {
                    card.classList.remove('active');
                    if (card.dataset.category === category) card.classList.add('active');
                });
            }
        });
        
        categorySidebarList.appendChild(categoryItem);
    });
}

// Kanala tıklanıldığında oynatmayı başlat
function playChannel(channel) {
    if (!channel || !channel.url) {
        console.warn('Geçersiz kanal bilgisi');
        return;
    }
    
    currentChannel = channel;
    document.title = `${channel.name} - PlusTV`;
    
    if (typeof videoPlayer !== 'undefined' && videoPlayer) {
        videoPlayer.title = channel.name;
        setupVideoControls();
    }
    
    if (typeof channelsSidebarList !== 'undefined' && channelsSidebarList) {
        const items = channelsSidebarList.querySelectorAll('.channel-sidebar-item');
        items.forEach(item => {
            if (parseInt(item.dataset.channelId) === channel.id) {
                item.classList.add('active');
                requestAnimationFrame(() => {
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                });
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    cleanup();
    
    if (typeof iframePlayer !== 'undefined' && iframePlayer) iframePlayer.style.display = 'none';
    
    if (channel.url.includes('.m3u8')) {
        if (typeof videoPlaceholderPlayer !== 'undefined' && videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'flex';
        if (typeof loadingPlayer !== 'undefined' && loadingPlayer) loadingPlayer.classList.add('active');
        playM3U8(channel.url);
    } else if (channel.url.includes('youtube.com') || channel.url.includes('youtu.be')) {
        if (typeof videoPlaceholderPlayer !== 'undefined' && videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'none';
        if (typeof loadingPlayer !== 'undefined' && loadingPlayer) loadingPlayer.classList.remove('active');
        const youtubeUrl = convertYouTubeToEmbed(channel.url);
        playIframe(youtubeUrl);
    } else {
        if (typeof videoPlaceholderPlayer !== 'undefined' && videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'flex';
        if (typeof loadingPlayer !== 'undefined' && loadingPlayer) loadingPlayer.classList.add('active');
        playIframe(channel.url);
    }
}


// 2. VE 3. PARÇA: HLS (M3U8) MEDYA MOTORU, SAFARI DESTEĞİ VE TARAYICI KONTROLLERİ
function playM3U8(url) {
    if (url.startsWith('http://') && location.protocol === 'https:') {
        url = url.replace('http://', 'https://');
    }
    
    if (typeof videoPlayer === 'undefined' || !videoPlayer) return;
    
    videoPlayer.style.display = 'block';
    if (typeof iframePlayer !== 'undefined' && iframePlayer) iframePlayer.style.display = 'none';
    
    if (currentChannel) {
        videoPlayer.title = currentChannel.name;
    }
    
    videoPlayer.preload = 'auto';
    videoPlayer.playsInline = true;
    setupVideoControls();
    
    if (typeof Hls === 'undefined') {
        console.warn('HLS.js yüklenemedi');
        if (typeof loadingPlayer !== 'undefined' && loadingPlayer) loadingPlayer.classList.remove('active');
        return;
    }
    
    if (Hls.isSupported()) {
        if (window.hlsInstance) {
            try { window.hlsInstance.destroy(); } catch (e) { console.warn('HLS instance temizleme hatası:', e); }
        }
        
        if (videoPlayer.hls) {
            try { videoPlayer.hls.destroy(); } catch (e) { console.warn('Player HLS temizleme hatası:', e); }
            videoPlayer.hls = null;
        }
        
        const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            debug: false,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            maxBufferSize: 30 * 1000 * 1000,
            startLevel: 0,
            capLevelToPlayerSize: false,
            startFragPrefetch: true,
            testBandwidth: false,
            progressive: false,
            xhrSetup: function(xhr) {
                xhr.withCredentials = false;
                xhr.timeout = 10000;
            }
        });
        
        window.hlsInstance = hls;
        videoPlayer.hls = hls;
        
        videoPlayer.src = '';
        videoPlayer.load();
        
        hls.loadSource(url);
        hls.attachMedia(videoPlayer);
        
        let manifestParsed = false;
        let timeout;
        let firstFragmentLoaded = false;
        
        hls.on(Hls.Events.FRAG_LOADED, () => {
            if (!firstFragmentLoaded && typeof loadingPlayer !== 'undefined' && loadingPlayer?.classList.contains('active')) {
                firstFragmentLoaded = true;
                loadingPlayer.classList.remove('active');
                if (typeof videoPlaceholderPlayer !== 'undefined' && videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'none';
            }
        });
        
        hls.on(Hls.Events.LEVEL_LOADED, () => {
            if (typeof loadingPlayer !== 'undefined' && loadingPlayer?.classList.contains('active')) {
                loadingPlayer.classList.remove('active');
                if (typeof videoPlaceholderPlayer !== 'undefined' && videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'none';
            }
        });
        
        const canPlayHandler = () => {
            if (typeof loadingPlayer !== 'undefined' && loadingPlayer?.classList.contains('active')) {
                loadingPlayer.classList.remove('active');
                if (typeof videoPlaceholderPlayer !== 'undefined' && videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'none';
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
            if (typeof loadingPlayer !== 'undefined' && loadingPlayer) loadingPlayer.classList.remove('active');
            if (typeof videoPlaceholderPlayer !== 'undefined' && videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'none';
            
            setupVideoControls();
            
            videoPlayer.play().catch(err => {
                console.error('Playback error:', err);
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
                            console.warn('Ağ hatası');
                        } catch(e) {
                            if (typeof loadingPlayer !== 'undefined' && loadingPlayer) loadingPlayer.classList.remove('active');
                            try { hls.destroy(); } catch (err) {}
                        }
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        try {
                            hls.recoverMediaError();
                        } catch(e) {
                            if (typeof loadingPlayer !== 'undefined' && loadingPlayer) loadingPlayer.classList.remove('active');
                            try { hls.destroy(); } catch (err) {}
                            console.warn('Video çözümlenemedi');
                        }
                        break;
                    default:
                        if (timeout) {
                            clearTimeout(timeout);
                            activeTimeouts = activeTimeouts.filter(t => t !== timeout);
                        }
                        if (typeof loadingPlayer !== 'undefined' && loadingPlayer) loadingPlayer.classList.remove('active');
                        try { hls.destroy(); } catch (err) {}
                        console.warn('Kanal yüklenemedi');
                        break;
                }
            }
        });
        
        timeout = safeSetTimeout(() => {
            if (!manifestParsed) {
                if (typeof loadingPlayer !== 'undefined' && loadingPlayer) loadingPlayer.classList.remove('active');
                try { hls.destroy(); } catch (err) {}
                console.warn('Kanal yükleme zaman aşımı');
            }
        }, 10000);
        
    } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        // Yerel Apple Safari HLS Katmanı
        setupVideoControls();
        videoPlayer.src = url;
        
        const canPlayHandler = () => {
            if (typeof loadingPlayer !== 'undefined' && loadingPlayer) loadingPlayer.classList.remove('active');
            if (typeof videoPlaceholderPlayer !== 'undefined' && videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'none';
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
                if (typeof loadingPlayer !== 'undefined' && loadingPlayer) loadingPlayer.classList.remove('active');
                if (typeof videoPlaceholderPlayer !== 'undefined' && videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'none';
            }).catch(err => {
                console.error('Playback error:', err);
                if (typeof loadingPlayer !== 'undefined' && loadingPlayer) loadingPlayer.classList.remove('active');
                console.warn('Video oynatılamadı');
            });
        }
        
        const safariTimeout = safeSetTimeout(() => {
            if (videoPlayer.readyState === 0) {
                if (typeof loadingPlayer !== 'undefined' && loadingPlayer) loadingPlayer.classList.remove('active');
                console.warn('Kanal yükleme zaman aşımı');
            }
        }, 10000);
        
        const loadedDataHandler = () => {
            if (safariTimeout) {
                clearTimeout(safariTimeout);
                activeTimeouts = activeTimeouts.filter(t => t !== safariTimeout);
            }
            videoPlayer.removeEventListener('loadeddata', loadedDataHandler);
        };
        videoPlayer.addEventListener('loadeddata', loadedDataHandler, { once: true });
    } else {
        if (typeof loadingPlayer !== 'undefined' && loadingPlayer) loadingPlayer.classList.remove('active');
        console.warn('Tarayıcı bu video formatını desteklemiyor');
    }
}

// YouTube Link Dönüştürücü Sabiti
function convertYouTubeToEmbed(url) {
    let videoId = '';
    
    if (url.includes('youtube.com/watch?v=')) {
        const match = url.match(/[?&]v=([^&]+)/);
        if (match) videoId = match[1];
    } else if (url.includes('youtu.be/')) {
        const match = url.match(/youtu\.be\/([^?&]+)/);
        if (match) videoId = match[1];
    } else if (url.includes('youtube.com/embed/')) {
        return url;
    }
    
    if (videoId) {
        videoId = videoId.split('&')[0].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&playsinline=1&enablejsapi=1`;
    }
    
    return url;
}

// Iframe Üzerinden Medya Oynatımı (Dış Kaynaklar ve YouTube)
function playIframe(url) {
    if (typeof videoPlayer === 'undefined' || typeof iframePlayer === 'undefined') return;
    videoPlayer.style.display = 'none';
    iframePlayer.style.display = 'block';
    iframePlayer.src = url;
    
    if (currentChannel) {
        iframePlayer.title = currentChannel.name;
    }
    
    if (!url.includes('youtube.com')) {
        iframePlayer.onload = () => {
            if (typeof loadingPlayer !== 'undefined' && loadingPlayer) loadingPlayer.classList.remove('active');
            if (typeof videoPlaceholderPlayer !== 'undefined' && videoPlaceholderPlayer) videoPlaceholderPlayer.style.display = 'none';
        };
    }
}

// Mobil Cihazlar İçin Çift Tıklama Tam Ekran Modu
function setupDoubleTapFullscreen(element) {
    if (!element) return;
    
    let lastTap = 0;
    let tapTimeout = null;
    let touchStartX = 0;
    let touchStartY = 0;
    
    const touchStartHandler = function(e) {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    };
    
    const touchEndHandler = function(e) {
        if (e.changedTouches.length !== 1) return;
        
        const touch = e.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - touchStartX);
        const deltaY = Math.abs(touch.clientY - touchStartY);
        
        if (deltaX > 10 || deltaY > 10) {
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
            e.preventDefault();
            e.stopPropagation();
            toggleFullscreen();
            lastTap = 0;
        } else {
            tapTimeout = safeSetTimeout(() => { tapTimeout = null; }, 400);
        }
        
        lastTap = currentTime;
    };
    
    element.addEventListener('touchstart', touchStartHandler, { passive: true });
    element.addEventListener('touchend', touchEndHandler, { passive: false });
}

// Tam Ekran Aç / Kapat Yönetimi
function toggleFullscreen() {
    if (typeof videoContainerPlayer === 'undefined' || !videoContainerPlayer) return;
    const container = videoContainerPlayer;
    
    try {
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && 
            !document.msFullscreenElement) {
            if (container.requestFullscreen) container.requestFullscreen();
            else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
            else if (container.mozRequestFullScreen) container.mozRequestFullScreen();
            else if (container.msRequestFullscreen) container.msRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        }
    } catch (error) {
        console.error('Tam ekran hatası:', error);
        showError('Tam ekran modu açılamadı.');
    }
}

// Favorilere Ekle / Çıkar Fonksiyonu
function toggleFavorite(channelId) {
    const index = favoriteChannels.indexOf(channelId);
    if (index > -1) {
        favoriteChannels.splice(index, 1);
    } else {
        favoriteChannels.push(channelId);
    }
    localStorage.setItem('favoriteChannels', JSON.stringify(favoriteChannels));
}

// Hata Mesajı Bildirim Kutusu (Toast UI)
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--danger, #ff4d4d);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        z-index: 10000;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        font-size: 0.9375rem;
        max-width: 400px;
        pointer-events: none;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    const timeoutDuration = message.includes('zaman aşımı') ? 2000 : 5000;
    
    safeSetTimeout(() => {
        errorDiv.style.opacity = '0';
        errorDiv.style.transition = 'opacity 0.3s ease';
        safeSetTimeout(() => { errorDiv.remove(); }, 300);
    }, timeoutDuration);
}

// --- GÜVENLİK VE BELLEK YÖNETİMİ YARDIMCI FONKSİYONLARI ---

// Güvenli setTimeout Sarmalayıcısı
function safeSetTimeout(callback, delay) {
    const timeoutId = setTimeout(() => {
        if (typeof activeTimeouts !== 'undefined') {
            window.activeTimeouts = window.activeTimeouts.filter(t => t !== timeoutId);
        }
        callback();
    }, delay);
    if (typeof activeTimeouts !== 'undefined') window.activeTimeouts.push(timeoutId);
    return timeoutId;
}

// Oynatıcı Bellek Temizliği (Kanal Geçişlerinde Şişmeyi Engeller)
function cleanup() {
    if (typeof activeTimeouts !== 'undefined' && window.activeTimeouts.length > 0) {
        window.activeTimeouts.forEach(t => clearTimeout(t));
        window.activeTimeouts = [];
    }
    
    if (window.hlsInstance) {
        try { window.hlsInstance.destroy(); } catch (e) {}
        window.hlsInstance = null;
    }
    
    if (typeof videoPlayer !== 'undefined' && videoPlayer) {
        if (videoPlayer.hls) {
            try { videoPlayer.hls.destroy(); } catch(e) {}
            videoPlayer.hls = null;
        }
        videoPlayer.pause();
        videoPlayer.removeAttribute('src');
        try { videoPlayer.load(); } catch(e) {}
    }
    
    if (typeof iframePlayer !== 'undefined' && iframePlayer) {
        iframePlayer.src = 'about:blank';
    }
}

// HTML5 Video Yerel Kontrol Yapılandırması
function setupVideoControls() {
    if (typeof videoPlayer === 'undefined' || !videoPlayer) return;
    videoPlayer.controls = true;
    videoPlayer.setAttribute('controlslist', 'nodownload');
}

// Türkçe Karakter Duyarlı Kategori Normalizasyonu
function normalizeCategory(category) {
    if (!category) return 'diğer';
    return category
        .trim()
        .replace(/İ/g, 'i')
        .replace(/I/g, 'ı')
        .toLowerCase();
}
// ============================================================================
// PLUS TV - GÜVENLİ MEDYA KÖPRÜSÜ MOTORU ( player.js ENTEGRASYONU )
// ============================================================================
(function() {
    // Sayfa yüklenince elementleri yakala ve hazırla
    window.addEventListener('DOMContentLoaded', () => {
        const fakeIframe = document.getElementById('iframePlayer') || document.querySelector('iframe');
        const videoContainer = document.getElementById('videoContainerPlayer') || document.querySelector('.video-container-player') || document.querySelector('.player-main');
        
        if (!fakeIframe || !videoContainer) {
            console.error("PlusTV Köprüsü: Gerekli HTML elementleri bulunamadı. Orijinal HTML yapısını kontrol edin.");
            return;
        }

        // 1. HTML Oynatıcı Elementlerini Dinamik Oluştur (HTML'i bozmamak için)
        let normalVideoPlayer = document.getElementById('videoPlayer');
        if (!normalVideoPlayer) {
            normalVideoPlayer = document.createElement('video');
            normalVideoPlayer.id = 'videoPlayer';
            normalVideoPlayer.className = 'video-player';
            normalVideoPlayer.autoplay = true;
            normalVideoPlayer.controls = false; // Orijinal alt bar butonları için kapalı
            normalVideoPlayer.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; object-fit:fill; z-index:2; display:none; background:#000;";
            fakeIframe.parentNode.insertBefore(normalVideoPlayer, fakeIframe);
        }

        let realYtDiv = document.getElementById('ytActualPlayer');
        if (!realYtDiv) {
            realYtDiv = document.createElement('div');
            realYtDiv.id = 'ytActualPlayer';
            realYtDiv.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; z-index:2; display:none; background:#000;";
            fakeIframe.parentNode.insertBefore(realYtDiv, fakeIframe);
        }

        let loadingOverlay = document.getElementById('loadingPlayer');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loadingPlayer';
            loadingOverlay.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:none; flex-direction:column; align-items:center; justify-content:center; z-index:99; color:#fff; font-family:sans-serif;";
            loadingOverlay.innerHTML = '<div style="width:40px; height:40px; border:4px solid rgba(255,255,255,0.1); border-left-color:#007bff; border-radius:50%; animation: spin 1s linear infinite; margin-bottom:10px;"></div><p>Yükleniyor...</p>';
            
            // Spinner animasyonu ekle
            if (!document.getElementById('plusTvSpinnerStyle')) {
                const style = document.createElement('style');
                style.id = 'plusTvSpinnerStyle';
                style.innerHTML = "@keyframes spin { to { transform: rotate(360deg); } }";
                document.head.appendChild(style);
            }
            fakeIframe.parentNode.insertBefore(loadingOverlay, fakeIframe);
        }

        const placeholderPlayer = document.getElementById('videoPlaceholderPlayer');

        let ytPlayerInstance = null;
        let hlsInstance = null;

        // YouTube ID Ayıklayıcı
        function extractYouTubeId(url) {
            if (!url) return null;
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        }

        // M3U8 Akış Oynatıcı (SSL Hatası Çözümlü)
        function playM3u8Stream(url) {
            // Görseldeki ERR_CERT_COMMON_NAME_INVALID hatasını engellemek için HTTP'ye köprüle
            if (url.startsWith('https://0e770a63.ucomist.net')) {
                url = url.replace('https://', 'http://');
            } else if (url.includes('ucomist.net') && !url.startsWith('http://')) {
                url = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
            }

            if (placeholderPlayer) placeholderPlayer.style.opacity = '0';
            loadingOverlay.style.display = 'flex';

            if (hlsInstance) { 
                try { hlsInstance.destroy(); } catch(e) {} 
            }

            if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                hlsInstance = new Hls({
                    maxBufferLength: 10,
                    maxMaxBufferLength: 20,
                    xhrSetup: function (xhr) { xhr.withCredentials = false; }
                });
                
                hlsInstance.loadSource(url);
                hlsInstance.attachMedia(normalVideoPlayer);
                
                hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
                    loadingOverlay.style.display = 'none';
                    normalVideoPlayer.play().catch(e => console.log("Otomatik oynatma engellendi:", e));
                });

                hlsInstance.on(Hls.Events.ERROR, function (event, data) {
                    if (data.fatal) {
                        loadingOverlay.style.display = 'none';
                        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                            hlsInstance.startLoad();
                        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                            hlsInstance.recoverMediaError();
                        } else {
                            normalVideoPlayer.src = url;
                        }
                    }
                });
            } else if (normalVideoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                normalVideoPlayer.src = url;
                normalVideoPlayer.addEventListener('loadedmetadata', function () {
                    loadingOverlay.style.display = 'none';
                    normalVideoPlayer.play().catch(e => console.log(e));
                }, { once: true });
            }
        }

        // YouTube Oynatıcı Motoru
        function playWithYouTubeAPI(videoId) {
            if (placeholderPlayer) placeholderPlayer.style.opacity = '0';
            loadingOverlay.style.display = 'none';
            
            if (ytPlayerInstance && typeof ytPlayerInstance.loadVideoById === 'function') {
                ytPlayerInstance.loadVideoById({ videoId: videoId, startSeconds: 0 });
                setTimeout(() => {
                    try { ytPlayerInstance.playVideo(); } catch(e) {}
                }, 300);
            } else if (typeof YT !== 'undefined' && YT.Player) {
                ytPlayerInstance = new YT.Player('ytActualPlayer', {
                    height: '100%', width: '100%', videoId: videoId,
                    playerVars: { 'autoplay': 1, 'playsinline': 1, 'controls': 1, 'rel': 0, 'mute': 1 },
                    events: {
                        'onReady': function(event) {
                            event.target.playVideo();
                            setTimeout(() => {
                                try { event.target.unMute(); event.target.setVolume(100); } catch(e) {}
                            }, 500);
                        },
                        'onStateChange': function(event) {
                            if (event.data === YT.PlayerState.ENDED) {
                                if (typeof changeChannel === 'function') changeChannel(1);
                            }
                        }
                    }
                });
            }
        }

        // 2. Element İzleme Köprüsü (MutationObserver)
        const bridgeObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === "attributes" && mutation.attributeName === "src") {
                    const interceptedUrl = fakeIframe.getAttribute('src');
                    if (!interceptedUrl || interceptedUrl === 'about:blank') return;

                    const ytId = extractYouTubeId(interceptedUrl);
                    
                    if (ytId) {
                        // YouTube Modu Aktif
                        normalVideoPlayer.pause();
                        normalVideoPlayer.style.display = 'none';
                        fakeIframe.style.cssText += "display:none !important; opacity:0 !important; pointer-events:none !important;";
                        
                        bridgeObserver.disconnect();
                        fakeIframe.setAttribute('src', 'about:blank');
                        bridgeObserver.observe(fakeIframe, { attributes: true });

                        realYtDiv.style.display = 'block';
                        playWithYouTubeAPI(ytId);
                    } else if (interceptedUrl.includes('.m3u8') || interceptedUrl.startsWith('http')) {
                        // HLS (.m3u8) Modu Aktif
                        if (ytPlayerInstance && typeof ytPlayerInstance.pauseVideo === 'function') {
                            try { ytPlayerInstance.pauseVideo(); } catch(e) {}
                        }
                        realYtDiv.style.display = 'none';
                        fakeIframe.style.cssText += "display:none !important; opacity:0 !important; pointer-events:none !important;";
                        
                        bridgeObserver.disconnect();
                        fakeIframe.setAttribute('src', 'about:blank');
                        bridgeObserver.observe(fakeIframe, { attributes: true });

                        normalVideoPlayer.style.display = 'block';
                        playM3u8Stream(interceptedUrl);
                    }
                }
            });
        });

        // İzleyiciyi başlat
        bridgeObserver.observe(fakeIframe, { attributes: true });

        // Normal yayın biterse sonraki kanala geç
        normalVideoPlayer.addEventListener('ended', function() {
            if (typeof changeChannel === 'function') changeChannel(1);
        });
    });
})();
