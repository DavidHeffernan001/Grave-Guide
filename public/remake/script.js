const workspace = document.querySelector(".workspace");
const screen = document.querySelector("[data-screen]");
const panels = {
  welcome: document.querySelector(".welcome-panel"),
  permission: document.querySelector(".permission-panel"),
  search: document.querySelector(".search-panel"),
  selected: document.querySelector(".selected-panel"),
  route: document.querySelector(".route-panel"),
};
const searchInput = document.querySelector("#nameSearch");
const modeButtons = [...document.querySelectorAll("[data-mode-option]")];
const adminModeStatus = document.querySelector("#adminModeStatus");
const adminSaveTokenInput = document.querySelector("#adminSaveToken");
const adminSaveStatus = document.querySelector("#adminSaveStatus");
const stateButtons = [...document.querySelectorAll(".state-button")];
const flowSteps = [...document.querySelectorAll(".flow-step")];
const cemeteryCountValue = document.querySelector("#cemeteryCountValue");
const activeCemeteryName = document.querySelector("#activeCemeteryName");
const cemeterySelect = document.querySelector("#cemeterySelect");
const cemeteryOrgValue = document.querySelector("#cemeteryOrgValue");
const addCemeteryButton = document.querySelector("#addCemetery");
const addCemeteryStatus = document.querySelector("#addCemeteryStatus");
const entranceCountValue = document.querySelector("#entranceCountValue");
const recordCountValue = document.querySelector("#recordCountValue");
const mapArea = document.querySelector(".osm-map");
const mapTransform = document.querySelector("[data-map-transform]");
const cemeteryLeafletMap = document.querySelector("#cemeteryLeafletMap");
const mapOverlayNote = document.querySelector(".map-overlay-note");
const allowLocationButton = document.querySelector("#allowLocation");
const locateButton = document.querySelector(".locate-button");
const locationStatus = document.querySelector("#locationStatus");
const editableBlock = document.querySelector("[data-editable-block='A']");
const blockSelect = document.querySelector("#blockSelect");
const addBlockButton = document.querySelector("#addBlock");
const saveBlocksButton = document.querySelector("#saveBlocks");
const deleteBlockButton = document.querySelector("#deleteBlock");
const blockVisualModeInput = document.querySelector("#blockVisualMode");
const activeBlockName = document.querySelector("#activeBlockName");
const blockSaveStatus = document.querySelector("#blockSaveStatus");
const blockAdjustments = document.querySelector(".block-adjustments");
const toggleBlockControlsButton = document.querySelector("#toggleBlockControls");
const cutoutControls = document.querySelector(".cutout-controls");
const toggleCutoutControlsButton = document.querySelector("#toggleCutoutControls");
const widthInput = document.querySelector("#blockWidth");
const heightInput = document.querySelector("#blockHeight");
const rotateInput = document.querySelector("#blockRotate");
const blockShapeInput = document.querySelector("#blockShape");
const blockTemplateInput = document.querySelector("#blockTemplate");
const stripsInput = document.querySelector("#blockStrips");
const rowsInput = document.querySelector("#blockRows");
const cutoutInputs = {
  x: document.querySelector("#cutoutX"),
  y: document.querySelector("#cutoutY"),
  width: document.querySelector("#cutoutWidth"),
  height: document.querySelector("#cutoutHeight"),
};
const resetBlockButton = document.querySelector("#resetBlockA");
const blockPositionValue = document.querySelector("#blockPositionValue");
const blockSizeValue = document.querySelector("#blockSizeValue");
const blockCutValue = document.querySelector("#blockCutValue");
const rowSummary = document.querySelector(".row-summary");
const rowCountEditor = document.querySelector(".row-count-editor");
const toggleRowCountsButton = document.querySelector("#toggleRowCounts");
const rowCountList = document.querySelector("#rowCountList");
const stripRowEditor = document.querySelector(".strip-row-editor");
const toggleStripRowsButton = document.querySelector("#toggleStripRows");
const stripRowList = document.querySelector("#stripRowList");
const searchResults = document.querySelector("#searchResults");
const selectedName = document.querySelector("#selectedName");
const selectedPlot = document.querySelector("#selectedPlot");
const selectedDates = document.querySelector("#selectedDates");
const selectedDistance = document.querySelector("#selectedDistance");
const routeName = document.querySelector("#routeName");
const routePlot = document.querySelector("#routePlot");
const routePath = document.querySelector("#routePath");
const routeSvg = document.querySelector(".osm-route");
const userMarker = document.querySelector("[data-user-marker]");
const plotMarker = document.querySelector("[data-plot-marker]");
const userMarkerValue = document.querySelector("#userMarkerValue");
const entranceSelect = document.querySelector("#entranceSelect");
const entranceQrValue = document.querySelector("#entranceQrValue");
const addEntranceButton = document.querySelector("#addEntrance");
const saveEntrancesButton = document.querySelector("#saveEntrances");
const entranceSaveStatus = document.querySelector("#entranceSaveStatus");
const resetUserMarkerButton = document.querySelector("#resetUserMarker");
const headingToggle = document.querySelector("[data-heading-toggle]");
const headingRotationInput = document.querySelector("#headingRotation");
const headingValue = document.querySelector("#headingValue");
const calibrationMarkers = document.querySelector("#calibrationMarkers");
const calibrationValues = document.querySelector("#calibrationValues");
const activeCalibrationValue = document.querySelector("#activeCalibrationValue");
const startCalibrationButton = document.querySelector("#startCalibration");
const clearCalibrationButton = document.querySelector("#clearCalibration");
const residentFullNameInput = document.querySelector("#residentFullName");
const residentBlockInput = document.querySelector("#residentBlock");
const residentRowInput = document.querySelector("#residentRow");
const residentPlotInput = document.querySelector("#residentPlot");
const residentPlotSpacesInput = document.querySelector("#residentPlotSpaces");
const useResidentSuggestionButton = document.querySelector("#useResidentSuggestion");
const residentDobInput = document.querySelector("#residentDob");
const residentDodInput = document.querySelector("#residentDod");
const addResidentButton = document.querySelector("#addResident");
const residentStatus = document.querySelector("#residentStatus");
const editResidentSelect = document.querySelector("#editResidentSelect");
const editResidentFullNameInput = document.querySelector("#editResidentFullName");
const editResidentBlockInput = document.querySelector("#editResidentBlock");
const editResidentRowInput = document.querySelector("#editResidentRow");
const editResidentPlotInput = document.querySelector("#editResidentPlot");
const editResidentPlotSpacesInput = document.querySelector("#editResidentPlotSpaces");
const useEditResidentSuggestionButton = document.querySelector("#useEditResidentSuggestion");
const editResidentDobInput = document.querySelector("#editResidentDob");
const editResidentDodInput = document.querySelector("#editResidentDod");
const saveResidentEditButton = document.querySelector("#saveResidentEdit");
const residentEditStatus = document.querySelector("#residentEditStatus");
let mapZoom = 1.18;
let mapPan = { x: 0, y: 0 };
let headingUp = false;
let headingRotation = -128;
let blockA = {
  x: 77.2,
  y: 24.8,
  width: 96,
  height: 125,
  rotate: 39,
  cutout: {
    x: -2,
    y: -1,
    width: 10,
    height: 15,
  },
};
let cemeteryBlocks = [
  {
    id: "A",
    name: "Block A",
    calibration: blockA,
  },
];
let defaultCemeteryBlocks = [];
let selectedBlockId = "A";
let dragMode = null;
let panMode = null;
let userMarkerDrag = null;
let calibrationDrag = null;
let cornerDrag = null;
let userPosition = {
  x: 76.6,
  y: 16.4,
};
let liveLocation = {
  watchId: null,
  bestAccuracy: Infinity,
  lastFixAt: 0,
  source: "entrance",
};
let plotRecords = [];
let plotSourceData = null;
let cemeteriesConfig = { activeCemeteryId: "sligo-town-cemetery", cemeteries: [] };
let allCemeteryBlocks = [];
let allCemeteryEntrances = [];
let cemeteryEntrances = [];
let selectedEntranceId = null;
let selectedRecord = null;
let activeCalibrationId = null;
let activeCalibrationBlockId = null;
let activeCemetery = null;
let workspaceMode = "visitor";
let blockVisualMode = "strips";
let cemeteryLeaflet = null;
let cemeteryTileLayer = null;
let cemeteryLeafletBounds = null;
const blockStorageKey = "graveguide-sligo-block-layout";
const adminSaveTokenKey = "graveguide-admin-save-token";
const referenceMapWidth = 390;
const mobileMapReference = { width: 390, height: 800 };
const remakeUrlParams = new URLSearchParams(window.location.search);
const requestedShell = remakeUrlParams.get("view") || remakeUrlParams.get("shell") || "demo";
const requestedState = remakeUrlParams.get("state");

const visiblePanels = {
  welcome: ["welcome"],
  permission: ["permission"],
  map: [],
  search: ["search"],
  selected: ["selected"],
  route: ["route"],
};

function setState(state) {
  screen.dataset.screen = state;

  Object.entries(panels).forEach(([name, panel]) => {
    panel.hidden = !visiblePanels[state].includes(name);
  });

  if (state === "search") {
    renderSearchResults(searchInput.value);
  } else if (state === "selected" || state === "route") {
    searchInput.value = selectedRecord ? selectedRecord.fullName : "Andrew Hosie";
  } else {
    searchInput.value = "";
  }

  [...stateButtons, ...flowSteps].forEach((button) => {
    button.classList.toggle("active", button.dataset.state === state);
  });

  if (state === "route") {
    mapTransform.classList.add("route-zooming");
    setMapZoom(Math.max(mapZoom, 1.5));
    window.setTimeout(() => mapTransform.classList.remove("route-zooming"), 950);
  }

  scheduleCemeteryLeafletSync();
}

function setWorkspaceMode(mode) {
  workspaceMode = mode;
  workspace.dataset.mode = mode;
  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.modeOption === mode);
  });
  adminModeStatus.textContent = mode === "admin" ? "Admin tools active" : "Visitor preview";
  scheduleCemeteryLeafletSync();
}

function applyRemakeShellMode() {
  const shell = ["visitor-map", "admin-map"].includes(requestedShell) ? requestedShell : "demo";
  document.body.dataset.shell = shell;
  mapArea.style.setProperty("--mobile-map-reference-width", `${mobileMapReference.width}px`);
  mapArea.style.setProperty("--mobile-map-reference-height", `${mobileMapReference.height}px`);

  if (shell === "visitor-map") {
    setWorkspaceMode("visitor");
    mapZoom = Number(remakeUrlParams.get("zoom")) || 1;
    mapPan = { x: 0, y: 0 };
    headingUp = false;
    renderMapPan();
    renderHeading();
    setMapZoom(mapZoom);
    setState(requestedState || "search");
  }

  if (shell === "admin-map") {
    setWorkspaceMode("admin");
    mapZoom = Number(remakeUrlParams.get("zoom")) || 1;
    mapPan = { x: 0, y: 0 };
    headingUp = false;
    renderMapPan();
    renderHeading();
    setMapZoom(mapZoom);
    setState(requestedState || "map");
  }

  renderBlockA();
  renderUserMarker();
  scheduleCemeteryLeafletSync();
}

function getBlock(blockId = selectedBlockId) {
  return cemeteryBlocks.find((block) => block.id === blockId) || cemeteryBlocks[0];
}

function getBlockCalibration(blockId = selectedBlockId) {
  return getBlock(blockId).calibration;
}

function setSelectedBlock(blockId) {
  selectedBlockId = blockId;
  if (blockId !== "A") activeCalibrationId = null;
  renderBlockA();
}

function getDefaultRowPlotCounts(rowCount, blockId = selectedBlockId) {
  return Object.fromEntries(
    Array.from({ length: rowCount }, (_, index) => {
      const row = index + 1;
      return [row, blockId === "A" && row <= 2 ? 26 : 32];
    }),
  );
}

function normalizeRowPlotCounts(block, nextRowCount = block.logicalRows || 2) {
  block.rowsPerStrip = Math.min(5, Math.max(1, Number(block.rowsPerStrip) || 2));
  block.blockShape ||= block.blockTemplate === "irregular" ? "polygon" : "rectangle";
  if (block.blockTemplate === "irregular") block.blockTemplate = `standard-${block.rowsPerStrip}`;
  block.physicalStrips = Math.max(1, Number(block.physicalStrips) || Math.ceil(block.logicalRows / block.rowsPerStrip));
  block.stripRowCounts = normalizeStripRowCounts(block);
  block.logicalRows = Math.min(160, Math.max(1, Number(nextRowCount) || getLogicalRowsFromStrips(block)));
  const defaults = getDefaultRowPlotCounts(block.logicalRows, block.id);
  block.rowPlotCounts = Object.fromEntries(
    Array.from({ length: block.logicalRows }, (_, index) => {
      const row = String(index + 1);
      return [row, Number(block.rowPlotCounts?.[row]) || defaults[row]];
    }),
  );
}

function normalizeStripRowCounts(block) {
  const existing = block.stripRowCounts || {};
  return Object.fromEntries(
    Array.from({ length: block.physicalStrips || 1 }, (_, index) => {
      const strip = String(index + 1);
      return [strip, Math.min(5, Math.max(1, Number(existing[strip]) || Number(block.rowsPerStrip) || 2))];
    }),
  );
}

function getLogicalRowsFromStrips(block) {
  const stripCounts = block.stripRowCounts || normalizeStripRowCounts(block);
  return Object.values(stripCounts).reduce((total, count) => total + Number(count || 0), 0);
}

