<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1C5INd1PgNRZM-4b-7MR88FtuMNMJe0XK

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

The flashcards are generated directly from the built-in vocabulary database, so no API keys or network calls are required. Use the search field to filter categories, hit “Shuffle all cards” to estudar o baralho inteiro em ordem aleatória, marque cartas como favoritas (estrela) e abra o deck de favoritos a qualquer momento.

### Extras
- **Favorites & stats:** clique na estrela durante o estudo para marcar/desmarcar; a tela inicial mostra quantos favoritos existem, quantos cards já foram estudados, notas rápidas de sessão e um gráfico diário dos últimos 7 dias.
- **Shuffle, quiz e writing practice:** no modo embaralhado existe “Reshuffle deck”. O “Spaced practice” usa o histórico para priorizar cartas difíceis; “Quick quiz” cria testes relâmpago (5–30 perguntas) e “Writing practice” compara sua escrita em alemão com tolerância a erros (Levenshtein).
- **Filtros avançados e revisão temática:** filtre categorias por tipo/tamanho/favoritos ou combine múltiplas categorias no bloco “Themed revision” para montar baralhos específicos.
- **Marcação de dificuldade & edição:** durante os estudos use “Need more practice” / “I got it” para alimentar a revisão espaçada, registre notas em cada sessão e edite o conteúdo das cartas diretamente no app.
- **Export/Import:** exporte o vocabulário atual em JSON/CSV, importe arquivos para substituir os dados personalizados e limpe tudo com um clique.
