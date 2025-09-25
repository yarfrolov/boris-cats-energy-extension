// content-loader.js - Полный статический инспектор
let overlayElements = null;

function createInspector() {
    if (window.__inspectorInitialized) return;
    window.__inspectorInitialized = true;

    console.log('Создаем инспектор');

    // Создаем стили
    const style = document.createElement('style');
    style.textContent = `
        .inspector-images-box {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif;
            overflow-y: auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-left: 1px solid rgba(0, 0, 0, 0.04);
            box-shadow: -2px 0 32px rgba(0, 0, 0, 0.08);
            color: #1d1d1f;
            font-size: 14px;
            padding: 24px;
            position: fixed;
            top: 0;
            right: 0;
            width: 300px;
            height: 100vh;
            z-index: 2147483648;
            pointer-events: auto;
            display: flex;
            flex-direction: column;
            user-select: none;
        }

        .segmented-control {
            display: flex;
            border-radius: 12px;
            background: #f5f5f7;
            padding: 2px;
            margin-bottom: 32px;
            user-select: none;
            border: 1px solid #e5e5e7;
        }

        .segmented-control button {
            flex: 1;
            background: transparent;
            border: none;
            color: #86868B;
            font-weight: 400;
            font-size: 13px;
            padding: 8px 12px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
        }

        .segmented-control button.active {
            background: white;
            color: #1d1d1f;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
            font-weight: 500;
        }

        .tab-content {
            flex: 1;
            overflow-y: auto;
            font-size: 14px;
            color: #1d1d1f;
        }

        .section-title {
            font-size: 17px;
            font-weight: 600;
            color: #1d1d1f;
            margin: 0 0 12px 0;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 14px;
        }

        .info-label {
            color: #86868B;
            font-weight: 400;
        }

        .info-value {
            color: #1d1d1f;
            font-weight: 500;
            font-family: "SF Mono", Monaco, monospace;
            font-size: 13px;
        }

        .color-row {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            font-size: 14px;
        }

        .color-preview {
            width: 16px;
            height: 16px;
            border-radius: 3px;
            margin: 0 8px;
            border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .spacing-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        .spacing-item {
            background: #f5f5f7;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 500;
            color: #1d1d1f;
            text-align: center;
            border: 1px solid #e5e5e7;
            font-family: "SF Mono", Monaco, monospace;
        }

        .inspector-highlight {
            position: fixed;
            border-radius: 4px;
            box-shadow: 0 0 0 2px #007AFF;
            background: rgba(0, 122, 255, 0.1);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.15s ease;
            z-index: 2147483649;
        }

        .media-item {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            user-select: none;
        }

        .media-item img {
            max-height: 80px;
            max-width: 80px;
            margin-right: 16px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            object-fit: contain;
            background: white;
            border: 1px solid #e5e5e7;
        }

        .media-item a {
            color: #007AFF;
            text-decoration: none;
            word-break: break-word;
            font-size: 13px;
            font-weight: 400;
            font-family: "SF Mono", Monaco, monospace;
        }

        .media-item a:hover {
            text-decoration: underline;
        }

        .special-chars-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            user-select: none;
        }

        .special-char-btn {
            width: 100%;
            height: 72px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e5e7;
            color: #1d1d1f;
            cursor: pointer;
            user-select: none;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            transition: all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);
        }

        .special-char-btn:hover {
            background: #f5f5f7;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .special-char-symbol {
            font-size: 24px;
            font-weight: 400;
            margin-bottom: 4px;
            user-select: text;
            color: #1d1d1f;
        }

        .special-char-name {
            font-size: 10px;
            color: #86868B;
            user-select: none;
            font-weight: 400;
        }
    `;
    document.head.appendChild(style);

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'inspector-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '2147483647';
    document.body.appendChild(overlay);

    // Highlight box
    const highlightBox = document.createElement('div');
    highlightBox.className = 'inspector-highlight';
    document.body.appendChild(highlightBox);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'inspector-images-box';

    // Segmented control tabs
    const tabBar = document.createElement('div');
    tabBar.className = 'segmented-control';

    const tabs = [
        { id: 'inspector', label: 'Прицел' },
        { id: 'images', label: 'Пикчи' },
        { id: 'special', label: 'Знаки' },
    ];

    const buttons = {};
    tabs.forEach(tab => {
        const btn = document.createElement('button');
        btn.textContent = tab.label;
        // По умолчанию активна вкладка "Пикчи"
        if (tab.id === 'images') btn.classList.add('active');
        btn.onclick = () => setActiveTab(tab.id);
        tabBar.appendChild(btn);
        buttons[tab.id] = btn;
    });
    panel.appendChild(tabBar);

    // Content containers
    const inspectorContainer = document.createElement('div');
    inspectorContainer.className = 'tab-content';
    inspectorContainer.style.display = 'none';
    inspectorContainer.innerHTML = '<div class="section-title">Выберите элемент</div><p>Наведите курсор на элемент для просмотра информации</p>';

    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'tab-content';
    imagesContainer.style.display = 'block';

    const specialContainer = document.createElement('div');
    specialContainer.className = 'tab-content';
    specialContainer.style.display = 'none';

    panel.appendChild(inspectorContainer);
    panel.appendChild(imagesContainer);
    panel.appendChild(specialContainer);

    overlay.appendChild(panel);
    document.body.style.marginRight = '300px';

    function setActiveTab(tabId) {
        console.log('Переключаем на вкладку:', tabId);
        Object.keys(buttons).forEach(id => {
            buttons[id].classList.toggle('active', id === tabId);
        });

        inspectorContainer.style.display = tabId === 'inspector' ? 'block' : 'none';
        imagesContainer.style.display = tabId === 'images' ? 'block' : 'none';
        specialContainer.style.display = tabId === 'special' ? 'block' : 'none';

        if (tabId !== 'inspector') {
            highlightBox.style.opacity = 0;
        }
    }

    // Mouse move handler for inspector
    document.addEventListener('mousemove', (e) => {
        if (!window.__inspectorInitialized || inspectorContainer.style.display === 'none') return;

        const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
        if (!elementUnder || panel.contains(elementUnder)) return;

        const rect = elementUnder.getBoundingClientRect();
        highlightBox.style.left = rect.left + 'px';
        highlightBox.style.top = rect.top + 'px';
        highlightBox.style.width = rect.width + 'px';
        highlightBox.style.height = rect.height + 'px';
        highlightBox.style.opacity = 1;

        const computedStyle = window.getComputedStyle(elementUnder);
        const tagName = elementUnder.tagName.toLowerCase();
        const className = elementUnder.className || 'Нет класса';
        const id = elementUnder.id || 'Нет ID';

        const elementWidth = Math.round(rect.width);
        const elementHeight = Math.round(rect.height);

        inspectorContainer.innerHTML = `
            <div class="section-title">${tagName}</div>
            
            <div class="info-row">
                <span class="info-label">Класс:</span>
                <span class="info-value">${className}</span>
            </div>
            
            <div class="info-row">
                <span class="info-label">ID:</span>
                <span class="info-value">${id}</span>
            </div>
            
            <div class="info-row">
                <span class="info-label">Размеры:</span>
                <span class="info-value">${elementWidth}px × ${elementHeight}px</span>
            </div>
            
            <div class="info-row">
                <span class="info-label">Размер шрифта:</span>
                <span class="info-value">${computedStyle.fontSize}</span>
            </div>
            
            <div class="info-row">
                <span class="info-label">Межстрочный:</span>
                <span class="info-value">${computedStyle.lineHeight}</span>
            </div>
            
            <div class="color-row">
                <span class="info-label">Цвет текста:</span>
                <div class="color-preview" style="background-color: ${computedStyle.color}"></div>
                <span class="info-value">${computedStyle.color}</span>
            </div>
            
            <div class="color-row">
                <span class="info-label">Цвет фона:</span>
                <div class="color-preview" style="background-color: ${computedStyle.backgroundColor}"></div>
                <span class="info-value">${computedStyle.backgroundColor}</span>
            </div>
            
            <div class="spacing-grid">
                <div class="spacing-item">PADDING<br>${computedStyle.padding}</div>
                <div class="spacing-item">MARGIN<br>${computedStyle.margin}</div>
            </div>
        `;
    });

    // Images tab
    function renderImages() {
        console.log('Рендерим изображения');
        imagesContainer.innerHTML = '<div class="section-title">Изображения на странице</div>';
        
        const imgs = Array.from(document.images)
            .map(img => img.src)
            .filter(src => src && src.startsWith('http'))
            .filter((src, index, arr) => arr.indexOf(src) === index);

        console.log('Найдено изображений:', imgs.length);

        if (imgs.length === 0) {
            imagesContainer.innerHTML += '<p>На странице нет изображений.</p>';
            return;
        }

        imgs.forEach(src => {
            const wrapper = document.createElement('div');
            wrapper.className = 'media-item';

            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            img.onerror = () => {
                img.style.display = 'none';
            };

            const linkBlock = document.createElement('div');
            linkBlock.style.display = 'flex';
            linkBlock.style.flexDirection = 'column';
            linkBlock.style.justifyContent = 'center';

            const link = document.createElement('a');
            link.href = src;
            link.target = '_blank';
            link.textContent = src.length > 35 ? src.slice(0, 30) + '...' : src;
            link.style.marginBottom = '4px';

            const sizeSpan = document.createElement('span');
            sizeSpan.style.fontSize = '11px';
            sizeSpan.style.color = '#86868B';

            const naturalImg = new Image();
            naturalImg.onload = function() {
                sizeSpan.textContent = `${naturalImg.naturalWidth}px × ${naturalImg.naturalHeight}px`;
            };
            naturalImg.onerror = function() {
                sizeSpan.textContent = '';
            };
            naturalImg.src = src;

            linkBlock.appendChild(link);
            linkBlock.appendChild(sizeSpan);

            wrapper.appendChild(img);
            wrapper.appendChild(linkBlock);

            imagesContainer.appendChild(wrapper);
        });
    }

    renderImages();

    // Special chars tab
    const specialChars = [
        { char: '₽', name: 'Рубль' },
        { char: 'м²', name: 'Кв. метр' },
        { char: 'м³', name: 'Куб. метр' },
        { char: '«', name: 'Лев. кав.' },
        { char: '»', name: 'Прав. кав.' },
        { char: '–', name: 'Кор. тире' },
        { char: '—', name: 'Дл. тире' },
        { char: '©', name: 'Копирайт' },
        { char: '®', name: 'Рег. знак' }
    ];

    const specialGrid = document.createElement('div');
    specialGrid.className = 'special-chars-grid';

    specialChars.forEach(({ char, name }) => {
        const btn = document.createElement('button');
        btn.className = 'special-char-btn';

        const sym = document.createElement('span');
        sym.className = 'special-char-symbol';
        sym.textContent = char;

        const nm = document.createElement('span');
        nm.className = 'special-char-name';
        nm.textContent = name;

        btn.appendChild(sym);
        btn.appendChild(nm);
        btn.title = `Копировать символ «${char}»`;

        btn.onclick = () => {
            navigator.clipboard.writeText(char).then(() => {
                const old = sym.textContent;
                sym.textContent = '✓';
                setTimeout(() => sym.textContent = old, 1500);
            }).catch(() => {
                alert(`Не удалось скопировать символ «${char}»`);
            });
        };

        specialGrid.appendChild(btn);
    });

    specialContainer.appendChild(specialGrid);

    overlayElements = { overlay, highlightBox, panel, style };
    console.log('Инспектор создан, активна вкладка "Пикчи"');
}

function removeInspector() {
    if (!window.__inspectorInitialized) return;

    console.log('Удаляем инспектор');

    if (overlayElements) {
        Object.values(overlayElements).forEach(el => {
            if (el && el.parentNode) el.parentNode.removeChild(el);
        });
    }

    window.__inspectorInitialized = false;
    document.body.style.marginRight = '';
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Получено сообщение:', message);
    
    if (message.action === 'toggle_inspector') {
        if (window.__inspectorInitialized) {
            console.log('Выключаем инспектор');
            removeInspector();
            sendResponse({ active: false });
        } else {
            console.log('Включаем инспектор');
            createInspector();
            sendResponse({ active: true });
        }
    } else if (message.action === 'get_status') {
        const isActive = !!window.__inspectorInitialized;
        console.log('Запрос статуса, активен:', isActive);
        sendResponse({ active: isActive });
    }
    return true;
});
