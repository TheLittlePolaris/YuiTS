import * as tsConfig from 'tsconfig-paths';

tsConfig.register({
  baseUrl: '../',
  paths: {
    '@/*': ['./yui/*']
  }
});
