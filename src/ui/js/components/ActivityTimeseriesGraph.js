const { exportDeps, drawSvgElement, drawCircle, drawLinearPath, coordsToPathData, drawText, drawToolTip } = window.__WTR__

const drawValueWithTooltip  = ({x, y, label, direction, parentNode}) => {
  const tooltipWrapperGroup = drawSvgElement({tag: "g", className: "tooltip_wrapper_group", parent: parentNode})
  drawToolTip({x: x, y: y - 0.0032, text: label, direction, parentNode: tooltipWrapperGroup})
  return drawText({x: x, y: y, dominantBaseline: "middle", text: "0", className: "timeseries_value", parentNode: tooltipWrapperGroup})
}

const dataWindowSize = 16
const dataWindowInterval = 1000
const graphHeight = 0.25

const innerCircleClipPathId = "inner_circle_clip"

const createLinearScale = (domainMin, domainMax, rangeMin, rangeMax) => {
  const domainSize = domainMax - domainMin
  if (domainSize === 0) { return () => rangeMin }
  const rangeSize = rangeMax - rangeMin
  const ratio = rangeSize / domainSize

  return (domainValue) => (domainValue - domainMin) * ratio + rangeMin
}

const createRandomDataWindow = () => {
  const series = []
  const endTime = new Date().setMilliseconds(0).valueOf()
  const startTime = endTime - dataWindowInterval * dataWindowSize
  let maxValue = 0

  for (let time = startTime; time < endTime; time += dataWindowInterval) {
    // const value = Math.floor(Math.random() * 101)
    const value = 0
    if (value > maxValue) { maxValue = value }
    series.push({time, value})
  }

  return series
}

const getSeriesWindowInfo = (series) => {
  const startTime = series.at(1).time
  const endTime = series.at(-1).time
  let maxValue = 0
  series.forEach(({value}) => {
    if (value > maxValue) { maxValue = value }
  })

  return {startTime, endTime, maxValue}
}

class ActivityTimeseriesGraph {
  constructor ({innerRingRadius, parentNode}) {
    this.innerRingRadius = innerRingRadius
    this.parentNode = parentNode
    this.parentNode.innerHTML = ""
    this.dataWindow = window.activityDataWindow || createRandomDataWindow()
    window.activityDataWindow = this.dataWindow
    if (!window.currentActivityCount) { window.currentActivityCount = 0 }
    this.draw()
  }

  draw () {
    const minX = -this.innerRingRadius
    const maxX = this.innerRingRadius
    const width = maxX - minX
    const height = graphHeight
    const minY = -height / 2
    const maxY = minY + height

    const clipPath = drawSvgElement({tag: "clipPath", attributes: {id: innerCircleClipPathId}, parent: this.parentNode})
    drawCircle({cx: 0, cy: 0, r: this.innerRingRadius - 0.005, parentNode: clipPath})
    drawSvgElement({tag: "rect", attributes: {"clip-path": `url(#${innerCircleClipPathId})`, x: minX, y: minY, height, width}, className: "timeseries_bg", parent: this.parentNode})

    const series = this.dataWindow
    const {startTime, endTime, maxValue} = getSeriesWindowInfo(series)

    const maxValueElement = drawValueWithTooltip({x: minX + width / 2, y: minY - 0.08, label: "Max updates in a 1 second window", direction: "above", parentNode: this.parentNode})
    const currentValueElement = drawValueWithTooltip({x: minX + width / 2, y: maxY + 0.095, label: "Updates in last full second", parentNode: this.parentNode})

    let valueScale = createLinearScale(0, maxValue, maxY, minY) // in svg, y increases as it goes down, so we need to flip max and min in the range
    let timeScale = createLinearScale(startTime, endTime, minX, maxX)

    const pathCoords = series.map(({time, value}) => {
      return [timeScale(time), valueScale(value)]
    })

    const graphPath = drawLinearPath({coords: pathCoords, className: "timeseries_path", parentNode: this.parentNode})

    if (window.activityTimeout) { clearTimeout(window.activityTimeout) }
    const onTickUpdate = () => {
      scheduleNextTick()

      console.log("data tick", Date.now())
      const series = this.dataWindow
      const prevEndTime = series.at(-1).time
      const newTime = prevEndTime + dataWindowInterval
      series.shift()
      series.push({time: newTime, value: window.currentActivityCount})
      currentValueElement.textContent = window.currentActivityCount
      window.currentActivityCount = 0

      const pathCoords = series.map(({time, value}) => {
        return [timeScale(time), valueScale(value)]
      })

      const pathData = coordsToPathData(pathCoords)
      graphPath.style.transition = ""
      graphPath.setAttribute("d", pathData)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const {startTime, endTime, maxValue} = getSeriesWindowInfo(series)
          maxValueElement.textContent = maxValue

          valueScale = createLinearScale(0, maxValue, maxY, minY) // in svg, y increases as it goes down, so we need to flip max and min in the range
          timeScale = createLinearScale(startTime, endTime, minX, maxX)

          const pathCoords = series.map(({time, value}) => {
            return [timeScale(time), valueScale(value)]
          })

          const pathData = coordsToPathData(pathCoords)
          graphPath.style.transition = "all 1s linear"
          graphPath.setAttribute("d", pathData)
        })
      })

    }

    const scheduleNextTick = () => {
      const nowMillis = new Date().getMilliseconds()
      const millisUntilNextSecond = 1000 - nowMillis
      window.activityTimeout = setTimeout(onTickUpdate, millisUntilNextSecond)
    }

    scheduleNextTick()
  }

  triggerActivity () {
    window.currentActivityCount++
    console.log("time series graph activity")
  }
}

exportDeps({ActivityTimeseriesGraph})

/*
 *
 */
