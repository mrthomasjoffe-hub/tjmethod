// Manual neck wiper lid for Bubble Magus Curve 5 / Extreme 5 collection cup
// Thumb dial on top -> D-shaft through lid -> two arms -> TPU wiper blades on the neck wall
//
// MEASURE YOUR CUP and edit the four values marked [MEASURE]. All in mm.
// Render one part at a time: set PART below, F6, then export STL.

PART = "assembly";   // "lid" | "rotor" | "dial" | "blade" | "assembly"

/* ---------- [MEASURE] cup ---------- */
cup_id        = 140;   // [MEASURE] inside diameter of the cup at the very top rim
cup_rim_od    = 148;   // [MEASURE] outside diameter of the cup rim
neck_id       = 120;   // [SET 120 per Thomas] inside diameter of the neck (riser tube) you want wiped
neck_top_drop = 30;    // [MEASURE] cup rim top down to the top edge of the neck
wipe_depth    = 60;    // how far down inside the neck the blades reach

/* ---------- lid style ---------- */
lid_style   = "plug";  // "plug" = ring drops inside the cup rim, "skirt" = ring drops over the outside
fit_clear   = 0.5;     // diametral clearance on the cup fit
lid_t       = 4;       // lid plate thickness
ring_depth  = 8;       // plug or skirt depth
ring_wall   = 2.4;
vent_count  = 8;       // skimmer cups must breathe. do not seal the lid
vent_d      = 5;

/* ---------- drive ---------- */
t           = 6;       // rotor thickness (flat-print thickness)
shaft_d     = 10;      // round D-shaft, flats at +-t/2
bore_clear  = 0.6;
boss_d      = 22;      // bearing boss under the lid
boss_h      = 6;
collar_w    = 20;      // stop under the boss so the shaft cannot lift out
collar_h    = 4;
key_w       = 6;       // square key into the dial
key_len     = 10;
pin_d       = 1.9;     // 1.75 mm filament as a retaining pin
dial_d      = 40;
dial_h      = 14;
dial_gap    = 0.6;

/* ---------- wiper ---------- */
arm_h       = 8;
arm_clear   = 4;       // arm bottom above neck top
spar_w      = 6;
spar_gap    = 3;       // radial gap spar edge to neck wall, the blade bridges it
interf      = 1.2;     // how far the blade pushes into the wall
blade_t     = 1.6;     // TPU 95A, or cut from 1.5 mm silicone sheet with the same holes
peg_d       = 3;
peg_pitch   = 15;
hole_d      = 2.7;     // slightly under peg_d so TPU grips

$fn = 72;
e = 0.01;

/* ---------- derived ---------- */
neck_r     = neck_id/2;
spar_out   = neck_r - spar_gap;
spar_in    = spar_out - spar_w;
spar_mid   = (spar_out + spar_in)/2;
arm_bot    = -neck_top_drop + arm_clear;
arm_top    = arm_bot + arm_h;
collar_top = -boss_h - 0.3;
collar_bot = collar_top - collar_h;
use_collar = arm_top < collar_bot - e;
spar_bot   = -neck_top_drop - wipe_depth;
key_bot    = lid_t + 0.3;
key_top    = lid_t + dial_gap + key_len;
pin_z      = lid_t + dial_gap + key_len/2;
blade_w    = spar_w + spar_gap + interf;
blade_len  = arm_bot - spar_bot;
peg_zs     = [for (z = [spar_bot + 6 : peg_pitch : arm_bot - 4]) z];

assert(arm_top <= collar_top, "Neck sits too close to the rim. Reduce boss_h, arm_h or arm_clear.");
assert(spar_in > shaft_d/2, "neck_id too small for this layout");

/* ---------- lid ---------- */
module lid() {
  difference() {
    union() {
      cylinder(d = cup_rim_od + (lid_style == "skirt" ? 2*ring_wall + fit_clear : 4), h = lid_t);
      if (lid_style == "plug")
        translate([0,0,-ring_depth]) difference() {
          cylinder(d = cup_id - fit_clear, h = ring_depth + e);
          translate([0,0,-e]) cylinder(d = cup_id - fit_clear - 2*ring_wall, h = ring_depth + 3*e);
        }
      else
        translate([0,0,-ring_depth]) difference() {
          cylinder(d = cup_rim_od + fit_clear + 2*ring_wall, h = ring_depth + e);
          translate([0,0,-e]) cylinder(d = cup_rim_od + fit_clear, h = ring_depth + 3*e);
        }
      translate([0,0,-boss_h]) cylinder(d = boss_d, h = boss_h + e);
    }
    translate([0,0,-boss_h-1]) cylinder(d = shaft_d + bore_clear, h = boss_h + lid_t + 2);
    vr = (boss_d/2 + (lid_style == "plug" ? cup_id/2 - ring_wall : cup_rim_od/2))/2;
    for (i = [0:vent_count-1]) rotate(i*360/vent_count + 360/vent_count/2)
      translate([vr,0,-1]) cylinder(d = vent_d, h = lid_t + 2);
    // index marks every 45 deg
    for (i = [0:7]) rotate(i*45) translate([dial_d/2 + 3, -0.5, lid_t - 0.6]) cube([5, 1, 1]);
  }
}

