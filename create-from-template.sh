#!/bin/bash

# Скрипт для создания нового репозитория на основе шаблона mcp-nest-boilerplate
# Использование: ./create-from-template.sh <новый-репозиторий>

set -e  # Остановить выполнение при ошибке

# Проверяем, что передан аргумент с именем нового репозитория
if [ $# -eq 0 ]; then
    echo "❌ Ошибка: Не указано имя нового репозитория"
    echo "Использование: $0 <новый-репозиторий>"
    echo "Пример: $0 my-awesome-project"
    exit 1
fi

NEW_REPO_NAME=$1
TEMPLATE_REPO="git@github.com:isachivka/mcp-nest-boilerplate.git"
NEW_REPO_URL="git@github.com:isachivka/${NEW_REPO_NAME}.git"

echo "🚀 Создание нового репозитория на основе шаблона..."
echo "📦 Шаблон: ${TEMPLATE_REPO}"
echo "🆕 Новый репозиторий: ${NEW_REPO_URL}"
echo ""

# Клонируем шаблон
echo "📥 Клонирование шаблона..."
git clone ${TEMPLATE_REPO} ${NEW_REPO_NAME}
cd ${NEW_REPO_NAME}

# Удаляем связь с оригинальным репозиторием
echo "🔗 Изменение remote origin..."
git remote remove origin

# Добавляем новый remote
git remote add origin ${NEW_REPO_URL}

# Проверяем, что remote изменился
echo "✅ Проверка remote..."
git remote -v

# Пушим в новый репозиторий
echo "📤 Отправка кода в новый репозиторий..."
git push -u origin main

echo ""
echo "🎉 Готово! Новый репозиторий создан:"
echo "   📁 Локальная папка: $(pwd)"
echo "   🌐 GitHub: https://github.com/isachivka/${NEW_REPO_NAME}"
echo ""
echo "💡 Следующие шаги:"
echo "   1. Убедитесь, что репозиторий ${NEW_REPO_NAME} существует на GitHub"
echo "   2. Перейдите в папку: cd ${NEW_REPO_NAME}"
echo "   3. Начните разработку!"