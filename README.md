# Flashcard Deutsch

Aplicativo offline-first para treino de vocabulario em alemao com foco em repeticao ativa.

## Funcionalidades
- Modos de treino: multipla escolha (DE -> gloss) e escrita (gloss -> DE)
- SRS Lite (Leitner): progresso por palavra com caixas e data de revisao
- Botao de revisao de vencidos na Home
- Modo "So artigos" (somente palavras NOUN)
- Deck minimo A1 de artigos (instalacao rapida pela Home)
- Audio via TTS (`expo-speech`)
- Ranking local de pontuacao
- Banco local SQLite sem backend obrigatorio
- Export/Import local: backup JSON completo e deck CSV

## Stack
- Expo 54
- React Native 0.81
- TypeScript
- React Navigation
- expo-sqlite

## Rodando localmente
```bash
npm install
npm run android
npm run ios
npm run web
```

## Decks e seed
- Seed padrao do app: `assets/words_v2_skeleton.json`
- Normalizar deck base:
```bash
npm run deck:normalize
```
- Enriquecer com Kaikki (JSONL):
```bash
npm run deck:enrich -- /caminho/kaikki.org-dictionary-German.jsonl
```
- Saida esperada do enrich: `assets/words_v2_enriched.json`

## Testes
```bash
npm test
```

## Licencas
- Codigo: `LICENSE` (MIT)
- Conteudo/decks: `data/LICENSE` e `data/SOURCES.md`

## Comunidade
- Guia de contribuicao: `CONTRIBUTING.md`
- Conduta: `CODE_OF_CONDUCT.md`
- Seguranca: `SECURITY.md`
