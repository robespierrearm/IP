# 🕐 Настройка Cron Job для автоматического перехода тендеров

## Что делает Cron Job?

Каждый день в 00:00 UTC автоматически проверяет все тендеры со статусом "подано" и если дедлайн подачи (`submission_deadline`) наступил или прошёл, переводит их в статус "на рассмотрении".

---

## Настройка в Vercel

### 1. Добавить переменную окружения

В Vercel Dashboard → Settings → Environment Variables добавь:

```
CRON_SECRET=your-random-secret-key-here
```

**Как сгенерировать секретный ключ:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Или используй любую случайную строку (минимум 32 символа).

### 2. Vercel автоматически настроит Cron

После деплоя Vercel автоматически создаст Cron Job на основе `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-deadlines",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Schedule:** `0 0 * * *` = каждый день в 00:00 UTC (03:00 по Москве)

---

## Как это работает?

### 1. Пользователь подаёт тендер
- Статус меняется на "подано"
- Устанавливается `submission_date = сегодня`
- Карточка становится зелёной
- Тендер остаётся во вкладке "Новые"

### 2. Наступает день дедлайна
- Cron Job запускается в 00:00 UTC
- Проверяет все тендеры: `status = 'подано' AND submission_deadline <= сегодня`
- Обновляет статус на "на рассмотрении"
- Создаёт напоминание (если есть таблица `reminders`)

### 3. Пользователь видит изменения
- Тендер автоматически переходит во вкладку "На рассмотрении"
- Появляется напоминание о смене статуса

---

## Тестирование

### Вручную запустить Cron Job:

```bash
curl -X GET "https://your-app.vercel.app/api/cron/check-deadlines" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Ожидаемый ответ:

```json
{
  "message": "Обновлено 3 из 3 тендеров",
  "results": [
    { "id": 1, "success": true, "name": "Ремонт дороги" },
    { "id": 2, "success": true, "name": "Поставка оборудования" },
    { "id": 3, "success": true, "name": "Строительство моста" }
  ],
  "count": 3
}
```

---

## Логи в Vercel

Чтобы посмотреть логи Cron Job:

1. Vercel Dashboard → Project → Deployments
2. Выбери последний деплой
3. Functions → `/api/cron/check-deadlines`
4. Смотри логи выполнения

---

## Альтернатива: Проверка при загрузке

Если Vercel Cron не работает (бесплатный план), можно добавить проверку при загрузке страницы:

```typescript
// В app/m/tenders/page.tsx или app/(dashboard)/tenders/page.tsx

useEffect(() => {
  checkDeadlines();
  loadTenders();
}, []);

const checkDeadlines = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  const expiredTenders = tenders.filter(t => 
    t.status === 'подано' && 
    t.submission_deadline && 
    t.submission_deadline <= today
  );
  
  for (const tender of expiredTenders) {
    await apiClient.updateTender(tender.id, { 
      status: 'на рассмотрении' 
    });
  }
};
```

**Минусы:** Проверка происходит только когда пользователь открывает страницу.

---

## Безопасность

- Endpoint `/api/cron/check-deadlines` защищён секретным ключом
- Только Vercel Cron может вызвать этот endpoint
- Без правильного `Authorization` header запрос будет отклонён

---

**Готово!** Теперь тендеры автоматически переходят в "на рассмотрении" в день дедлайна. 🎯
