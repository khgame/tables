import type { DefaultTheme } from 'vitepress'

const themeConfig: DefaultTheme.Config = {
  logo: '/favicon.svg',
  nav: [
    {
      text: '指南',
      items: [
        { text: '快速开始', link: '/guide/overview' },
        { text: '概念与约定', link: '/guide/concepts' },
        { text: '插件体系', link: '/guide/plugins' },
        { text: '序列化输出', link: '/guide/serializers' },
        { text: '最佳实践', link: '/guide/best-practices' },
        { text: '架构解读', link: '/guide/architecture' },
        { text: '发布与部署', link: '/guide/how-to-publish' }
      ]
    },
    {
      text: '参考',
      items: [
        { text: '概览', link: '/reference/' },
        { text: 'API', link: '/reference/api' },
        { text: 'CLI', link: '/reference/cli' },
        { text: '协议', link: '/reference/protocol' },
        { text: '序列化器注册', link: '/reference/serializer-registry' }
      ]
    },
    { text: '体验 Demo', link: '/demos/' },
    { text: '实用工具', link: '/tools/' },
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
          { text: '序列化输出', link: '/guide/serializers' },
          { text: '最佳实践', link: '/guide/best-practices' },
          { text: '架构解读', link: '/guide/architecture' },
          { text: '发布与部署', link: '/guide/how-to-publish' }
        ]
      }
    ],
    '/reference/': [
      {
        text: '参考',
        items: [
          { text: '概览', link: '/reference/' },
          { text: 'API', link: '/reference/api' },
          { text: 'CLI', link: '/reference/cli' },
          { text: '协议', link: '/reference/protocol' },
          { text: '序列化器注册', link: '/reference/serializer-registry' }
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
          { text: 'A Dark Room', link: '/demos/a-dark-room' },
          { text: 'Arcane Depths', link: '/demos/arcane-depths' },
          { text: 'Neon Aberration', link: '/demos/neon-aberration' }
        ]
      }
    ],
    '/tools/': [
      {
        text: '实用工具',
        items: [
          { text: '概览', link: '/tools/' },
          { text: 'Tileset 切片工具', link: '/tools/tileset-slicer' }
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
