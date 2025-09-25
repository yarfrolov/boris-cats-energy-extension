// Модуль для обработки обновлений расширения
const Updater = {
  // Применяет загруженные обновления
  applyUpdates: async function() {
    try {
      // Получаем все сохраненные файлы из хранилища
      const storage = await chrome.storage.local.get();
      const updatedFiles = [];
      
      // Обрабатываем каждый файл
      for (const key in storage) {
        if (key.startsWith('file:')) {
          const fileName = key.substring(5); // Убираем префикс 'file:'
          const content = storage[key];
          
          // Применяем обновления в зависимости от типа файла
          if (fileName.endsWith('.js')) {
            // Для JavaScript файлов
            this.applyJsUpdate(fileName, content);
          } else if (fileName.endsWith('.css')) {
            // Для CSS файлов
            this.applyCssUpdate(fileName, content);
          } else if (fileName.endsWith('.html')) {
            // Для HTML файлов
            this.applyHtmlUpdate(fileName, content);
          } else {
            // Для других файлов (изображения и т.д.)
            this.applyBinaryUpdate(fileName, content);
          }
          
          updatedFiles.push(fileName);
        }
      }
      
      console.log('Обновления успешно применены:', updatedFiles);
      return updatedFiles;
    } catch (error) {
      console.error('Ошибка при применении обновлений:', error);
      throw error;
    }
  },
  
  // Применяет обновления для JS файлов
  applyJsUpdate: function(fileName, content) {
    try {
      // Для JavaScript файлов можно использовать динамическую загрузку
      // или сохранить для следующего запуска расширения
      console.log(`Обновлен JavaScript файл: ${fileName}`);
      
      // Сохраняем обновленный файл для следующего запуска
      chrome.storage.local.set({ [`updated:${fileName}`]: content });
    } catch (error) {
      console.error(`Ошибка при обновлении JS файла ${fileName}:`, error);
    }
  },
  
  // Применяет обновления для CSS файлов
  applyCssUpdate: function(fileName, content) {
    try {
      console.log(`Обновлен CSS файл: ${fileName}`);
      
      // Сохраняем обновленный CSS для следующего запуска
      chrome.storage.local.set({ [`updated:${fileName}`]: content });
    } catch (error) {
      console.error(`Ошибка при обновлении CSS файла ${fileName}:`, error);
    }
  },
  
  // Применяет обновления для HTML файлов
  applyHtmlUpdate: function(fileName, content) {
    try {
      console.log(`Обновлен HTML файл: ${fileName}`);
      
      // Сохраняем обновленный HTML для следующего запуска
      chrome.storage.local.set({ [`updated:${fileName}`]: content });
    } catch (error) {
      console.error(`Ошибка при обновлении HTML файла ${fileName}:`, error);
    }
  },
  
  // Применяет обновления для бинарных файлов
  applyBinaryUpdate: function(fileName, content) {
    try {
      console.log(`Обновлен бинарный файл: ${fileName}`);
      
      // Сохраняем обновленный файл для следующего запуска
      chrome.storage.local.set({ [`updated:${fileName}`]: content });
    } catch (error) {
      console.error(`Ошибка при обновлении бинарного файла ${fileName}:`, error);
    }
  },
  
  // Проверяет наличие обновлений
  checkForUpdates: async function(updateUrl) {
    try {
      const response = await fetch(`${updateUrl}/version.json?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Не удалось получить информацию о версии');
      }
      
      const updateInfo = await response.json();
      const currentVersion = chrome.runtime.getManifest().version;
      
      // Сравниваем версии
      if (updateInfo.version !== currentVersion) {
        console.log(`Доступно обновление: ${updateInfo.version} (текущая: ${currentVersion})`);
        return {
          hasUpdate: true,
          newVersion: updateInfo.version,
          currentVersion: currentVersion,
          files: updateInfo.files
        };
      }
      
      return { hasUpdate: false };
    } catch (error) {
      console.error('Ошибка при проверке обновлений:', error);
      return { hasUpdate: false, error: error.message };
    }
  },
  
  // Загружает обновленные файлы
  downloadUpdates: async function(updateUrl, filesList) {
    const downloadedFiles = [];
    
    try {
      for (const file of filesList) {
        const response = await fetch(`${updateUrl}/${file}?t=${Date.now()}`);
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
        await chrome.storage.local.set({ [`file:${file}`]: content });
        downloadedFiles.push(file);
      }
      
      console.log('Все файлы успешно загружены:', downloadedFiles);
      return downloadedFiles;
    } catch (error) {
      console.error('Ошибка при загрузке обновлений:', error);
      throw error;
    }
  }
};

// Экспортируем модуль
if (typeof module !== 'undefined') {
  module.exports = Updater;
}