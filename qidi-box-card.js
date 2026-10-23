// qidi-box-card: Fluidd-style spool view and controls for a QIDI Box in Home Assistant.
// Install through HACS (Luca-Bachini-Barr/ha-qidi-box-card) as a dashboard plugin.
//
// type: custom:qidi-box-card
// title: QIDI Box 1                       # optional
// slots:                                  # Moonraker fork "Box Slot N Filament" sensors
//   - sensor.dining_room_q2_box_slot_1_filament
//   - ...
// labels: [1A, 1B, 1C, 1D]                # optional, default 1A..1D
// humidity: sensor.q2_heater_box1_humidity        # optional
// temperature: sensor.q2_heater_box1_temperature  # optional
// drying: binary_sensor.dining_room_q2_box_1_drying # optional
// device_id: <moonraker device id>        # enables the controls (moonraker.send_gcode)
// print_state: sensor.q2_current_print_state     # controls are disabled while "printing"
// change: sensor.dining_room_q2_box_filament_change  # optional: banner during a colour change
// warnings: sensor.dining_room_q2_box_warnings       # optional: shows box warnings
// colors                                  # optional override of the colour palette
//
// Controls send what the Q2 touchscreen (QIDI_Client) sends on firmware with the Box V2
// multi_color_controller (n = 0-based slot as a bare integer; "SLOT=slot2" fails with
// "unable to parse slot2"):
//   LOAD_FILAMENT_CONTROL / UNLOAD_FILAMENT_CONTROL / EJECT_FILAMENT_CONTROL SLOT=<n>
//   UPDATE_FILAMENT_INFORMATION SLOT=<n> COLOR='<hex>' VENDOR='<vendor>' FILAMENT='<filament name>'
// (load, unload and update confirmed by capturing the touchscreen's own commands on 2026-10-23)
// (Fluidd's E_LOAD / E_UNLOAD / E_BOX and its 2-vendor SAVE_VARIABLE lists are legacy and
// not registered on this firmware.)

