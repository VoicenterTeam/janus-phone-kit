module.exports = {
  locales: {
    '/': {
      lang: 'en-US',
      title: 'Janus Phone Kit',
      description: ''
    }
  },
  head: [
    ['link', { rel: 'stylesheet', href: 'https://unpkg.com/tailwindcss@^1.2/dist/tailwind.min.css'}]
  ],
  themeConfig: {
    repo: '/VoicenterTeam/janus-phone-kit',
    docsDir: 'docs',
    locales: {
      '/': {
        label: 'English',
        selectText: 'Languages',
        editLinkText: 'Edit this page on GitHub',
        nav: [{
          text: 'Release Notes',
          link: 'https://github.com/VoicenterTeam/janus-phone-kit/releases'
        }],
        sidebar: [
          {
            title: 'Demo',
            path: '/demo.md',
            sidebarDepth: 2
          }
        ]
      }
    }
  }
}