function getStripInfoFromRow(rowNumber, block) {
  const counts = block.stripRowCounts || normalizeStripRowCounts(block);
  let running = 0;
  for (let strip = 1; strip <= (block.physicalStrips || 1); strip += 1) {
    const rowsInStrip = Number(counts[strip]) || block.rowsPerStrip || 2;
    if (rowNumber <= running + rowsInStrip) {
      return { stripNumber: strip, positionInStrip: rowNumber - running, rowsInStrip };
    }
    running += rowsInStrip;
  }

  return {
    stripNumber: block.physicalStrips || 1,
    positionInStrip: Number(counts[block.physicalStrips]) || block.rowsPerStrip || 2,
    rowsInStrip: Number(counts[block.physicalStrips]) || block.rowsPerStrip || 2,
  };
}

function getStripSideFromRow(rowNumber, blockId = residentBlockInput?.value || selectedBlockId) {
  const block = getBlock(blockId);
  const { stripNumber, positionInStrip } = getStripInfoFromRow(rowNumber, block);
  return {
    stripNumber,
    side: positionInStrip === 1 ? "left-facing-in" : `row-${positionInStrip}`,
  };
}

function getRowNumberFromPlot(plot) {
  const block = getBlock(plot.blockId);
  const counts = block.stripRowCounts || normalizeStripRowCounts(block);
  const stripNumber = Number(plot.stripId.split("S")[1]);
  const sideMatch = String(plot.side || "").match(/row-(\d+)/);
  const rowInStrip = plot.side === "right-facing-in" ? 2 : sideMatch ? Number(sideMatch[1]) : 1;
  const before = Array.from({ length: Math.max(0, stripNumber - 1) }, (_, index) => Number(counts[index + 1]) || block.rowsPerStrip || 2).reduce(
    (total, count) => total + count,
    0,
  );
  return before + rowInStrip;
}

function getResidentNameParts(fullName) {
  const nameParts = fullName.trim().split(/\s+/);
  return {
    firstName: nameParts.slice(0, -1).join(" ") || nameParts[0] || "",
    lastName: nameParts.length > 1 ? nameParts.at(-1) : "",
  };
}

function getPlotByLocation(blockId, rowNumber, plotNumber) {
  return plotSourceData?.plots.find(
    (plot) => plot.blockId === blockId && getRowNumberFromPlot(plot) === rowNumber && Number(plot.plotNumber) === plotNumber,
  );
}

function getPlotSpaces(value) {
  return Math.min(6, Math.max(1, Number(value) || 1));
}

function getPlotEnd(record) {
  return Number(record.plotNumber) + getPlotSpaces(record.plotSpaces) - 1;
}

function formatPlotRange(record) {
  const start = Number(record.plotNumber);
  const end = getPlotEnd(record);
  return end > start ? `${start}-${end}` : `${start}`;
}

function formatPlotSpaces(recordOrSpaces) {
  const spaces = typeof recordOrSpaces === "object" ? getPlotSpaces(recordOrSpaces.plotSpaces) : getPlotSpaces(recordOrSpaces);
  return `${spaces} plot space${spaces === 1 ? "" : "s"}`;
}

function formatPlotLocation(record) {
  return `Block ${record.blockId} - Row ${record.rowNumber} - Plot ${formatPlotRange(record)} (${formatPlotSpaces(record)})`;
}

function getOccupiedRanges(blockId, rowNumber, excludeRecordId = null) {
  return plotRecords
    .filter((record) => !record.isCalibrationAnchor)
    .filter((record) => record.id !== excludeRecordId && record.blockId === blockId && Number(record.rowNumber) === Number(rowNumber))
    .map((record) => ({ start: Number(record.plotNumber), end: getPlotEnd(record), name: record.fullName }))
    .sort((a, b) => a.start - b.start);
}

function isPlotSpanAvailable(blockId, rowNumber, plotNumber, plotSpaces = 1, excludeRecordId = null) {
  const block = getBlock(blockId);
  const plotCount = Number(block.rowPlotCounts?.[rowNumber]) || 32;
  const start = Number(plotNumber);
  const end = start + getPlotSpaces(plotSpaces) - 1;
  if (start < 1 || end > plotCount) return false;
  return getOccupiedRanges(blockId, rowNumber, excludeRecordId).every((range) => end < range.start || start > range.end);
}

function getNextAvailablePlotStart(blockId, rowNumber, plotSpaces = 1, excludeRecordId = null) {
  const block = getBlock(blockId);
  const plotCount = Number(block.rowPlotCounts?.[rowNumber]) || 32;
  const spaces = getPlotSpaces(plotSpaces);
  let candidate = 1;
  getOccupiedRanges(blockId, rowNumber, excludeRecordId).forEach((range) => {
    if (candidate >= range.start && candidate <= range.end) candidate = range.end + 1;
  });
  return candidate + spaces - 1 <= plotCount ? candidate : null;
}

function getNextAvailableLocation(blockId, preferredRow, plotSpaces = 1, excludeRecordId = null) {
  const block = getBlock(blockId);
  const rows = Math.max(1, Number(block.logicalRows) || 1);
  const startRow = Math.min(rows, Math.max(1, Number(preferredRow) || 1));
  for (let offset = 0; offset < rows; offset += 1) {
    const rowNumber = ((startRow - 1 + offset) % rows) + 1;
    const plotNumber = getNextAvailablePlotStart(blockId, rowNumber, plotSpaces, excludeRecordId);
    if (plotNumber) return { rowNumber, plotNumber };
  }
  return null;
}

function updateResidentSuggestion() {
  if (!residentStatus || !plotRecords.length) return null;
  const block = getBlock(residentBlockInput.value || selectedBlockId);
  const rowNumber = Math.min(block.logicalRows || 1, Math.max(1, Number(residentRowInput.value) || 1));
  const plotNumber = Number(residentPlotInput.value) || 1;
  const spaces = getPlotSpaces(residentPlotSpacesInput.value);
  const suggestion = getNextAvailableLocation(block.id, rowNumber, spaces);
  if (useResidentSuggestionButton) useResidentSuggestionButton.disabled = !suggestion;
  if (isPlotSpanAvailable(block.id, rowNumber, plotNumber, spaces)) {
    residentStatus.textContent = `Available: ${block.name}, Row ${rowNumber}, Plot ${plotNumber}${spaces > 1 ? `-${plotNumber + spaces - 1}` : ""} (${formatPlotSpaces(spaces)}).`;
    return suggestion;
  }
  if (!suggestion) {
    residentStatus.textContent = `No ${spaces}-space opening found in ${block.name}.`;
    return null;
  }
  residentStatus.textContent = `Suggested opening: ${block.name}, Row ${suggestion.rowNumber}, Plot ${suggestion.plotNumber}${spaces > 1 ? `-${suggestion.plotNumber + spaces - 1}` : ""}.`;
  return suggestion;
}

function updateEditResidentSuggestion() {
  const record = plotRecords.find((item) => item.id === editResidentSelect.value);
  if (!record || !residentEditStatus) return null;
  const block = getBlock(editResidentBlockInput.value || record.blockId);
  const rowNumber = Math.min(block.logicalRows || 1, Math.max(1, Number(editResidentRowInput.value) || 1));
  const plotNumber = Number(editResidentPlotInput.value) || 1;
  const spaces = getPlotSpaces(editResidentPlotSpacesInput.value);
  const suggestion = getNextAvailableLocation(block.id, rowNumber, spaces, record.id);
  if (useEditResidentSuggestionButton) useEditResidentSuggestionButton.disabled = !suggestion;
  if (isPlotSpanAvailable(block.id, rowNumber, plotNumber, spaces, record.id)) {
    residentEditStatus.textContent = `Available: ${block.name}, Row ${rowNumber}, Plot ${plotNumber}${spaces > 1 ? `-${plotNumber + spaces - 1}` : ""} (${formatPlotSpaces(spaces)}).`;
    return suggestion;
  }
  if (!suggestion) {
    residentEditStatus.textContent = `No ${spaces}-space opening found in ${block.name}.`;
    return null;
  }
  residentEditStatus.textContent = `Suggested opening: ${block.name}, Row ${suggestion.rowNumber}, Plot ${suggestion.plotNumber}${spaces > 1 ? `-${suggestion.plotNumber + spaces - 1}` : ""}.`;
  return suggestion;
}

function getApproxPlotPositionInBlock(block, rowNumber, plotNumber, plotSpaces = 1) {
  const rowCount = Math.max(1, Number(block.logicalRows) || 1);
  const rowPlotCount = Number(block.rowPlotCounts?.[rowNumber]) || 32;
  const effectivePlotNumber = Number(plotNumber) + (getPlotSpaces(plotSpaces) - 1) / 2;
  return {
    xPercent: Math.min(96, Math.max(4, rowCount === 1 ? 50 : 4 + ((rowNumber - 1) / (rowCount - 1)) * 92)),
    yPercent: Math.min(96, Math.max(4, 4 + ((effectivePlotNumber - 1) / Math.max(1, rowPlotCount - 1)) * 92)),
  };
}

function getApproxDistanceMetres(record) {
  const bbox = activeCemetery?.map?.bbox;
  if (!bbox) return null;

  const target = getSelectedPlotScreenPosition(record);
  const west = bbox[0];
  const south = bbox[1];
  const east = bbox[2];
  const north = bbox[3];
  const midLat = ((north + south) / 2) * (Math.PI / 180);
  const metresPerLatDegree = 111_320;
  const metresPerLonDegree = 111_320 * Math.cos(midLat);
  const widthMetres = Math.abs(east - west) * metresPerLonDegree;
  const heightMetres = Math.abs(north - south) * metresPerLatDegree;
  const dx = ((target.x - userPosition.x) / 100) * widthMetres;
  const dy = ((target.y - userPosition.y) / 100) * heightMetres;

  return Math.max(1, Math.round(Math.sqrt(dx * dx + dy * dy)));
}

function getMapPositionFromCoordinates(latitude, longitude, cemetery = activeCemetery) {
  const bbox = getCemeteryMapBounds(cemetery);
  const [west, south, east, north] = bbox;
  const x = ((longitude - west) / (east - west)) * 100;
  const y = ((north - latitude) / (north - south)) * 100;

  return {
    x: Math.min(98, Math.max(2, x)),
    y: Math.min(98, Math.max(2, y)),
    outsideMap: x < 0 || x > 100 || y < 0 || y > 100,
  };
}

function updateLocationStatus(message, state = "idle") {
  if (!locationStatus) return;
  locationStatus.hidden = false;
  locationStatus.textContent = message;
  locationStatus.dataset.locationState = state;
}

function shouldAcceptLocationFix(accuracy) {
  if (!Number.isFinite(accuracy)) return true;
  if (!Number.isFinite(liveLocation.bestAccuracy)) return true;
  if (accuracy <= liveLocation.bestAccuracy + 8) return true;
  if (Date.now() - liveLocation.lastFixAt > 30000) return true;
  return accuracy <= liveLocation.bestAccuracy * 1.6;
}

function applyLiveLocationFix(position) {
  const { latitude, longitude, accuracy } = position.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

  if (!shouldAcceptLocationFix(accuracy)) {
    updateLocationStatus(`Holding better fix: ${Math.round(liveLocation.bestAccuracy)}m`, liveLocation.bestAccuracy <= 25 ? "good" : "rough");
    return;
  }

  const mapPosition = getMapPositionFromCoordinates(latitude, longitude);
  userPosition = {
    x: Number(mapPosition.x.toFixed(2)),
    y: Number(mapPosition.y.toFixed(2)),
  };
  liveLocation.bestAccuracy = Math.min(liveLocation.bestAccuracy, Number.isFinite(accuracy) ? accuracy : liveLocation.bestAccuracy);
  liveLocation.lastFixAt = Date.now();
  liveLocation.source = "gps";
  renderUserMarker();

  const roundedAccuracy = Number.isFinite(accuracy) ? Math.round(accuracy) : null;
  const quality = roundedAccuracy !== null && roundedAccuracy <= 25 ? "good" : roundedAccuracy !== null && roundedAccuracy <= 60 ? "ok" : "rough";
  const outsideText = mapPosition.outsideMap ? " - outside mapped cemetery area" : "";
  updateLocationStatus(roundedAccuracy === null ? `Location updated${outsideText}` : `Accuracy ${roundedAccuracy}m${outsideText}`, quality);
}

function handleLocationError(error) {
  const messages = {
    1: "Location permission blocked",
    2: "Location unavailable",
    3: "Location timed out",
  };
  updateLocationStatus(messages[error?.code] || "Location unavailable", "error");
}

function startHighAccuracyLocation() {
  if (!navigator.geolocation) {
    updateLocationStatus("Location not supported on this browser", "error");
    return;
  }

  updateLocationStatus("Locating...", "loading");
  if (liveLocation.watchId !== null) {
    navigator.geolocation.clearWatch(liveLocation.watchId);
  }
  liveLocation.bestAccuracy = Infinity;
  liveLocation.lastFixAt = 0;

  const options = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 20000,
  };

  navigator.geolocation.getCurrentPosition(applyLiveLocationFix, handleLocationError, options);
  liveLocation.watchId = navigator.geolocation.watchPosition(applyLiveLocationFix, handleLocationError, options);
}

function renderEntranceControls() {
  entranceSelect.innerHTML = cemeteryEntrances
    .map((entrance) => `<option value="${entrance.id}" ${entrance.id === selectedEntranceId ? "selected" : ""}>${entrance.name}</option>`)
    .join("");

  const entrance = cemeteryEntrances.find((item) => item.id === selectedEntranceId) || cemeteryEntrances[0];
  if (!entrance) return;
  entranceQrValue.textContent = `QR: ${entrance.qrCodeSlug}`;
  entranceSaveStatus.textContent = `${entrance.name} ready. Move marker, then save entrance.`;
}

function applyEntrance(entranceId) {
  const entrance = cemeteryEntrances.find((item) => item.id === entranceId) || cemeteryEntrances[0];
  if (!entrance) return;
  selectedEntranceId = entrance.id;
  userPosition = { ...entrance.mapPosition };
  headingRotation = entrance.defaultHeadingDegrees ?? headingRotation;
  renderUserMarker();
  renderHeading();
  renderEntranceControls();
}

