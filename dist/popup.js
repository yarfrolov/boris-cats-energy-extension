// popup-v1.2.js - Обновленная версия для динамической загрузки
function initializeUpdatedPopup(features) {
    console.log('🆕 Инициализируем обновленный popup с функциями:', features);
    
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
                    console.log('Загружаем динамический content script...');
                    chrome.scripting.executeScript({
                        target: {tabId: tabs[0].id},
                        func: injectDynamicContentScript
                    });
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
        console.log('🔄 Принудительное обновление...');
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

    // Инициализация событий
    const toggleBtn = document.getElementById('toggle-btn');
    const glossaryLink = document.getElementById('glossary-link');
    const updateBtn = document.getElementById('update-btn');
    
    if (toggleBtn) {
        toggleBtn.replaceWith(toggleBtn.cloneNode(true));
        document.getElementById('toggle-btn').addEventListener('click', toggleInspector);
    }
    
    if (glossaryLink) {
        glossaryLink.replaceWith(glossaryLink.cloneNode(true));
        document.getElementById('glossary-link').addEventListener('click', (e) => {
            e.preventDefault();
            openGlossary();
        });
    }
    
    if (updateBtn) {
        updateBtn.replaceWith(updateBtn.cloneNode(true));
        document.getElementById('update-btn').addEventListener('click', forceUpdate);
    }

    // Проверка состояния инспектора
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        if (!tabs[0]) return;
        chrome.tabs.sendMessage(tabs[0].id, {action: 'get_status'}, response => {
            if (!chrome.runtime.lastError && response) {
                updateButton(response.active);
            }
        });
    });
    
    console.log('✅ Обновленный popup инициализирован');
}

async function injectDynamicContentScript() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getLatestCode' });
        if (response && response.content) {
            eval(response.content);
        }
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
}
