export const ASSET_VAULT = {
  skeletons: [
    "biped_upright", "biped_hunched", "quadruped_heavy", "quadruped_light",
    "serpentine", "floating_sphere", "arachnid_base", "amorphous_blob"
  ],
  heads: [
    "canine_snout", "feline_short", "reptile_jaw", "avian_beak",
    "insect_mandibles", "mech_visor", "bone_skull", "eyeball_cluster"
  ],
  limbs: [
    "humanoid_fist", "beast_claw", "crab_pincer", "mantis_scythe",
    "mech_piston", "stump", "tentacle_suction"
  ],
  backs: [
    "dragon_wing", "feathered_wing", "insect_wing", "jetpack_thruster",
    "dino_tail", "whip_tail", "turtle_shell", "crystal_spikes"
  ]
};

// Procedural Sockets for Base Skeletons (Offsets)
export const SKELETON_SOCKETS: Record<string, any> = {
  amorphous_blob: {
    headSocket: [0, 0.5, 0],
    frontLeftLegSocket: [-0.3, 0, 0.3],
    frontRightLegSocket: [0.3, 0, 0.3],
    tailSocket: [0, 0.2, -0.4],
    backSocket: [0, 0.6, -0.2]
  },
  floating_sphere: {
    headSocket: [0, 0, 0.5],
    frontLeftLegSocket: [-0.6, 0, 0],
    frontRightLegSocket: [0.6, 0, 0],
    tailSocket: [0, 0, -0.6],
    backSocket: [0, 0.5, -0.2]
  },
  quadruped_heavy: {
    headSocket: [0, 1.2, 1.5],
    frontLeftLegSocket: [-0.5, 0.5, 1.0],
    frontRightLegSocket: [0.5, 0.5, 1.0],
    tailSocket: [0, 0.8, -1.5],
    backSocket: [0, 1.5, -0.5]
  },
  biped_upright: {
    headSocket: [0, 1.5, 0],
    frontLeftLegSocket: [-0.6, 1.0, 0.2],
    frontRightLegSocket: [0.6, 1.0, 0.2],
    tailSocket: [0, 0.5, -0.4],
    backSocket: [0, 1.2, -0.3]
  }
};
