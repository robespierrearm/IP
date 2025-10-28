// Умный bookmarklet - сначала извлекает текст, потом отправляет
(function(){
  (async () => {
    // Показываем загрузку
    const loading = document.createElement('div');
    loading.style.cssText = 'position:fixed;top:20px;right:20px;background:linear-gradient(135deg,rgb(102,126,234),rgb(118,75,162));color:white;padding:20px 30px;border-radius:50px;font-family:system-ui;font-size:16px;font-weight:bold;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:999999';
    loading.innerHTML = '🔍 Извлекаю текст...';
    document.body.appendChild(loading);
    
    try {
      // УМНОЕ ИЗВЛЕЧЕНИЕ - берём только видимый текст
      const extractText = (element) => {
        let text = '';
        
        // Пропускаем скрипты, стили, SVG
        if (['SCRIPT', 'STYLE', 'SVG', 'NOSCRIPT'].includes(element.tagName)) {
          return '';
        }
        
        // Берём текст из узлов
        for (let node of element.childNodes) {
          if (node.nodeType === 3) { // Text node
            text += node.textContent + ' ';
          } else if (node.nodeType === 1) { // Element node
            text += extractText(node);
          }
        }
        
        return text;
      };
      
      // Извлекаем текст со страницы
      let pageText = extractText(document.body);
      
      // Очищаем от лишних пробелов
      pageText = pageText.replace(/\s+/g, ' ').trim();
      
      // Ограничиваем размер
      if (pageText.length > 50000) {
        pageText = pageText.substring(0, 50000);
        loading.innerHTML = '⚠️ Большая страница, обрезаю...';
      }
      
      loading.innerHTML = '🤖 ИИ анализирует...';
      
      // Отправляем ТОЛЬКО текст (не HTML!)
      const res = await fetch('http://localhost:3000/api/bookmarklet-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: pageText, // Отправляем чистый текст
          url: window.location.href
        })
      });
      
      if (!res.ok) {
        const txt = await res.text();
        document.body.removeChild(loading);
        alert('❌ Ошибка сервера (' + res.status + '):\n\n' + txt);
        return;
      }
      
      const result = await res.json();
      document.body.removeChild(loading);
      
      if (!result.success) {
        alert('❌ Ошибка: ' + (result.error || 'Неизвестная ошибка'));
        return;
      }
      
      const d = result.data;
      const msg = `📋 ДАННЫЕ ТЕНДЕРА:\n\n✅ ${d.name}\n\n📝 Номер: ${d.purchase_number || '—'}\n📍 Регион: ${d.region || '—'}\n📅 Публикация: ${d.publication_date || '—'}\n⏰ Дедлайн: ${d.submission_deadline || '—'}\n💰 Цена: ${d.start_price ? new Intl.NumberFormat('ru-RU', {style: 'currency', currency: 'RUB'}).format(d.start_price) : '—'}`;
      
      if (confirm(msg + '\n\n➡️ Открыть форму в CRM?')) {
        localStorage.setItem('parsedTender', JSON.stringify(d));
        window.open('http://localhost:3000/tenders?action=add-from-parser', '_blank');
      }
    } catch (err) {
      if (document.body.contains(loading)) document.body.removeChild(loading);
      alert('❌ Ошибка:\n\n' + err.message + '\n\nПроверьте:\n✓ Сервер запущен?\n✓ Открыто с localhost?');
      console.error('Bookmarklet error:', err);
    }
  })();
})();
