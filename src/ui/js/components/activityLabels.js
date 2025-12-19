const { drawText, wtrActivityDataWindowEmitter, onEvent, constants } = __WTR__
const { innerRingRadius } = constants

const parentGroup = document.getElementById("activity_labels_group")
parentGroup.innerHTML = ""

const valuePadding = 0.068
const labelPadding = 0.14

drawText({
  text: "Max",
  y: -innerRingRadius + labelPadding,
  className: "small_label",
  parent: parentGroup,
})

const maxValueText = drawText({
  text: "0",
  y: -innerRingRadius + valuePadding,
  className: "time_series_value",
  parent: parentGroup,
})

drawText({
  text: "Updates / second",
  y: innerRingRadius - labelPadding,
  className: "small_label",
  parent: parentGroup,
})

const currentValueText = drawText({
  text: "0",
  y: innerRingRadius - valuePadding,
  className: "time_series_value",
  parent: parentGroup,
})

onEvent(wtrActivityDataWindowEmitter, "data", ({ maxValue, currentValue }) => {
  maxValueText.textContent = maxValue
  currentValueText.textContent = currentValue
})
