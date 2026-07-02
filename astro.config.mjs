import { defineConfig } from 'astro/config';

import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'MetrologyBase',
      description: 'Independent educational metrology basics, calibration concepts, and practical measurement reference notes.',
      favicon: '/favicon.svg',
      credits: false,
      lastUpdated: false,
      head: [
        { tag: 'meta', attrs: { name: 'theme-color', content: '#0f172a' } },
        { tag: 'meta', attrs: { name: 'robots', content: 'index,follow' } },
        { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
        { tag: 'meta', attrs: { property: 'og:site_name', content: 'MetrologyBase' } },
        { tag: 'meta', attrs: { name: 'description', content: 'Independent educational metrology basics, calibration concepts, and practical measurement reference notes.' } },
      ],
      sidebar: [
        { label: 'Start here', link: '/' },
        { label: 'Metrology basics', link: '/metrology-basics/' },
        { label: 'Pressure calibration', link: '/pressure-calibration/' },
        { label: 'Temperature calibration', link: '/temperature-calibration/' },
        { label: 'Tools', link: '/tools/' },
        { label: 'Buying guides', link: '/buying-guides/' },
        { label: 'Glossary', link: '/glossary/' },
        { label: 'Disclaimer', link: '/disclaimer/' },
      ],
      components: {
        Footer: './src/components/Footer.astro',
      },
    }),
  ],
});