function syncSelectedEntrancePosition() {
  const entrance = cemeteryEntrances.find((item) => item.id === selectedEntranceId);
  if (!entrance) return;
  entrance.mapPosition = {
    x: Number(userPosition.x.toFixed(1)),
    y: Number(userPosition.y.toFixed(1)),
  };
  entrance.defaultHeadingDegrees = headingRotation;
  const existingIndex = allCemeteryEntrances.findIndex((item) => item.id === entrance.id);
  if (existingIndex >= 0) {
    allCemeteryEntrances[existingIndex] = entrance;
  } else {
    allCemeteryEntrances.push(entrance);
  }
  entranceSaveStatus.textContent = `${entrance.name}: x ${entrance.mapPosition.x}%, y ${entrance.mapPosition.y}% unsaved.`;
}

function createEntrance(cemetery, name = null, position = null) {
  const slug = cemetery.slug || slugify(cemetery.name);
  const baseName = name || `Entrance ${cemeteryEntrances.length + 1}`;
  const idBase = `${slug}-${slugify(baseName) || `entrance-${Date.now()}`}`;
  const used = new Set(allCemeteryEntrances.map((entrance) => entrance.id));
  let id = idBase;
  let suffix = 2;
  while (used.has(id)) {
    id = `${idBase}-${suffix}`;
    suffix += 1;
  }

  return {
    id,
    cemeteryId: cemetery.id,
    name: baseName,
    type: "qr-start-point",
    mapPosition: position || { x: Number(userPosition.x.toFixed(1)), y: Number(userPosition.y.toFixed(1)) },
    defaultHeadingDegrees: headingRotation,
    qrCodeSlug: id,
  };
}

function ensureDefaultEntrancesForActiveCemetery() {
  if (activeCemetery?.id !== "sligo-town-cemetery") return;
  const hasRoadEntrance = cemeteryEntrances.some((entrance) => entrance.id === "sligo-cemetery-road-gate");
  if (hasRoadEntrance) return;

  const roadEntrance = {
    id: "sligo-cemetery-road-gate",
    cemeteryId: "sligo-town-cemetery",
    name: "Cemetery Road Gate",
    type: "qr-start-point",
    mapPosition: { x: 25.6, y: 36 },
    defaultHeadingDegrees: -128,
    qrCodeSlug: "sligo-town-cemetery-cemetery-road-gate",
  };
  cemeteryEntrances.push(roadEntrance);
  allCemeteryEntrances.push(roadEntrance);
}

async function saveEntranceLayout() {
  syncSelectedEntrancePosition();
  entranceSaveStatus.textContent = "Saving entrance...";

  try {
    await ensureActiveCemeterySaved();
    const result = await postAdminJson("/api/save-entrances", allCemeteryEntrances);
    entranceSaveStatus.textContent = result.source === "supabase" ? "Entrance saved to live database." : "Entrance saved in browser fallback.";
    entranceCountValue.textContent = `${cemeteryEntrances.length} entrance${cemeteryEntrances.length === 1 ? "" : "s"}`;
  } catch (error) {
    entranceSaveStatus.textContent = getFriendlySaveError(error);
    console.error(error);
  }
}

function addEntrance() {
  if (!activeCemetery) return;
  const entrance = createEntrance(activeCemetery, `Entrance ${cemeteryEntrances.length + 1}`, {
    x: Math.min(95, Math.max(5, userPosition.x + 4)),
    y: Math.min(95, Math.max(5, userPosition.y + 4)),
  });
  cemeteryEntrances.push(entrance);
  allCemeteryEntrances.push(entrance);
  selectedEntranceId = entrance.id;
  entranceCountValue.textContent = `${cemeteryEntrances.length} entrance${cemeteryEntrances.length === 1 ? "" : "s"}`;
  applyEntrance(entrance.id);
  entranceSaveStatus.textContent = `${entrance.name} added. Move marker, then save entrance.`;
}

function getActiveCalibrationRecord() {
  return plotRecords.find((record) => record.id === activeCalibrationId);
}

function setActiveCalibrationRecord(record) {
  activeCalibrationId = record?.id || null;
  if (record) selectedBlockId = record.blockId;
  renderBlockSelection();
  renderCalibrationMarkers();
}

function getCalibrationLabel(record) {
  if (!record) return "";
  return `${record.blockName || `Block ${record.blockId}`} - Row ${record.rowNumber}, Plot ${record.plotNumber}`;
}

function markBlocksUnsaved() {
  blockSaveStatus.textContent = "Unsaved changes";
}

function markBlocksSaved(source = "browser") {
  blockSaveStatus.textContent =
    source === "supabase" ? "Saved to live database" : source === "browser-fallback" ? "Saved in browser fallback" : "Browser backup loaded";
}

function getFriendlySaveError(error) {
  const message = error instanceof Error ? error.message : "";
  return message.toLowerCase().includes("admin save key") ? "Admin save key needed. Browser backup saved." : "Live save failed. Browser backup saved.";
}

function getAdminSaveHeaders() {
  const token = adminSaveTokenInput?.value.trim() || localStorage.getItem(adminSaveTokenKey) || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { "x-graveguide-admin-token": token } : {}),
  };
}

function getCemeteryScopedStorageKey(baseKey) {
  return `${baseKey}-${activeCemetery?.id || "sligo-town-cemetery"}`;
}

function updateAdminSaveStatus(message = null) {
  if (!adminSaveStatus) return;
  const hasToken = Boolean(adminSaveTokenInput?.value.trim() || localStorage.getItem(adminSaveTokenKey));
  adminSaveStatus.textContent = message || (hasToken ? "Live saves enabled for this browser." : "Required for live database saves.");
}

async function postAdminJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: getAdminSaveHeaders(),
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.ok === false) {
    throw new Error(result.error || "Admin save failed");
  }

  updateAdminSaveStatus(result.source === "supabase" ? "Saved to live database." : "Saved in browser fallback.");
  return result;
}

async function ensureActiveCemeterySaved() {
  if (!activeCemetery) return null;
  return postAdminJson("/api/save-cemeteries", {
    ...cemeteriesConfig,
    activeCemeteryId: activeCemetery.id,
  });
}

function saveBlockBrowserBackup() {
  localStorage.setItem(
    getCemeteryScopedStorageKey(blockStorageKey),
    JSON.stringify({
      selectedBlockId,
      blockVisualMode,
      blocks: getSavableBlocks(),
    }),
  );
}

function getSavableBlocks() {
  return cemeteryBlocks.map((block) => {
    normalizeRowPlotCounts(block, block.logicalRows || (block.id === "A" ? 18 : 2));

    return {
      id: block.id,
      cemeteryId: activeCemetery?.id || "sligo-town-cemetery",
      name: block.name,
      physicalStrips: block.physicalStrips,
      rowsPerStrip: block.rowsPerStrip || 2,
      blockShape: block.blockShape || "rectangle",
      stripRowCounts: block.stripRowCounts || normalizeStripRowCounts(block),
      blockTemplate: block.blockTemplate || "standard-2",
      logicalRows: block.logicalRows,
      rowPlotCounts: block.rowPlotCounts,
      rowRules:
        block.rowRules ||
        (block.id === "A"
          ? [
              { rows: [1, 2], plotsPerRow: 26 },
              { rows: [3, 18], plotsPerRow: 32 },
            ]
          : [{ rows: [1, block.logicalRows], plotsPerRow: 32 }]),
      calibration: block.calibration,
    };
  });
}

async function saveBlockLayout() {
  const blocks = getSavableBlocks();
  allCemeteryBlocks = [...allCemeteryBlocks.filter((block) => block.cemeteryId !== activeCemetery?.id), ...blocks];
  saveBlockBrowserBackup();
  blockSaveStatus.textContent = "Saving...";

  try {
    await ensureActiveCemeterySaved();
    const response = await fetch("/api/save-blocks", {
      method: "POST",
      headers: getAdminSaveHeaders(),
      body: JSON.stringify(allCemeteryBlocks),
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Could not save blocks");
    }

    markBlocksSaved(result.source);
  } catch (error) {
    blockSaveStatus.textContent = getFriendlySaveError(error);
    console.error(error);
  }
}

function getPlotDataWithCalibrations(plotData) {
  const calibratedByPlotId = new Map(
    plotRecords
      .filter((record) => record.calibrationEnabled && record.calibratedPositionInBlock)
      .map((record) => [record.plotId, record.calibratedPositionInBlock]),
  );

  return {
    ...plotData,
    plots: plotData.plots.map((plot) => {
      const calibration = calibratedByPlotId.get(plot.id);
      if (!calibration) return plot;

      return {
        ...plot,
        calibratedPositionInBlock: {
          x: Number(calibration.x.toFixed(1)),
          y: Number(calibration.y.toFixed(1)),
        },
        calibrationEnabled: true,
      };
    }),
  };
}

async function savePlotData(nextData, statusElement = activeCalibrationValue) {
  plotSourceData = nextData;
  localStorage.setItem(getCemeteryScopedStorageKey("graveguide-plot-data"), JSON.stringify(nextData));

  await ensureActiveCemeterySaved();

  const response = await fetch("/api/save-plot-data", {
    method: "POST",
    headers: getAdminSaveHeaders(),
    body: JSON.stringify(nextData),
  });
  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.error || "Could not save plot data");
  }

  if (statusElement) statusElement.textContent = result.source === "supabase" ? "Saved to live database" : "Saved in browser fallback";
}

async function saveCalibrations() {
  activeCalibrationId = null;
  activeCalibrationValue.textContent = "Saving calibration...";

  try {
    const currentData = plotSourceData || (await loadPlotData(activeCemetery));
    const nextData = getPlotDataWithCalibrations(currentData);
    await savePlotData(nextData, activeCalibrationValue);
    await saveBlockLayout();
  } catch (error) {
    activeCalibrationValue.textContent = getFriendlySaveError(error);
    console.error(error);
  }

  renderCalibrationMarkers();
}

function loadSavedBlockLayout() {
  const saved = localStorage.getItem(getCemeteryScopedStorageKey(blockStorageKey));
  if (!saved) return false;

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.blocks) || !parsed.blocks.length) return false;
    const savedById = new Map(parsed.blocks.map((block) => [block.id, block]));
    cemeteryBlocks = cemeteryBlocks.map((block) => {
      const savedBlock = savedById.get(block.id);
      if (!savedBlock) return block;

      return {
        ...block,
        ...savedBlock,
        logicalRows: block.id === "B" ? Math.max(Number(savedBlock.logicalRows) || 0, block.logicalRows || 20) : savedBlock.logicalRows,
        physicalStrips: block.id === "B" ? Math.max(Number(savedBlock.physicalStrips) || 0, block.physicalStrips || 10) : savedBlock.physicalStrips,
      };
    });
    parsed.blocks
      .filter((savedBlock) => !cemeteryBlocks.some((block) => block.id === savedBlock.id))
      .forEach((savedBlock) => cemeteryBlocks.push(savedBlock));
    cemeteryBlocks.forEach((block) => normalizeRowPlotCounts(block, block.logicalRows || (block.id === "A" ? 18 : 2)));
    selectedBlockId = parsed.selectedBlockId || cemeteryBlocks[0].id;
    blockVisualMode = parsed.blockVisualMode || "strips";
    markBlocksSaved();
    return true;
  } catch {
    return false;
  }
}

function getNextBlockId() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const used = new Set(cemeteryBlocks.map((block) => block.id));
  return [...alphabet].find((letter) => !used.has(letter)) || `B${cemeteryBlocks.length + 1}`;
}

