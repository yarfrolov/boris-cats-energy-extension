// content-loader.js - Статический загрузчик
console.log('🔄 Content loader инициализирован');

// Только базовая функциональность
let inspectorActive = false;

function createBasicInspector() {
    if (window.__inspectorInitialized) return;
    window.__inspectorInitialized = true;
    
    console.log('🔧 Создаем базовый инспектор');
    
    // Простой overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        height: 400px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.15);
        padding: 20px;
        z-index: 2147483647;
        font-family: -apple-system, sans-serif;
        font-size: 14px;
    `;
    
    overlay.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: #1d1d1f;">Энергия кота Бориса 🐱⚡</h3>
        <div id="inspector-info">
            <p style="color: #86868B;">Наведите курсор на элемент для просмотра информации</p>
        </div>
        <button id="close-inspector" style="
            position: absolute;
            top: 8px;
            right: 8px;
            background: #FF3B30;
            color: white;
            border: none;
            border-radius: 6px;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 12px;
        ">×</button>
    `;
    
    document.body.appendChild(overlay);
    
    // Highlight элемент
    const highlight = document.createElement('div');
    highlight.style.cssText = `
        position: fixed;
        pointer-events: none;
        border: 2px solid #007AFF;
        background: rgba(0, 122, 255, 0.1);
        border-radius: 4px;
        opacity: 0;
        transition: opacity 0.15s ease;
        z-index: 2147483646;
    `;
    document.body.appendChild(highlight);
    
    // События
    const closeBtn = overlay.querySelector('#close-inspector');
    const infoDiv = overlay.querySelector('#inspector-info');
    
    closeBtn.onclick = () => {
        inspectorActive = false;
        overlay.remove();
        highlight.remove();
        window.__inspectorInitialized = false;
    };
    
    // Отслеживание мыши
    document.addEventListener('mousemove', (e) => {
        if (!window.__inspectorInitialized) return;
        
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (!element || overlay.contains(element)) return;
        
        const rect = element.getBoundingClientRect();
        highlight.style.left = rect.left + 'px';
        highlight.style.top = rect.top + 'px';
        highlight.style.width = rect.width + 'px';
        highlight.style.height = rect.height + 'px';
        highlight.style.opacity = '1';
        
        const computedStyle = window.getComputedStyle(element);
        infoDiv.innerHTML = `
            <div><strong>Элемент:</strong> ${element.tagName.toLowerCase()}</div>
            <div><strong>Класс:</strong> ${element.className || 'нет'}</div>
            <div><strong>Размер:</strong> ${Math.round(rect.width)}×${Math.round(rect.height)}px</div>
            <div><strong>Цвет:</strong> ${computedStyle.color}</div>
            <div><strong>Фон:</strong> ${computedStyle.backgroundColor}</div>
            <div><strong>Шрифт:</strong> ${computedStyle.fontSize}</div>
        `;
    });
    
    inspectorActive = true;
}

function removeBasicInspector() {
    const overlay = document.querySelector('[style*="z-index: 2147483647"]');
    const highlight = document.querySelector('[style*="z-index: 2147483646"]');
    if (overlay) overlay.remove();
    if (highlight) highlight.remove();
    window.__inspectorInitialized = false;
    inspectorActive = false;
}

// Слушаем сообщения
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggle_inspector') {
        if (inspectorActive) {
            removeBasicInspector();
            sendResponse({ active: false });
        } else {
            createBasicInspector();
            sendResponse({ active: true });
        }
    } else if (message.action === 'get_status') {
        sendResponse({ active: inspectorActive });
    }
    return true;
});
