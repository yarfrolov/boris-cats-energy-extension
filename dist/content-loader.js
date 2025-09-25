// content-loader.js - Загрузчик динамического content script
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
                    
                    // Выполняем динамический код
                    eval(response.content);
                    
                    console.log('✅ Динамический content script загружен');
                } else {
                    console.log('⚠️ Динамический content script недоступен, используем заглушку');
                    // Базовая функциональность
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
