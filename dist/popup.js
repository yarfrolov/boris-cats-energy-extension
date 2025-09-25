// popup.js - Загрузчик динамического UI (безопасный)
let isInitialized = false;

async function initializeDynamicPopup() {
    if (isInitialized) return;
    
    try {
        console.log('🚀 Инициализируем динамический popup...');
        showLoadingIndicator();
        
        const response = await chrome.runtime.sendMessage({ action: 'getLatestCode' });
        
        if (response && response.popup) {
            console.log('📥 Загружаем динамический код версии:', response.version);
            
            // Загружаем стили
            if (response.styles) {
                const style = document.createElement('style');
                style.textContent = response.styles;
                document.head.appendChild(style);
            }
            
            // БЕЗОПАСНЫЙ СПОСОБ: создаем script element
            const script = document.createElement('script');
            script.textContent = `
                (function() {
                    ${response.popup}
                    
                    if (typeof initializeUpdatedPopup === 'function') {
                        initializeUpdatedPopup(${JSON.stringify(response.features || {})});
                    }
                })();
            `;
            document.head.appendChild(script);
            
            if (response.version) {
                showVersionInfo(response.version);
            }
            
        } else {
            console.log('⚠️ Динамический код недоступен, используем локальный');
            initializeLocalPopup();
        }
        
        hideLoadingIndicator();
        isInitialized = true;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        hideLoadingIndicator();
        initializeLocalPopup();
        isInitialized = true;
    }
}

function showLoadingIndicator() {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.style.display = 'block';
}

function hideLoadingIndicator() {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.style.display = 'none';
}

function showVersionInfo(version) {
    const footer = document.querySelector('.footer');
    if (footer && version) {
        const versionSpan = document.createElement('span');
        versionSpan.textContent = ` v${version}`;
        versionSpan.style.color = '#86868B';
        versionSpan.style.fontSize = '10px';
        footer.appendChild(versionSpan);
    }
}

function initializeLocalPopup() {
    console.log('📱 Инициализируем локальную версию');
    
    function updateButton(isActive) {
        const btn = document.getElementById('toggle-btn');
        if (!btn) return;
        
        if (isActive) {
            btn.textContent = '⏹️ Выключить';
            btn.style.background = '#FF3B30';
        } else {
            btn.textContent = '🔗 Активировать';  
            btn.style.background = '#007AFF';
        }
    }

    function toggleInspector() {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            if (!tabs[0]) return;
            
            chrome.tabs.sendMessage(tabs[0].id, {action: 'toggle_inspector'}, response => {
                if (chrome.runtime.lastError) {
                    // Инжектируем dynamic script через background
                    chrome.runtime.sendMessage({ action: 'injectContentScript', tabId: tabs[0].id });
                    updateButton(true);
                } else if (response) {
                    updateButton(response.active);
                }
            });
        });
    }

    function openGlossary() {
        chrome.tabs.create({ 
            url: 'https://developer.mozilla.org/ru/docs/Web/CSS',
            active: true
        });
    }
    
    function forceUpdate() {
        const btn = document.getElementById('update-btn');
        if (btn) {
            btn.textContent = '⏳ Обновляем...';
            btn.disabled = true;
        }
        
        chrome.runtime.sendMessage({ action: 'forceUpdate' }, (response) => {
            if (btn) {
                btn.disabled = false;
                if (response && response.success) {
                    btn.textContent = '✅ Обновлено!';
                    setTimeout(() => btn.textContent = '🔄 Проверить обновления', 2000);
                } else {
                    btn.textContent = '❌ Ошибка';
                    setTimeout(() => btn.textContent = '🔄 Проверить обновления', 2000);
                }
            }
        });
    }

    // События
    const toggleBtn = document.getElementById('toggle-btn');
    const glossaryLink = document.getElementById('glossary-link');
    const updateBtn = document.getElementById('update-btn');
    
    if (toggleBtn) toggleBtn.addEventListener('click', toggleInspector);
    if (glossaryLink) {
        glossaryLink.addEventListener('click', (e) => {
            e.preventDefault();
            openGlossary();
        });
    }
    if (updateBtn) updateBtn.addEventListener('click', forceUpdate);

    // Проверка состояния
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        if (!tabs[0]) return;
        chrome.tabs.sendMessage(tabs[0].id, {action: 'get_status'}, response => {
            if (!chrome.runtime.lastError && response) {
                updateButton(response.active);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', initializeDynamicPopup);