function createBlock(id) {
  const logicalRows = 2;
  return {
    id,
    cemeteryId: activeCemetery?.id || "sligo-town-cemetery",
    name: `Block ${id}`,
    physicalStrips: 1,
    rowsPerStrip: 2,
    stripRowCounts: { "1": 2 },
    blockTemplate: "standard-2",
    blockShape: "rectangle",
    logicalRows,
    rowPlotCounts: getDefaultRowPlotCounts(logicalRows, id),
    calibration: {
      x: Math.min(115, Math.max(-15, blockA.x + cemeteryBlocks.length * 5)),
      y: Math.min(115, Math.max(-15, blockA.y + cemeteryBlocks.length * 5)),
      width: 18,
      height: 116,
      rotate: blockA.rotate,
      cutout: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
    },
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createDefaultEntrance(cemetery) {
  const slug = cemetery.slug || slugify(cemetery.name);
  return {
    id: `${slug}-main-entrance`,
    cemeteryId: cemetery.id,
    name: "Main Entrance",
    type: "qr-start-point",
    mapPosition: { x: 58.8, y: 16.0 },
    defaultHeadingDegrees: -128,
    qrCodeSlug: `${slug}-main-entrance`,
  };
}

function getCemeteryMapBounds(cemetery) {
  const bbox = cemetery?.map?.bbox;
  if (Array.isArray(bbox) && bbox.length === 4) return bbox;

  const centre = cemetery?.map?.centre;
  if (!centre) return [-8.4666, 54.2587, -8.4612, 54.2604];

  const longitude = Number(centre.longitude);
  const latitude = Number(centre.latitude);
  return [longitude - 0.0027, latitude - 0.0012, longitude + 0.0027, latitude + 0.0012];
}

function renderCemeteryMapFrame() {
  if (!activeCemetery || !cemeteryLeafletMap || !window.L) return;
  const [west, south, east, north] = getCemeteryMapBounds(activeCemetery);
  const layer = activeCemetery.map?.layer === "standard" ? "mapnik" : "hot";
  const tileUrl =
    layer === "mapnik"
      ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      : "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";

  if (!cemeteryLeaflet) {
    cemeteryLeaflet = window.L.map(cemeteryLeafletMap, {
      attributionControl: false,
      boxZoom: false,
      dragging: false,
      doubleClickZoom: false,
      keyboard: false,
      scrollWheelZoom: false,
      tap: false,
      touchZoom: false,
      zoomControl: false,
    });
  }

  if (cemeteryTileLayer) cemeteryLeaflet.removeLayer(cemeteryTileLayer);
  cemeteryTileLayer = window.L.tileLayer(tileUrl, {
    maxNativeZoom: 19,
    maxZoom: 22,
  }).addTo(cemeteryLeaflet);

  cemeteryLeafletBounds = [
    [south, west],
    [north, east],
  ];
  cemeteryLeafletMap.setAttribute("aria-label", `Leaflet map - ${activeCemetery.name}`);
  scheduleCemeteryLeafletSync();
  if (mapOverlayNote) mapOverlayNote.textContent = activeCemetery.name;
}

function syncCemeteryLeafletMap() {
  if (!cemeteryLeaflet || !cemeteryLeafletBounds) return;
  cemeteryLeaflet.invalidateSize(false);
  cemeteryLeaflet.fitBounds(cemeteryLeafletBounds, { animate: false, padding: [0, 0] });
}

function scheduleCemeteryLeafletSync() {
  window.requestAnimationFrame(syncCemeteryLeafletMap);
  window.setTimeout(syncCemeteryLeafletMap, 120);
  window.setTimeout(syncCemeteryLeafletMap, 360);
}

async function saveCemeteryConfig() {
  if (activeCemetery) cemeteriesConfig.activeCemeteryId = activeCemetery.id;
  await Promise.all([
    postAdminJson("/api/save-cemeteries", cemeteriesConfig),
    postAdminJson("/api/save-entrances", allCemeteryEntrances),
    postAdminJson("/api/save-blocks", allCemeteryBlocks),
  ]);
}

async function addTestCemetery() {
  const name = window.prompt("Cemetery name for test mode?", `Test Cemetery ${cemeteriesConfig.cemeteries.length + 1}`);
  if (!name?.trim()) return;

  const slugBase = slugify(name);
  const used = new Set(cemeteriesConfig.cemeteries.map((cemetery) => cemetery.id));
  let id = slugBase || `test-cemetery-${Date.now()}`;
  let suffix = 2;
  while (used.has(id)) {
    id = `${slugBase}-${suffix}`;
    suffix += 1;
  }

  const cemetery = {
    id,
    name: name.trim(),
    slug: id,
    town: "",
    county: "",
    country: "Ireland",
    managingOrganisation: activeCemetery?.managingOrganisation || {
      id: "sligo-county-council",
      name: "Sligo County Council",
      type: "council",
    },
    map: activeCemetery?.map || null,
  };

  cemeteriesConfig.cemeteries.push(cemetery);
  cemeteriesConfig.activeCemeteryId = cemetery.id;
  allCemeteryEntrances.push(createDefaultEntrance(cemetery));
  activeCemetery = cemetery;
  const starterBlock = createBlock("A");
  allCemeteryBlocks.push({
    ...starterBlock,
    cemeteryId: cemetery.id,
    calibration: starterBlock.calibration,
  });
  addCemeteryStatus.textContent = `Added ${cemetery.name} in test mode.`;
  try {
    await saveCemeteryConfig();
  } catch (error) {
    addCemeteryStatus.textContent = `${cemetery.name} added in browser. ${getFriendlySaveError(error)}`;
    console.error(error);
  }
  await setActiveCemetery(cemetery.id);
}

function formatYear(dateValue) {
  return dateValue ? dateValue.slice(0, 4) : "";
}

function getPlotsFromDataset(data) {
  return data.plots || [];
}

function getCalibrationAnchorSpecs(block) {
  if (block?.id === "A") {
    return [
      { row: 1, plot: 1, x: 6.4, y: 25.1 },
      { row: 1, plot: 26, x: 8.3, y: 96 },
      { row: 18, plot: 1, x: 96, y: 4 },
      { row: 5, plot: 12, x: 30.5, y: 36.6 },
      { row: 10, plot: 17, x: 58.2, y: 51.5 },
      { row: 14, plot: 21, x: 80.4, y: 63.4 },
      { row: 15, plot: 9, x: 85.9, y: 27.7 },
      { row: 2, plot: 1, x: 11.9, y: 25.1 },
    ];
  }

  const rows = Math.max(1, Number(block.logicalRows) || 1);
  const rowAt = (ratio) => Math.min(rows, Math.max(1, Math.round(1 + (rows - 1) * ratio)));
  const plotCountForRow = (row) => Number(block.rowPlotCounts?.[row]) || 32;
  const plotAt = (row, ratio) => {
    const count = plotCountForRow(row);
    return Math.min(count, Math.max(1, Math.round(1 + (count - 1) * ratio)));
  };
  const make = (rowRatio, plotRatio) => {
    const row = rowAt(rowRatio);
    return {
      row,
      plot: plotAt(row, plotRatio),
      x: 8 + rowRatio * 84,
      y: 8 + plotRatio * 84,
    };
  };

  const anchors = [
    make(0, 0),
    make(0, 1),
    make(1, 0),
    make(0.25, 0.35),
    make(0.5, 0.5),
    make(0.75, 0.65),
    make(0.85, 0.25),
  ];
  const seen = new Set();

  return anchors.map((anchor, index) => {
    const key = `${anchor.row}:${anchor.plot}`;
    if (!seen.has(key)) {
      seen.add(key);
      return anchor;
    }

    const count = plotCountForRow(anchor.row);
    const fallbackPlot = Math.min(count, Math.max(1, anchor.plot + index + 1));
    seen.add(`${anchor.row}:${fallbackPlot}`);
    return { ...anchor, plot: fallbackPlot };
  });
}

function createCalibrationAnchorPlot(block, spec, index) {
  const { stripNumber, side } = getStripSideFromRow(spec.row, block.id);
  return {
    id: `${block.id}-CAL-${String(index + 1).padStart(2, "0")}`,
    blockId: block.id,
    stripId: `${block.id}-S${String(stripNumber).padStart(2, "0")}`,
    side,
    plotNumber: spec.plot,
    positionInBlock: { xPercent: spec.x, yPercent: spec.y },
    calibrationEnabled: true,
    isCalibrationAnchor: true,
  };
}

function removeGeneratedCalibrationAnchors(blockId, data = plotSourceData) {
  if (!data?.plots) return;
  data.plots = data.plots.filter((plot) => !(plot.blockId === blockId && plot.isCalibrationAnchor));
}

function ensureCalibrationAnchorsForBlock(block, data = plotSourceData, options = {}) {
  if (!block || !data?.plots) return;
  if (options.rebuild) removeGeneratedCalibrationAnchors(block.id, data);

  const requiredAnchorCount = getCalibrationAnchorSpecs(block).length;
  const existingAnchorCount = data.plots.filter((plot) => plot.blockId === block.id && plot.isCalibrationAnchor).length;
  if (existingAnchorCount >= requiredAnchorCount && !options.rebuild) return;

  const existingIds = new Set(data.plots.map((plot) => plot.id));
  getCalibrationAnchorSpecs(block).forEach((spec, index) => {
    const anchor = createCalibrationAnchorPlot(block, spec, index);
    if (!existingIds.has(anchor.id)) data.plots.push(anchor);
  });
}

function ensureCalibrationAnchorsForBlocks(data) {
  cemeteryBlocks.forEach((block) => ensureCalibrationAnchorsForBlock(block, data));
  return data;
}

function startCalibrationForSelectedBlock() {
  const block = getBlock();
  if (!block) return;
  activeCalibrationBlockId = block.id;
  activeCalibrationId = null;

  if (plotSourceData) {
    ensureCalibrationAnchorsForBlock(block, plotSourceData);
    plotRecords = flattenPlotRecords(plotSourceData, activeCemetery);
  }

  activeCalibrationValue.textContent = `Calibration started for ${block.name}. Click an orange plot anchor.`;
  renderCalibrationMarkers();
}

function ensurePrototypeCalibrationAnchors(data) {
  const blockA = cemeteryBlocks.find((block) => block.id === "A");
  if (blockA && Array.isArray(data.plots)) {
    ensureCalibrationAnchorsForBlock(blockA, data);
  }

  const andrewPlot = data.plots?.find((plot) => plot.id === "A-01-001");
  if (andrewPlot) {
    andrewPlot.calibrationEnabled = true;
    andrewPlot.calibratedPositionInBlock ||= { x: 4.4, y: 21.8 };
  }

  const firstStripBackToBackPlot = data.plots?.find((plot) => plot.id === "A-02-001");
  if (firstStripBackToBackPlot) {
    firstStripBackToBackPlot.calibratedPositionInBlock ||= { x: 4.4, y: 21.8 };
  }

  return data;
}

async function loadPlotData(cemetery) {
  try {
    const response = await fetch(`/api/remake-plot-data?cemetery=${encodeURIComponent(cemetery.id)}`);
    const apiData = await response.json();
    if (apiData.source === "supabase" && Array.isArray(apiData.plots) && Array.isArray(apiData.burials)) {
      return ensurePrototypeCalibrationAnchors({
        cemetery: apiData.cemetery || cemetery,
        plots: apiData.plots,
        burials: apiData.burials,
      });
    }
  } catch (error) {
    console.warn("Using bundled plot data fallback.", error);
  }

  if (!cemetery?.plotDataUrl || !cemetery?.burialDataUrl) {
    return { cemetery, plots: [], burials: [] };
  }

  const savedPlotData = localStorage.getItem(getCemeteryScopedStorageKey("graveguide-plot-data"));
  if (savedPlotData) {
    try {
      const parsed = JSON.parse(savedPlotData);
      if (Array.isArray(parsed.plots) && Array.isArray(parsed.burials) && parsed.cemetery?.id === cemetery.id) return ensurePrototypeCalibrationAnchors(parsed);
    } catch {
      localStorage.removeItem(getCemeteryScopedStorageKey("graveguide-plot-data"));
    }
  }

  const [plotsData, burialsData] = await Promise.all([
    fetch(cemetery.plotDataUrl).then((response) => response.json()),
    fetch(cemetery.burialDataUrl).then((response) => response.json()),
  ]);

  return ensurePrototypeCalibrationAnchors({
    cemetery: plotsData.cemetery || cemetery,
    plots: plotsData.plots || [],
    burials: burialsData.burials || [],
  });
}

function flattenPlotRecords(data, cemetery) {
  const burialsByPlotId = new Map();
  (data.burials || []).forEach((burial) => {
    const existing = burialsByPlotId.get(burial.plotId) || [];
    existing.push(burial);
    burialsByPlotId.set(burial.plotId, existing);
  });

  return getPlotsFromDataset(data).flatMap((plot) => {
    const plotBurials = plot.burials || burialsByPlotId.get(plot.id) || [];
    const rowNumber = getRowNumberFromPlot(plot);
    const basePlotRecord = {
      cemeteryId: cemetery?.id || "sligo-town-cemetery",
      cemeteryName: cemetery?.name || data.cemetery?.name || "Sligo Town Cemetery",
      plotId: plot.id,
      blockId: plot.blockId,
      blockName: getBlock(plot.blockId)?.name || `Block ${plot.blockId}`,
      stripId: plot.stripId,
      side: plot.side,
      stripNumber: Number(plot.stripId.split("S")[1]),
      rowNumber,
      plotNumber: plot.plotNumber,
      positionInBlock: plot.positionInBlock,
      calibrationEnabled: plot.calibrationEnabled,
      calibratedPositionInBlock: plot.calibratedPositionInBlock,
      isCalibrationAnchor: Boolean(plot.isCalibrationAnchor),
    };

    if (!plotBurials.length && plot.calibrationEnabled) {
      return [
        {
          ...basePlotRecord,
          id: `plot-anchor-${plot.id}`,
          firstName: "Plot",
          lastName: "Anchor",
          fullName: getCalibrationLabel(basePlotRecord),
          dateOfBirth: "",
          dateOfDeath: "",
        },
      ];
    }

    return plotBurials.map((burial) => ({
      ...burial,
      plotSpaces: getPlotSpaces(burial.plotSpaces),
      fullName: `${burial.firstName} ${burial.lastName}`,
      ...basePlotRecord,
    }));
  });
}

async function addResident() {
  const fullName = residentFullNameInput.value.trim();
  if (!fullName) {
    residentStatus.textContent = "Add a full name first.";
    return;
  }

  const { firstName, lastName } = getResidentNameParts(fullName);
  const block = getBlock(residentBlockInput.value || selectedBlockId);
  const rowNumber = Math.min(block.logicalRows || 1, Math.max(1, Number(residentRowInput.value) || 1));
  const plotCount = Number(block.rowPlotCounts?.[rowNumber]) || 32;
  const plotNumber = Math.min(plotCount, Math.max(1, Number(residentPlotInput.value) || 1));
  const plotSpaces = getPlotSpaces(residentPlotSpacesInput.value);
  if (!isPlotSpanAvailable(block.id, rowNumber, plotNumber, plotSpaces)) {
    const suggestion = getNextAvailableLocation(block.id, rowNumber, plotSpaces);
    if (suggestion) {
      residentRowInput.value = suggestion.rowNumber;
      residentPlotInput.value = suggestion.plotNumber;
      residentStatus.textContent = `That space is already taken or too close to the row end. Suggested: ${block.name}, Row ${suggestion.rowNumber}, Plot ${suggestion.plotNumber}${plotSpaces > 1 ? `-${suggestion.plotNumber + plotSpaces - 1}` : ""}.`;
    } else {
      residentStatus.textContent = `No ${plotSpaces}-space opening found in ${block.name}.`;
    }
    return;
  }
  const { stripNumber, side } = getStripSideFromRow(rowNumber, block.id);
  const nextNumber = plotRecords.length + 1;
  const existingPlot = getPlotByLocation(block.id, rowNumber, plotNumber);
  const plotId =
    existingPlot?.id ||
    `${block.id}-${String(rowNumber).padStart(2, "0")}-${String(plotNumber).padStart(3, "0")}-TEST-${String(
      nextNumber,
    ).padStart(3, "0")}`;
  const record = {
    id: `burial-test-${Date.now()}`,
    firstName,
    lastName,
    fullName,
    dateOfBirth: residentDobInput.value,
    dateOfDeath: residentDodInput.value,
    cemeteryId: activeCemetery?.id || "sligo-town-cemetery",
    cemeteryName: activeCemetery?.name || "Sligo Town Cemetery",
    plotId,
    blockId: block.id,
    stripId: `${block.id}-S${String(stripNumber).padStart(2, "0")}`,
    side,
    stripNumber,
    rowNumber,
    plotNumber,
    plotSpaces,
    calibrationEnabled: false,
  };

  plotRecords.push(record);
  if (plotSourceData && !existingPlot) {
    plotSourceData.plots.push({
      id: plotId,
      blockId: block.id,
      stripId: record.stripId,
      side,
      plotNumber,
      positionInBlock: getApproxPlotPositionInBlock(block, rowNumber, plotNumber, plotSpaces),
    });
  }
  if (plotSourceData) {
    plotSourceData.burials.push({
      id: record.id,
      firstName,
      lastName,
      dateOfBirth: residentDobInput.value,
      dateOfDeath: residentDodInput.value,
      plotSpaces,
      plotId,
    });
  }
  residentFullNameInput.value = "";
  residentDobInput.value = "";
  residentDodInput.value = "";
  const nextOpening = getNextAvailableLocation(block.id, rowNumber, 1);
  if (nextOpening) {
    residentRowInput.value = nextOpening.rowNumber;
    residentPlotInput.value = nextOpening.plotNumber;
    residentPlotSpacesInput.value = "1";
  }
  recordCountValue.textContent = `${plotRecords.filter((item) => !item.isCalibrationAnchor).length} records`;
  residentStatus.textContent = `Saving ${fullName}...`;
  renderSearchResults(searchInput.value);
  selectRecord(record);
  setState("selected");

  try {
    if (plotSourceData) await savePlotData(plotSourceData, residentStatus);
    residentStatus.textContent = `${fullName} added to ${block.name}, Row ${rowNumber}, Plot ${formatPlotRange(record)}.${
      nextOpening ? ` Next 1-space opening: Row ${nextOpening.rowNumber}, Plot ${nextOpening.plotNumber}.` : ""
    }`;
  } catch (error) {
    residentStatus.textContent = `${fullName} added in browser. ${getFriendlySaveError(error)}`;
    console.error(error);
  }
}

function renderSearchResults(query = "") {
  const normalisedQuery = query.trim().toLowerCase();
  if (!normalisedQuery) {
    searchResults.innerHTML = "";
    return;
  }

  const matches = plotRecords
    .filter((record) => !record.isCalibrationAnchor)
    .filter((record) => {
      return (
        record.fullName.toLowerCase().includes(normalisedQuery) ||
        record.lastName.toLowerCase().includes(normalisedQuery) ||
        record.plotId.toLowerCase().includes(normalisedQuery)
      );
    })
    .slice(0, 5);

  searchResults.innerHTML = matches
    .map(
      (record) => `
        <button class="result-row ${selectedRecord?.id === record.id ? "active" : ""}" data-burial-id="${record.id}">
          <span>
            <strong>${record.fullName}</strong>
            <small>${formatYear(record.dateOfBirth)}-${formatYear(record.dateOfDeath)}</small>
          </span>
          <em>${formatPlotLocation(record)}</em>
        </button>
      `,
    )
    .join("");

  if (!matches.length) {
    searchResults.innerHTML = `<p class="empty-results">No matching records</p>`;
  }
}

function renderResidentEditControls() {
  const residentRecords = plotRecords.filter((record) => !record.isCalibrationAnchor);
  if (!residentRecords.length) return;
  const activeId = selectedRecord && !selectedRecord.isCalibrationAnchor ? selectedRecord.id : residentRecords[0].id;
  editResidentSelect.innerHTML = residentRecords
    .map((record) => `<option value="${record.id}" ${record.id === activeId ? "selected" : ""}>${record.fullName}</option>`)
    .join("");
  editResidentBlockInput.innerHTML = cemeteryBlocks
    .map((block) => `<option value="${block.id}">${block.name}</option>`)
    .join("");
  populateResidentEditor(residentRecords.find((record) => record.id === activeId) || residentRecords[0]);
}

function populateResidentEditor(record) {
  if (!record) return;
  const block = getBlock(record.blockId);
  editResidentSelect.value = record.id;
  editResidentFullNameInput.value = record.fullName;
  editResidentBlockInput.value = record.blockId;
  editResidentRowInput.max = block.logicalRows || 1;
  editResidentRowInput.value = record.rowNumber;
  editResidentPlotInput.value = record.plotNumber;
  editResidentPlotSpacesInput.value = String(getPlotSpaces(record.plotSpaces));
  editResidentDobInput.value = record.dateOfBirth || "";
  editResidentDodInput.value = record.dateOfDeath || "";
  updateEditResidentSuggestion();
}

function renderSelectedPlotMarker(record) {
  if (!record) return;
  const mapPosition = getSelectedPlotScreenPosition(record);
  plotMarker.style.setProperty("--selected-plot-map-x", `${mapPosition.x}%`);
  plotMarker.style.setProperty("--selected-plot-map-y", `${mapPosition.y}%`);
}

function selectRecord(record) {
  if (!record) {
    selectedRecord = null;
    selectedName.textContent = "No resident selected";
    selectedPlot.textContent = activeCemetery ? activeCemetery.name : "";
    selectedDates.textContent = "";
    selectedDistance.textContent = "0 m";
    routeName.textContent = "No route selected";
    routePlot.textContent = "";
    return;
  }
  selectedRecord = record;
  selectedName.textContent = record.fullName;
  selectedPlot.textContent = formatPlotLocation(record);
  selectedDates.textContent = `${formatYear(record.dateOfBirth)}-${formatYear(record.dateOfDeath)}`;
  selectedDistance.textContent = `${getApproxDistanceMetres(record) ?? 0} m`;
  routeName.textContent = `To ${record.fullName}`;
  routePlot.textContent = formatPlotLocation(record);
  renderSelectedPlotMarker(record);
  updateRoutePath(record);
  if (workspaceMode !== "admin") focusRouteOnMap(record);
  renderSearchResults(searchInput.value);
  if (plotRecords.length) renderCalibrationMarkers();
  renderResidentEditControls();
}

async function loadTestPlots() {
  try {
    const apiResponse = await fetch("/api/remake-data");
    const apiData = await apiResponse.json();
    if (apiData.source === "supabase" && apiData.cemeteriesConfig?.cemeteries?.length) {
      cemeteriesConfig = apiData.cemeteriesConfig;
      allCemeteryEntrances = Array.isArray(apiData.entrances) ? apiData.entrances : [];
      allCemeteryBlocks = Array.isArray(apiData.blocks) ? apiData.blocks : [];
      await setActiveCemetery(cemeteriesConfig.activeCemeteryId || cemeteriesConfig.cemeteries[0]?.id);
      return;
    }
  } catch (error) {
    console.warn("Using bundled cemetery data fallback.", error);
  }

  const [cemeteriesResponse, entrancesResponse, blocksResponse] = await Promise.all([
    fetch("data/cemeteries.json"),
    fetch("data/entrances.json"),
    fetch("data/blocks.json"),
  ]);
  cemeteriesConfig = await cemeteriesResponse.json();
  allCemeteryEntrances = await entrancesResponse.json();
  allCemeteryBlocks = await blocksResponse.json();
  await setActiveCemetery(cemeteriesConfig.activeCemeteryId || cemeteriesConfig.cemeteries[0]?.id);
}

function hydrateBlock(block) {
  return {
    id: block.id,
    name: block.name || `Block ${block.id}`,
    physicalStrips: block.physicalStrips,
    rowsPerStrip: block.rowsPerStrip || 2,
    stripRowCounts: block.stripRowCounts,
    blockTemplate: block.blockTemplate || "standard-2",
    blockShape: block.blockShape || (block.blockTemplate === "irregular" ? "polygon" : "rectangle"),
    logicalRows: block.logicalRows,
    rowPlotCounts: block.rowPlotCounts,
    rowRules: block.rowRules,
    calibration: JSON.parse(JSON.stringify(block.calibration)),
  };
}

async function setActiveCemetery(cemeteryId) {
  activeCemetery =
    cemeteriesConfig.cemeteries.find((cemetery) => cemetery.id === cemeteryId) ||
    cemeteriesConfig.cemeteries[0];
  if (!activeCemetery) return;

  cemeterySelect.innerHTML = cemeteriesConfig.cemeteries
    .map((cemetery) => `<option value="${cemetery.id}" ${cemetery.id === activeCemetery.id ? "selected" : ""}>${cemetery.name}</option>`)
    .join("");
  cemeteryCountValue.textContent = `${cemeteriesConfig.cemeteries.length} cemeter${cemeteriesConfig.cemeteries.length === 1 ? "y" : "ies"}`;
  activeCemeteryName.textContent = activeCemetery.name;
  cemeteryOrgValue.textContent = activeCemetery.managingOrganisation?.name || "Organisation not set";
  renderCemeteryMapFrame();

  cemeteryEntrances = allCemeteryEntrances.filter((entrance) => entrance.cemeteryId === activeCemetery.id);
  if (!cemeteryEntrances.length) {
    cemeteryEntrances = [createDefaultEntrance(activeCemetery)];
    allCemeteryEntrances.push(...cemeteryEntrances);
  }
  ensureDefaultEntrancesForActiveCemetery();
  entranceCountValue.textContent = `${cemeteryEntrances.length} entrance${cemeteryEntrances.length === 1 ? "" : "s"}`;

  const activeBlocks = allCemeteryBlocks.filter((block) => block.cemeteryId === activeCemetery.id);
  cemeteryBlocks = activeBlocks.length ? activeBlocks.map(hydrateBlock) : [createBlock("A")];
  cemeteryBlocks.forEach((block) => {
    block.cemeteryId = activeCemetery.id;
    normalizeRowPlotCounts(block);
  });
  if (!activeBlocks.length) allCemeteryBlocks.push(...getSavableBlocks());
  defaultCemeteryBlocks = JSON.parse(JSON.stringify(cemeteryBlocks));
  selectedBlockId = cemeteryBlocks[0].id;
  blockA = getBlockCalibration("A");

  applyEntrance(cemeteryEntrances[0].id);
  renderBlockA();
  const data = await loadPlotData(activeCemetery);
  plotSourceData = data;
  plotRecords = flattenPlotRecords(data, activeCemetery);
  const residentRecords = plotRecords.filter((record) => !record.isCalibrationAnchor);
  recordCountValue.textContent = `${residentRecords.length} record${residentRecords.length === 1 ? "" : "s"}`;
  selectRecord(residentRecords[0] || plotRecords[0]);
  renderCalibrationMarkers();
}

function setMapZoom(nextZoom) {
  mapZoom = Math.min(2.6, Math.max(0.9, nextZoom));
  mapTransform.style.setProperty("--map-zoom", mapZoom.toFixed(2));
}

function renderMapPan() {
  mapTransform.style.setProperty("--map-pan-x", `${mapPan.x}px`);
  mapTransform.style.setProperty("--map-pan-y", `${mapPan.y}px`);
}

function frameHeadingUpUser() {
  if (!headingUp) return;
  const { width, height } = getMapSize();
  const userPoint = {
    x: (userPosition.x / 100) * width,
    y: (userPosition.y / 100) * height,
  };
  mapPan.x = width * 0.5 - userPoint.x;
  mapPan.y = height * 0.8 - userPoint.y;
  renderMapPan();
}

function focusRouteOnMap(record) {
  if (!record) return;
  if (headingUp) {
    frameHeadingUpUser();
    return;
  }
  const { width, height } = getMapSize();
  const target = getSelectedPlotScreenPosition(record);
  const center = {
    x: ((userPosition.x + target.x) / 2 / 100) * width,
    y: ((userPosition.y + target.y) / 2 / 100) * height,
  };
  const origin = {
    x: (userPosition.x / 100) * width,
    y: (userPosition.y / 100) * height,
  };
  const dx = Math.abs(target.x - userPosition.x);
  const dy = Math.abs(target.y - userPosition.y);
  const fitZoom = Math.min(1.45, Math.max(1.02, 42 / Math.max(dx, dy, 24)));
  const desired = {
    x: width * 0.5,
    y: height * 0.48,
  };

  setMapZoom(fitZoom);
  mapPan.x = desired.x - origin.x - mapZoom * (center.x - origin.x);
  mapPan.y = desired.y - origin.y - mapZoom * (center.y - origin.y);
  renderMapPan();
}

function renderHeading() {
  mapTransform.style.setProperty("--map-heading", headingUp ? `${headingRotation}deg` : "0deg");
  headingToggle.classList.toggle("active", headingUp);
  headingRotationInput.value = headingRotation;
  headingValue.textContent = `heading ${headingRotation}deg`;
  frameHeadingUpUser();
}

function renderUserMarker() {
  userMarker.style.setProperty("--user-marker-x", `${userPosition.x}%`);
  userMarker.style.setProperty("--user-marker-y", `${userPosition.y}%`);
  mapTransform.style.setProperty("--user-marker-x", `${userPosition.x}%`);
  mapTransform.style.setProperty("--user-marker-y", `${userPosition.y}%`);
  userMarkerValue.textContent = `x ${userPosition.x.toFixed(1)}%, y ${userPosition.y.toFixed(1)}%`;

  frameHeadingUpUser();
  if (selectedRecord) updateRoutePath(selectedRecord);
  if (plotRecords.length) renderCalibrationMarkers();
}

function getResponsiveBlockScale() {
  const { width, height } = getMapSize();
  const viewportScale = Math.min(
    (width || referenceMapWidth) / mobileMapReference.width,
    (height || mobileMapReference.height) / mobileMapReference.height,
  );
  return viewportScale;
}

function getResponsiveBlockPosition(calibration) {
  return {
    x: calibration.x,
    y: calibration.y,
  };
}

function getRenderedBlockSize(calibration) {
  const scale = getResponsiveBlockScale();
  return {
    width: calibration.width * scale,
    height: calibration.height * scale,
  };
}

function applyBlockStyles(element, calibration, block = getBlock(element.dataset.extraBlock || element.dataset.editableBlock || "A")) {
  const polygon = calibration.polygon || [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];
  const renderedPosition = getResponsiveBlockPosition(calibration);
  element.style.setProperty("--block-a-x", `${renderedPosition.x}%`);
  element.style.setProperty("--block-a-y", `${renderedPosition.y}%`);
  const renderedSize = getRenderedBlockSize(calibration);
  element.style.setProperty("--block-a-width", `${renderedSize.width}px`);
  element.style.setProperty("--block-a-height", `${renderedSize.height}px`);
  element.style.setProperty("--block-a-rotate", `${calibration.rotate}deg`);
  element.style.setProperty("--cutout-x", `${calibration.cutout.x}%`);
  element.style.setProperty("--cutout-y", `${calibration.cutout.y}%`);
  element.style.setProperty("--cutout-width", `${calibration.cutout.width}%`);
  element.style.setProperty("--cutout-height", `${calibration.cutout.height}%`);
  element.style.setProperty("--block-line-step", `${100 / Math.max(1, block.physicalStrips || Math.ceil((block.logicalRows || 2) / 2))}%`);
  element.style.setProperty("--poly-a", `${polygon[0].x}% ${polygon[0].y}%`);
  element.style.setProperty("--poly-b", `${polygon[1].x}% ${polygon[1].y}%`);
  element.style.setProperty("--poly-c", `${polygon[2].x}% ${polygon[2].y}%`);
  element.style.setProperty("--poly-d", `${polygon[3].x}% ${polygon[3].y}%`);
  element.dataset.blockTemplate = block.blockTemplate || "standard-2";
  element.dataset.blockShape = block.blockShape || (block.blockTemplate === "irregular" ? "polygon" : "rectangle");
}

function renderBlockSelection() {
  editableBlock.classList.toggle("selected-block", selectedBlockId === "A");
  document.querySelectorAll("[data-extra-block]").forEach((element) => {
    element.classList.toggle("selected-block", element.dataset.extraBlock === selectedBlockId);
  });
  if (blockSelect.value !== selectedBlockId) blockSelect.value = selectedBlockId;
  renderBlockControls(getBlock(), getBlockCalibration());
  renderCalibrationMarkers();
}

function renderBlockControls(block, calibration) {
  normalizeRowPlotCounts(block, block.logicalRows || (block.id === "A" ? 18 : 2));
  blockShapeInput.value = block.blockShape === "polygon" || block.blockTemplate === "irregular" ? "polygon" : "rectangle";
  blockTemplateInput.value = String(block.rowsPerStrip || 2);
  stripsInput.value = block.physicalStrips;
  blockVisualModeInput.value = blockVisualMode;
  rowsInput.value = block.logicalRows;
  widthInput.value = Math.round(calibration.width);
  heightInput.value = Math.round(calibration.height);
  rotateInput.value = Math.round(calibration.rotate);
  cutoutInputs.x.value = Math.round(calibration.cutout.x);
  cutoutInputs.y.value = Math.round(calibration.cutout.y);
  cutoutInputs.width.value = Math.round(calibration.cutout.width);
  cutoutInputs.height.value = Math.round(calibration.cutout.height);
  blockPositionValue.textContent = `x ${calibration.x.toFixed(1)}%, y ${calibration.y.toFixed(1)}%`;
  blockSizeValue.textContent = `${Math.round(calibration.width)} x ${Math.round(calibration.height)}, ${Math.round(
    calibration.rotate,
  )}deg`;
  blockCutValue.textContent = `cut-out x ${Math.round(calibration.cutout.x)}, y ${Math.round(
    calibration.cutout.y,
  )}, ${Math.round(calibration.cutout.width)} x ${Math.round(calibration.cutout.height)}`;
  activeBlockName.textContent = `Selected: ${block.name}`;
  deleteBlockButton.disabled = block.id === "A" || cemeteryBlocks.length <= 1;
  residentBlockInput.innerHTML = cemeteryBlocks
    .map((item) => `<option value="${item.id}" ${item.id === block.id ? "selected" : ""}>${item.name}</option>`)
    .join("");
  residentRowInput.max = block.logicalRows;

  const totalPlots = Object.values(block.rowPlotCounts).reduce((total, count) => total + Number(count || 0), 0);
  rowSummary.innerHTML = `
    <strong>${block.name} rows</strong>
    <span>${block.physicalStrips} physical strip${block.physicalStrips === 1 ? "" : "s"}</span>
    <span>${block.rowsPerStrip || 2} row${(block.rowsPerStrip || 2) === 1 ? "" : "s"} per strip</span>
    <span>${block.logicalRows} logical row${block.logicalRows === 1 ? "" : "s"}</span>
    <span>Estimated total: ${totalPlots} plots</span>
  `;
  renderRowCountEditor(block);
  renderStripRowEditor(block);
}

function renderRowCountEditor(block = getBlock()) {
  normalizeRowPlotCounts(block, block.logicalRows || 1);
  rowCountList.innerHTML = Array.from({ length: block.logicalRows }, (_, index) => {
    const row = index + 1;
    const strip = Math.ceil(row / (block.rowsPerStrip || 2));
    return `
      <label class="row-count-item">
        <span>Row ${row}<small>Strip ${strip}</small></span>
        <input data-row-plot-count="${row}" type="number" min="1" max="200" value="${block.rowPlotCounts[row] || 32}" />
      </label>
    `;
  }).join("");
}

function renderStripRowEditor(block = getBlock()) {
  block.stripRowCounts = normalizeStripRowCounts(block);
  stripRowList.innerHTML = Array.from({ length: block.physicalStrips }, (_, index) => {
    const strip = index + 1;
    return `
      <label class="strip-row-item">
        <span>Strip ${strip}<small>Rows inside this strip</small></span>
        <input data-strip-row-count="${strip}" type="number" min="1" max="5" value="${block.stripRowCounts[strip] || block.rowsPerStrip || 2}" />
      </label>
    `;
  }).join("");
}

function renderBlockA() {
  const activeBlock = getBlock();
  const activeCalibration = activeBlock.calibration;
  blockA = getBlockCalibration("A");
  mapTransform.dataset.blockVisual = blockVisualMode;

  applyBlockStyles(editableBlock, blockA, getBlock("A"));
  editableBlock.innerHTML = `${getCornerHandlesHtml(getBlock("A"))}<i class="resize-handle" aria-hidden="true"></i>`;
  editableBlock.classList.toggle("selected-block", selectedBlockId === "A");

  document.querySelectorAll("[data-extra-block]").forEach((element) => element.remove());
  cemeteryBlocks
    .filter((block) => block.id !== "A")
    .forEach((block) => {
      const calibration = block.calibration;
      const element = document.createElement("div");
      element.className = `block-a-overlay extra-block-overlay ${selectedBlockId === block.id ? "selected-block" : ""}`;
      element.dataset.extraBlock = block.id;
      applyBlockStyles(element, calibration, block);
      element.innerHTML = `${getCornerHandlesHtml(block)}<i class="resize-handle" aria-hidden="true"></i>`;
      mapTransform.insertBefore(element, userMarker);
    });

  blockSelect.innerHTML = cemeteryBlocks
    .map((block) => `<option value="${block.id}" ${block.id === selectedBlockId ? "selected" : ""}>${block.name}</option>`)
    .join("");
  renderBlockControls(activeBlock, activeCalibration);

  if (selectedRecord) updateRoutePath(selectedRecord);
  if (plotRecords.length) renderCalibrationMarkers();
}

function getCornerHandlesHtml(block) {
  if (block.blockShape !== "polygon" && block.blockTemplate !== "irregular") return "";
  const points = block.calibration.polygon || [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];

  return points
    .map((point, index) => `<i class="corner-handle" data-corner-handle="${index}" style="left:${point.x}%; top:${point.y}%"></i>`)
    .join("");
}

function getPlotPositionInBlock(record) {
  if (record.calibratedPositionInBlock) return record.calibratedPositionInBlock;
  const sharedStripStart = plotRecords.find(
    (item) =>
      item.blockId === record.blockId &&
      item.stripId === record.stripId &&
      item.side === record.side &&
      item.plotNumber === 1 &&
      item.calibratedPositionInBlock,
  );

  if (record.plotNumber === 1 && sharedStripStart) return sharedStripStart.calibratedPositionInBlock;

  if (record.blockId !== "A" && record.positionInBlock?.xPercent !== undefined) {
    return {
      x: Number(record.positionInBlock.xPercent),
      y: Number(record.positionInBlock.yPercent),
    };
  }
  const block = getBlock(record.blockId);
  const rowPlotCount = Number(block?.rowPlotCounts?.[record.rowNumber]) || (record.rowNumber <= 2 ? 26 : 32);
  const effectivePlotNumber = Number(record.plotNumber) + (getPlotSpaces(record.plotSpaces) - 1) / 2;
  const x = Math.min(96, Math.max(4, 2.8 + record.rowNumber * 5.54));
  const y = Math.min(96, Math.max(4, 4 + ((effectivePlotNumber - 1) / Math.max(1, rowPlotCount - 1)) * 92));
  return { x, y };
}

function getMapSize() {
  return {
    width: mapArea.clientWidth || 390,
    height: mapArea.clientHeight || 800,
  };
}

function getMapLocalPoint(event) {
  const rect = mapArea.getBoundingClientRect();
  const { width, height } = getMapSize();
  const origin = {
    x: (userPosition.x / 100) * width,
    y: (userPosition.y / 100) * height,
  };
  const screenPoint = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
  const translated = {
    x: screenPoint.x - origin.x - mapPan.x,
    y: screenPoint.y - origin.y - mapPan.y,
  };
  const angle = headingUp ? (headingRotation * Math.PI) / 180 : 0;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: origin.x + (translated.x * cos + translated.y * sin) / mapZoom,
    y: origin.y + (-translated.x * sin + translated.y * cos) / mapZoom,
  };
}

function getBlockMapPoint(plotPosition, blockCalibration) {
  const { width, height } = getMapSize();
  const renderedSize = getRenderedBlockSize(blockCalibration);
  const renderedPosition = getResponsiveBlockPosition(blockCalibration);
  const angle = (blockCalibration.rotate * Math.PI) / 180;
  const skew = Math.tan((-2 * Math.PI) / 180);
  const localX = ((plotPosition.x - 50) / 100) * renderedSize.width;
  const localY = ((plotPosition.y - 50) / 100) * renderedSize.height;
  const skewedX = localX;
  const skewedY = localY + localX * skew;
  const rotatedX = skewedX * Math.cos(angle) - skewedY * Math.sin(angle);
  const rotatedY = skewedX * Math.sin(angle) + skewedY * Math.cos(angle);

  return {
    x: (renderedPosition.x / 100) * width + rotatedX,
    y: (renderedPosition.y / 100) * height + rotatedY,
  };
}

function getKnownPlotMapPosition(record) {
  return null;
}

function getSelectedPlotScreenPosition(record) {
  const knownPosition = getKnownPlotMapPosition(record);
  if (knownPosition) return knownPosition;

  const plotPosition = getPlotPositionInBlock(record);
  const blockCalibration = getBlockCalibration(record.blockId);
  const mapPoint = getBlockMapPoint(plotPosition, blockCalibration);
  const { width, height } = getMapSize();
  return {
    x: (mapPoint.x / width) * 100,
    y: (mapPoint.y / height) * 100,
  };
}

function getSvgPointFromElement(element, fallback) {
  const ctm = routeSvg.getScreenCTM();
  if (!ctm) return fallback;

  const rect = element.getBoundingClientRect();
  const point = routeSvg.createSVGPoint();
  point.x = rect.left + rect.width / 2;
  point.y = rect.top + rect.height / 2;
  return point.matrixTransform(ctm.inverse());
}

function updateRoutePath(record) {
  renderSelectedPlotMarker(record);
  const target = getSelectedPlotScreenPosition(record);
  const startFallback = {
    x: (userPosition.x / 100) * 390,
    y: (userPosition.y / 100) * 800,
  };
  const endFallback = {
    x: (target.x / 100) * 390,
    y: (target.y / 100) * 800,
  };
  const start = getSvgPointFromElement(userMarker, startFallback);
  const end = getSvgPointFromElement(plotMarker, endFallback);
  const startX = start.x;
  const startY = start.y;
  const endX = end.x;
  const endY = end.y;
  const controlX = startX + (endX - startX) * 0.55;
  const controlY = startY + (endY - startY) * 0.42;

  routePath.setAttribute("d", `M${startX} ${startY} Q${controlX} ${controlY} ${endX} ${endY}`);
}

function renderCalibrationMarkers() {
  const selectedBlock = getBlock();
  if (activeCalibrationBlockId !== selectedBlock.id) {
    calibrationMarkers.innerHTML = "";
    calibrationValues.innerHTML = "";
    activeCalibrationValue.textContent = `Press Start Cal to create plot anchors for ${selectedBlock.name}`;
    return;
  }

  const calibrationRecords = plotRecords.filter(
    (record) => record.calibrationEnabled && record.blockId === selectedBlock.id,
  );
  const activeRecord = getActiveCalibrationRecord();
  activeCalibrationValue.textContent = activeRecord
    ? `Editing plot anchor: ${getCalibrationLabel(activeRecord)}`
    : `No active plot calibration for ${selectedBlock.name}`;

  calibrationMarkers.innerHTML = calibrationRecords
    .map((record) => {
      const position = getSelectedPlotScreenPosition(record);
      return `<button class="calibration-marker ${
        activeCalibrationId === record.id ? "selected" : ""
      }" data-calibration-id="${record.id}" style="left:${position.x}%; top:${position.y}%" title="${getCalibrationLabel(record)}"></button>`;
    })
    .join("");

  renderCalibrationValues(calibrationRecords);
}

function renderCalibrationValues(
  records = plotRecords.filter((record) => record.calibrationEnabled && record.blockId === activeCalibrationBlockId),
) {
  calibrationValues.innerHTML = records
    .map((record) => {
      const position = getPlotPositionInBlock(record);
      return `<span>${getCalibrationLabel(record)} - x ${position.x.toFixed(
        1,
      )}%, y ${position.y.toFixed(1)}%</span>`;
    })
    .join("");
}

function getMapPoint(event) {
  const localPoint = getMapLocalPoint(event);
  const { width, height } = getMapSize();
  return {
    x: (localPoint.x / width) * 100,
    y: (localPoint.y / height) * 100,
  };
}

function getPlotPositionFromMapPoint(event, blockId = "A") {
  const calibration = getBlockCalibration(blockId);
  const renderedSize = getRenderedBlockSize(calibration);
  const renderedPosition = getResponsiveBlockPosition(calibration);
  const mapPoint = getMapLocalPoint(event);
  const { width, height } = getMapSize();
  const rotatedX = mapPoint.x - (renderedPosition.x / 100) * width;
  const rotatedY = mapPoint.y - (renderedPosition.y / 100) * height;
  const angle = (calibration.rotate * Math.PI) / 180;
  const skew = Math.tan((-2 * Math.PI) / 180);
  const skewedX = rotatedX * Math.cos(angle) + rotatedY * Math.sin(angle);
  const skewedY = -rotatedX * Math.sin(angle) + rotatedY * Math.cos(angle);
  const localX = skewedX;
  const localY = skewedY - localX * skew;

  return {
    x: Math.min(100, Math.max(0, 50 + (localX / renderedSize.width) * 100)),
    y: Math.min(100, Math.max(0, 50 + (localY / renderedSize.height) * 100)),
  };
}

function placeActiveCalibrationAt(event) {
  const record = getActiveCalibrationRecord();
  if (!record) return false;

  event.preventDefault();
  event.stopPropagation();
  record.calibratedPositionInBlock = getPlotPositionFromMapPoint(event, record.blockId);
  selectRecord(record);
  if (workspaceMode === "admin") setState("map");
  renderCalibrationMarkers();
  return true;
}

function updateDraggedBlock(event) {
  if (!dragMode || dragMode.pointerId !== event.pointerId) return;

  const calibration = getBlockCalibration(dragMode.blockId);
  const current = getMapPoint(event);
  const dx = current.x - dragMode.start.x;
  const dy = current.y - dragMode.start.y;

  if (dragMode.type === "corner") {
    calibration.polygon ||= [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const point = getPlotPositionFromMapPoint(event, dragMode.blockId);
    calibration.polygon[dragMode.cornerIndex] = {
      x: Number(point.x.toFixed(1)),
      y: Number(point.y.toFixed(1)),
    };
  } else if (dragMode.type === "move") {
    calibration.x = Math.min(125, Math.max(-25, dragMode.initial.x + dx));
    calibration.y = Math.min(125, Math.max(-25, dragMode.initial.y + dy));
  } else {
    const scale = getResponsiveBlockScale();
    const widthScale = mapTransform.getBoundingClientRect().width / 100 / scale;
    const heightScale = mapTransform.getBoundingClientRect().height / 100 / scale;
    calibration.width = Math.min(280, Math.max(12, dragMode.initial.width + dx * widthScale));
    calibration.height = Math.min(280, Math.max(18, dragMode.initial.height + dy * heightScale));
  }

  applyBlockStyles(dragMode.element, calibration);
  if (dragMode.type === "corner") dragMode.element.innerHTML = `${getCornerHandlesHtml(getBlock(dragMode.blockId))}<i class="resize-handle" aria-hidden="true"></i>`;
  renderBlockControls(getBlock(dragMode.blockId), calibration);
  markBlocksUnsaved();
  if (selectedRecord) updateRoutePath(selectedRecord);
}

function startCalibrationDrag(record, event, marker = null) {
  if (!record) return;
  event.preventDefault();
  event.stopPropagation();
  setActiveCalibrationRecord(record);
  selectRecord(record);
  if (workspaceMode === "admin") {
    setState("map");
  } else {
    setState("selected");
  }

  if (!marker) return;

  marker.setPointerCapture(event.pointerId);
  const position = getPlotPositionFromMapPoint(event, record.blockId);
  calibrationDrag = {
    pointerId: event.pointerId,
    record,
    marker,
    start: getMapPoint(event),
    initial: { ...position },
  };
}

document.addEventListener("click", (event) => {
  const modeButton = event.target.closest("[data-mode-option]");
  if (modeButton) {
    setWorkspaceMode(modeButton.dataset.modeOption);
    return;
  }

  const calibrationButton = event.target.closest("[data-calibration-id]");
  if (calibrationButton) {
    const record = plotRecords.find((item) => item.id === calibrationButton.dataset.calibrationId);
    if (record) {
      setActiveCalibrationRecord(record);
      selectRecord(record);
      if (workspaceMode === "admin") {
        setState("map");
      } else {
        setState("selected");
      }
    }
    return;
  }

  const resultButton = event.target.closest("[data-burial-id]");
  if (resultButton) {
    const record = plotRecords.find((item) => item.id === resultButton.dataset.burialId);
    if (record) {
      selectRecord(record);
      setState("selected");
      searchInput.blur();
    }
    return;
  }

  const trigger = event.target.closest("[data-state], [data-next]");
  if (!trigger) return;

  setState(trigger.dataset.state || trigger.dataset.next);
});

searchInput.addEventListener("focus", () => setState("search"));
searchInput.addEventListener("input", () => {
  renderSearchResults(searchInput.value);
  if (screen.dataset.screen !== "search") setState("search");
});

document.addEventListener("click", (event) => {
  const zoomButton = event.target.closest("[data-zoom]");
  if (!zoomButton) return;

  setMapZoom(mapZoom + (zoomButton.dataset.zoom === "in" ? 0.18 : -0.18));
});

mapArea.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    const step = event.ctrlKey ? 0.18 : 0.1;
    setMapZoom(mapZoom + direction * step);
  },
  { passive: false },
);

