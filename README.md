# QIDI Box Card

A Home Assistant dashboard card for the **QIDI Box** multi-material unit on QIDI printers running Klipper/Moonraker (built on a Qidi Q2). It shows a Fluidd-style spool view and can load, unload and set filament for each slot.

It reads entities from the Moonraker integration fork [Luca-Bachini-Barr/moonraker-home-assistant](https://github.com/Luca-Bachini-Barr/moonraker-home-assistant), which adds the QIDI Box sensors (slot filament, drying, filament change, warnings).

## Features
- One spool per slot, drawn in the loaded filament's colour, with its material and temperature range. Empty or run-out slots are shown dashed.
- Marks the slot currently feeding the toolhead.
- Box humidity, temperature and drying state.
- A progress banner during a colour change (e.g. `1A → 1C · Unloading`, or `Heating 156 / 240 °C` while the nozzle heats), plus any Box warnings.
- Optional controls: **Load**, **Unload**, **Eject** (push the filament back out of the box), and setting the slot's vendor, material and colour (from the Box V2 material database). Load, Unload and Eject ask for confirmation first; vendor, filament and colour changes are sent straight away. All controls are disabled while the printer is printing.

## Installation
**HACS:** HACS → ⋮ → **Custom repositories** → add `https://github.com/Luca-Bachini-Barr/ha-qidi-box-card` as type **Dashboard**, then install **QIDI Box Card**. HACS registers the resource for you.

**Manual:** copy `qidi-box-card.js` to `/config/www/` and add `/local/qidi-box-card.js` as a JavaScript module under Settings → Dashboards → ⋮ → Resources.

## Configuration
```yaml
type: custom:qidi-box-card
title: QIDI Box 1                                   # optional
slots:                                              # "Box Slot N Filament" sensors
  - sensor.q2_box_slot_1_filament
  - sensor.q2_box_slot_2_filament
  - sensor.q2_box_slot_3_filament
  - sensor.q2_box_slot_4_filament
labels: [1A, 1B, 1C, 1D]                            # optional, default 1A..1D
humidity: sensor.q2_heater_box1_humidity            # optional
temperature: sensor.q2_heater_box1_temperature      # optional
drying: binary_sensor.q2_box_1_drying               # optional
change: sensor.q2_box_filament_change               # optional: colour-change banner
warnings: sensor.q2_box_warnings                    # optional: Box warnings
nozzle: sensor.q2_extruder_temperature              # optional: nozzle temp while heating
nozzle_target: number.q2_extruder_target            # optional: target temp while heating
device_id: <moonraker device id>                    # optional: enables the controls
print_state: sensor.q2_current_print_state          # disables controls while printing
```
Entity IDs depend on your printer's name and area. Leave out `device_id` for a display-only card.

## G-code sent by the controls
The controls send the commands the Q2 touchscreen uses on firmware with the Box V2 `multi_color_controller` (`n` = 0-based slot as a bare integer, e.g. `SLOT=2`; `SLOT=slot2` is rejected with "unable to parse"), through `moonraker.send_gcode`:
- `LOAD_FILAMENT_CONTROL SLOT=<n>`, `UNLOAD_FILAMENT_CONTROL SLOT=<n>`, `EJECT_FILAMENT_CONTROL SLOT=<n>`
- `UPDATE_FILAMENT_INFORMATION SLOT=<n> COLOR='<hex>' VENDOR='<vendor>' FILAMENT='<filament name>'` (e.g. `VENDOR='Generic' FILAMENT='PLA+'`)

All four commands match what the Q2 touchscreen itself sends (captured from the printer's console). Load, unload and eject run for a few minutes; the card sends them with `wait: false` (needs the Moonraker fork with the `send_gcode` `wait` option) and locks the buttons until the filament change has finished, so a second press can't queue another run. Fluidd's `E_LOAD` / `E_UNLOAD` / `E_BOX` macros are legacy and are not registered on this firmware. Use the controls only with the printer idle.
