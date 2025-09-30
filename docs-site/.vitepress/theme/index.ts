import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import DemoGrid from './components/DemoGrid.vue'
import './custom.css'

const theme: Theme = {
  ...DefaultTheme,
  enhanceApp({ app }) {
    DefaultTheme.enhanceApp?.({ app })
    app.component('DemoGrid', DemoGrid)
  }
}

export default theme
