function updateButton(isActive) {
  const btn = document.getElementById('toggle-btn');
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
              console.log('Скрипт не загружен, включаем его');
              chrome.scripting.executeScript({
                  target: {tabId: tabs[0].id},
                  files: ['content.js']
              }).then(() => {
                  console.log('Скрипт загружен, обновляем кнопку');
                  updateButton(true);
              }).catch(error => {
                  console.error('Ошибка загрузки скрипта:', error);
              });
          } else if (response) {
              console.log('Получен ответ:', response);
              // ИСПРАВЛЕНО: убрана инверсия состояния
              updateButton(response.active);
          }
      });
  });
}

// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM загружен, инициализируем popup');
  
  document.getElementById('toggle-btn').addEventListener('click', toggleInspector);

  // При открытии popup запрашиваем состояние
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      if (!tabs[0]) return;
      
      chrome.tabs.sendMessage(tabs[0].id, {action: 'get_status'}, response => {
          if (chrome.runtime.lastError) {
              console.log('Скрипт не загружен, кнопка показывает Активировать');
              updateButton(false);
          } else {
              console.log('Состояние инспектора:', response);
              updateButton(response && response.active);
          }
      });
  });
});
