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

## Fase 7 — RestTimer

- **AudioContext criado a cada beep**: gera/fecha um contexto por vez. Mais simples que reaproveitar, e evita problema de contexto suspenso depois de muito tempo sem interação. Custo de ~1ms negligível, mas se notar latência podemos cachear.
- **Beep não respeita "silencioso" do device em alguns browsers**: Web Audio toca mesmo no modo silencioso em desktop; iOS Safari respeita o switch físico. Aceitável — vibração é o sinal principal no mobile.
- **Sem opção de "auto-start na primeira série"**: timer só dispara após marcar feito. Spec não pede botão "iniciar manual"; se você quiser começar o descanso antes de marcar (raro), precisaríamos adicionar.
- **Wake lock não tem fallback**: em browsers sem suporte (Safari iOS antigo, Firefox em algumas plataformas), a tela desliga normalmente. Aceitável dado a Wake Lock API ser amplamente suportada agora.

## Fase 8 — Combo + Alternativas

- **Substituição é só display name**: `SetEntry.exerciseId` continua o original, então o histórico mostra o exercício prescrito (não o substituído). Se quiser registrar "fez X em vez de Y", precisamos adicionar `actualName?: string` em `SetEntry`. Tradeoff: mais info vs. mais ruído no histórico.
- **Alternativas pegam sets/reps/rest do original**: como alternatives são strings (não Exercise records), o substituto herda o volume/descanso. Bom o suficiente quando a alt é equivalente (ex: supino reto ↔ supino inclinado); ruim se a alt tem outro padrão.
- **Botão "Trocar" só aparece se há alternativas cadastradas ou substituição ativa**: evita poluir o card de exercício "puro". Se quiser sempre permitir trocar (mesmo digitando uma alt nova), precisamos adicionar input livre no sheet.

## Fase 11 — Histórico

- **Sessão guarda só `exerciseId`, não snapshot do exercício**: se você editar/renomear/excluir o exercício depois, o histórico mostra o estado atual (ou "Exercício excluído"). Tradeoff: economia de espaço vs. imutabilidade histórica. Aceito por enquanto.
- **Sem filtros**: lista plana cronológica reversa. Quando o histórico crescer, vamos querer filtrar por rotina/intervalo.
- **Sem estatísticas (volume, PRs)**: spec não pede; Fase 13 (polimento) ou pós-MVP.

## Fase 12 — Export/Import

- **Import recarrega a página inteira**: jeito mais seguro de resetar todos os `liveQuery` que estavam apontando pro DB antigo. Alternativa: re-emitir as queries manualmente, mas é frágil. Custo: ~1s de flash.
- **Sem merge no import**: é sempre "wipe + restaurar". Útil pra backup/restore puro; ruim se você quiser combinar dois devices. Aceito por enquanto.
- **Backup expõe IDs UUID**: trivial de inspecionar mas sem dados sensíveis no esquema atual.

## Fase 13 — Polimento (pulada no MVP)

Não implementadas, ficam como backlog:

- **Drag-and-drop** (`vue-draggable-plus`) para reordenar rotinas/exercícios. Botões ↑↓ continuam funcionando.
- **Transições entre exercícios** (slide ao navegar prev/next na sessão).
- **Tema escuro automático** (`prefers-color-scheme`): hoje o `App.vue` força `.dark` no mount. Pra respeitar o SO, basta remover essa linha — os tokens já têm light mode definidos no `:root`.
