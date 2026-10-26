// Motorized version of the neck wiper. Same lid, rotor, carriage and rubber strip as neck_wiper.scad.
// The thumb dial is swapped for a 28BYJ-48 stepper on a small tower, driven by an ESP32 on a timer.
// Render one part at a time: set AUTO_PART below, F6, then export STL.
//
// Hardware on top of the manual build:
//   1x 28BYJ-48 stepper, 5 V, with ULN2003 driver board
//   3x M3 x 8 screws, tower to lid. 2x M3 x 10 screws + nuts, motor to tower. Nylon or 316 stainless.

include <neck_wiper.scad>
PART = "none";            // silences the manual file's own output

AUTO_PART = "auto_assembly"; // "auto_lid" | "tower" | "coupler" | "cover" | "auto_assembly"

/* ---------- 28BYJ-48 ---------- */
m_body_d     = 28.5;
m_body_h     = 19.5;
m_offset     = 8;      // output shaft sits this far off the body centre
m_ear_pitch  = 35;
m_ear_hole   = 3.4;    // M3 through
m_boss_d     = 9.5;    // collar round the output shaft
m_shaft_d    = 5.2;    // 5 mm shaft + clearance
m_flat_w     = 3.1;    // 3 mm across the flats + clearance
m_engage     = 6;      // how far the shaft enters the coupler
m_shaft_len  = 10;     // shaft length below the mounting face

/* ---------- tower ---------- */
tw_od        = 50;
tw_wall      = 2.4;
tw_base_t    = 3;
tw_plate_t   = 3;
tw_screw_r   = 20;     // tower screws into the lid on this radius
tw_pilot_d   = 2.5;    // M3 self-tap into the lid plate
tw_pilot_h   = 6;

/* ---------- cover ---------- */
cv_id        = 64;
cv_wall      = 2;
cv_h         = 52;     // lid top to cover roof

/* ---------- derived ---------- */
cp_bot       = lid_t + dial_gap;                    // coupler sits where the dial used to
cp_h         = key_len + 0.5 + 1.5 + m_engage;
cp_top       = cp_bot + cp_h;
plate_bot    = cp_top + m_shaft_len - m_engage - tw_plate_t;  // motor face lands on the plate top
plate_top    = plate_bot + tw_plate_t;
tw_h         = plate_top - lid_t;

assert(plate_bot > cp_top + 0.5, "coupler hits the tower plate");
assert(cv_h + lid_t > plate_top + m_body_h + 4, "cover too short for the motor");

/* ---------- lid: stock lid + pilot holes for the tower ---------- */
module auto_lid() {
  difference() {
    lid();
    for (a = [90, 210, 330]) rotate(a) translate([tw_screw_r, 0, lid_t - tw_pilot_h]) cylinder(d = tw_pilot_d, h = tw_pilot_h + 1);
  }
}

/* ---------- tower: holds the motor coaxial with the wiper shaft ---------- */
module tower() {
  difference() {
    union() {
      translate([0,0,lid_t]) difference() {
        cylinder(d = tw_od, h = tw_h);
        translate([0,0,-e]) cylinder(d = tw_od - 2*tw_wall, h = tw_h - tw_plate_t + e);
      }
      // base flange with screw ears
      translate([0,0,lid_t]) difference() {
        hull() for (a = [90, 210, 330]) rotate(a) translate([tw_screw_r, 0, 0]) cylinder(d = 9, h = tw_base_t);
        translate([0,0,-1]) cylinder(d = tw_od - 2*tw_wall, h = tw_base_t + 2);
      }
    }
    for (a = [90, 210, 330]) rotate(a) translate([tw_screw_r, 0, lid_t - 1]) cylinder(d = 3.4, h = tw_base_t + 2);
    // shaft boss hole and motor ears. body centre is offset along +y
    translate([0,0,plate_bot - 1]) cylinder(d = m_boss_d + 0.6, h = tw_plate_t + 2);
    for (x = [-1, 1]) translate([x*m_ear_pitch/2, m_offset, plate_bot - 1]) cylinder(d = m_ear_hole, h = tw_plate_t + 2);
    // windows to see the coupler and push the pin in
    for (a = [0, 180]) rotate(a) translate([tw_od/2 - tw_wall - 1, -8, lid_t + tw_base_t + 1])
      cube([tw_wall + 2, 16, plate_bot - lid_t - tw_base_t - 2]);
    // cable and drain slots at the foot
    for (a = [90, 270]) rotate(a) translate([tw_od/2 - tw_wall - 1, -3, lid_t - e]) cube([tw_wall + 2, 6, 2]);
  }
}

/* ---------- coupler: wiper key below, motor D-shaft above ---------- */
module coupler() {
  difference() {
    cylinder(d = 16, h = cp_h);
    translate([-key_w/2 - 0.2, -key_w/2 - 0.2, -e]) cube([key_w + 0.4, key_w + 0.4, key_len + 0.5]);
    translate([0, 0, key_len/2]) rotate([90,0,0]) cylinder(d = pin_d, h = 20, center = true);
    translate([0,0,cp_h - m_engage]) intersection() {
      cylinder(d = m_shaft_d, h = m_engage + 1);
      translate([-m_flat_w/2, -5, 0]) cube([m_flat_w, 10, m_engage + 1]);
    }
    // pointer on the side, lines up with the wiper
    translate([8 - 0.8, -1, 2]) cube([2, 2, cp_h - 4]);
  }
}

/* ---------- cover: keeps salt spray off the motor ---------- */
module cover() {
  difference() {
    translate([0, 0, lid_t]) cylinder(d = cv_id + 2*cv_wall, h = cv_h);
    translate([0, 0, lid_t - e]) cylinder(d = cv_id, h = cv_h - cv_wall);
    // cable exit
    translate([-5, cv_id/2 - 2, lid_t - e]) cube([10, cv_wall + 4, 8]);
  }
}

/* ---------- output ---------- */
if (AUTO_PART == "auto_lid") rotate([180,0,0]) translate([0,0,-lid_t]) auto_lid();
if (AUTO_PART == "tower")    translate([0,0,-lid_t]) tower();                          // base on the bed
if (AUTO_PART == "coupler")  coupler();
if (AUTO_PART == "cover")    translate([0,0,cv_h + lid_t]) rotate([180,0,0]) cover(); // roof on the bed
if (AUTO_PART == "auto_assembly") {
  color("lightblue", 0.6) auto_lid();
  color("orange") rotor();
  color("white") carriage();
  color("white") translate([spar_out - bolt_off, 0, arm_top]) knob();
  color("black") translate([spar_out - slot_depth, rubber_t/2, spar_bot]) rotate([90,0,0]) blade();
  color("gainsboro") tower();
  color("dimgray") translate([0, 0, cp_bot]) coupler();
  // motor stand-in
  color("silver") translate([0, m_offset, plate_top]) cylinder(d = m_body_d, h = m_body_h);
  color("silver") translate([0, 0, plate_top - m_shaft_len]) cylinder(d = 5, h = m_shaft_len);
  color("silver") translate([0, m_offset, plate_top]) hull() for (x = [-1, 1]) translate([x*m_ear_pitch/2, 0, 0]) cylinder(d = 7, h = 1);
  color("royalblue") translate([-8.5, m_offset + m_body_d/2 - 2, plate_top]) cube([17, 6, 16]);
  %cover();
}
