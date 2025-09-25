// background.js - Динамическая загрузка с безопасной инъекцией
let cachedCode = {
    content: null,
    popup: null,
    styles: null,
    lastUpdated: null,
    version: null
};

const CONFIG_URL = 'https://yarfrolov.github.io/boris-cats-energy-extension/extension/config.json';
const CODE_BASE_URL = 'https://yarfrolov.github.io/boris-cats-energy-extension/extension/';

// Проверка обновлений каждые 30 минут
setInterval(checkForUpdates, 30 * 60 * 1000);

async function checkForUpdates() {
    try {
        console.log('🔍 Проверяем обновления с GitHub Pages...');
        
        const response = await fetch(CONFIG_URL + '?t=' + Date.now());
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const config = await response.json();
        
        if (!cachedCode.lastUpdated || 
            new Date(config.lastUpdated) > new Date(cachedCode.lastUpdated)) {
            
            console.log('🆕 Найдены обновления! Версия:', config.version);
            await loadLatestCode(config);
            
            chrome.action.setBadgeText({text: 'NEW'});
            chrome.action.setBadgeBackgroundColor({color: '#FF3B30'});
            
            setTimeout(() => {
                chrome.action.setBadgeText({text: ''});
            }, 10000);
        } else {
            console.log('✅ Код актуален. Версия:', cachedCode.version);
        }
    } catch (error) {
        console.error('❌ Ошибка при проверке обновлений:', error);
        if (!cachedCode.content) {
            await loadFallbackCode();
        }
    }
}

async function loadLatestCode(config) {
    try {
        console.log('⬇️ Загружаем код с GitHub Pages...');
        
        const promises = [
            fetch(CODE_BASE_URL + config.files.content).then(r => r.text()),
            fetch(CODE_BASE_URL + config.files.popup).then(r => r.text()),
            fetch(CODE_BASE_URL + config.files.styles).then(r => r.text())
        ];

        const [contentCode, popupCode, stylesCode] = await Promise.all(promises);

        cachedCode = {
            content: contentCode,
            popup: popupCode,
            styles: stylesCode,
            lastUpdated: config.lastUpdated,
            version: config.version,
            features: config.features || {}
        };

        await chrome.storage.local.set({ cachedCode });
        console.log('✅ Код обновлен до версии:', config.version);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки кода:', error);
        throw error;
    }
}

async function loadFallbackCode() {
    try {
        const result = await chrome.storage.local.get(['cachedCode']);
        if (result.cachedCode) {
            cachedCode = result.cachedCode;
            console.log('📱 Используем кэшированный код версии:', cachedCode.version);
        } else {
            console.log('⚠️ Кэшированный код не найден');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки резервного кода:', error);
    }
}

// НОВАЯ ФУНКЦИЯ: безопасная инъекция content script
async function injectContentScript(tabId) {
    try {
        if (cachedCode.content) {
            console.log('💉 Инжектируем динамический content script в таб:', tabId);
            
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: (contentCode) => {
                    // Создаем script элемент
                    const script = document.createElement('script');
                    script.textContent = contentCode;
                    (document.head || document.documentElement).appendChild(script);
                    
                    // Удаляем после выполнения
                    setTimeout(() => {
                        if (script.parentNode) {
                            script.parentNode.removeChild(script);
                        }
                    }, 100);
                },
                args: [cachedCode.content]
            });
            
            console.log('✅ Content script инжектирован');
        }
    } catch (error) {
        console.error('❌ Ошибка инъекции content script:', error);
    }
}

// Инициализация
chrome.runtime.onStartup.addListener(async () => {
    await loadFallbackCode();
    checkForUpdates();
});

chrome.runtime.onInstalled.addListener(async (details) => {
    await loadFallbackCode();
    checkForUpdates();
    
    if (details.reason === 'install') {
        console.log('🎉 Расширение установлено!');
        chrome.tabs.create({ 
            url: 'https://yarfrolov.github.io/boris-cats-energy-extension/extension/welcome.html' 
        });
    }
});

// Обработка сообщений
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getLatestCode') {
        console.log('📤 Отправляем код версии:', cachedCode.version || 'local');
        sendResponse(cachedCode);
    } else if (message.action === 'forceUpdate') {
        console.log('🔄 Принудительное обновление...');
        checkForUpdates().then(() => {
            sendResponse({success: true, version: cachedCode.version});
        }).catch(() => {
            sendResponse({success: false});
        });
        return true;
    } else if (message.action === 'getVersion') {
        sendResponse({version: cachedCode.version || '1.0.0'});
    } else if (message.action === 'injectContentScript') {
        // НОВОЕ: безопасная инъекция
        if (message.tabId) {
            injectContentScript(message.tabId);
        }
        sendResponse({success: true});
    }
    return true;
});
