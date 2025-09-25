// background.js - Простой background
console.log('🎉 Boris Cat Extension загружен!');

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Расширение установлено');
        chrome.tabs.create({ 
            url: 'https://yarfrolov.github.io/boris-cats-energy-extension/extension/welcome.html' 
        });
    }
});

// Обработка сообщений
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Получено сообщение:', message);
    sendResponse({success: true});
    return true;
});
