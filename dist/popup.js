// popup.js - с поддержкой динамических обновлений
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
                console.log('Content script не загружен');
                updateButton(false);
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
document.addEventListener('DOMContentLoaded', () => {
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

    // Проверка состояния при открытии popup
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        if (!tabs[0]) return;
        chrome.tabs.sendMessage(tabs[0].id, {action: 'get_status'}, response => {
            if (!chrome.runtime.lastError && response) {
                updateButton(response.active);
            } else {
                updateButton(false);
            }
        });
    });
});
