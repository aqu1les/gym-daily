# Decisões pendentes de revisão

Coisas escolhidas durante a implementação que valem ser revistas no final do projeto.

## Fase 1 — Setup

- **vue-router 5 em vez de 4**: npm `latest` resolveu para 5.0.7 (sucessor estável do 4, mesma API `createRouter`/`RouterView`). Spec pedia v4. Decisão: manter v5. Trocável com `bun add vue-router@^4`.
- **Ícones PWA como SVG**: placeholders `icon-192.svg` e `icon-512.svg` com letras "GD". iOS prefere PNG `apple-touch-icon`. Pode querer trocar por PNG real antes de instalar no iPhone.

## Fase 2 — Composables Dexie

- **`lastSetFor` faz match por `setNumber` exato**: pré-preenche o peso só se a série N da sessão anterior tiver sido feita. Alternativa mais permissiva: pegar qualquer série feita do exercício (boa quando a primeira série é aquecimento com peso diferente). Trocável depois.
- **Reordenação por swap de vizinhos**: `moveRoutine`/`moveExercise` trocam `order` de dois itens em vez de recompactar todos. Suficiente pros botões ↑↓; quando entrar drag-and-drop (Fase 13) provavelmente vamos recompactar.
- **`useHistory.lastSetFor` escaneia 20 sessões**: limite arbitrário pra evitar varrer o histórico inteiro. Se alguém pular um exercício por >20 treinos seguidos o pré-preenchimento some. Aceitável.
