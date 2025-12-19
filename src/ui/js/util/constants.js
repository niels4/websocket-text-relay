const { exportDeps, evalOnChange } = window.__WTR__

evalOnChange(["js/components/statusRing.js", "js/components/sessionWedges.js"])

const constants = {
  innerRingRadius: 0.33,
  outerRingRadius: 0.6,
  outerArcSize: 0.175,
  dataWindowSize: 16,
  maxSessionWedges: 5,
}

exportDeps({ constants })
