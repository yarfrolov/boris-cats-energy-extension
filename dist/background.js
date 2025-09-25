// background.js - с расширенной отладкой
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
        console.log('📋 Конфиг с GitHub:', config);
        
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
    }
}

async function loadLatestCode(config) {
    try {
        console.log('⬇️ Загружаем код с GitHub Pages...');
        
        const contentResponse = await fetch(CODE_BASE_URL + config.files.content);
        const contentCode = await contentResponse.text();
        
        console.log('📥 Загружен content script, размер:', contentCode.length, 'символов');
        
        // ОТЛАДКА: проверяем, есть ли символ в коде
        if (contentCode.includes('Пункт')) {
            console.log('✅ Символ "Пункт" найден в коде!');
        } else {
            console.log('❌ Символ "Пункт" НЕ найден в коде!');
        }

        cachedCode = {
            content: contentCode,
            popup: null,
            styles: null,
            lastUpdated: config.lastUpdated,
            version: config.version,
            features: config.features || {}
        };

        await chrome.storage.local.set({ cachedCode });
        console.log('✅ Код обновлен до версии:', config.version);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки кода:', error);
    }
}

async function loadFallbackCode() {
    try {
        const result = await chrome.storage.local.get(['cachedCode']);
        if (result.cachedCode) {
            cachedCode = result.cachedCode;
            console.log('📱 Используем кэшированный код версии:', cachedCode.version);
            
            // ОТЛАДКА: проверяем кэшированный код
            if (cachedCode.content && cachedCode.content.includes('Пункт')) {
                console.log('✅ Символ "Пункт" найден в кэшированном коде!');
            } else {
                console.log('❌ Символ "Пункт" НЕ найден в кэшированном коде!');
            }
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки резервного кода:', error);
    }
}

// Безопасная инъекция content script
async function injectContentScript(tabId) {
    try {
        if (cachedCode.content) {
            console.log('💉 Инжектируем динамический content script в таб:', tabId);
            console.log('📦 Размер кода:', cachedCode.content.length, 'символов');
            
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: (contentCode, version) => {
                    console.log('🔧 Выполняем динамический код версии:', version);
                    
                    // Устанавливаем версию для отладки
                    window.__inspectorVersion = version;
                    
                    // ОТЛАДКА: проверяем код перед выполнением
                    if (contentCode.includes('Пункт')) {
                        console.log('✅ Символ "Пункт" есть в коде для выполнения!');
                    } else {
                        console.log('❌ Символ "Пункт" НЕТ в коде для выполнения!');
                    }
                    
                    // Создаем script элемент
                    const script = document.createElement('script');
                    script.textContent = contentCode;
                    (document.head || document.documentElement).appendChild(script);
                    
                    setTimeout(() => {
                        if (script.parentNode) {
                            script.parentNode.removeChild(script);
                        }
                    }, 100);
                },
                args: [cachedCode.content, cachedCode.version]
            });
            
            console.log('✅ Динамический content script инжектирован');
        } else {
            console.log('⚠️ Нет кэшированного кода для инъекции');
        }
    } catch (error) {
        console.error('❌ Ошибка инъекции content script:', error);
    }
}

// Инициализация
chrome.runtime.onStartup.addListener(async () => {
    console.log('🚀 Background script запущен (onStartup)');
    await loadFallbackCode();
    checkForUpdates();
});

chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('🚀 Background script запущен (onInstalled)');
    await loadFallbackCode();
    checkForUpdates();
    
    if (details.reason === 'install') {
        console.log('🎉 Расширение установлено!');
    }
});

// Обработка сообщений
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Получено сообщение:', message);
    
    if (message.action === 'getLatestCode') {
        console.log('📤 Отправляем код версии:', cachedCode.version || 'local');
        sendResponse(cachedCode);
    } else if (message.action === 'forceUpdate') {
        console.log('🔄 Принудительное обновление...');
        checkForUpdates().then(() => {
            sendResponse({success: true, version: cachedCode.version});
        }).catch((error) => {
            console.error('❌ Ошибка принудительного обновления:', error);
            sendResponse({success: false});
        });
        return true;
    } else if (message.action === 'getVersion') {
        sendResponse({version: cachedCode.version || '1.0.0'});
    } else if (message.action === 'injectContentScript') {
        if (message.tabId) {
            injectContentScript(message.tabId);
        }
        sendResponse({success: true});
    }
    return true;
});

// Запускаем проверку через 3 секунды после старта
setTimeout(() => {
    console.log('🔄 Первоначальная проверка обновлений...');
    checkForUpdates();
}, 3000);