headingToggle.addEventListener("click", () => {
  headingUp = !headingUp;
  renderHeading();
});

headingRotationInput.addEventListener("input", () => {
  headingRotation = Number(headingRotationInput.value);
  renderHeading();
});

window.addEventListener("resize", scheduleCemeteryLeafletSync);

allowLocationButton.addEventListener("click", startHighAccuracyLocation);

locateButton.addEventListener("click", () => {
  setState("map");
  startHighAccuracyLocation();
});

mapTransform.addEventListener("pointerdown", (event) => {
  const extraBlock = event.target.closest("[data-extra-block]");
  if (extraBlock && workspaceMode === "admin") {
    const cornerHandle = event.target.closest("[data-corner-handle]");
    const activeCalibrationRecord = getActiveCalibrationRecord();
    if (activeCalibrationRecord?.blockId === extraBlock.dataset.extraBlock && !event.target.classList.contains("resize-handle") && !cornerHandle) {
      placeActiveCalibrationAt(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    selectedBlockId = extraBlock.dataset.extraBlock;
    renderBlockSelection();
    extraBlock.setPointerCapture(event.pointerId);
    dragMode = {
      type: cornerHandle ? "corner" : event.target.classList.contains("resize-handle") ? "resize" : "move",
      cornerIndex: cornerHandle ? Number(cornerHandle.dataset.cornerHandle) : null,
      pointerId: event.pointerId,
      blockId: extraBlock.dataset.extraBlock,
      element: extraBlock,
      start: getMapPoint(event),
      initial: { ...getBlockCalibration(extraBlock.dataset.extraBlock) },
    };
    return;
  }

  if (event.target.closest("[data-editable-block], [data-extra-block], .zoom-controls, button, input")) return;

  mapTransform.setPointerCapture(event.pointerId);
  panMode = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    initialX: mapPan.x,
    initialY: mapPan.y,
  };
});

mapArea.addEventListener("pointerdown", (event) => {
  if (panMode || dragMode) return;
  if (event.target.closest("[data-editable-block], [data-extra-block], .zoom-controls, button, input, .top-search, .panel-state")) return;

  mapArea.setPointerCapture(event.pointerId);
  panMode = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    initialX: mapPan.x,
    initialY: mapPan.y,
  };
});