/* ---------- rotor (prints flat) ---------- */
module slab(x0, x1, z0, z1) translate([x0, -t/2, z0]) cube([x1 - x0, t, z1 - z0]);

module rotor() {
  difference() {
    union() {
      // D-shaft from arm to just above lid
      intersection() {
        translate([0,0,arm_top - e]) cylinder(d = shaft_d, h = key_bot - arm_top + e);
        slab(-shaft_d, shaft_d, arm_top - 1, key_bot + 1);
      }
      // square key
      translate([-key_w/2, -t/2, key_bot - e]) cube([key_w, t, key_top - key_bot - 0.6]);
      translate([0,0,key_top - 0.6 - e]) hull() {
        translate([-key_w/2, -t/2, 0]) cube([key_w, t, e]);
        translate([-key_w/2 + 0.6, -t/2, 0.6]) cube([key_w - 1.2, t, e]);
      }
      if (use_collar) slab(-collar_w/2, collar_w/2, collar_bot, collar_top);
      // arm
      slab(-spar_out, spar_out, arm_bot, arm_top);
      // spars
      for (s = [-1, 1]) mirror([s < 0 ? 1 : 0, 0, 0]) {
        slab(spar_in, spar_out, spar_bot, arm_top);
        // gusset
        hull() { slab(spar_in - 6, spar_in, arm_bot - e, arm_bot); slab(spar_in - e, spar_in, arm_bot - 6, arm_bot); }
        for (z = peg_zs) translate([spar_mid, t/2 - e, z]) rotate([-90,0,0]) {
          cylinder(d = peg_d, h = blade_t + 0.6);
          translate([0,0,blade_t]) cylinder(d1 = peg_d + 0.6, d2 = peg_d, h = 0.6);
        }
      }
    }
    // filament pin hole through key
    translate([0, 0, pin_z]) rotate([90,0,0]) cylinder(d = pin_d, h = t + 2, center = true);
  }
}

/* ---------- dial ---------- */
module dial() {
  difference() {
    union() {
      cylinder(d = dial_d, h = dial_h);
    }
    // finger scallops
    for (i = [0:11]) rotate(i*30) translate([dial_d/2 + 2.2, 0, -1]) cylinder(d = 7, h = dial_h + 2);
    // key socket
    translate([-key_w/2 - 0.2, -t/2 - 0.2, -e]) cube([key_w + 0.4, t + 0.4, key_len + 0.5]);
    // pin hole
    translate([0, 0, key_len/2]) rotate([90,0,0]) cylinder(d = pin_d, h = dial_d + 2, center = true);
    // pointer groove on top, aligned with the blades
    translate([dial_d/2 - 12, -1, dial_h - 1]) cube([11, 2, 2]);
    // top grip dish
    translate([0,0,dial_h + 26]) sphere(r = 27);
  }
}

/* ---------- blade (TPU) ---------- */
module blade_2d() {
  ch = spar_gap + interf;   // lead-in chamfer so it slides into the neck
  difference() {
    polygon([[0,0], [blade_w - ch, 0], [blade_w, ch], [blade_w, blade_len], [0, blade_len]]);
    for (z = peg_zs) translate([spar_w/2, z - spar_bot]) circle(d = hole_d);
  }
}
module blade() linear_extrude(blade_t) blade_2d();

/* ---------- output ---------- */
if (PART == "lid")   rotate([180,0,0]) translate([0,0,-lid_t]) lid();          // top face down
if (PART == "rotor") translate([0,0,t/2]) rotate([90,0,0]) rotor();           // flat, pegs up
if (PART == "dial")  translate([0,0,dial_h]) rotate([180,0,0]) dial();        // top face down
if (PART == "blade") blade();
if (PART == "assembly") {
  color("lightblue", 0.5) lid();
  color("orange") rotor();
  color("dimgray") translate([0,0,lid_t + dial_gap]) dial();
  for (s = [-1, 1]) mirror([s < 0 ? 1 : 0, 0, 0])
    color("black") translate([spar_in, t/2, spar_bot]) rotate([90,0,0]) translate([0,0,-blade_t]) blade();
  // ghost of the neck
  %translate([0,0,spar_bot - 5]) difference() {
    cylinder(d = neck_id + 6, h = wipe_depth + 5);
    translate([0,0,-1]) cylinder(d = neck_id, h = 500);
  }
}
