import type { App } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { router } from './router';
import '@/styles/global.css';
import 'vue-sonner/style.css';

export default (app: App): void => {
  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  app.use(pinia);
  app.use(router);
};
