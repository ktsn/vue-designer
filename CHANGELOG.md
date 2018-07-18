<a name="0.6.0"></a>
# [0.6.0](https://github.com/ktsn/vue-designer/compare/v0.5.0...v0.6.0) (2018-07-18)


### Bug Fixes

* avoid to show empty preview when changing to active editor of non-vue file ([#42](https://github.com/ktsn/vue-designer/issues/42)) ([b1c230b](https://github.com/ktsn/vue-designer/commit/b1c230b))


### Features

* allow to include shared styles ([#41](https://github.com/ktsn/vue-designer/issues/41)) ([6b07626](https://github.com/ktsn/vue-designer/commit/6b07626))
* make animation and keyframes scoped ([#37](https://github.com/ktsn/vue-designer/issues/37)) ([e81cd6b](https://github.com/ktsn/vue-designer/commit/e81cd6b))
* render slot contents ([#43](https://github.com/ktsn/vue-designer/issues/43)) ([c5a398d](https://github.com/ktsn/vue-designer/commit/c5a398d))
* resolve a template tag of an injected named slot ([#45](https://github.com/ktsn/vue-designer/issues/45)) ([2102711](https://github.com/ktsn/vue-designer/commit/2102711))
* resolve template element having control directives ([#44](https://github.com/ktsn/vue-designer/issues/44)) ([4f274fc](https://github.com/ktsn/vue-designer/commit/4f274fc))
* resolve v-model on select element ([#35](https://github.com/ktsn/vue-designer/issues/35)) ([194a167](https://github.com/ktsn/vue-designer/commit/194a167))
* support rendering scoped slots ([#47](https://github.com/ktsn/vue-designer/issues/47)) ([9cbbae5](https://github.com/ktsn/vue-designer/commit/9cbbae5))



<a name="0.5.0"></a>
# [0.5.0](https://github.com/ktsn/vue-designer/compare/v0.4.0...v0.5.0) (2018-06-03)


### Bug Fixes

* handle attribute selectors having double quotes in their value correctly ([5f2e950](https://github.com/ktsn/vue-designer/commit/5f2e950))


### Features

* allow to modify props and data in preview pane ([#32](https://github.com/ktsn/vue-designer/issues/32)) ([d4442d2](https://github.com/ktsn/vue-designer/commit/d4442d2))
* resolve v-model on checkbox element ([f83742f](https://github.com/ktsn/vue-designer/commit/f83742f))
* resolve v-model on radio element ([ce934b1](https://github.com/ktsn/vue-designer/commit/ce934b1))
* support insensitive selector of css ([68be320](https://github.com/ktsn/vue-designer/commit/68be320))


### UI Improvements

* always show scope information ([09faa59](https://github.com/ktsn/vue-designer/commit/09faa59))
* normalize scale delta during various environment ([#33](https://github.com/ktsn/vue-designer/issues/33)) ([2aab18c](https://github.com/ktsn/vue-designer/commit/2aab18c))


<a name="0.4.0"></a>
# [0.4.0](https://github.com/ktsn/vue-designer/compare/v0.3.0...v0.4.0) (2018-05-05)


### Bug Fixes

* limit viewport size to avoid going minus value (fix [#28](https://github.com/ktsn/vue-designer/issues/28)) ([dc43f42](https://github.com/ktsn/vue-designer/commit/dc43f42))
* print expression if it is resolved as null or undefined ([a4ace5c](https://github.com/ktsn/vue-designer/commit/a4ace5c))


### Features

* allow to pass props to child components ([#29](https://github.com/ktsn/vue-designer/issues/29)) ([3989f24](https://github.com/ktsn/vue-designer/commit/3989f24))
* resolve assets in preview ([#31](https://github.com/ktsn/vue-designer/issues/31)) ([668450c](https://github.com/ktsn/vue-designer/commit/668450c))
* show guide of selected node ([#30](https://github.com/ktsn/vue-designer/issues/30)) ([c84f20b](https://github.com/ktsn/vue-designer/commit/c84f20b))



<a name="0.3.0"></a>
# [0.3.0](https://github.com/ktsn/vue-designer/compare/v0.2.2...v0.3.0) (2018-04-20)


### Bug Fixes

* avoid adding a new declaration when finish editing existing style ([#21](https://github.com/ktsn/vue-designer/issues/21)) ([1ddcc1d](https://github.com/ktsn/vue-designer/commit/1ddcc1d))
* avoid clashing by ECONNRESET ([#25](https://github.com/ktsn/vue-designer/issues/25)) ([1dd6dab](https://github.com/ktsn/vue-designer/commit/1dd6dab))
* fix scoped style leakage ([de82d01](https://github.com/ktsn/vue-designer/commit/de82d01))


### Features

* enable to zoom viewport with pinch ([#22](https://github.com/ktsn/vue-designer/issues/22)) ([fbf8156](https://github.com/ktsn/vue-designer/commit/fbf8156))
* improve viewport scrolling ([#24](https://github.com/ktsn/vue-designer/issues/24)) ([b99f861](https://github.com/ktsn/vue-designer/commit/b99f861))
* resizable viewport ([#19](https://github.com/ktsn/vue-designer/issues/19)) ([98bd2fe](https://github.com/ktsn/vue-designer/commit/98bd2fe))



<a name="0.2.2"></a>
## [0.2.2](https://github.com/ktsn/vue-designer/compare/v0.2.1...v0.2.2) (2018-03-22)


### UI Improvements

* focus a new declaration prop automatically ([#18](https://github.com/ktsn/vue-designer/issues/18)) ([0374aeb](https://github.com/ktsn/vue-designer/commit/0374aeb))



<a name="0.2.1"></a>
## [0.2.1](https://github.com/ktsn/vue-designer/compare/v0.2.0...v0.2.1) (2018-03-21)


### Bug Fixes

* add semi-colon to each declaration ([#15](https://github.com/ktsn/vue-designer/issues/15)) ([e83fe23](https://github.com/ktsn/vue-designer/commit/e83fe23))
* avoid to make input caret jump during editing declaration ([#16](https://github.com/ktsn/vue-designer/issues/16)) ([dd09ab6](https://github.com/ktsn/vue-designer/commit/dd09ab6))
* prevent to add a declaration when clicking existing declaration values ([#14](https://github.com/ktsn/vue-designer/issues/14)) ([8c8de9f](https://github.com/ktsn/vue-designer/commit/8c8de9f))



<a name="0.2.0"></a>
## [0.2.0](https://github.com/ktsn/vue-designer/compare/v0.1.0...v0.2.0) (2018-03-21)


### Bug Fixes

* match selected node and style rules in client side ([#8](https://github.com/ktsn/vue-designer/issues/8)) ([031ebad](https://github.com/ktsn/vue-designer/commit/031ebad))


### Features

* add / remove declaration in preview ([#11](https://github.com/ktsn/vue-designer/issues/11)) ([decd3cb](https://github.com/ktsn/vue-designer/commit/decd3cb))
* support updating style declaration in preview ([#6](https://github.com/ktsn/vue-designer/issues/6)) ([50e56d3](https://github.com/ktsn/vue-designer/commit/50e56d3))



<a name="0.1.0"></a>
## 0.1.0 (2018-02-28)

Initial release
