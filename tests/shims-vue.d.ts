// TypeScript 7 cannot load Vue's language plugin, so plain tsc and the IDE need this to import .vue files. vue-tsc resolves the real file and ignores it.
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent;
  export default component;
}
