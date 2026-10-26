// Manual neck wiper lid for Bubble Magus Curve 5 / Curve A5 / Extreme 5 collection cup
// Thumb dial on top -> shaft through lid -> single arm -> adjustable carriage -> slide-in rubber strip
// Works like the Bubble Magus ACS: one wiper on one side, with a thumb adjuster that sets
// how hard the rubber presses on the neck wall.
//
// The lid is the stock Curve A5 lid from Printables model 182898, modified:
// rim groove, vent holes and foam ring kept, drip cone removed, bearing and dial added.
// Put that STL next to this file as stock_curve_a5_lid.stl. All in mm.
// Render one part at a time: set PART below, F6, then export STL.
//
// Hardware: 1x M4 x 20 hex bolt + 1x M4 hex nut, nylon or 316 stainless. 2x short 1.75 mm filament pins.

PART = "assembly";   // "lid" | "rotor" | "carriage" | "dial" | "knob" | "blade" | "assembly"

/* ---------- neck ---------- */
neck_id       = 55;    // inside diameter of the foam neck
neck_top_drop = 22;    // [MEASURE] lid underside down to the top edge of the neck
wipe_depth    = 60;    // how far down inside the neck the strip reaches

/* ---------- stock lid, measured from the STL ---------- */
stock_file  = "stock_curve_a5_lid.stl";
stock_ctr   = [64.5, 64.49];
lid_t       = 7.5;     // plate thickness, top face to underside
cone_cut_r  = 40;      // removes the drip cone, keeps the 85 mm foam ring

/* ---------- drive ---------- */
shaft_d     = 10;
bore_clear  = 0.6;
boss_d      = 22;      // bearing boss under the lid
boss_h      = 3;
key_w       = 6;       // square key into the dial
key_len     = 10;
pin_d       = 1.9;     // 1.75 mm filament as a retaining pin
dial_d      = 40;
dial_h      = 14;
dial_gap    = 0.6;

/* ---------- arm and adjuster ---------- */
arm_h       = 8;
collar_d    = 16;      // stop under the boss so the shaft cannot lift out
collar_h    = 3;
knob_room   = 9;       // headroom for the adjuster knob between arm and lid
arm_t       = 12;
arm_back    = 8;       // arm length behind the shaft
travel      = 5;       // radial adjustment range
bolt_d      = 4.4;     // M4 clearance
nut_af      = 7.3;     // M4 nut across flats + clearance
nut_h       = 3.4;
bolt_head_af = 7.3;    // M4 hex bolt head across flats + clearance
rib_w       = 4.2;     // key on the carriage that rides in the arm slot
rib_h       = 2;
rib_len     = 8;

/* ---------- carriage and rubber ---------- */
spar_w      = 5;
spar_t      = 10;
pad_in      = 7;       // how far the clamp pad reaches in from the spar
rubber_t    = 1.5;     // 1/16 in silicone sheet
slot_w      = 1.3;     // a little under rubber_t so it grips. open up if too tight
slot_depth  = 4;
reach       = 4;       // rubber sticking out past the spar
interf      = 1.5;     // preview only. you set the real value with the adjuster

$fn = 72;
e = 0.01;

/* ---------- derived ---------- */
neck_r     = neck_id/2;
collar_top = -boss_h - 0.3;
collar_bot = collar_top - collar_h;
arm_top    = collar_bot - knob_room;
arm_bot    = arm_top - arm_h;
spar_out_min = neck_r - reach - 2;           // rubber just clear of the wall
spar_out_max = spar_out_min + travel;
spar_out   = neck_r - reach + interf;         // preview position
bolt_off   = spar_w + pad_in/2;               // bolt distance in from the spar outer edge
slot_x0    = spar_out_min - bolt_off - rib_len/2;
slot_x1    = spar_out_max - bolt_off + rib_len/2;
arm_x1     = slot_x1 + 3;
spar_bot   = -neck_top_drop - wipe_depth;
slot_top   = arm_bot - 1;                     // strip slides up from the bottom until it stops here
lock_z     = spar_bot + 5;
key_bot    = lid_t + 0.3;
key_top    = lid_t + dial_gap + key_len;
pin_z      = lid_t + dial_gap + key_len/2;
strip_w    = slot_depth + reach;
strip_len  = slot_top - spar_bot;

