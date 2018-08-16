module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ['ktsn-vue'],
  rules: {
    'no-console': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  }
}
