import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import DemoGrid from './components/DemoGrid.vue'
import './custom.css'

const theme: Theme = {
  ...DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp?.(ctx)

    const { app, siteData } = ctx

    if (typeof window !== 'undefined') {
      const base = siteData.value.base ?? '/'
      const normalizedBase = base.endsWith('/') ? base : `${base}/`

      const setIconVar = (name: string, assetPath: string) => {
        const sanitizedPath = assetPath.replace(/^\/+/, '')
        const url = `${normalizedBase}${sanitizedPath}`
        document.documentElement.style.setProperty(name, `url(${url})`)
      }

      setIconVar('--docs-hero-icon-primary', 'icons/hero-quickstart.svg')
      setIconVar('--docs-hero-icon-secondary', 'icons/hero-demo.svg')
    }

    app.component('DemoGrid', DemoGrid)
  }
}

export default theme