assert(slot_x0 > shaft_d/2 + 2, "neck_id too small for this layout");
assert(spar_out_max < neck_r - 0.5, "travel lets the carriage hit the wall");

/* ---------- lid ---------- */
module lid() {
  difference() {
    union() {
      // flip so the underside is z=0 and the top face is z=lid_t
      difference() {
        translate([0,0,lid_t]) mirror([0,0,1]) translate([-stock_ctr[0], -stock_ctr[1], 0])
          import(stock_file, convexity = 6);
        translate([0,0,-40]) cylinder(r = cone_cut_r, h = 40 - e);
      }
      translate([0,0,-boss_h]) cylinder(d = boss_d, h = boss_h + 0.1);
    }
    translate([0,0,-boss_h-1]) cylinder(d = shaft_d + bore_clear, h = boss_h + lid_t + 2);
    // index marks every 45 deg
    for (i = [0:7]) rotate(i*45) translate([dial_d/2 + 3, -0.5, lid_t - 0.6]) cube([5, 1, 1]);
  }
}

/* ---------- rotor: shaft + arm. prints arm down ---------- */
module rotor() {
  difference() {
    union() {
      translate([0,0,arm_bot]) cylinder(d = shaft_d, h = key_bot - arm_bot);
      translate([-key_w/2, -key_w/2, key_bot - e]) cube([key_w, key_w, key_top - key_bot - 0.6]);
      translate([0,0,key_top - 0.6 - e]) hull() {
        translate([-key_w/2, -key_w/2, 0]) cube([key_w, key_w, e]);
        translate([-key_w/2 + 0.6, -key_w/2 + 0.6, 0.6]) cube([key_w - 1.2, key_w - 1.2, e]);
      }
      // collar with a 45 deg underside so it prints without supports
      translate([0,0,collar_bot - (collar_d - shaft_d)/2]) cylinder(d1 = shaft_d, d2 = collar_d, h = (collar_d - shaft_d)/2 + e);
      translate([0,0,collar_bot]) cylinder(d = collar_d, h = collar_h);
      hull() {
        translate([-arm_back, 0, arm_bot]) cylinder(d = arm_t, h = arm_h);
        translate([arm_x1 - arm_t/2, 0, arm_bot]) cylinder(d = arm_t, h = arm_h);
      }
    }
    // adjuster slot
    hull() for (x = [slot_x0 + rib_w/2, slot_x1 - rib_w/2])
      translate([x, 0, arm_bot - 1]) cylinder(d = rib_w + 0.3, h = arm_h + 2);
    // scale ticks every 1 mm of travel, on top of the arm beside the slot
    for (i = [0:travel]) translate([spar_out_min - bolt_off + i - 0.25, rib_w/2 + 1, arm_top - 0.6])
      cube([0.5, i % 5 == 0 ? 3.5 : 2, 1]);
    translate([0, 0, pin_z]) rotate([90,0,0]) cylinder(d = pin_d, h = key_w + 2, center = true);
  }
}

