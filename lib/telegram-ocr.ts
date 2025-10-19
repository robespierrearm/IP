// Распознавание чеков через Google Gemini Vision

function getGoogleKey() {
  return process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'AIzaSyB4q--whZbW0GpezMXfJncEQibZayhRbaA';
}

export interface ReceiptData {
  amount: number;
  date?: string;
  store?: string;
  category?: string;
  description?: string;
}

export async function recognizeReceipt(photoUrl: string): Promise<ReceiptData | null> {
  try {
    const googleKey = getGoogleKey();
    if (!googleKey) {
      console.error('Google API key not found');
      return null;
    }

    // Скачиваем фото
    const imageResponse = await fetch(photoUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Промпт для Gemini
    const prompt = `Проанализируй этот чек и извлеки следующую информацию в формате JSON:

{
  "amount": [общая сумма чека в рублях, только число],
  "date": "[дата в формате YYYY-MM-DD, если есть]",
  "store": "[название магазина/организации]",
  "category": "[категория: Материалы, Доставка, Работы, Техника, Инструменты или Прочее]",
  "description": "[краткое описание покупки]"
}

ВАЖНО:
- amount должен быть числом (например: 5420.50)
- Если не можешь определить какое-то поле, оставь его пустым
- category выбери наиболее подходящую из списка
- Верни ТОЛЬКО JSON, без дополнительного текста`;

    // Запрос к Gemini Vision
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini response:', data);
      return null;
    }

    const text = data.candidates[0].content.parts[0].text;
    
    // Извлекаем JSON из ответа
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      return null;
    }

    const receiptData = JSON.parse(jsonMatch[0]);
    
    // Валидация
    if (!receiptData.amount || isNaN(receiptData.amount)) {
      console.error('Invalid amount in receipt data:', receiptData);
      return null;
    }

    return {
      amount: parseFloat(receiptData.amount),
      date: receiptData.date || undefined,
      store: receiptData.store || undefined,
      category: receiptData.category || 'Прочее',
      description: receiptData.description || undefined,
    };

  } catch (error) {
    console.error('Receipt recognition error:', error);
    return null;
  }
}
