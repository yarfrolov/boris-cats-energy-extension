// sync.js - Скрипт для синхронизации файлов из extension в dist
const fs = require('fs');
const path = require('path');
const https = require('https');

// Пути к директориям
const extensionDir = path.join(__dirname, 'extension');
const distDir = path.join(__dirname, 'dist');

// URL для GitHub Pages
const GITHUB_PAGES_URL = 'https://yarfrolov.github.io/boris-cats-energy-extension';

// Функция для загрузки файла с GitHub Pages
async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Ошибка загрузки: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Функция для загрузки JSON с GitHub Pages
async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Ошибка загрузки JSON: ${response.statusCode}`));
        return;
      }

      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (err) {
          reject(err);
        }
      });

      response.on('error', (err) => {
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Функция для чтения и обновления файлов на основе конфигурации
async function syncFiles(useGitHubPages = false) {
  try {
    let configData;
    
    if (useGitHubPages) {
      // Загрузка конфигурации с GitHub Pages
      console.log('Загрузка конфигурации с GitHub Pages...');
      configData = await fetchJSON(`${GITHUB_PAGES_URL}/extension/config.json`);
    } else {
      // Чтение локальной конфигурации
      const configPath = path.join(extensionDir, 'config.json');
      configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    
    console.log(`Синхронизация файлов из версии ${configData.version}...`);
    
    // Обновление content.js
    if (configData.files.content) {
      if (useGitHubPages) {
        const contentUrl = `${GITHUB_PAGES_URL}/extension/${configData.files.content}`;
        const contentDest = path.join(distDir, 'content-loader.js');
        await downloadFile(contentUrl, contentDest);
      } else {
        const contentSrc = path.join(extensionDir, configData.files.content);
        const contentDest = path.join(distDir, 'content-loader.js');
        fs.copyFileSync(contentSrc, contentDest);
      }
      console.log(`✅ Обновлен content-loader.js из ${configData.files.content}`);
    }
    
    // Обновление popup.js
    if (configData.files.popup) {
      if (useGitHubPages) {
        const popupUrl = `${GITHUB_PAGES_URL}/extension/${configData.files.popup}`;
        const popupDest = path.join(distDir, 'popup.js');
        await downloadFile(popupUrl, popupDest);
      } else {
        const popupSrc = path.join(extensionDir, configData.files.popup);
        const popupDest = path.join(distDir, 'popup.js');
        fs.copyFileSync(popupSrc, popupDest);
      }
      console.log(`✅ Обновлен popup.js из ${configData.files.popup}`);
    }
    
    // Обновление styles.css
    if (configData.files.styles) {
      if (useGitHubPages) {
        const stylesUrl = `${GITHUB_PAGES_URL}/extension/${configData.files.styles}`;
        const stylesDest = path.join(distDir, 'styles.css');
        await downloadFile(stylesUrl, stylesDest);
      } else {
        const stylesSrc = path.join(extensionDir, configData.files.styles);
        const stylesDest = path.join(distDir, 'styles.css');
        fs.copyFileSync(stylesSrc, stylesDest);
      }
      console.log(`✅ Обновлен styles.css из ${configData.files.styles}`);
    }
    
    // Обновление версии в manifest.json
    const manifestPath = path.join(distDir, 'manifest.json');
    const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifestData.version = configData.version;
    fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));
    console.log(`✅ Обновлена версия в manifest.json: ${configData.version}`);
    
    console.log('Синхронизация завершена успешно!');
  } catch (error) {
    console.error('Ошибка при синхронизации файлов:', error);
  }
}

// Запуск синхронизации
if (process.argv.includes('--remote')) {
  // Синхронизация с GitHub Pages
  syncFiles(true).then(() => {
    console.log('Синхронизация с GitHub Pages завершена');
  });
} else {
  // Локальная синхронизация
  syncFiles(false).then(() => {
    console.log('Локальная синхронизация завершена');
  });
}

// Функция для отслеживания изменений в папке extension
function watchExtensionFolder() {
  console.log('Отслеживание изменений в папке extension...');
  
  fs.watch(extensionDir, { recursive: true }, (eventType, filename) => {
    if (filename) {
      console.log(`Обнаружено изменение: ${filename}`);
      syncFiles(false);
    }
  });
}

// Если скрипт запущен с аргументом --watch, включаем режим отслеживания
if (process.argv.includes('--watch')) {
  watchExtensionFolder();
} else {
  console.log('Для автоматического отслеживания изменений запустите скрипт с аргументом --watch');
}
