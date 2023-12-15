/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts',

  transform: {
    '^.+\\.vue$': '@vue/vue2-jest',
    '.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$':
      'jest-transform-stub'
  },

  transformIgnorePatterns: ['node_modules/(?!(sinai/lib))'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  testRegex: '/tests/.+\\.spec\\.(js|ts)x?$',

  testEnvironment: 'jsdom',

  moduleNameMapper: {
    '^@/(.+)$': '<rootDir>/src/$1',
    '^vue$': 'vue/dist/vue.runtime.common.js'
  },

  moduleFileExtensions: ['ts', 'js', 'json', 'vue', 'jsx', 'tsx'],

  snapshotSerializers: ['jest-serializer-vue']
}
