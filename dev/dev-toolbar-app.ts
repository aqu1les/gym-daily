import { defineToolbarApp } from 'astro/toolbar';
import { DEV_NO_SHARE_KEY } from '@/app/lib/devFlags';

/** O <astro-dev-toolbar-toggle> expõe o checkbox interno em `.input`. */
type ToolbarToggle = HTMLElement & { input: HTMLInputElement };

export default defineToolbarApp({
  init(canvas, app) {
    const win = document.createElement('astro-dev-toolbar-window');
    win.innerHTML = `
      <style>
        .title { font-size: 14px; font-weight: 600; margin: 0 0 4px; }
        .subtitle { font-size: 12px; opacity: 0.6; margin: 0 0 16px; }
        .row { display: flex; align-items: center; gap: 10px; }
        .row label { font-size: 13px; }
        .hint { font-size: 11px; opacity: 0.5; margin: 6px 0 0; }
      </style>
      <p class="title">Gym — Dev Toggles</p>
      <p class="subtitle">Opções só de desenvolvimento. Não afetam produção.</p>
      <div class="row">
        <astro-dev-toolbar-toggle id="no-share"></astro-dev-toolbar-toggle>
        <label for="no-share">Desabilitar native share</label>
      </div>
      <p class="hint">Força o fluxo de copiar link / diálogo, mesmo onde o
      <code>navigator.share</code> existe.</p>
    `;
    canvas.appendChild(win);

    const toggle = win.querySelector<ToolbarToggle>('#no-share');
    if (!toggle) return;

    const isOn = (): boolean => localStorage.getItem(DEV_NO_SHARE_KEY) === '1';

    toggle.input.checked = isOn();
    app.toggleState({ state: isOn() });

    // O <input> real vive no shadow DOM do toggle, e o evento `change` não é
    // `composed` — não escapa para o host. Por isso escutamos no input direto.
    toggle.input.addEventListener('change', () => {
      const checked = toggle.input.checked;
      if (checked) localStorage.setItem(DEV_NO_SHARE_KEY, '1');
      else localStorage.removeItem(DEV_NO_SHARE_KEY);
      app.toggleState({ state: checked });
    });
  },
});
