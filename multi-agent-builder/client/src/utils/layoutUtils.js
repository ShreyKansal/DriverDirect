export const LAYOUT_PRESETS = {
  balanced: {
    label: "Balanced",
    columns: "340px minmax(560px, 1fr) 390px"
  },
  main_plan: {
    label: "Main Plan",
    columns: "260px minmax(480px, 1fr) 520px"
  },
  canvas_focus: {
    label: "Canvas Focus",
    columns: "300px minmax(760px, 1fr) 320px"
  },
  config_focus: {
    label: "Config Focus",
    columns: "300px minmax(500px, 0.85fr) 480px"
  },
  execution_focus: {
    label: "Execution Focus",
    columns: "430px minmax(520px, 1fr) 320px"
  }
};

export function layoutColumnsFor(preset) {
  return LAYOUT_PRESETS[preset]?.columns || LAYOUT_PRESETS.balanced.columns;
}
