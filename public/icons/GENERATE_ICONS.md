# Генерация иконок для PWA

## Автоматическая генерация

Используйте онлайн сервис для конвертации SVG в PNG:
https://realfavicongenerator.net/

Или используйте команду (если установлен ImageMagick):

```bash
# Из корня проекта
convert -background none -resize 192x192 public/icon.svg public/icons/icon-192x192.png
convert -background none -resize 512x512 public/icon.svg public/icons/icon-512x512.png
```

## Ручная генерация

1. Откройте `public/icon.svg` в любом векторном редакторе (Figma, Sketch, Inkscape)
2. Экспортируйте в PNG:
   - 192x192px → `public/icons/icon-192x192.png`
   - 512x512px → `public/icons/icon-512x512.png`

## Текущий дизайн

Логотип представляет собой:
- Градиентный фон (Indigo → Purple)
- Документ с галочкой (символ успешного тендера)
- Зелёный акцент в углу (строительство)
- Современный минималистичный стиль

## Цвета

- Основной градиент: #6366F1 → #8B5CF6
- Акцент: #10B981 → #34D399
- Документ: белый с прозрачностью
