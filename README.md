---

# 🇩🇪 Flashcard Deutsch

### Domine o alemão, um card de cada vez.

O **Flashcard Deutsch** é um aplicativo mobile desenvolvido para transformar o aprendizado de vocabulário alemão em uma experiência dinâmica e gamificada. Através de múltiplos modos de interação, o app ajuda você a memorizar artigos, palavras e pronúncias de forma intuitiva.

---

## 🚀 Funcionalidades Principais

* **Modos de Jogo Duplos**: Desafie-se com questões de múltipla escolha (**MC**) para reconhecimento rápido ou o modo de **Escrita** para fixar a ortografia correta.
* **Pronúncia Nativa (TTS)**: Ouça a pronúncia correta de cada palavra em alemão antes de responder, utilizando integração com `expo-speech`.
* **Sistema de Feedback Instantâneo**: Saiba na hora se acertou ou errou, com correções visuais e indicação da resposta certa.
* **Gamificação Real**: Acompanhe seu *Score*, mantenha seu *Streak* (sequência de acertos) e gerencie seus *Skips* (pulos) limitados para tornar o estudo um desafio constante.
* **Banco de Dados Local**: Performance rápida e persistência de dados utilizando `expo-sqlite` para salvar seus recordes e progresso.
* **Ranking**: Visualize suas melhores pontuações e acompanhe sua evolução no tempo.

---

## 🛠️ Stack Tecnológica

O projeto foi construído utilizando as tecnologias mais modernas do ecossistema React Native:

* **Core**: React Native 0.81 & Expo 54
* **Linguagem**: TypeScript para máxima segurança de tipos
* **Navegação**: React Navigation (Native Stack)
* **Persistência**: SQLite para armazenamento robusto
* **Voz**: Expo Speech para síntese de fala

---

## 📱 Interface (UI)

O app conta com um **Dark Mode nativo** e minimalista, focado no que importa: o conteúdo.

* **Home**: Ponto de partida para iniciar novas sessões de estudo.
* **Game Screen**: Interface limpa com barras de progresso, exemplos de uso e tradução (gloss) para cada palavra.
* **Ranking**: Tela dedicada para exibir os campeões de memorização.

---

## ⚙️ Como Executar

1. **Clone o repositório**:
```bash
git clone https://github.com/dev-guirocha/flashcard-deutsch.git

```


2. **Instale as dependências**:
```bash
npm install

```


3. **Inicie o projeto**:
```bash
npm run android  # Para Android
npm run ios      # Para iOS

```



---

## 🧠 Arquitetura

O projeto segue uma estrutura organizada para escalabilidade:

* `/src/ui`: Componentes de interface e telas (Home, Game, Ranking).
* `/src/state`: Gerenciamento de estado global da aplicação.
* `/src/domain`: Lógica de negócio e motor do jogo.
* `/src/services`: Integrações externas como Text-to-Speech.

---

Desenvolvido com ❤️ por **Guilherme Rocha** (dev.guirocha).
