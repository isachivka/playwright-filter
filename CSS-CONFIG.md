# CSS Configuration Guide

Этот MCP прокси автоматически определяет сайт по URL и применяет соответствующие CSS правила для очистки веб-страниц. Все настройки хранятся в файле `src/config/css-rules.json`.

## Структура конфигурации

```json
{
  "rutracker.org": {
    "name": "Rutracker CSS Cleaning Rules",
    "description": "CSS rules to clean Rutracker pages by hiding unnecessary elements",
    "enabled": true,
    "rules": [
      "#sidebar1",
      "#main-nav", 
      "#logo"
    ],
    "specialRules": [
      {
        "selector": "#topic_main > *",
        "action": "hide",
        "exceptions": ["#topic_main > *:nth-child(2)"]
      }
    ],
    "customCSS": ""
  },
  "default": {
    "name": "Default CSS Cleaning Rules",
    "description": "Basic CSS rules for general page cleaning",
    "enabled": true,
    "rules": [
      ".advertisement",
      ".ads",
      ".sidebar",
      ".footer",
      ".header"
    ],
    "specialRules": [],
    "customCSS": ""
  }
}
```

## Параметры конфигурации

### Основные поля:
- `name` - Название конфигурации
- `description` - Описание назначения
- `enabled` - Включена ли конфигурация (true/false)
- `rules` - Массив CSS селекторов для скрытия
- `specialRules` - Специальные правила с исключениями
- `customCSS` - Дополнительный CSS код

### Special Rules:
- `selector` - CSS селектор
- `action` - Действие: "hide" или "show"
- `exceptions` - Массив исключений (селекторы, которые не будут скрыты)

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
  "example.com": {
    "name": "Example Site CSS Rules",
    "description": "CSS rules for cleaning example.com",
    "enabled": true,
    "rules": [
      ".advertisement",
      ".sidebar"
    ],
    "specialRules": [],
    "customCSS": "/* Дополнительный CSS */"
  }
}
```

3. Сохраните файл - изменения применятся автоматически
4. Используйте: `browser_navigate({ url: "https://example.com/page" })`

## Горячая перезагрузка

Конфигурация автоматически перезагружается при изменении файла `css-rules.json`. Не нужно перезапускать сервер!

## Примеры

### Скрытие рекламы:
```json
"rules": [
  ".advertisement",
  ".ads",
  "[id*='ad']",
  "[class*='banner']"
]
```

### Сложные правила с исключениями:
```json
"specialRules": [
  {
    "selector": ".content > *",
    "action": "hide",
    "exceptions": [".content > .main", ".content > .important"]
  }
]
```

### Кастомный CSS:
```json
"customCSS": ".my-custom-rule { display: none !important; }"
```

## Отладка

Используйте `css_preview` для проверки сгенерированного CSS перед применением к реальным страницам.