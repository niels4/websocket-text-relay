const { drawSvgElement, constants, wtrActivityDataWindowEmitter, onEvent } = __WTR__
const { innerRingRadius } = constants

const parentGroup = document.getElementById("activity_time_series_group")
parentGroup.innerHTML = ""

const animationProps = { duration: 1000, easing: "linear", iterations: 1, fill: "forwards" }

// const animationKeyFrames = [
//   {
//     transform: `translateX(${minX}px) translateY(${maxY}px) scaleX(${intervalWidth}) scaleY(${-state.prevValueScale})`,
//   },
//   {
//     transform: `translateX(${minX - intervalWidth}px) translateY(${maxY}px) scaleX(${intervalWidth}) scaleY(${-valueScale})`,
//   },
// ]

const animationKeyFrames = [
  {
    transform: `translateX(0)`,
  },
  {
    transform: `translateX(${innerRingRadius}px)`,
  },
]

const minX = -innerRingRadius
const width = innerRingRadius * 2
const height = innerRingRadius * 0.8
const minY = -height / 2
const maxY = height / 2

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

const testDot = drawSvgElement({
  tag: "circle",
  attributes: { r: 0.04, fill: "var(--color-tangerine-sunset)" },
  parent: clippedGroup,
})

// const clipRectAttributes = { x: minX, width, y: minY, height }
// drawSvgElement({
//   tag: "rect",
//   attributes: { ...clipRectAttributes, stroke: "white" },
//   parent: parentGroup,
// })

testDot.animate(animationKeyFrames, animationProps)

onEvent(wtrActivityDataWindowEmitter, "data", (data) => {
  console.log("data window", data.at(-2))
})
