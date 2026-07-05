/* GAIA cinematic globe — ~5000 teal particles forming a rotating Earth,
 * brightened near country centroids weighted by gaia_a. Exposes window.GaiaGlobe
 * { setZoom, setMorph, setOpacity, ready } for the scroll story to drive.
 * Degrades gracefully: no init on mobile / no-WebGL / reduced-motion. */
(function () {
  "use strict";
  var TEAL = new THREEcolorSafe();

  function THREEcolorSafe() {
    return { r: 0.05, g: 0.62, b: 0.46 }; // #0D9E76
  }

  // --- guards: skip the heavy globe where inappropriate ---
  function webglOK() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) {
      return false;
    }
  }
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.matchMedia && window.matchMedia("(max-width: 820px)").matches;

  window.GaiaGlobe = { ready: false, setZoom: function () {}, setMorph: function () {}, setOpacity: function () {} };

  if (typeof THREE === "undefined" || !webglOK() || isMobile || reduce) {
    document.documentElement.classList.add("no-globe");
    return; // CSS shows the static fallback backdrop
  }

  // --- compact ISO3 -> [lat, lon] centroid lookup ---
  var C = {
    USA: [39.8, -98.6], CAN: [56.1, -106.3], MEX: [23.6, -102.6], BRA: [-14.2, -51.9], ARG: [-38.4, -63.6],
    CHL: [-35.7, -71.5], COL: [4.6, -74.3], PER: [-9.2, -75.0], VEN: [6.4, -66.6], BOL: [-16.3, -63.6],
    ECU: [-1.8, -78.2], URY: [-32.5, -55.8], PRY: [-23.4, -58.4], GBR: [55.4, -3.4], IRL: [53.4, -8.2],
    FRA: [46.2, 2.2], ESP: [40.5, -3.7], PRT: [39.4, -8.2], DEU: [51.2, 10.4], NLD: [52.1, 5.3],
    BEL: [50.5, 4.5], LUX: [49.8, 6.1], CHE: [46.8, 8.2], AUT: [47.5, 14.6], ITA: [41.9, 12.6],
    GRC: [39.1, 21.8], NOR: [60.5, 8.5], SWE: [60.1, 18.6], FIN: [61.9, 25.7], DNK: [56.3, 9.5],
    ISL: [64.9, -19.0], POL: [51.9, 19.1], CZE: [49.8, 15.5], SVK: [48.7, 19.7], HUN: [47.2, 19.5],
    ROU: [45.9, 24.9], BGR: [42.7, 25.5], HRV: [45.1, 15.2], SVN: [46.2, 14.8], SRB: [44.0, 21.0],
    BIH: [43.9, 17.7], ALB: [41.2, 20.2], MKD: [41.6, 21.7], EST: [58.6, 25.0], LVA: [56.9, 24.6],
    LTU: [55.2, 23.9], UKR: [48.4, 31.2], BLR: [53.7, 27.9], MDA: [47.4, 28.4], RUS: [61.5, 105.3],
    TUR: [38.9, 35.2], GEO: [42.3, 43.4], ARM: [40.1, 45.0], AZE: [40.1, 47.6], KAZ: [48.0, 66.9],
    UZB: [41.4, 64.6], TKM: [38.9, 59.6], KGZ: [41.2, 74.8], TJK: [38.9, 71.3], IRN: [32.4, 53.7],
    IRQ: [33.2, 43.7], SAU: [23.9, 45.1], ARE: [23.4, 53.8], QAT: [25.4, 51.2], KWT: [29.3, 47.5],
    BHR: [26.0, 50.6], OMN: [21.5, 55.9], YEM: [15.6, 48.5], JOR: [30.6, 36.2], LBN: [33.9, 35.9],
    ISR: [31.0, 34.9], PSE: [31.9, 35.2], SYR: [35.0, 38.5], EGY: [26.8, 30.8], LBY: [26.3, 17.2],
    TUN: [33.9, 9.6], DZA: [28.0, 1.7], MAR: [31.8, -7.1], MRT: [21.0, -10.9], SEN: [14.5, -14.5],
    GMB: [13.4, -15.3], GIN: [9.9, -9.7], SLE: [8.5, -11.8], LBR: [6.4, -9.4], CIV: [7.5, -5.5],
    GHA: [7.9, -1.0], TGO: [8.6, 0.8], BEN: [9.3, 2.3], NGA: [9.1, 8.7], NER: [17.6, 8.1],
    BFA: [12.2, -1.6], MLI: [17.6, -3.9], TCD: [15.5, 18.7], CMR: [7.4, 12.4], CAF: [6.6, 20.9],
    GAB: [-0.8, 11.6], COG: [-0.7, 15.8], COD: [-4.0, 21.8], AGO: [-11.2, 17.9], ZMB: [-13.1, 27.8],
    ZWE: [-19.0, 29.2], MWI: [-13.3, 34.3], MOZ: [-18.7, 35.5], TZA: [-6.4, 34.9], KEN: [0.0, 37.9],
    UGA: [1.4, 32.3], RWA: [-1.9, 29.9], BDI: [-3.4, 29.9], ETH: [9.1, 40.5], SOM: [5.2, 46.2],
    SDN: [12.9, 30.2], SSD: [7.0, 30.0], ERI: [15.2, 39.8], DJI: [11.8, 42.6], ZAF: [-30.6, 22.9],
    NAM: [-22.9, 18.5], BWA: [-22.3, 24.7], LSO: [-29.6, 28.2], SWZ: [-26.5, 31.5], MDG: [-18.8, 46.9],
    MUS: [-20.3, 57.6], IND: [20.6, 78.9], PAK: [30.4, 69.3], BGD: [23.7, 90.4], LKA: [7.9, 80.8],
    NPL: [28.4, 84.1], BTN: [27.5, 90.4], AFG: [33.9, 67.7], CHN: [35.9, 104.2], MNG: [46.9, 103.8],
    JPN: [36.2, 138.3], KOR: [35.9, 127.8], PRK: [40.3, 127.5], TWN: [23.7, 121.0], HKG: [22.4, 114.1],
    VNM: [14.1, 108.3], LAO: [19.9, 102.5], KHM: [12.6, 104.9], THA: [15.9, 100.9], MMR: [21.9, 95.96],
    MYS: [4.2, 101.98], SGP: [1.35, 103.8], IDN: [-0.8, 113.9], PHL: [12.9, 121.8], BRN: [4.5, 114.7],
    AUS: [-25.3, 133.8], NZL: [-40.9, 174.9], PNG: [-6.3, 143.9], FJI: [-17.7, 178.1], BRB: [13.2, -59.5],
    JAM: [18.1, -77.3], TTO: [10.7, -61.2], CRI: [9.7, -83.8], PAN: [8.5, -80.8], GTM: [15.8, -90.2],
    HND: [15.2, -86.2], SLV: [13.8, -88.9], NIC: [12.9, -85.2], DOM: [18.7, -70.2], CUB: [21.5, -77.8],
    CYP: [35.1, 33.4], MLT: [35.9, 14.4], LIE: [47.1, 9.5], AND: [42.5, 1.6], MCO: [43.7, 7.4],
    KOS: [42.6, 20.9], MNE: [42.7, 19.4]
  };

  var data = {}; // iso3 -> gaia_a (0..1)
  var maxGaia = 0.5;

  // --- three.js scene ---
  var host = document.getElementById("globe-canvas");
  if (!host) {
    document.documentElement.classList.add("no-globe");
    return;
  }
  var W = host.clientWidth || window.innerWidth;
  var H = host.clientHeight || window.innerHeight;
  var renderer = new THREE.WebGLRenderer({ canvas: host, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W, H, false);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.z = 5.4;

  var N = 5000, R = 2.0;
  var positions = new Float32Array(N * 3);
  var scatter = new Float32Array(N * 3);
  var base = new Float32Array(N * 3); // sphere home
  var colors = new Float32Array(N * 3);

  function latLonToVec(lat, lon, r) {
    var phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
    return [-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)];
  }

  function build() {
    // Fibonacci sphere
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), t = golden * i;
      var x = Math.cos(t) * rad, z = Math.sin(t) * rad;
      var px = x * R, py = y * R, pz = z * R;
      base[i * 3] = px; base[i * 3 + 1] = py; base[i * 3 + 2] = pz;
      positions[i * 3] = px; positions[i * 3 + 1] = py; positions[i * 3 + 2] = pz;
      // scatter target: pushed outward + jittered
      var s = 1.7 + Math.random() * 1.8;
      scatter[i * 3] = px * s + (Math.random() - 0.5) * 1.2;
      scatter[i * 3 + 1] = py * s + (Math.random() - 0.5) * 1.2;
      scatter[i * 3 + 2] = pz * s + (Math.random() - 0.5) * 1.2;

      // brightness: base + proximity to bright (high gaia_a) centroids
      var b = 0.28;
      for (var iso in data) {
        var cc = C[iso]; if (!cc) continue;
        var v = latLonToVec(cc[0], cc[1], R);
        var dx = px - v[0], dy = py - v[1], dz = pz - v[2];
        var d2 = dx * dx + dy * dy + dz * dz;
        var w = Math.exp(-d2 * 3.0) * (data[iso] / maxGaia);
        if (w > 0.01) b += w * 0.9;
      }
      b = Math.min(1.15, b);
      colors[i * 3] = TEAL.r * b + b * 0.02;
      colors[i * 3 + 1] = TEAL.g * b + b * 0.05;
      colors[i * 3 + 2] = TEAL.b * b + b * 0.03;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    var mat = new THREE.PointsMaterial({
      size: 0.028, vertexColors: true, transparent: true, opacity: 1,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
    });
    points = new THREE.Points(geo, mat);
    group.add(points);
    window.GaiaGlobe.ready = true;
  }

  var group = new THREE.Group();
  scene.add(group);
  var points = null;

  // state driven by the story
  var zoom = 1, morph = 0, opacity = 1, targetZoom = 1, targetMorph = 0, targetOpacity = 1;
  var mx = 0, my = 0, tmx = 0, tmy = 0;

  window.GaiaGlobe.setZoom = function (v) { targetZoom = v; };
  window.GaiaGlobe.setMorph = function (v) { targetMorph = Math.max(0, Math.min(1, v)); };
  window.GaiaGlobe.setOpacity = function (v) { targetOpacity = Math.max(0, Math.min(1, v)); };

  window.addEventListener("pointermove", function (e) {
    tmx = (e.clientX / window.innerWidth - 0.5);
    tmy = (e.clientY / window.innerHeight - 0.5);
  });

  function onResize() {
    W = host.clientWidth || window.innerWidth; H = host.clientHeight || window.innerHeight;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", onResize);

  var last = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    if (now - last < 16) return; last = now; // cap ~60fps
    if (!points) return;
    zoom += (targetZoom - zoom) * 0.06;
    morph += (targetMorph - morph) * 0.08;
    opacity += (targetOpacity - opacity) * 0.08;
    mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;

    group.rotation.y += 0.0016;
    group.rotation.x = my * 0.4;
    group.rotation.z = 0;
    group.position.x = mx * 0.5;
    var s = zoom;
    group.scale.set(s, s, s);
    points.material.opacity = opacity;

    if (morph > 0.001) {
      var p = points.geometry.attributes.position.array;
      for (var i = 0; i < N * 3; i++) p[i] = base[i] + (scatter[i] - base[i]) * morph;
      points.geometry.attributes.position.needsUpdate = true;
    } else if (points.geometry.attributes.position.array[0] !== base[0]) {
      points.geometry.attributes.position.array.set(base);
      points.geometry.attributes.position.needsUpdate = true;
    }
    renderer.render(scene, camera);
  }

  // --- load data then build ---
  function parseCSV(text) {
    var lines = text.split(/\r?\n/).filter(function (l) { return l && l[0] !== "#"; });
    if (!lines.length) return;
    var head = lines[0].split(",");
    var iIso = head.indexOf("iso3"), iG = head.indexOf("gaia_a");
    if (iIso < 0 || iG < 0) return;
    for (var i = 1; i < lines.length; i++) {
      var cells = lines[i].split(",");
      var iso = cells[iIso], g = parseFloat(cells[iG]);
      if (iso && !isNaN(g)) { data[iso] = g; if (g > maxGaia) maxGaia = g; }
    }
  }

  fetch("data/gaia_countries.csv")
    .then(function (r) { return r.text(); })
    .then(function (t) { parseCSV(t); })
    .catch(function () {})
    .finally(function () { build(); onResize(); requestAnimationFrame(tick); });
})();