mapTransform.addEventListener("pointermove", (event) => {
  if (dragMode && dragMode.pointerId === event.pointerId) {
    updateDraggedBlock(event);
    return;
  }

  if (!panMode || panMode.pointerId !== event.pointerId) return;

  mapPan.x = panMode.initialX + event.clientX - panMode.startX;
  mapPan.y = panMode.initialY + event.clientY - panMode.startY;
  renderMapPan();
});

mapArea.addEventListener("pointermove", (event) => {
  if (!panMode || panMode.pointerId !== event.pointerId) return;

  mapPan.x = panMode.initialX + event.clientX - panMode.startX;
  mapPan.y = panMode.initialY + event.clientY - panMode.startY;
  renderMapPan();
});

mapTransform.addEventListener("pointerup", (event) => {
  if (dragMode?.pointerId === event.pointerId) {
    dragMode = null;
  }

  if (panMode?.pointerId === event.pointerId) {
    panMode = null;
  }
});

mapArea.addEventListener("pointerup", (event) => {
  if (panMode?.pointerId === event.pointerId) {
    panMode = null;
  }
});

mapTransform.addEventListener("pointercancel", () => {
  panMode = null;
});

mapArea.addEventListener("pointercancel", () => {
  panMode = null;
});

editableBlock.addEventListener("pointerdown", (event) => {
  if (workspaceMode !== "admin") return;
  if (event.target.closest("[data-calibration-id]")) return;
  const cornerHandle = event.target.closest("[data-corner-handle]");
  const activeCalibrationRecord = getActiveCalibrationRecord();
  if (activeCalibrationRecord && !event.target.classList.contains("resize-handle") && !cornerHandle) {
    placeActiveCalibrationAt(event);
    return;
  }
  event.preventDefault();
  selectedBlockId = "A";
  renderBlockSelection();
  editableBlock.setPointerCapture(event.pointerId);

  const start = getMapPoint(event);
  dragMode = {
    type: cornerHandle ? "corner" : event.target.classList.contains("resize-handle") ? "resize" : "move",
    cornerIndex: cornerHandle ? Number(cornerHandle.dataset.cornerHandle) : null,
    pointerId: event.pointerId,
    blockId: "A",
    element: editableBlock,
    start,
    initial: { ...getBlockCalibration("A") },
  };
});

