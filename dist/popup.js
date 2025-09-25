// popup.js - Простой popup
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
                return;
            }
            if (response) {
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

function showUpdateInfo() {
    const btn = document.getElementById('update-btn');
    if (btn) {
        btn.textContent = '✅ Актуально v1.0.0';
        btn.disabled = true;
    }
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
    if (updateBtn) updateBtn.addEventListener('click', showUpdateInfo);

    // Проверка состояния при открытии popup
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        if (!tabs[0]) return;
        chrome.tabs.sendMessage(tabs[0].id, {action: 'get_status'}, response => {
            if (!chrome.runtime.lastError && response) {
                updateButton(response.active);
            }
        });
    });
});
