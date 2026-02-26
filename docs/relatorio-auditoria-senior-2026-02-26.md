# Relatório de Auditoria Técnica e Pedagógica

Data: 2026-02-26  
Projeto: Flashcard Deutsch  
Branch: `main`

## 1. Contexto
Este relatório consolida a execução das recomendações das auditorias recebidas (incluindo a auditoria mais recente em PDF) com foco em:
- ganho pedagógico (retenção real, não só gamificação)
- robustez técnica (seed, migrações, testes)
- compartilhamento comunitário sem backend obrigatório
- acessibilidade e governança mínima de repositório

## 2. Entregas implementadas

### 2.1 Core pedagógico (SRS + revisão)
- Implementado `SRS Lite` baseado em Leitner local.
- Persistência por palavra em `card_progress` (`box`, `dueAt`, `correct`, `wrong`, `lastReviewedAt`).
- Priorização de cartões vencidos no início da sessão.
- Modo de revisão de vencidos disponível na Home.
- Sessão contínua (sem limite fixo de 30) com repetição espaçada dentro da própria run:
  - palavra correta retorna mais tarde
  - palavra errada retorna mais cedo
  - evita repetição imediata da mesma palavra

Arquivos-chave:
- `src/data/migrations.ts`
- `src/domain/srsLeitner.ts`
- `src/data/wordsRepo.ts`
- `src/state/appStore.ts`
- `src/domain/gameEngine.ts`

### 2.2 Deck, seed e conteúdo
- Seed deixou de ser destrutivo (`DELETE`) e passou para `UPSERT` por `id`.
- Seed padrão alterado para `assets/words_v2_skeleton.json`.
- `SEED_VERSION` atualizado para 6.
- Pipeline de normalização criado:
  - script `de-seed/normalize_words_v2.mjs`
  - geração de `assets/words_v2_skeleton.json`
  - relatório automático de qualidade `assets/words_v2_skeleton.report.json`
- Pipeline de enriquecimento via Kaikki criado:
  - script `de-seed/enrich_with_kaikki.mjs`
  - saída prevista: `assets/words_v2_enriched.json`

Resultado da normalização atual:
- entrada: 1974
- saída: 1640
- duplicatas removidas: 334
- com `pt`: 1604
- com exemplo: 1109
- coloquiais marcadas: 18

### 2.3 Modo Só Artigos
- Implementado fluxo de treino direcionado para artigos.
- Bloqueio seguro quando não há dados válidos para o modo.
- Botão de instalação rápida de deck mínimo A1 de artigos.
- Deck mínimo criado em `assets/decks/articles_a1_min.json`.

### 2.4 Export/Import e compartilhamento
- Export completo de backup (JSON): palavras + progresso + scores.
- Export de deck em CSV.
- Import de backup JSON e import de deck CSV.
- Implementação com `expo-document-picker`, `expo-file-system`, `expo-sharing`.

Arquivos-chave:
- `src/domain/backup.ts`
- `src/services/backupFiles.ts`
- `src/state/appStore.ts`

### 2.5 Acessibilidade
- Adicionados `accessibilityRole`, `accessibilityLabel`, `accessibilityHint` e estados em botões/campos críticos.
- Feedback textual explícito de acerto/erro (além de cor).

Arquivos-chave:
- `src/ui/screens/Home.tsx`
- `src/ui/screens/Game.tsx`
- `src/ui/screens/Ranking.tsx`

### 2.6 Governança, segurança e distribuição
- Adicionados:
  - `LICENSE`
  - `CONTRIBUTING.md`
  - `CODE_OF_CONDUCT.md`
  - `SECURITY.md`
  - `data/LICENSE`
  - `data/SOURCES.md`
- Dependabot configurado em `.github/dependabot.yml`.
- CI configurado em `.github/workflows/ci.yml`.
- Ajuste de build Android release para não depender fixamente de assinatura debug.

## 3. Qualidade e validação

Execuções locais:
- `npx tsc --noEmit` -> OK
- `npm test -- --runInBand` -> OK

Status atual dos testes:
- 3 suítes
- 10 testes passando

Cobertura relevante:
- scheduler SRS
- engine de jogo
- serialização/import/export de backup/deck
- comportamento endless + repetição espaçada na sessão

## 4. Pendências técnicas (próximo ciclo)

1. Executar enriquecimento completo com dump Kaikki real (`.jsonl`) e validar qualidade de POS/flexões em amostra humana.
2. Promover `assets/words_v2_enriched.json` a seed principal após QA de conteúdo.
3. Incluir validação automática de deck em CI (schema + campos obrigatórios + licença/fonte).
4. Refinar estratégia de distrações por POS após enriquecimento total do deck (reduzir ruído em MC).

## 5. Riscos e observações
- Licenciamento final de conteúdo ainda exige fechamento formal por fonte/deck (TASL completo).
- Vulnerabilidades `high` transitivas do ecossistema Expo permanecem; `audit` está em nível `critical` para não bloquear pipeline.
- Enriquecimento automático melhora escala, mas não substitui revisão linguística humana (principalmente nuances de registro/contexto).

## 6. Conclusão
O projeto saiu de um quiz de sessão fixa para uma base de aprendizado contínuo com memória por item, repetição espaçada, compartilhamento local e pipeline de evolução de deck. A arquitetura se manteve simples e offline-first, com avanço real em retenção, governança e capacidade de evolução sem backend.
