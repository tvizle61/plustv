const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// GitHub repository bilgileri
const REPO_OWNER = 'iptv-org';
const REPO_NAME = 'iptv';
const STREAMS_PATH = 'streams';
const BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${STREAMS_PATH}`;
const RAW_BASE_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/master/${STREAMS_PATH}`;

// TV klasörü oluştur
const TV_DIR = path.join(__dirname, 'tv');
if (!fs.existsSync(TV_DIR)) {
    fs.mkdirSync(TV_DIR, { recursive: true });
    console.log('✅ tv klasörü oluşturuldu');
}

// GitHub API'den dosya listesini çek
function fetchFileList(url, allFiles = []) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/vnd.github.v3+json'
            }
        }, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const files = JSON.parse(data);
                        
                        // Eğer pagination varsa (100'den fazla dosya)
                        const linkHeader = res.headers.link;
                        if (linkHeader && linkHeader.includes('rel="next"')) {
                            const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
                            if (nextMatch) {
                                // Sonraki sayfayı da çek
                                fetchFileList(nextMatch[1], [...allFiles, ...files])
                                    .then(resolve)
                                    .catch(reject);
                                return;
                            }
                        }
                        
                        resolve([...allFiles, ...files]);
                    } catch (error) {
                        reject(new Error(`JSON parse hatası: ${error.message}`));
                    }
                } else if (res.statusCode === 301 || res.statusCode === 302) {
                    // Redirect takip et
                    const location = res.headers.location;
                    if (location) {
                        fetchFileList(location, allFiles)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: Redirect location bulunamadı`));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Dosya indir
function downloadFile(fileName) {
    return new Promise((resolve, reject) => {
        const fileUrl = `${RAW_BASE_URL}/${fileName}`;
        const filePath = path.join(TV_DIR, fileName);
        
        console.log(`📥 İndiriliyor: ${fileName}`);
        
        https.get(fileUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        }, (res) => {
            if (res.statusCode === 200) {
                const fileStream = fs.createWriteStream(filePath);
                res.pipe(fileStream);
                
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`✅ İndirildi: ${fileName}`);
                    resolve();
                });
            } else if (res.statusCode === 301 || res.statusCode === 302) {
                // Redirect takip et
                const location = res.headers.location;
                if (location) {
                    const protocol = location.startsWith('https') ? https : http;
                    protocol.get(location, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0'
                        }
                    }, (res2) => {
                        if (res2.statusCode === 200) {
                            const fileStream = fs.createWriteStream(filePath);
                            res2.pipe(fileStream);
                            
                            fileStream.on('finish', () => {
                                fileStream.close();
                                console.log(`✅ İndirildi: ${fileName}`);
                                resolve();
                            });
                        } else {
                            reject(new Error(`${fileName} indirilemedi: HTTP ${res2.statusCode}`));
                        }
                    }).on('error', reject);
                } else {
                    reject(new Error(`${fileName} indirilemedi: HTTP ${res.statusCode}`));
                }
            } else {
                reject(new Error(`${fileName} indirilemedi: HTTP ${res.statusCode}`));
            }
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Ana fonksiyon
async function main() {
    try {
        console.log('🔍 GitHub\'dan dosya listesi alınıyor...');
        const files = await fetchFileList(BASE_URL);
        
        // Sadece .m3u uzantılı dosyaları filtrele
        const m3uFiles = files.filter(file => 
            file.type === 'file' && 
            file.name.toLowerCase().endsWith('.m3u')
        );
        
        console.log(`\n📋 Toplam ${m3uFiles.length} adet .m3u dosyası bulundu:\n`);
        m3uFiles.forEach((file, index) => {
            console.log(`${index + 1}. ${file.name}`);
        });
        
        console.log(`\n📥 ${m3uFiles.length} dosya indiriliyor...\n`);
        
        // Tüm dosyaları sırayla indir
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < m3uFiles.length; i++) {
            try {
                await downloadFile(m3uFiles[i].name);
                successCount++;
                
                // Rate limiting için kısa bir bekleme
                if (i < m3uFiles.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                console.error(`❌ Hata: ${m3uFiles[i].name} - ${error.message}`);
                failCount++;
            }
        }
        
        console.log(`\n✨ İşlem tamamlandı!`);
        console.log(`✅ Başarılı: ${successCount}`);
        console.log(`❌ Başarısız: ${failCount}`);
        console.log(`📁 Dosyalar ${TV_DIR} klasörüne kaydedildi.`);
        
    } catch (error) {
        console.error('❌ Hata:', error.message);
        process.exit(1);
    }
}

// Scripti çalıştır
main();

