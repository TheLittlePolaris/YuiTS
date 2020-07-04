import { register } from 'tsconfig-paths'
;(() => {
  register({
    baseUrl: '../',
    paths: {
      '@/*': ['./yui/*'],
      'config-service': ['./yui/config-service'],
    },
  })
})()
