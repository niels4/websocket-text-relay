const { drawSvgElement, constants, wtrActivityDataWindowEmitter, onEvent, dataWindowSize } = __WTR__
const { innerRingRadius } = constants

const parentGroup = document.getElementById("activity_time_series_group")
parentGroup.innerHTML = ""

const animationProps = { duration: 1000, easing: "linear", iterations: 1, fill: "forwards" }

const minX = -innerRingRadius
const width = innerRingRadius * 2
const height = 0.25
const maxY = height / 2
const intervalWidth = width / (dataWindowSize - 2)

const clipId = "time-series-clip"

const clipPath = drawSvgElement({
  tag: "clipPath",
  attributes: { id: clipId },
  parent: parentGroup,
})

drawSvgElement({
  tag: "circle",
  attributes: { r: innerRingRadius },
  parent: clipPath,
})

const clippedGroup = drawSvgElement({
  tag: "g",
  attributes: { "clip-path": `url(#${clipId})` },
  parent: parentGroup,
})

const valuePath = drawSvgElement({
  tag: "path",
  attributes: { d: "" },
  className: "time_series_path",
  parent: clippedGroup,
})

const getValueScale = (maxValue) => (maxValue === 0 ? 0.00001 : height / maxValue)

onEvent(wtrActivityDataWindowEmitter, "data", (data) => {
  valuePath.setAttribute("d", data.path)
  const prevValueScale = getValueScale(data.prevMaxValue)
  const valueScale = getValueScale(data.maxValue)

  const animationKeyFrames = [
    {
      transform: `translateX(${minX}px) translateY(${maxY}px) scaleX(${intervalWidth}) scaleY(${-prevValueScale})`,
    },
    {
      transform: `translateX(${minX - intervalWidth}px) translateY(${maxY}px) scaleX(${intervalWidth}) scaleY(${-valueScale})`,
    },
  ]
  valuePath.animate(animationKeyFrames, animationProps)
})
