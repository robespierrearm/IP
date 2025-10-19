// Клиентские AI провайдеры для GitHub Pages
export type AIProvider = 'google' | 'intelligence';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Конфигурация провайдеров
export const AI_PROVIDERS = {
  google: {
    name: 'Google AI',
    models: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ],
    defaultModel: 'gemini-2.0-flash-exp',
  },
  intelligence: {
    name: 'Intelligence.io',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B' },
      { id: 'mistralai/Mistral-Nemo-Instruct-2407', name: 'Mistral Nemo' },
      { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B' },
      { id: 'Intel/Qwen3-Coder-480B-A35B-Instruct-int4-mixed-ar', name: 'Qwen3 Coder 480B' },
      { id: 'mistralai/Devstral-Small-2505', name: 'Devstral Small' },
      { id: 'swiss-ai/Apertus-70B-Instruct-2509', name: 'Apertus 70B' },
    ],
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct',
  },
};

// Системный промпт для AI
export const SYSTEM_PROMPT = `Ты полезный ИИ-помощник в CRM-системе для управления тендерами. Отвечай кратко, по делу и на русском языке. Помогай с вопросами о работе, тендерах, документах и организации процессов.

ВАЖНО: Ты можешь выполнять действия в системе! Когда пользователь просит добавить тендер, расход или поставщика, ты должен вернуть специальный JSON с командой.

Формат ответа для выполнения действий:
Если пользователь просит добавить тендер, верни JSON в формате:
[ACTION:ADD_TENDER]
{
  "name": "Название тендера",
  "start_price": 1000000,
  "publication_date": "2025-01-19",
  "status": "новый"
}
[/ACTION]

Для добавления расхода:
[ACTION:ADD_EXPENSE]
{
  "category": "Категория",
  "amount": 50000,
  "description": "Описание расхода"
}
[/ACTION]

Для добавления поставщика:
[ACTION:ADD_SUPPLIER]
{
  "name": "Название поставщика",
  "phone": "+7...",
  "email": "email@example.com",
  "category": "Категория"
}
[/ACTION]

После JSON добавь обычный текст с объяснением, что ты подготовил для добавления.`;

// Вызов Google AI
async function callGoogleAI(messages: AIMessage[], model: string): Promise<string> {
  // Для GitHub Pages используем захардкоженный ключ
  const apiKey = typeof window !== 'undefined' 
    ? 'AIzaSyB4q--whZbW0GpezMXfJncEQibZayhRbaA'
    : process.env.NEXT_PUBLIC_GOOGLE_AI_KEY;
  
  if (!apiKey) {
    throw new Error('Google AI API ключ не найден');
  }

  // Используем CORS прокси для обхода региональных ограничений
  const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google AI error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || 'Нет ответа';
}

// Вызов Intelligence.io AI
async function callIntelligenceIO(messages: AIMessage[], model: string): Promise<string> {
  // Для GitHub Pages используем захардкоженный ключ
  const apiKey = typeof window !== 'undefined'
    ? 'io-v2-eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJvd25lciI6IjNmMzg4Yzc0LWYzZjItNDI0ZC04MmExLTFlNzhhMzUxY2NjNiIsImV4cCI6NDkxNDQxMTI2MH0.TDGo9AQD2jWlIj56dy8Vk0_EMq7jQX6bcTWgsfyZLmr-vTyv2ygvOIb03CNJWtAE6jecQyNPB2YMvRap9fqs-A'
    : process.env.NEXT_PUBLIC_INTELLIGENCE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Intelligence.io API ключ не найден');
  }

  const response = await fetch('https://api.intelligence.io.solutions/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Intelligence.io error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Нет ответа';
}

// Главная функция вызова AI
export async function callAI(
  provider: AIProvider,
  messages: AIMessage[],
  model?: string
): Promise<string> {
  // Добавляем системный промпт в начало
  const messagesWithSystem = [
    { role: 'user' as const, content: SYSTEM_PROMPT },
    ...messages,
  ];

  switch (provider) {
    case 'google':
      return callGoogleAI(messagesWithSystem, model || AI_PROVIDERS.google.defaultModel);
    case 'intelligence':
      return callIntelligenceIO(messagesWithSystem, model || AI_PROVIDERS.intelligence.defaultModel);
    default:
      throw new Error(`Неизвестный провайдер: ${provider}`);
  }
}

// Проверка доступности провайдеров
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  
  if (process.env.NEXT_PUBLIC_GOOGLE_AI_KEY) {
    providers.push('google');
  }
  
  if (process.env.NEXT_PUBLIC_INTELLIGENCE_API_KEY) {
    providers.push('intelligence');
  }
  
  return providers;
}
