const iconsWrapper = document.createElement('div')
iconsWrapper.style.display = 'none'

// Load all the SVG symbols
const icons = (require as any).context(
  'raw-loader!material-design-icons/sprites/svg-sprite',
  false,
  /svg-sprite-(\w+)-symbol\.svg$/i
)

icons.keys().forEach((key: any) => {
  const result = icons(key)
  iconsWrapper.innerHTML += result
})

document.body.appendChild(iconsWrapper)