userMarker.addEventListener("pointerdown", (event) => {
  if (workspaceMode !== "admin") return;
  event.preventDefault();
  event.stopPropagation();
  userMarker.setPointerCapture(event.pointerId);

  userMarkerDrag = {
    pointerId: event.pointerId,
    start: getMapPoint(event),
    initial: { ...userPosition },
  };
});

userMarker.addEventListener("pointermove", (event) => {
  if (!userMarkerDrag || userMarkerDrag.pointerId !== event.pointerId) return;

  const current = getMapPoint(event);
  userPosition.x = Math.min(98, Math.max(2, userMarkerDrag.initial.x + current.x - userMarkerDrag.start.x));
  userPosition.y = Math.min(98, Math.max(2, userMarkerDrag.initial.y + current.y - userMarkerDrag.start.y));
  syncSelectedEntrancePosition();
  renderUserMarker();
});

userMarker.addEventListener("pointerup", (event) => {
  if (userMarkerDrag?.pointerId === event.pointerId) {
    userMarkerDrag = null;
  }
});

userMarker.addEventListener("pointercancel", () => {
  userMarkerDrag = null;
});

calibrationMarkers.addEventListener("pointerdown", (event) => {
  if (workspaceMode !== "admin") return;
  const marker = event.target.closest("[data-calibration-id]");
  if (!marker) return;

  const record = plotRecords.find((item) => item.id === marker.dataset.calibrationId);
  startCalibrationDrag(record, event, marker);
});

calibrationMarkers.addEventListener("pointermove", (event) => {
  if (!calibrationDrag || calibrationDrag.pointerId !== event.pointerId) return;

  const nextPosition = getPlotPositionFromMapPoint(event, calibrationDrag.record.blockId);
  calibrationDrag.record.calibratedPositionInBlock = nextPosition;
  if (calibrationDrag.marker) {
    const markerPosition = getSelectedPlotScreenPosition(calibrationDrag.record);
    calibrationDrag.marker.style.left = `${markerPosition.x}%`;
    calibrationDrag.marker.style.top = `${markerPosition.y}%`;
  }

  if (selectedRecord?.id === calibrationDrag.record.id) updateRoutePath(calibrationDrag.record);
  renderCalibrationValues();
});

calibrationMarkers.addEventListener("pointerup", (event) => {
  if (calibrationDrag?.pointerId === event.pointerId) {
    if (calibrationDrag.marker) calibrationDrag.marker.releasePointerCapture(event.pointerId);
    calibrationDrag = null;
    renderCalibrationMarkers();
  }
});

calibrationMarkers.addEventListener("pointercancel", () => {
  calibrationDrag = null;
});

editableBlock.addEventListener("pointermove", (event) => {
  updateDraggedBlock(event);
});

editableBlock.addEventListener("pointerup", (event) => {
  if (dragMode?.pointerId === event.pointerId) {
    dragMode = null;
  }
});

editableBlock.addEventListener("pointercancel", () => {
  dragMode = null;
});

widthInput.addEventListener("input", () => {
  getBlockCalibration().width = Number(widthInput.value);
  markBlocksUnsaved();
  renderBlockA();
});

heightInput.addEventListener("input", () => {
  getBlockCalibration().height = Number(heightInput.value);
  markBlocksUnsaved();
  renderBlockA();
});

rotateInput.addEventListener("input", () => {
  getBlockCalibration().rotate = Number(rotateInput.value);
  markBlocksUnsaved();
  renderBlockA();
});

