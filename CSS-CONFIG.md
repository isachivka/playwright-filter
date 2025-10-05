# CSS Configuration Guide

Этот MCP прокси автоматически определяет сайт по URL и применяет соответствующие CSS правила для очистки веб-страниц. Все настройки хранятся в файле `src/config/css-rules.json`.

## Структура конфигурации

Простой JSON где ключ - домен, значение - CSS код:

```json
{
  "rutracker.org": "#sidebar1,\n#main-nav,\n#logo,\n#idx-sidebar2,\n#latest_news,\n#forums_top_links,\n#board_stats,\n#page_footer,\n#t-top-user-buttons,\n#categories-wrap { display: none !important; }\n\n#topic_main > * { display: none !important; }\n#topic_main > *:nth-child(2) { display: block !important; }",
  "default": ".advertisement,\n.ads,\n.sidebar,\n.footer,\n.header { display: none !important; }"
}
```

## Формат конфигурации

- **Ключ** - домен сайта (например, `rutracker.org`)
- **Значение** - CSS код для очистки страницы
- **`default`** - CSS для сайтов без специальной конфигурации

## Использование

### Навигация с автоматической CSS очисткой:
```javascript
browser_navigate({
  url: "https://rutracker.org/forum/viewtopic.php?t=123456"
})
```

Сайт определяется автоматически по URL:
- `rutracker.org` → `rutracker.org` конфигурация
- Другие сайты → `default` конфигурация

## Добавление новых сайтов

1. Откройте `src/config/css-rules.json`
2. Добавьте новую конфигурацию:

```json
{
  "example.com": ".advertisement,\n.sidebar,\n.footer { display: none !important; }"
}
```

3. Сделайте редеплой сервера
4. Используйте: `browser_navigate({ url: "https://example.com/page" })`

## Примеры

### Скрытие рекламы:
```json
{
  "adsite.com": ".advertisement,\n.ads,\n[id*='ad'],\n[class*='banner'] { display: none !important; }"
}
```

### Сложные правила:
```json
{
  "complexsite.com": ".content > * { display: none !important; }\n.content > .main,\n.content > .important { display: block !important; }"
}
```

### Множественные селекторы:
```json
{
  "multisite.com": "#sidebar1,\n#main-nav,\n.logo,\n.footer { display: none !important; }\n\n#main-content { display: block !important; }"
}
```