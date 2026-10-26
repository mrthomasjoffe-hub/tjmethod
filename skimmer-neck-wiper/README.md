# Manual neck wiper lid. Bubble Magus Curve 5 / Extreme 5

Replaces the stock collection cup lid. Turn the thumb dial on top and two TPU blades sweep the inside wall of the neck.

## Parts
| File | Material | Orientation | Qty |
|---|---|---|---|
| lid.stl | PETG | top face down, no supports | 1 |
| rotor.stl | PETG | flat, pegs up, no supports | 1 |
| dial.stl | PETG | top face down, no supports | 1 |
| blade.stl | TPU 95A | flat | 2 |

Plus 15 mm of 1.75 mm filament as a retaining pin.
PETG over PLA because it lives in a salty, wet cup. 4 walls, 30% infill on the rotor.

## Measure first
Open `neck_wiper.scad`, edit the values tagged `[MEASURE]`, export each part by setting `PART`.
1. `cup_id`: inside diameter of the cup at the rim.
2. `cup_rim_od`: outside diameter of the rim.
3. `neck_id`: inside diameter of the neck.
4. `neck_top_drop`: from the top of the rim down to the top edge of the neck.
5. `wipe_depth`: how much of the neck you want wiped.

If your stock lid fits over the outside of the cup, set `lid_style = "skirt"`.
Print one blade first. It should press about 1 mm into the wall. Adjust `interf` if it drags too hard or skips.

## Assembly
1. Press both blades onto the pegs on the rotor.
2. Push the rotor up through the lid from underneath. The collar stops against the boss.
3. Press the dial onto the square key, line up the holes, push the filament pin through. Trim flush.
4. Drop it onto the cup, squeezing the blades into the neck. The chamfer on the blades helps.
5. Turn the dial a few times a day or before you empty the cup.

The vent holes are required. A sealed lid will push foam back down.
