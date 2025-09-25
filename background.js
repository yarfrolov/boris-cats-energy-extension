// Конфигурация для обновлений
const UPDATE_CONFIG = {
  // URL вашего репозитория на GitHub Pages
  updateUrl: 'https://yarfrolov.github.io/boris-cats-energy-extension',
  // Интервал проверки обновлений в минутах
  checkInterval: 60,
  // Имя для задачи проверки обновлений
  alarmName: 'checkForUpdates'
};

// Инициализация при установке или обновлении расширения
chrome.runtime.onInstalled.addListener(() => {
  // Установка периодической проверки обновлений
  chrome.alarms.create(UPDATE_CONFIG.alarmName, {
    periodInMinutes: UPDATE_CONFIG.checkInterval
  });
  
  // Сохраняем текущую версию расширения
  chrome.storage.local.set({ 
    currentVersion: chrome.runtime.getManifest().version 
  });
});

// Обработчик нажатия на иконку расширения
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
});

// Проверка обновлений по расписанию
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === UPDATE_CONFIG.alarmName) {
    checkForUpdates();
  }
});

// Функция проверки обновлений
async function checkForUpdates() {
  try {
    // Получаем информацию о версии с GitHub Pages
    const response = await fetch(`${UPDATE_CONFIG.updateUrl}/version.json?t=${Date.now()}`);
    if (!response.ok) {
      throw new Error('Не удалось получить информацию о версии');
    }
    
    const updateInfo = await response.json();
    const currentVersion = chrome.runtime.getManifest().version;
    
    // Сравниваем версии
    if (updateInfo.version !== currentVersion) {
      console.log(`Доступно обновление: ${updateInfo.version} (текущая: ${currentVersion})`);
      
      // Загружаем обновленные файлы
      await downloadUpdates(updateInfo.files);
      
      // Сохраняем новую версию
      chrome.storage.local.set({ currentVersion: updateInfo.version });
      
      // Уведомляем пользователя
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Обновление расширения',
        message: `Расширение обновлено до версии ${updateInfo.version}`
      });
    }
  } catch (error) {
    console.error('Ошибка при проверке обновлений:', error);
  }
}

// Функция загрузки обновленных файлов
async function downloadUpdates(filesList) {
  try {
    for (const file of filesList) {
      const response = await fetch(`${UPDATE_CONFIG.updateUrl}/${file}?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`Не удалось загрузить файл: ${file}`);
      }
      
      // Получаем содержимое файла
      let content;
      if (file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
        content = await response.text();
      } else {
        // Для бинарных файлов (изображений и т.д.)
        content = await response.blob();
      }
      
      // Сохраняем файл в локальное хранилище
      chrome.storage.local.set({ [`file:${file}`]: content });
    }
    
    console.log('Все файлы успешно загружены');
  } catch (error) {
    console.error('Ошибка при загрузке обновлений:', error);
    throw error;
  }
}

// Применяем загруженные файлы при запуске
chrome.runtime.onStartup.addListener(async () => {
  try {
    // Получаем список всех сохраненных файлов
    const storage = await chrome.storage.local.get();
    
    for (const key in storage) {
      if (key.startsWith('file:')) {
        const fileName = key.substring(5); // Убираем префикс 'file:'
        
        // Здесь можно добавить логику для применения обновленных файлов
        // Например, для скриптов можно использовать eval() или importScripts()
        // Для CSS и HTML можно обновить соответствующие элементы
        
        console.log(`Применен обновленный файл: ${fileName}`);
      }
    }
  } catch (error) {
    console.error('Ошибка при применении обновлений:', error);
  }
});
  