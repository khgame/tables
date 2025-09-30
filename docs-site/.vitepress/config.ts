import type { DefaultTheme } from 'vitepress'

const themeConfig: DefaultTheme.Config = {
  logo: '/favicon.svg',
  nav: [
    { text: '指南', link: '/guide/overview' },
    { text: '概念', link: '/guide/concepts' },
    { text: '插件', link: '/guide/plugins' },
    { text: '序列化', link: '/guide/serializers' },
    { text: '体验 Demo', link: '/demos/' },
    { text: 'GitHub', link: 'https://github.com/khgame/tables' }
  ],
  sidebar: {
    '/guide/': [
      {
        text: '指南',
        items: [
          { text: '快速开始', link: '/guide/overview' },
          { text: '概念与约定', link: '/guide/concepts' },
          { text: '插件体系', link: '/guide/plugins' },
          { text: '序列化输出', link: '/guide/serializers' }
        ]
      }
    ],
    '/demos/': [
      {
        text: '示例体验',
        items: [
          { text: '概览', link: '/demos/' },
          { text: 'Mini RPG', link: '/demos/minirpg' },
          { text: 'Click Cookies', link: '/demos/click-cookies' },
          { text: 'A Dark Room', link: '/demos/a-dark-room' }
        ]
      }
    ]
  },
  socialLinks: [
    { icon: 'github', link: 'https://github.com/khgame/tables' }
  ],
  footer: {
    message: 'MIT Licensed',
    copyright: 'Copyright © 2025 khgame'
  }
}

const config = {
  lang: 'zh-CN',
  title: 'tables',
  description: '轻量级游戏表格导出管线：Excel => json/js/ts/ts-interface',
  base: '/tables/',
  head: [
    ['meta', { name: 'theme-color', content: '#0f1729' }],
    ['link', { rel: 'icon', href: '/tables/favicon.svg', type: 'image/svg+xml' }]
  ],
  themeConfig
}

export default config