/* ---------- carriage: clamp pad + spar with rubber slot. prints upright ---------- */
module carriage() {
  pad_x0 = spar_out - spar_w - pad_in;
  bx = spar_out - bolt_off;
  difference() {
    union() {
      translate([spar_out - spar_w, -spar_t/2, spar_bot]) cube([spar_w, spar_t, arm_bot - spar_bot]);
      translate([pad_x0, -spar_t/2, arm_bot - 8]) cube([pad_in + spar_w, spar_t, 8]);
      // 45 deg support under the pad so it prints without supports
      hull() {
        translate([pad_x0, -spar_t/2, arm_bot - 8]) cube([pad_in, spar_t, e]);
        translate([spar_out - spar_w - e, -spar_t/2, arm_bot - 8 - pad_in]) cube([e, spar_t, e]);
      }
      // rib that rides in the arm slot and keeps the carriage square
      hull() for (x = [bx - rib_len/2 + rib_w/2, bx + rib_len/2 - rib_w/2])
        translate([x, 0, arm_bot - e]) cylinder(d = rib_w, h = rib_h);
    }
    translate([bx, 0, arm_bot - 30]) cylinder(d = bolt_d, h = 40);
    // captive nut, pushed up from below
    translate([bx, 0, arm_bot - 8 - pad_in - 1]) cylinder(d = nut_af / cos(30), h = pad_in + 1 + 8 - 3, $fn = 6);
    // rubber slot, open at the bottom and the outer edge
    translate([spar_out - slot_depth, -slot_w/2, spar_bot - 1]) cube([slot_depth + 1, slot_w, slot_top - spar_bot + 1]);
    translate([spar_out - slot_depth, -slot_w/2 - 0.6, spar_bot - 1]) cube([slot_depth + 1, slot_w + 1.2, 1.6]);
    // lock pin through spar and rubber
    translate([spar_out - slot_depth/2, 0, lock_z]) rotate([90,0,0]) cylinder(d = pin_d, h = spar_t + 2, center = true);
  }
}

/* ---------- adjuster knob, presses onto the M4 bolt head ---------- */
module knob() {
  difference() {
    cylinder(d = 13, h = 7);
    for (i = [0:7]) rotate(i*45) translate([7.2, 0, -1]) cylinder(d = 3, h = 9);
    translate([0,0,-e]) cylinder(d = bolt_head_af / cos(30), h = 3.2, $fn = 6);
    translate([0,0,-1]) cylinder(d = bolt_d, h = 10);
  }
}

/* ---------- dial ---------- */
module dial() {
  difference() {
    cylinder(d = dial_d, h = dial_h);
    for (i = [0:11]) rotate(i*30) translate([dial_d/2 + 2.2, 0, -1]) cylinder(d = 7, h = dial_h + 2);
    translate([-key_w/2 - 0.2, -key_w/2 - 0.2, -e]) cube([key_w + 0.4, key_w + 0.4, key_len + 0.5]);
    translate([0, 0, key_len/2]) rotate([90,0,0]) cylinder(d = pin_d, h = dial_d + 2, center = true);
    // pointer groove on top, points at the wiper
    translate([dial_d/2 - 12, -1, dial_h - 1]) cube([11, 2, 2]);
    translate([0,0,dial_h + 26]) sphere(r = 27);
  }
}

/* ---------- rubber strip. cutting template, or print in TPU 85A ---------- */
module blade_2d() {
  ch = reach;
  polygon([[0,0], [strip_w - ch, 0], [strip_w, ch], [strip_w, strip_len], [0, strip_len]]);
}
module blade() linear_extrude(rubber_t) blade_2d();

/* ---------- output ---------- */
if (PART == "lid")      rotate([180,0,0]) translate([0,0,-lid_t]) lid();       // top face down, as the stock file prints
if (PART == "rotor")    translate([0,0,-arm_bot]) rotor();                    // arm on the bed
if (PART == "carriage") translate([-spar_out,0,-spar_bot]) carriage();        // upright, spar on the bed
if (PART == "dial")     translate([0,0,dial_h]) rotate([180,0,0]) dial();     // top face down
if (PART == "knob")     knob();
if (PART == "blade")    blade();
if (PART == "assembly") {
  color("lightblue", 0.6) lid();
  color("orange") rotor();
  color("white") carriage();
  color("dimgray") translate([0,0,lid_t + dial_gap]) dial();
  color("white") translate([spar_out - bolt_off, 0, arm_top]) knob();
  color("black") translate([spar_out - slot_depth, rubber_t/2, spar_bot]) rotate([90,0,0]) blade();
  // ghost of the neck
  %translate([0,0,spar_bot - 5]) difference() {
    cylinder(d = neck_id + 6, h = wipe_depth + 5);
    translate([0,0,-1]) cylinder(d = neck_id, h = 500);
  }
}
