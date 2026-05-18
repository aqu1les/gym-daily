# Decisões pendentes de revisão

Coisas escolhidas durante a implementação que valem ser revistas no final do projeto.

## Fase 1 — Setup

- **vue-router 5 em vez de 4**: npm `latest` resolveu para 5.0.7 (sucessor estável do 4, mesma API `createRouter`/`RouterView`). Spec pedia v4. Decisão: manter v5. Trocável com `bun add vue-router@^4`.
- **Ícones PWA como SVG**: placeholders `icon-192.svg` e `icon-512.svg` com letras "GD". iOS prefere PNG `apple-touch-icon`. Pode querer trocar por PNG real antes de instalar no iPhone.

## Fase 2 — Composables Dexie

- **`lastSetFor` faz match por `setNumber` exato**: pré-preenche o peso só se a série N da sessão anterior tiver sido feita. Alternativa mais permissiva: pegar qualquer série feita do exercício (boa quando a primeira série é aquecimento com peso diferente). Trocável depois.
- **Reordenação por swap de vizinhos**: `moveRoutine`/`moveExercise` trocam `order` de dois itens em vez de recompactar todos. Suficiente pros botões ↑↓; quando entrar drag-and-drop (Fase 13) provavelmente vamos recompactar.
- **`useHistory.lastSetFor` escaneia 20 sessões**: limite arbitrário pra evitar varrer o histórico inteiro. Se alguém pular um exercício por >20 treinos seguidos o pré-preenchimento some. Aceitável.

## Fase 4 — Home

- **`confirm()` nativo no delete**: rápido e ok no MVP, mas quebra a estética. Substituível por `AlertDialog` do shadcn-vue depois.
- **Botão Play visível em todas as rotinas**: na Home, inicia sessão mesmo se vazia (toast de erro aparece no RoutineEditor `startSession`, mas na Home ainda navega). Considerar desabilitar o Play da Home com `useLiveQuery` contando exercícios da rotina, ou redirecionar pro editor quando vazia.
- **`tsConfigPath` removido de components.json**: rejeitado pelo schema do shadcn-vue CLI atual. Sem efeito prático (resolve via tsconfig padrão).

## Fase 5 — RoutineEditor

- **Sem validação de reps**: aceita qualquer string ("8-12", "AMRAP", "10"). Decisão consciente porque a spec permite ambos. Se quiser estruturar (min/max numéricos), refatorar `reps` no schema.
- **Alternativas só por texto livre**: não há sugestão/autocompletar do banco de exercícios existentes. Útil seria sugerir nomes já usados em outras rotinas.

## Fase 6 — WorkoutSession

- **Input de peso desabilita quando série marcada como feita**: previne edição acidental. Tradeoff: pra corrigir, precisa desmarcar primeiro. Alternativa: deixar editável sempre e só travar o `done` timestamp.
- **Sem campo de reps por série**: spec define `reps` como prescrição (string "8-12"), e `SetEntry.reps` é opcional. No MVP só registra peso + feito. Se quiser registrar reps reais por série, adicionar input numérico no grid.
- **Trocar rotina abandona sessão ativa sem confirmação extra**: ao navegar pra outra `/session/:routineId`, a sessão antiga é resetada silenciosamente. Cenário raro mas pode surpreender. Adicionar guard se virar problema.
- **Auto-start ao entrar na rota**: se você atualiza a página no meio do treino e a Fase 9 (persistência) ainda não estiver pronta, perde tudo. Aceitável até Fase 9.