// Box V2 material database: /home/qidi/QIDI_Client/resource/filament_config/filament-0.4.json on the Q2
// (the same list the touchscreen and multi_color_controller use). [filament_id, name, type, min °C, max °C]
const FILAMENT_DB = {
  "QIDI": [
    ["QFB53", "ABS Odorless", "ABS", 240, 280],
    ["QFB54", "ABS Rapido", "ABS", 240, 280],
    ["QFB55", "ABS Rapido Metal", "ABS", 240, 280],
    ["QFB50", "ABS-GF", "ABS-GF", 240, 280],
    ["QFB01", "ASA", "ASA", 240, 280],
    ["QFB02", "ASA-Aero", "ASA-AERO", 240, 280],
    ["QFB51", "ASA-CF20 Core", "ASA-CF", 260, 280],
    ["QFN12", "PA12-CF", "PA12-CF", 280, 300],
    ["QFN05", "PA6-CF", "PA6-CF", 280, 300],
    ["QFN04", "PAHT-CF", "PAHT-CF", 300, 320],
    ["QFN14", "PAHT-GF", "PAHT-GF", 300, 320],
    ["QFC02", "PC/ABS-FR", "PC-ABS-FR", 240, 280],
    ["QFU03", "PEBA 95A", "PEBA", 230, 260],
    ["QFT01", "PET-CF", "PET-CF", 280, 320],
    ["QFT02", "PET-GF", "PET-GF", 280, 320],
    ["QFG00", "PETG Basic", "PETG", 240, 280],
    ["QFG02", "PETG Rapido", "PETG", 240, 275],
    ["QFG03", "PETG Tough", "PETG", 220, 270],
    ["QFG04", "PETG Translucent", "PETG", 240, 280],
    ["QFG50", "PETG-CF", "PETG-CF", 240, 270],
    ["QFG51", "PETG-GF", "PETG-GF", 240, 270],
    ["QFA00", "PLA Basic", "PLA", 190, 240],
    ["QFA01", "PLA Matte Basic", "PLA", 190, 240],
    ["QFA02", "PLA Rapido", "PLA", 190, 240],
    ["QFA03", "PLA Rapido Matte", "PLA", 190, 240],
    ["QFA04", "PLA Rapido Metal", "PLA", 190, 240],
    ["QFA05", "PLA Silk", "PLA", 190, 240],
    ["QFA50", "PLA-CF", "PLA-CF", 210, 250],
    ["QFP01", "PPS-CF", "PPS-CF", 300, 350],
    ["QFP02", "PPS-GF", "PPS-GF", 300, 350],
    ["QFS03", "Support For PAHT", "PAHT-S", 260, 280],
    ["QFS01", "Support For PET/PA", "PA-S", 260, 280],
    ["QFU01", "TPU 95A-HF", "TPU", 200, 250],
    ["QFU00", "TPU-Aero", "TPU-AERO", 230, 270],
    ["QFU02", "TPU-GF", "TPU-GF", 240, 270],
    ["QFN20", "UltraPA", "UltraPA", 250, 290],
    ["QFN21", "UltraPA-CF25", "UltraPA-CF25", 300, 320],
    ["QFA16", "WOOD Rapido", "PLA", 190, 220],
  ],
  "Generic": [
    ["QFB91", "ABS", "ABS", 240, 280],
    ["QFC90", "PC", "PC", 260, 290],
    ["QFG90", "PETG", "PETG", 220, 270],
    ["QFA90", "PLA", "PLA", 190, 240],
    ["QFA92", "PLA Silk", "PLA", 190, 240],
    ["QFA91", "PLA+", "PLA", 190, 240],
    ["QFU91", "TPU 95A", "TPU", 200, 250],
  ],
  "Bambu": [
    ["QFL32", "ABS", "ABS", 240, 280],
    ["QFL31", "PETG", "PETG", 220, 270],
    ["QFL30", "PLA", "PLA", 190, 240],
  ],
  "HATCHBOX": [
    ["QFL12", "ABS", "ABS", 240, 280],
    ["QFL11", "PETG", "PETG", 220, 270],
    ["QFL10", "PLA", "PLA", 190, 240],
  ],
  "Overture": [
    ["QFL62", "ABS", "ABS", 240, 280],
    ["QFL60", "PLA", "PLA", 190, 240],
  ],
  "Polymaker": [
    ["QFL22", "ABS", "ABS", 240, 280],
    ["QFL20", "PLA", "PLA", 190, 240],
    ["QFL24", "PLA-HT", "PLA", 190, 240],
  ],
};

// Colour palette from [colordict] in officiall_filas_list.cfg.
const DEFAULT_COLORS = {
  1: "#FAFAFA", 2: "#060606", 3: "#D9E3ED", 4: "#5CF30F", 5: "#63E492", 6: "#2850FF", 7: "#FE98FE", 8: "#DFD628",
  9: "#228332", 10: "#99DEFF", 11: "#1714B0", 12: "#CEC0FE", 13: "#CADE4B", 14: "#1353AB", 15: "#5EA9FD", 16: "#A878FF",
  17: "#FE717A", 18: "#FF362D", 19: "#E2DFCD", 20: "#898F9B", 21: "#6E3812", 22: "#CAC59F", 23: "#F28636", 24: "#B87F2B",
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Pick black or white text for a hex background.
const inkFor = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "var(--primary-text-color)";
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "#000" : "#fff";
};

const keyFor = (dict, value) => Object.keys(dict).find((k) => String(dict[k]).toLowerCase() === String(value ?? "").toLowerCase());

const findFilament = (id) => {
  for (const [vendor, list] of Object.entries(FILAMENT_DB)) {
    const f = list.find((x) => x[0] === id);
    if (f) return { vendor, id: f[0], name: f[1] };
  }
  return null;
};

const spool = (color, empty) => {
  const body = empty ? "none" : color;
  const dash = empty ? ' stroke-dasharray="3 3"' : "";
  return `<svg viewBox="0 0 64 72" class="spool" aria-hidden="true">
    <ellipse cx="12" cy="36" rx="9" ry="33" class="flange"/>
    <rect x="12" y="10" width="40" height="52" fill="${body}" class="body"${dash}/>
    <ellipse cx="52" cy="36" rx="9" ry="33" class="flange"/>
    <ellipse cx="52" cy="36" rx="3" ry="9" class="hub"/>
  </svg>`;
};

