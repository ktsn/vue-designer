import action from 'material-design-icons/sprites/svg-sprite/svg-sprite-action-symbol.svg?raw'
import content from 'material-design-icons/sprites/svg-sprite/svg-sprite-content-symbol.svg?raw'

const iconsWrapper = document.createElement('div')
iconsWrapper.style.display = 'none'

// Load all the SVG symbols
const icons = [action, content]

icons.forEach((icon) => {
  iconsWrapper.innerHTML += icon
})

document.body.appendChild(iconsWrapper)