toggleBlockControlsButton.addEventListener("click", () => {
  const collapsed = blockAdjustments.classList.toggle("collapsed");
  toggleBlockControlsButton.setAttribute("aria-expanded", String(!collapsed));
  toggleBlockControlsButton.querySelector("span").textContent = collapsed ? "Show controls" : "Hide controls";
});

toggleCutoutControlsButton.addEventListener("click", () => {
  const collapsed = cutoutControls.classList.toggle("collapsed");
  toggleCutoutControlsButton.setAttribute("aria-expanded", String(!collapsed));
  toggleCutoutControlsButton.querySelector("span").textContent = collapsed ? "Show cut-outs" : "Hide cut-outs";
});

function updateActiveBlockRows() {
  const block = getBlock();
  if (rowsInput.value === "") return;
  block.logicalRows = Math.min(160, Math.max(1, Number(rowsInput.value) || block.logicalRows || 2));
  normalizeRowPlotCounts(block, block.logicalRows);
  rowsInput.value = block.logicalRows;
  markBlocksUnsaved();
  saveBlockBrowserBackup();
  renderBlockA();
}

function updateActiveBlockStructure() {
  const block = getBlock();
  const rowsPerStrip = Number(blockTemplateInput.value);
  block.blockTemplate = `standard-${rowsPerStrip}`;
  block.rowsPerStrip = rowsPerStrip;
  block.physicalStrips = Math.min(40, Math.max(1, Number(stripsInput.value) || block.physicalStrips || 1));
  block.stripRowCounts = Object.fromEntries(Array.from({ length: block.physicalStrips }, (_, index) => [String(index + 1), rowsPerStrip]));
  block.logicalRows = getLogicalRowsFromStrips(block);
  normalizeRowPlotCounts(block, block.logicalRows);
  markBlocksUnsaved();
  saveBlockBrowserBackup();
  renderBlockA();
}

function updateActiveBlockShape() {
  const block = getBlock();
  block.blockShape = blockShapeInput.value === "polygon" ? "polygon" : "rectangle";
  if (block.blockShape === "polygon" && !block.calibration.polygon) {
    block.calibration.polygon = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
  }
  markBlocksUnsaved();
  saveBlockBrowserBackup();
  renderBlockA();
}

rowsInput.addEventListener("input", () => {
  if (rowsInput.value === "") return;
  updateActiveBlockRows();
});

rowsInput.addEventListener("change", () => {
  if (rowsInput.value === "") rowsInput.value = getBlock().logicalRows || 2;
  updateActiveBlockRows();
});

blockShapeInput.addEventListener("change", updateActiveBlockShape);
blockTemplateInput.addEventListener("change", updateActiveBlockStructure);
stripsInput.addEventListener("input", () => {
  if (stripsInput.value === "") return;
  updateActiveBlockStructure();
});
stripsInput.addEventListener("change", () => {
  if (stripsInput.value === "") stripsInput.value = getBlock().physicalStrips || 1;
  updateActiveBlockStructure();
});

Object.entries(cutoutInputs).forEach(([key, input]) => {
  input.addEventListener("input", () => {
    getBlockCalibration().cutout[key] = Number(input.value);
    markBlocksUnsaved();
    renderBlockA();
  });
});

resetBlockButton.addEventListener("click", () => {
  const block = getBlock();
  const savedBlock = defaultCemeteryBlocks.find((item) => item.id === block.id) || createBlock(block.id);
  block.calibration = JSON.parse(JSON.stringify(savedBlock.calibration));
  block.logicalRows = savedBlock.logicalRows;
  block.physicalStrips = savedBlock.physicalStrips;
  block.rowsPerStrip = savedBlock.rowsPerStrip || 2;
  block.stripRowCounts = JSON.parse(JSON.stringify(savedBlock.stripRowCounts || normalizeStripRowCounts(block)));
  block.blockTemplate = savedBlock.blockTemplate || "standard-2";
  block.blockShape = savedBlock.blockShape || (savedBlock.blockTemplate === "irregular" ? "polygon" : "rectangle");
  block.rowPlotCounts = JSON.parse(JSON.stringify(savedBlock.rowPlotCounts || getDefaultRowPlotCounts(block.logicalRows, block.id)));
  markBlocksUnsaved();
  renderBlockA();
});

blockSelect.addEventListener("change", () => {
  activeCalibrationId = null;
  activeCalibrationBlockId = null;
  setSelectedBlock(blockSelect.value);
});

startCalibrationButton.addEventListener("click", startCalibrationForSelectedBlock);

clearCalibrationButton.addEventListener("click", saveCalibrations);

addResidentButton.addEventListener("click", addResident);

useResidentSuggestionButton.addEventListener("click", () => {
  const suggestion = updateResidentSuggestion();
  if (!suggestion) return;
  residentRowInput.value = suggestion.rowNumber;
  residentPlotInput.value = suggestion.plotNumber;
  updateResidentSuggestion();
});

residentBlockInput.addEventListener("change", () => {
  const block = getBlock(residentBlockInput.value);
  residentRowInput.max = block.logicalRows || 1;
  residentRowInput.value = Math.min(Number(residentRowInput.value) || 1, block.logicalRows || 1);
  updateResidentSuggestion();
});

[residentRowInput, residentPlotInput, residentPlotSpacesInput].forEach((input) => {
  input.addEventListener("input", updateResidentSuggestion);
  input.addEventListener("change", updateResidentSuggestion);
});

editResidentSelect.addEventListener("change", () => {
  populateResidentEditor(plotRecords.find((record) => record.id === editResidentSelect.value));
});

useEditResidentSuggestionButton.addEventListener("click", () => {
  const suggestion = updateEditResidentSuggestion();
  if (!suggestion) return;
  editResidentRowInput.value = suggestion.rowNumber;
  editResidentPlotInput.value = suggestion.plotNumber;
  updateEditResidentSuggestion();
});

editResidentBlockInput.addEventListener("change", () => {
  const block = getBlock(editResidentBlockInput.value);
  editResidentRowInput.max = block.logicalRows || 1;
  editResidentRowInput.value = Math.min(Number(editResidentRowInput.value) || 1, block.logicalRows || 1);
  updateEditResidentSuggestion();
});

[editResidentRowInput, editResidentPlotInput, editResidentPlotSpacesInput].forEach((input) => {
  input.addEventListener("input", updateEditResidentSuggestion);
  input.addEventListener("change", updateEditResidentSuggestion);
});

saveResidentEditButton.addEventListener("click", async () => {
  const record = plotRecords.find((item) => item.id === editResidentSelect.value);
  if (!record || !plotSourceData) return;

  const fullName = editResidentFullNameInput.value.trim();
  if (!fullName) {
    residentEditStatus.textContent = "Full name is required.";
    return;
  }

  const block = getBlock(editResidentBlockInput.value);
  const rowNumber = Math.min(block.logicalRows || 1, Math.max(1, Number(editResidentRowInput.value) || 1));
  const plotCount = Number(block.rowPlotCounts?.[rowNumber]) || 32;
  const plotNumber = Math.min(plotCount, Math.max(1, Number(editResidentPlotInput.value) || 1));
  const plotSpaces = getPlotSpaces(editResidentPlotSpacesInput.value);
  if (!isPlotSpanAvailable(block.id, rowNumber, plotNumber, plotSpaces, record.id)) {
    const suggestion = getNextAvailableLocation(block.id, rowNumber, plotSpaces, record.id);
    if (suggestion) {
      editResidentRowInput.value = suggestion.rowNumber;
      editResidentPlotInput.value = suggestion.plotNumber;
      residentEditStatus.textContent = `That space is already taken or too close to the row end. Suggested: ${block.name}, Row ${suggestion.rowNumber}, Plot ${suggestion.plotNumber}${plotSpaces > 1 ? `-${suggestion.plotNumber + plotSpaces - 1}` : ""}.`;
    } else {
      residentEditStatus.textContent = `No ${plotSpaces}-space opening found in ${block.name}.`;
    }
    return;
  }
  const { firstName, lastName } = getResidentNameParts(fullName);
  const { stripNumber, side } = getStripSideFromRow(rowNumber, block.id);
  const plot = plotSourceData.plots.find((item) => item.id === record.plotId);
  const burial = plotSourceData.burials.find((item) => item.id === record.id);

  if (plot) {
    plot.blockId = block.id;
    plot.stripId = `${block.id}-S${String(stripNumber).padStart(2, "0")}`;
    plot.side = side;
    plot.plotNumber = plotNumber;
    if (!plot.calibratedPositionInBlock) plot.positionInBlock = getApproxPlotPositionInBlock(block, rowNumber, plotNumber, plotSpaces);
  }

  if (burial) {
    burial.firstName = firstName;
    burial.lastName = lastName;
    burial.dateOfBirth = editResidentDobInput.value;
    burial.dateOfDeath = editResidentDodInput.value;
    burial.plotSpaces = plotSpaces;
  }

  record.firstName = firstName;
  record.lastName = lastName;
  record.fullName = fullName;
  record.dateOfBirth = editResidentDobInput.value;
  record.dateOfDeath = editResidentDodInput.value;
  record.blockId = block.id;
  record.stripId = `${block.id}-S${String(stripNumber).padStart(2, "0")}`;
  record.side = side;
  record.stripNumber = stripNumber;
  record.rowNumber = rowNumber;
  record.plotNumber = plotNumber;
  record.plotSpaces = plotSpaces;

  selectRecord(record);
  residentEditStatus.textContent = "Saving resident...";

  try {
    await savePlotData(plotSourceData, residentEditStatus);
    residentEditStatus.textContent = `${fullName} updated.`;
  } catch (error) {
    residentEditStatus.textContent = `${fullName} updated in browser. ${getFriendlySaveError(error)}`;
    console.error(error);
  }
});

addBlockButton.addEventListener("click", () => {
  const id = getNextBlockId();
  const block = createBlock(id);
  cemeteryBlocks.push(block);
  activeCalibrationId = null;
  activeCalibrationBlockId = null;
  markBlocksUnsaved();
  setSelectedBlock(id);
  setWorkspaceMode("admin");
});

deleteBlockButton.addEventListener("click", () => {
  if (selectedBlockId === "A" || cemeteryBlocks.length <= 1) return;
  const block = getBlock();
  const confirmed = window.confirm(
    `Are you sure you want to delete ${block.name}? This block may already be fully configured, including its size, rows, plot counts and calibration.`,
  );

  if (!confirmed) return;

  cemeteryBlocks = cemeteryBlocks.filter((block) => block.id !== selectedBlockId);
  selectedBlockId = "A";
  activeCalibrationId = null;
  markBlocksUnsaved();
  renderBlockA();
});

saveBlocksButton.addEventListener("click", saveBlockLayout);

blockVisualModeInput.addEventListener("change", () => {
  blockVisualMode = blockVisualModeInput.value;
  markBlocksUnsaved();
  renderBlockA();
});

resetUserMarkerButton.addEventListener("click", () => {
  applyEntrance(selectedEntranceId || cemeteryEntrances[0]?.id);
});

entranceSelect.addEventListener("change", () => {
  applyEntrance(entranceSelect.value);
});

addEntranceButton.addEventListener("click", addEntrance);

saveEntrancesButton.addEventListener("click", saveEntranceLayout);

cemeterySelect.addEventListener("change", async () => {
  cemeteriesConfig.activeCemeteryId = cemeterySelect.value;
  await setActiveCemetery(cemeterySelect.value);
});

addCemeteryButton.addEventListener("click", addTestCemetery);

toggleRowCountsButton.addEventListener("click", () => {
  const collapsed = rowCountEditor.classList.toggle("collapsed");
  toggleRowCountsButton.setAttribute("aria-expanded", String(!collapsed));
  toggleRowCountsButton.querySelector("span").textContent = collapsed ? "Show rows" : "Hide rows";
});

toggleStripRowsButton.addEventListener("click", () => {
  const collapsed = stripRowEditor.classList.toggle("collapsed");
  toggleStripRowsButton.setAttribute("aria-expanded", String(!collapsed));
  toggleStripRowsButton.querySelector("span").textContent = collapsed ? "Show strips" : "Hide strips";
});

stripRowList.addEventListener("input", (event) => {
  const input = event.target.closest("[data-strip-row-count]");
  if (!input || input.value === "") return;
  const block = getBlock();
  block.stripRowCounts ||= normalizeStripRowCounts(block);
  block.stripRowCounts[input.dataset.stripRowCount] = Math.min(5, Math.max(1, Number(input.value) || 1));
  block.logicalRows = getLogicalRowsFromStrips(block);
  normalizeRowPlotCounts(block, block.logicalRows);
  saveBlockBrowserBackup();
  markBlocksUnsaved();
  renderBlockControls(block, getBlockCalibration());
  renderBlockA();
});

rowCountList.addEventListener("input", (event) => {
  const input = event.target.closest("[data-row-plot-count]");
  if (!input || input.value === "") return;
  const block = getBlock();
  block.rowPlotCounts[input.dataset.rowPlotCount] = Math.min(200, Math.max(1, Number(input.value) || 1));
  saveBlockBrowserBackup();
  markBlocksUnsaved();
  renderBlockControls(block, getBlockCalibration());
  if (selectedRecord) updateRoutePath(selectedRecord);
});

if (adminSaveTokenInput) {
  adminSaveTokenInput.value = localStorage.getItem(adminSaveTokenKey) || "";
  updateAdminSaveStatus();
  adminSaveTokenInput.addEventListener("input", () => {
    const token = adminSaveTokenInput.value.trim();
    if (token) {
      localStorage.setItem(adminSaveTokenKey, token);
    } else {
      localStorage.removeItem(adminSaveTokenKey);
    }
    updateAdminSaveStatus();
  });
}

setMapZoom(mapZoom);
renderMapPan();
renderHeading();
renderBlockA();
renderUserMarker();
setWorkspaceMode("visitor");
loadTestPlots().then(() => {
  setState("welcome");
  applyRemakeShellMode();
});
