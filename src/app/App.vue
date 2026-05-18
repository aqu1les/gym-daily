<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { Toaster } from 'vue-sonner';
import { Home as HomeIcon, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-vue-next';

const route = useRoute();

onMounted(() => {
  document.documentElement.classList.add('dark');
});
</script>

<template>
  <div class="min-h-full flex flex-col bg-background text-foreground">
    <main class="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <RouterView v-slot="{ Component }">
        <component :is="Component" />
      </RouterView>
    </main>

    <nav
      v-if="route.name !== 'session'"
      class="fixed bottom-0 inset-x-0 border-t border-border bg-background/95 backdrop-blur z-40 pb-[env(safe-area-inset-bottom)]"
    >
      <div class="max-w-md mx-auto grid grid-cols-3 h-16">
        <RouterLink
          to="/"
          class="flex flex-col items-center justify-center gap-1 text-xs"
          active-class="text-primary"
        >
          <HomeIcon class="size-5" />
          Rotinas
        </RouterLink>
        <RouterLink
          to="/history"
          class="flex flex-col items-center justify-center gap-1 text-xs"
          active-class="text-primary"
        >
          <HistoryIcon class="size-5" />
          Histórico
        </RouterLink>
        <RouterLink
          to="/settings"
          class="flex flex-col items-center justify-center gap-1 text-xs"
          active-class="text-primary"
        >
          <SettingsIcon class="size-5" />
          Ajustes
        </RouterLink>
      </div>
    </nav>

    <Toaster theme="dark" position="top-center" rich-colors />
  </div>
</template>
