// content-loader.js - Безопасный загрузчик динамического content script
(async function() {
    try {
        console.log('🔄 Content loader инициализирован');
        
        // Ждем загрузки страницы
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                window.addEventListener('load', resolve);
            });
        }
        
        // Небольшая задержка для стабильности
        setTimeout(async () => {
            try {
                const response = await chrome.runtime.sendMessage({ action: 'getLatestCode' });
                
                if (response && response.content) {
                    console.log('📥 Загружаем динамический content script версии:', response.version);
                    
                    // БЕЗОПАСНЫЙ СПОСОБ: создаем script element
                    const script = document.createElement('script');
                    script.textContent = response.content;
                    
                    // Добавляем в head временно
                    (document.head || document.documentElement).appendChild(script);
                    
                    // Удаляем после выполнения
                    setTimeout(() => {
                        if (script.parentNode) {
                            script.parentNode.removeChild(script);
                        }
                    }, 100);
                    
                    console.log('✅ Динамический content script загружен');
                } else {
                    console.log('⚠️ Динамический content script недоступен, используем заглушку');
                    loadBasicContentScript();
                }
            } catch (error) {
                console.error('❌ Ошибка загрузки динамического content script:', error);
                loadBasicContentScript();
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Ошибка content-loader:', error);
    }
})();

function loadBasicContentScript() {
    console.log('📱 Загружаем базовый content script');
    
    // Заглушка - минимальная функциональность
    let basicInspectorActive = false;
    
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'toggle_inspector') {
            basicInspectorActive = !basicInspectorActive;
            console.log('🔧 Базовый инспектор:', basicInspectorActive ? 'включен' : 'выключен');
            sendResponse({ active: basicInspectorActive });
        } else if (message.action === 'get_status') {
            sendResponse({ active: basicInspectorActive });
        }
        return true;
    });
}
