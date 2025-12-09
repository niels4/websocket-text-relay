const { exportDeps, evalOnChange } = window.__WTR__

evalOnChange(["js/components/statusRing.js"])

const constants = {
  innerRingRadius: 0.33,
  outerRingRadius: 0.6,
  outerArcSize: 0.175,
}

exportDeps({ constants })
