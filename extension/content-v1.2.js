let overlayElements = null;

function createInspector() {
    if (window.__inspectorInitialized) return;
    window.__inspectorInitialized = true;

    console.log('Создаем инспектор');

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
        // ИЗМЕНЕНО: по умолчанию активна вкладка "Пикчи"
        if (tab.id === 'images') btn.classList.add('active');
        btn.onclick = () => setActiveTab(tab.id);
        tabBar.appendChild(btn);
        buttons[tab.id] = btn;
    });
    panel.appendChild(tabBar);

    // Content containers
    const inspectorContainer = document.createElement('div');
    inspectorContainer.className = 'tab-content';
    // ИЗМЕНЕНО: по умолчанию скрыт инспектор
    inspectorContainer.style.display = 'none';
    inspectorContainer.innerHTML = '<div class="section-title">Выберите элемент</div><div style="color: #86868B;">Наведите курсор на элемент для просмотра информации</div>';

    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'tab-content';
    // ИЗМЕНЕНО: по умолчанию показан контейнер изображений
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

    // НОВАЯ ФУНКЦИЯ: форматирование класса с сворачиванием
    function formatClassName(className) {
        if (!className || className === 'Нет класса') {
            return 'Нет класса';
        }

        // Разбиваем классы на отдельные элементы
        const classes = className.split(' ').filter(c => c.trim());
        
        if (classes.length <= 3) {
            return className;
        }

        // Если классов больше 3, показываем первые 3 + счетчик
        const visibleClasses = classes.slice(0, 3);
        const hiddenCount = classes.length - 3;
        
        return {
            display: `${visibleClasses.join(' ')} +${hiddenCount}`,
            full: className,
            isCollapsed: true
        };
    }

    // Функция для получения вложенных элементов
    function getNestedElements(element, maxDepth = 3, currentDepth = 0) {
        if (currentDepth >= maxDepth) return [];
        
        const children = Array.from(element.children);
        const nestedElements = [];
        
        children.forEach(child => {
            if (child.tagName && !panel.contains(child)) {
                const childInfo = {
                    tagName: child.tagName.toLowerCase(),
                    className: child.className || '',
                    id: child.id || '',
                    textContent: child.textContent ? child.textContent.slice(0, 50) + (child.textContent.length > 50 ? '...' : '') : '',
                    depth: currentDepth + 1,
                    hasChildren: child.children.length > 0
                };
                nestedElements.push(childInfo);
                
                // Рекурсивно получаем вложенные элементы
                if (child.children.length > 0 && currentDepth + 1 < maxDepth) {
                    nestedElements.push(...getNestedElements(child, maxDepth, currentDepth + 1));
                }
            }
        });
        
        return nestedElements;
    }

    // Функция для создания HTML структуры вложенных элементов
    function createNestedElementsHTML(nestedElements) {
        if (nestedElements.length === 0) {
            return '<div class="nested-elements"><div style="color: #86868B; text-align: center; padding: 20px;">Нет вложенных элементов</div></div>';
        }
        
        let html = '<div class="nested-elements">';
        
        nestedElements.forEach(element => {
            const indent = '  '.repeat((element.depth - 1) * 2);
            const tagDisplay = element.className ? `${element.tagName}.${element.className}` : element.tagName;
            const idDisplay = element.id ? `#${element.id}` : '';
            
            html += `<div class="nested-element">`;
            html += `<span class="nested-element-tag">${indent}<${tagDisplay}${idDisplay}></span>`;
            if (element.textContent && element.textContent.trim()) {
                html += `<div class="nested-element-text">${indent}  ${element.textContent}</div>`;
            }
            html += `</div>`;
        });
        
        html += '</div>';
        return html;
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
        const rawClassName = elementUnder.className || 'Нет класса';
        const id = elementUnder.id || 'Нет ID';

        // ИЗМЕНЕНО: используем новую функцию форматирования класса
        const formattedClass = formatClassName(rawClassName);
        const classDisplay = typeof formattedClass === 'object' ? formattedClass.display : formattedClass;
        
        // НОВОЕ: получаем размеры элемента
        const elementWidth = Math.round(rect.width);
        const elementHeight = Math.round(rect.height);
        
        // Получаем вложенные элементы
        const nestedElements = getNestedElements(elementUnder);
        const nestedHTML = createNestedElementsHTML(nestedElements);

        inspectorContainer.innerHTML = `
            <div class="section-title">${tagName}</div>
            
            <div class="info-row">
                <span class="info-label">Класс:</span>
                <span class="info-value class-value" ${typeof formattedClass === 'object' ? `data-full="${formattedClass.full}" style="cursor: pointer; color: #007AFF;"` : ''}>${classDisplay}</span>
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
                <div class="color-preview" style="background-color: ${computedStyle.color};"></div>
                <span class="info-value">${computedStyle.color}</span>
            </div>
            
            <div class="color-row">
                <span class="info-label">Цвет фона:</span>
                <div class="color-preview" style="background-color: ${computedStyle.backgroundColor};"></div>
                <span class="info-value">${computedStyle.backgroundColor}</span>
            </div>
            
            <div class="spacing-grid">
                <div class="spacing-item">
                    <div style="font-size: 9px; color: #86868B; margin-bottom: 2px;">PADDING</div>
                    <div>${computedStyle.padding}</div>
                </div>
                <div class="spacing-item">
                    <div style="font-size: 9px; color: #86868B; margin-bottom: 2px;">MARGIN</div>
                    <div>${computedStyle.margin}</div>
                </div>
            </div>
            
            <div style="margin-top: 16px;">
                <div class="section-title">Вложенные элементы</div>
                ${nestedHTML}
            </div>
        `;

        // НОВОЕ: добавляем обработчик клика для разворачивания класса
        const classValue = inspectorContainer.querySelector('.class-value');
        if (classValue && classValue.hasAttribute('data-full')) {
            let isExpanded = false;
            classValue.addEventListener('click', () => {
                if (isExpanded) {
                    classValue.textContent = formattedClass.display;
                    classValue.style.color = '#007AFF';
                } else {
                    classValue.textContent = formattedClass.full;
                    classValue.style.color = '#1d1d1f';
                }
                isExpanded = !isExpanded;
            });
        }
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
            imagesContainer.innerHTML += '<div style="color: #86868B; text-align: center; padding: 20px;">На странице нет изображений.</div>';
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
            naturalImg.onload = function () {
                sizeSpan.textContent = `${naturalImg.naturalWidth}px × ${naturalImg.naturalHeight}px`;
            };
            naturalImg.onerror = function () {
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
        { char: '·', name: 'Пункт' }
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

    overlayElements = { overlay, highlightBox, panel };
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
