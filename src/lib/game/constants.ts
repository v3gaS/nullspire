export const WEAPON_ORDER = [
  "pulse_smg",
  "scatter_carbine",
  "arc_caster",
  "rail_lance",
  "void_launcher",
] as const;

export const WEAPON_META = {
  pulse_smg: {
    name: "Pulse SMG",
    key: "1",
    ability: "Overclock",
  },
  scatter_carbine: {
    name: "Scatter Carbine",
    key: "2",
    ability: "Shockwave",
  },
  arc_caster: {
    name: "Arc Caster",
    key: "3",
    ability: "Storm Nest",
  },
  rail_lance: {
    name: "Rail Lance",
    key: "4",
    ability: "Mark",
  },
  void_launcher: {
    name: "Void Launcher",
    key: "5",
    ability: "Singularity",
  },
} as const;

export const PLAYER = {
  walkSpeed: 12.8,
  sprintSpeed: 21,
  jumpImpulse: 11.0,
  height: 1.7,
  radius: 0.35,
  coyoteTime: 0.16,
} as const;
