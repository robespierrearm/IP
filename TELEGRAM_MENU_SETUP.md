# 🤖 Настройка постоянного меню в Telegram боте

## ✅ Что уже работает:
Reply Keyboard (кнопки внизу) появляются после `/start`

## 🎯 Чтобы кнопки были ВСЕГДА:

### Вариант 1: Через BotFather (рекомендуется)

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду: `/mybots`
3. Выберите вашего бота
4. Нажмите **"Edit Bot"** → **"Edit Commands"**
5. Отправьте список команд:

```
start - Подключение к системе
menu - Главное меню
dashboard - Статистика
tenders - Список тендеров
reminders - Напоминания о дедлайнах
ai - Выбор AI модели
clear - Очистить историю чата
help - Справка
```

### Вариант 2: Через API (автоматически)

Выполните этот запрос (замените YOUR_BOT_TOKEN):

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "start", "description": "Подключение к системе"},
      {"command": "menu", "description": "Главное меню"},
      {"command": "dashboard", "description": "Статистика"},
      {"command": "tenders", "description": "Список тендеров"},
      {"command": "reminders", "description": "Напоминания"},
      {"command": "ai", "description": "Выбор AI модели"},
      {"command": "clear", "description": "Очистить историю"},
      {"command": "help", "description": "Справка"}
    ]
  }'
```

## 📱 Результат:

После настройки:
- Кнопки будут видны ВСЕГДА
- При нажатии "/" появится список команд
- Reply Keyboard (📊 📁 ⏰ 🤖) тоже будет работать

## 🔧 Текущее состояние:

✅ Reply Keyboard добавлен (появляется после /start)
✅ Обработка кнопок работает
⏳ Нужно настроить через BotFather для постоянного меню
