import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json' with { type: 'json' }

export default defineManifest({
  manifest_version: 3,
  name: 'Bug Recorder',
  description: pkg.description,
  version: pkg.version,
  icons: {
    16: 'public/icon16.png',
    32: 'public/icon32.png',
    48: 'public/icon48.png',
    128: 'public/icon128.png',
  },
  action: {
    default_icon: {
      16: 'public/icon16.png',
      32: 'public/icon32.png',
    },
    default_popup: 'src/popup/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  permissions: [
    'debugger',
    'tabCapture',
    'downloads',
    'storage',
    'offscreen',
    'alarms',
  ],
  host_permissions: ['<all_urls>'],
})
