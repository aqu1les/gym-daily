import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import Home from './views/Home.vue';
import RoutineEditor from './views/RoutineEditor.vue';
import WorkoutSession from './views/WorkoutSession.vue';
import History from './views/History.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: Home },
  { path: '/routine/:id', name: 'routine', component: RoutineEditor, props: true },
  { path: '/session/:routineId', name: 'session', component: WorkoutSession, props: true },
  { path: '/history', name: 'history', component: History },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
