// Простой скрипт для генерации PNG из SVG через canvas (без зависимостей)
// Для работы нужен Node.js с canvas или использовать онлайн генератор

console.log('📱 Генерация иконок для PWA');
console.log('');
console.log('❌ Для генерации PNG из SVG нужны дополнительные инструменты:');
console.log('');
console.log('🔧 Вариант 1 (РЕКОМЕНДУЕТСЯ):');
console.log('   1. Открой https://realfavicongenerator.net/');
console.log('   2. Загрузи файл public/icon-static.svg');
console.log('   3. Скачай сгенерированные иконки');
console.log('   4. Скопируй в папку public/');
console.log('');
console.log('🔧 Вариант 2 (если установлен ImageMagick):');
console.log('   cd public');
console.log('   convert icon-static.svg -resize 180x180 apple-touch-icon.png');
console.log('   convert icon-static.svg -resize 192x192 android-chrome-192x192.png');
console.log('   convert icon-static.svg -resize 512x512 android-chrome-512x512.png');
console.log('');
console.log('📖 Подробная инструкция: GENERATE_ICONS.md');
