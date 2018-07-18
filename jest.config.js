module.exports = {
  transform: {
    '^.+\\.[jt]s$': 'ts-jest',
    '^.+\\.vue$': 'vue-jest'
  },
  transformIgnorePatterns: ['node_modules/(?!(sinai/lib)/)'],
  setupFiles: ['<rootDir>/test/setup.ts'],
  testRegex: '/test/.+\\.spec\\.(js|ts)$',
  moduleNameMapper: {
    '^@/(.+)$': '<rootDir>/src/$1',
    '^vue$': 'vue/dist/vue.runtime.common.js'
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'vue'],
  collectCoverageFrom: ['src/**/*.{ts,vue}'],
  globals: {
    'ts-jest': {
      tsConfigFile: 'tsconfig.test.json'
    }
  }
}
