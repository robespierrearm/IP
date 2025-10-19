'use client';

export default function TestEnvPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Проверка переменных окружения</h1>
      <div className="space-y-2">
        <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong></p>
        <code className="block bg-gray-100 p-2 rounded">
          {process.env.NEXT_PUBLIC_SUPABASE_URL || 'НЕ НАЙДЕНО'}
        </code>
        
        <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong></p>
        <code className="block bg-gray-100 p-2 rounded text-xs">
          {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
            `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 50)}...` : 
            'НЕ НАЙДЕНО'}
        </code>
      </div>
    </div>
  );
}
