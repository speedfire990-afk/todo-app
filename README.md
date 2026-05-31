# Дела на день

React + Vite PWA для мобильного списка задач под iPhone 15 Pro Max.

## Запуск локально

```bash
npm install
npm run dev
```

## Сборка

```bash
npm run build
```

Готовые файлы появятся в папке `dist`.

## Публикация на GitHub Pages

1. Создайте репозиторий на GitHub и загрузите проект.
2. Установите зависимости:

```bash
npm install
```

3. Соберите проект:

```bash
npm run build
```

4. Вариант через GitHub Actions: добавьте workflow, который запускает `npm ci`, `npm run build` и публикует папку `dist`.
5. В настройках репозитория откройте `Settings -> Pages` и выберите публикацию из GitHub Actions.

Минимальный workflow:

```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

После публикации откройте ссылку на iPhone в Safari и выберите `Поделиться -> На экран "Домой"`.