const BUTTONS = [
  { cmd: "EJECT_FILAMENT_CONTROL", label: "Uninstall", confirm: "Uninstall (eject) the filament in slot {slot} back out of the box?" },
  { cmd: "LOAD_FILAMENT_CONTROL", label: "Load", confirm: "Load the filament from slot {slot} into the toolhead?" },
  { cmd: "UNLOAD_FILAMENT_CONTROL", label: "Unload", confirm: "Unload the filament in slot {slot} from the toolhead?" },
];

class QidiBoxCard extends HTMLElement {
  setConfig(config) {
    if (!Array.isArray(config.slots) || !config.slots.length) throw new Error("slots: list of slot filament sensors is required");
    this._config = config;
    this._key = "";
    this._selected = this._selected ?? 0;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    this._hass = hass;
    const c = this._config;
    const ids = [...c.slots, c.humidity, c.temperature, c.drying, c.print_state, c.change, c.warnings].filter(Boolean);
    // Only re-render when one of our entities changed, and never while a dropdown is open.
    const key = ids.map((id) => { const s = hass.states[id]; return s ? s.state + JSON.stringify(s.attributes) : "-"; }).join("|");
    if (key === this._key) return;
    this._key = key;
    if (this.shadowRoot.activeElement?.tagName === "SELECT") { this._pending = true; return; }
    this._render();
  }

  _slotInfo(i) {
    const s = this._hass.states[this._config.slots[i]];
    const a = s?.attributes || {};
    const empty = !s || s.state === "Empty" || a.runout === true;
    return { s, a, empty, loaded: !empty && a.slot_state === 2 };
  }

  // Load/unload/eject take ~2.5 min, longer than moonraker-api's 120 s request timeout, so they
  // are sent with wait: false (Moonraker fork PR #7): the call returns after a few seconds and
  // still fails if Klipper rejects the command straight away.
  _send(gcode, long = false) {
    return this._hass.callService("moonraker", "send_gcode", { device_id: this._config.device_id, gcode, ...(long && { wait: false }) })
      .catch((e) => alert(`QIDI Box: "${gcode}" failed: ${e.message || e}`));
  }

