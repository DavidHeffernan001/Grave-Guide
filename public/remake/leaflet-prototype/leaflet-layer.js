(function () {
  const leafletCss = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  const leafletJs = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  const cemeteryBounds = [
    [54.25825, -8.46735],
    [54.26062, -8.46215],
  ];

  const frame = document.querySelector("#prototypeFrame");
  const leafletBlockBackup = {
    selectedBlockId: "A",
    blockVisualMode: "strips",
    blocks: [
      {
        id: "A",
        cemeteryId: "sligo-town-cemetery",
        name: "Block A",
        physicalStrips: 9,
        rowsPerStrip: 2,
        stripRowCounts: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2 },
        blockTemplate: "standard-2",
        logicalRows: 18,
        rowPlotCounts: {
          1: 26,
          2: 26,
          3: 32,
          4: 32,
          5: 32,
          6: 32,
          7: 32,
          8: 32,
          9: 32,
          10: 32,
          11: 32,
          12: 32,
          13: 32,
          14: 32,
          15: 32,
          16: 32,
          17: 32,
          18: 32,
        },
        rowRules: [
          { rows: [1, 2], plotsPerRow: 26 },
          { rows: [3, 18], plotsPerRow: 32 },
        ],
        calibration: {
          x: 75.8,
          y: 22.2,
          width: 97,
          height: 121,
          rotate: 39,
          cutout: { x: -2, y: -1, width: 10, height: 15 },
        },
      },
      {
        id: "B",
        cemeteryId: "sligo-town-cemetery",
        name: "Block B",
        physicalStrips: 10,
        rowsPerStrip: 2,
        stripRowCounts: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2 },
        blockTemplate: "standard-2",
        logicalRows: 20,
        rowPlotCounts: {
          1: 18,
          2: 18,
          3: 18,
          4: 18,
          5: 18,
          6: 18,
          7: 18,
          8: 18,
          9: 18,
          10: 18,
          11: 18,
          12: 18,
          13: 18,
          14: 18,
          15: 18,
          16: 18,
          17: 18,
          18: 18,
          19: 18,
          20: 18,
        },
        rowRules: [{ rows: [1, 20], plotsPerRow: 18 }],
        calibration: {
          x: 91.1,
          y: 31.7,
          width: 109,
          height: 60,
          rotate: 39,
          cutout: { x: 0, y: 0, width: 0, height: 0 },
        },
      },
      {
        id: "C",
        cemeteryId: "sligo-town-cemetery",
        name: "Block C",
        physicalStrips: 1,
        rowsPerStrip: 2,
        stripRowCounts: { 1: 2 },
        blockTemplate: "standard-2",
        logicalRows: 2,
        rowPlotCounts: { 1: 32, 2: 32 },
        rowRules: [{ rows: [1, 2], plotsPerRow: 32 }],
        calibration: {
          x: 100.3,
          y: 26.4,
          width: 111,
          height: 63,
          rotate: 39,
          cutout: { x: 0, y: 0, width: 0, height: 0 },
        },
      },
    ],
  };

  localStorage.setItem("graveguide-sligo-block-layout", JSON.stringify(leafletBlockBackup));
  frame.src = "../index.html?map=leaflet";

  function loadScript(doc, src) {
    return new Promise((resolve, reject) => {
      const script = doc.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      doc.head.append(script);
    });
  }

  function loadStyle(doc, href) {
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    doc.head.append(link);
  }

  function addLeafletStyles(doc) {
    const style = doc.createElement("style");
    style.textContent = `
      .osm-map iframe,
      .osm-loading {
        display: none !important;
      }

      .leaflet-test-map {
        position: absolute;
        inset: -180px -180px -260px -240px;
        z-index: 0;
        filter: saturate(0.78) contrast(0.96) brightness(1.03);
        pointer-events: none;
      }

      .leaflet-test-map .leaflet-control-container {
        display: none;
      }

      .map-transform > :not(.leaflet-test-map) {
        position: absolute;
      }
    `;
    doc.head.append(style);
  }

  function installLeaflet(doc) {
    const mapTransform = doc.querySelector("[data-map-transform]");
    if (!mapTransform || doc.querySelector(".leaflet-test-map")) return;

    const mapEl = doc.createElement("div");
    mapEl.className = "leaflet-test-map";
    mapTransform.prepend(mapEl);

    const map = doc.defaultView.L.map(mapEl, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
    });

    doc.defaultView.L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      minZoom: 15,
      maxZoom: 21,
    }).addTo(map);

    map.fitBounds(cemeteryBounds, {
      paddingTopLeft: [120, 84],
      paddingBottomRight: [80, 170],
      animate: false,
    });

    doc.defaultView.setTimeout(() => map.invalidateSize(), 250);
    doc.defaultView.addEventListener("resize", () => map.invalidateSize());
  }

  frame.addEventListener("load", async () => {
    const doc = frame.contentDocument;
    if (!doc) return;

    loadStyle(doc, leafletCss);
    addLeafletStyles(doc);

    try {
      if (!doc.defaultView.L) {
        await loadScript(doc, leafletJs);
      }
      installLeaflet(doc);
    } catch {
      const note = doc.createElement("div");
      note.textContent = "Leaflet map could not load. Check internet access.";
      note.style.cssText =
        "position:absolute;left:18px;bottom:18px;z-index:80;padding:10px 12px;border-radius:12px;background:#fff;color:#69736e;font:700 12px system-ui;box-shadow:0 12px 30px rgba(0,0,0,.12)";
      doc.querySelector(".osm-map")?.append(note);
    }
  });
})();
