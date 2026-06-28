/** Flags de desenvolvimento, controladas pela Astro Dev Toolbar (ver dev/). */

export const DEV_NO_SHARE_KEY = 'gd:devNoShare';

/**
 * True quando o toggle de dev "desabilitar native share" está ativo.
 *
 * Em produção `import.meta.env.DEV` é `false` em tempo de build, então a
 * condição inteira é eliminada (dead-code) e o `localStorage` nem é tocado.
 */
export function isNativeShareDisabled(): boolean {
  return import.meta.env.DEV && localStorage.getItem(DEV_NO_SHARE_KEY) === '1';
}