  _render() {
    const hass = this._hass, c = this._config;
    const labels = c.labels || c.slots.map((_, i) => `1${String.fromCharCode(65 + i)}`);
    const colors = c.colors || DEFAULT_COLORS;
    const sel = Math.min(this._selected, c.slots.length - 1);

    const slots = c.slots.map((id, i) => {
      const { s, a, empty, loaded } = this._slotInfo(i);
      const color = a.color || "#888";
      const name = empty ? "Empty" : s.state === "unavailable" || s.state === "unknown" ? "?" : s.state;
      const temps = !empty && a.min_temp && a.max_temp ? `${a.min_temp}–${a.max_temp} °C` : "";
      return `<div class="slot${empty ? " empty" : ""}${loaded ? " loaded" : ""}${i === sel ? " selected" : ""}" data-slot="${i}">
        <div class="label">${esc(labels[i])}</div>
        ${spool(color, empty)}
        <div class="marker">${loaded ? "▲" : ""}</div>
        <div class="name">${esc(name)}</div>
        <div class="meta">${empty ? "&nbsp;" : `<span class="chip" style="background:${esc(color)};color:${inkFor(color)}">${esc(a.filament_type || "")}</span>`}</div>
        <div class="meta">${esc(temps) || "&nbsp;"}</div>
      </div>`;
    }).join("");

    const st = (id) => (id && hass.states[id]) || null;
    const hum = st(c.humidity), temp = st(c.temperature), dry = st(c.drying);
    const footer = [
      dry ? `<span class="pill" data-entity="${esc(c.drying)}"><span class="dot ${dry.state === "on" ? "on" : ""}"></span>${dry.state === "on" ? "DRYING" : "NOT DRYING"}</span>` : "",
      temp ? `<span class="pill" data-entity="${esc(c.temperature)}">🌡 ${esc(temp.state)}${esc(temp.attributes.unit_of_measurement || "")}</span>` : "",
      hum ? `<span class="pill" data-entity="${esc(c.humidity)}">💧 ${esc(hum.state)}${esc(hum.attributes.unit_of_measurement || "%")}</span>` : "",
    ].join("");

    // Filament change banner (Box Filament Change sensor from the Moonraker integration).
    let banner = "";
    const chg = st(c.change);
    const slotLabel = (n) => (n ? labels[n - 1] || `#${n}` : "");
    if (chg && !["idle", "unknown", "unavailable"].includes(chg.state)) {
      const ca = chg.attributes || {};
      // Remember the slot we came from and are going to, so "changing" after the
      // task ends can be shown as purging the new filament. The "from" slot is only
      // known before the task starts or while it runs; during the purge loaded_slot
      // already holds the new filament.
      if (ca.target_slot) {
        this._changeTo = ca.target_slot;
        const from = this._preFrom ?? (ca.loaded_slot !== ca.target_slot ? ca.loaded_slot : null);
        if (!this._changeFrom && from && from !== ca.target_slot) this._changeFrom = from;
      } else if (!this._changeTo && ca.loaded_slot) {
        this._preFrom = ca.loaded_slot;
      }
      const steps = ["cutting", "unloading", "loading"];
      const idx = steps.indexOf(chg.state);
      const words = { starting: "Starting", heat: "Heating", cutting: "Cutting filament", unloading: "Unloading", loading: "Loading", wipe: "Wiping nozzle", paused: "Paused" };
      const text = chg.state === "changing"
        ? (this._changeTo ? `Purging ${slotLabel(this._changeTo)}` : "In progress")
        : words[chg.state] || chg.state;
      const route = this._changeTo
        ? `${this._changeFrom ? esc(slotLabel(this._changeFrom)) + " " : ""}→ ${esc(slotLabel(this._changeTo))}`
        : "";
      const done = chg.state === "changing" && this._changeTo ? 3 : idx;
      const bar = steps.map((s, n) => `<span class="seg${n < done ? " done" : n === done ? " now" : ""}" title="${s}"></span>`).join("");
      banner = `<div class="change" data-entity="${esc(c.change)}">
          <div class="change-row"><span class="spin"></span><b>Filament change</b>${route ? `<span class="route">${route}</span>` : ""}<span class="what">${esc(text)}</span></div>
          <div class="bar">${bar}</div>
        </div>`;
    } else if (chg) {
      this._changeTo = null; this._changeFrom = null; this._preFrom = null;
    }
    const warn = st(c.warnings);
    if (warn && Number(warn.state) > 0) {
      const list = (warn.attributes.warnings || []).map((w) => esc(typeof w === "string" ? w : JSON.stringify(w))).join("<br>");
      banner += `<div class="warn" data-entity="${esc(c.warnings)}">⚠ Box warning${Number(warn.state) > 1 ? "s" : ""}: ${list || esc(warn.state)}</div>`;
    }

    let controls = "";
    if (c.device_id) {
      const { a, empty, loaded } = this._slotInfo(sel);
      const printing = st(c.print_state)?.state === "printing";
      const off = printing ? "disabled" : "";
      // A load/unload/eject runs for minutes after the call returns. Lock the buttons while the
      // change sensor shows it running, plus a grace period for the sensor's polling delay,
      // so a second press doesn't queue another flow.
      const busy = Date.now() < (this._busyUntil || 0) || (chg && !["idle", "unknown", "unavailable"].includes(chg.state));
      // Same enable rules as QIDI's Fluidd box card.
      const enabled = [!empty, !empty && !loaded, loaded].map((ok) => ok && !printing && !busy);
      const buttons = BUTTONS.map((b, n) => `<button class="action" data-action="${n}" ${enabled[n] ? "" : "disabled"}>${b.label}</button>`).join("");
      // Vendor picked in the dropdown but no filament chosen yet is kept as a local draft.
      const current = findFilament(a.filament_id);
      const vendor = (this._draft?.slot === sel && this._draft.vendor) || current?.vendor || "";
      const fil = current && current.vendor === vendor ? current.id : "";
      const cKey = keyFor(colors, a.color);
      this._ctl = { vendor, fil: current && current.vendor === vendor ? current.id : "", color: a.color || "" };
      const vendorOpts = (vendor ? "" : `<option value="" selected>—</option>`) +
        Object.keys(FILAMENT_DB).map((v) => `<option value="${esc(v)}" ${v === vendor ? "selected" : ""}>${esc(v)}</option>`).join("");
      const filOpts = (fil ? "" : `<option value="" selected>${vendor ? "Choose filament…" : "—"}</option>`) +
        (FILAMENT_DB[vendor] || []).map(([id, name, , lo, hi]) =>
          `<option value="${esc(id)}" ${id === fil ? "selected" : ""}>${esc(name)} (${lo}–${hi} °C)</option>`).join("");
      const swatches = Object.entries(colors).map(([k, hex]) =>
        `<button class="swatch${k === cKey ? " current" : ""}" data-color="${esc(hex)}" title="${esc(hex)}" style="background:${esc(hex)}" ${off}></button>`).join("");
      controls = `
        <div class="controls">
          <div class="buttons">${buttons}
            ${printing ? `<div class="note">Controls are disabled while printing</div>` : ""}</div>
          <div class="settings">
            <div class="row"><span>Slot</span><b>${esc(labels[sel])}</b></div>
            <label class="row"><span>Vendor</span><select data-var="vendor" ${off}>${vendorOpts}</select></label>
            <label class="row"><span>Filament</span><select data-var="filament" ${off}>${filOpts}</select></label>
            <div class="row color"><span>Color</span><div class="swatches">${swatches}</div></div>
          </div>
        </div>`;
    }

    this.shadowRoot.innerHTML = `
      <style>
        ha-card { padding: 12px 12px 10px; }
        .title { font-size: 16px; font-weight: 500; margin: 0 4px 8px; }
        .box { border: 1px solid var(--divider-color); border-radius: 12px; padding: 10px 6px 8px; }
        .slots { display: grid; grid-template-columns: repeat(${c.slots.length}, 1fr); gap: 4px; }
        .slot { display: flex; flex-direction: column; align-items: center; cursor: pointer; border-radius: 10px; padding: 4px 2px; min-width: 0; border: 1.5px solid transparent; }
        .slot:hover { background: var(--secondary-background-color); }
        .slot.selected { border-color: var(--primary-color); }
        .label { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); border: 1.5px solid var(--secondary-text-color);
                 border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; }
        .loaded .label { color: var(--primary-color); border-color: var(--primary-color); }
        .spool { width: 100%; max-width: 72px; height: auto; }
        .flange { fill: var(--card-background-color, #1c1c1c); stroke: var(--secondary-text-color); stroke-width: 1.5; }
        .body { stroke: var(--secondary-text-color); stroke-width: 1.5; }
        .hub { fill: none; stroke: var(--secondary-text-color); stroke-width: 1.2; }
        .empty .spool { opacity: .45; }
        .marker { height: 14px; font-size: 11px; line-height: 14px; color: var(--primary-color); }
        .name { font-size: 13px; font-weight: 500; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .empty .name { color: var(--secondary-text-color); font-weight: 400; }
        .meta { font-size: 11px; color: var(--secondary-text-color); margin-top: 3px; white-space: nowrap; }
        .chip { padding: 1px 6px; border-radius: 6px; font-weight: 600; font-size: 10px; border: 1px solid var(--divider-color); }
        .footer { display: flex; justify-content: flex-end; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
        .pill { font-size: 12px; font-weight: 600; letter-spacing: .03em; border: 1px solid var(--divider-color); border-radius: 8px;
                padding: 3px 8px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--disabled-text-color, #777); }
        .dot.on { background: var(--warning-color, #ff9800); }
        .controls { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 14px; margin-top: 12px; }
        @media (max-width: 520px) { .controls { grid-template-columns: 1fr; } }
        .buttons { display: flex; flex-direction: column; gap: 8px; }
        .action { font: inherit; font-size: 13px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; padding: 10px;
                  border-radius: 8px; border: none; cursor: pointer; background: var(--primary-color); color: var(--text-primary-color, #fff); }
        .action:disabled { background: var(--secondary-background-color); color: var(--disabled-text-color, #777); cursor: default; }
        .note { font-size: 11px; color: var(--secondary-text-color); text-align: center; }
        .settings { display: flex; flex-direction: column; gap: 8px; }
        .row { display: grid; grid-template-columns: 72px 1fr; align-items: center; gap: 8px; font-size: 14px; }
        .row span { color: var(--secondary-text-color); }
        select { font: inherit; padding: 7px 8px; border-radius: 8px; border: 1px solid var(--divider-color);
                 background: var(--secondary-background-color); color: var(--primary-text-color); min-width: 0; }
        .row.color { align-items: start; }
        .swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(22px, 1fr)); gap: 5px; }
        .swatch { width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--divider-color); cursor: pointer; padding: 0; }
        .swatch.current { outline: 2px solid var(--primary-color); outline-offset: 2px; }
        .change { margin-top: 10px; padding: 10px 12px; border-radius: 10px; cursor: pointer;
                  border: 1px solid var(--primary-color); background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
        .change-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 14px; }
        .route { font-weight: 600; color: var(--primary-color); }
        .what { margin-left: auto; color: var(--secondary-text-color); }
        .spin { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--primary-color); border-top-color: transparent;
                animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .bar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 8px; }
        .seg { height: 4px; border-radius: 2px; background: var(--divider-color); }
        .seg.done { background: var(--primary-color); }
        .seg.now { background: var(--primary-color); opacity: .5; animation: pulse 1.2s ease-in-out infinite; }
        @keyframes pulse { 50% { opacity: .15; } }
        .warn { margin-top: 8px; padding: 8px 12px; border-radius: 10px; cursor: pointer; font-size: 13px;
                border: 1px solid var(--error-color, #db4437); color: var(--error-color, #db4437); }
      </style>
      <ha-card>
        ${c.title ? `<div class="title">${esc(c.title)}</div>` : ""}
        <div class="box"><div class="slots">${slots}</div></div>
        ${banner}
        ${footer ? `<div class="footer">${footer}</div>` : ""}
        ${controls}
      </ha-card>`;

    const root = this.shadowRoot;
    root.querySelectorAll("[data-entity]").forEach((el) =>
      el.addEventListener("click", () => this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.entity }, bubbles: true, composed: true })))
    );
    root.querySelectorAll("[data-slot]").forEach((el) =>
      el.addEventListener("click", () => { this._selected = Number(el.dataset.slot); this._render(); })
    );
    root.querySelectorAll("[data-action]").forEach((el) =>
      el.addEventListener("click", () => {
        const b = BUTTONS[Number(el.dataset.action)];
        if (!confirm(b.confirm.replace("{slot}", labels[sel]))) return;
        this._busyUntil = Date.now() + 60000;
        setTimeout(() => this._render(), 60000);
        this._render();
        this._send(`${b.cmd} SLOT=${sel}`, true);
      })
    );
    const update = (vendor, fil, color) => {
      const hex = String(color || "#FAFAFA").replace("#", "").toUpperCase();
      this._draft = null;
      // The touchscreen sends the filament's name (FILAMENT='PLA+'), not its id.
      const name = findFilament(fil)?.name || fil;
      this._send(`UPDATE_FILAMENT_INFORMATION SLOT=${sel} COLOR='${hex}' VENDOR='${vendor}' FILAMENT='${name}'`);
    };
    root.querySelectorAll("select[data-var]").forEach((el) => {
      el.addEventListener("change", () => {
        if (el.value === "") return;
        if (el.dataset.var === "vendor") { this._draft = { slot: sel, vendor: el.value }; this._render(); }
        else update(this._ctl.vendor, el.value, this._ctl.color);
      });
      el.addEventListener("blur", () => { if (this._pending) { this._pending = false; this._render(); } });
    });
    root.querySelectorAll("[data-color]").forEach((el) =>
      el.addEventListener("click", () => {
        if (!this._ctl.fil) { alert("Choose a vendor and filament for this slot first."); return; }
        update(this._ctl.vendor, this._ctl.fil, el.dataset.color);
      })
    );
  }

  getCardSize() { return this._config?.device_id ? 8 : 4; }
  getGridOptions() { return { columns: 12, rows: "auto", min_rows: 4 }; }
}

if (!customElements.get("qidi-box-card")) customElements.define("qidi-box-card", QidiBoxCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "qidi-box-card"))
  window.customCards.push({ type: "qidi-box-card", name: "QIDI Box", description: "Fluidd-style spool view and controls for a QIDI Box" });
