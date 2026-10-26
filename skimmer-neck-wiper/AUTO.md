# Automatic neck wiper

Same wiper as the manual build. The thumb dial is replaced by a small stepper motor in a covered tower on the lid. An ESP32 turns the wiper one full 360 degree revolution at 8:00 and 20:00 every day.

## Printed parts
Print everything from the manual build except `dial.stl` and `lid.stl`, plus:

| File | Material | Orientation | Qty |
|---|---|---|---|
| auto_lid.stl | PETG | top face down | 1 |
| tower.stl | PETG | base on the bed | 1 |
| coupler.stl | PETG | as exported | 1 |
| cover.stl | PETG | roof on the bed | 1 |

`auto_lid.stl` is the stock lid with three pilot holes for the tower. Like `lid.stl`, it is kept out of git. Rebuild it from `auto_wiper.scad` with `stock_curve_a5_lid.stl` next to it.

## Shopping list
- 28BYJ-48 5 V stepper motor with ULN2003 driver board. They are sold as a pair.
- Seeed Studio XIAO ESP32-C3, or any classic ESP32 dev board. Solder the headers on the XIAO and screw on its Wi-Fi antenna.
- 5 V 2 A USB power supply and a USB cable.
- 5 jumper wires for ESP32 to driver, and a 5 wire extension so the electronics can live away from the sump.
- A small project box for the ESP32 and driver.
- Screws in nylon or 316 stainless: 3x M3 x 8 for the tower, 2x M3 x 10 with nuts for the motor.

## Wiring
| ULN2003 | XIAO ESP32-C3 | Classic ESP32 |
|---|---|---|
| IN1 | D1 / GPIO 3 | GPIO 16 |
| IN2 | D2 / GPIO 4 | GPIO 17 |
| IN3 | D3 / GPIO 5 | GPIO 18 |
| IN4 | D4 / GPIO 6 | GPIO 19 |
| + | 5V | 5V or VIN |
| - | GND | GND |

On the XIAO, leave D0 free. It is a boot pin and the driver board can stop the XIAO from starting.
In the Arduino IDE pick "XIAO_ESP32C3" as the board. The pins switch automatically.

The motor plugs into the white socket on the driver board.

## Firmware
1. Install the Arduino IDE and add the ESP32 board package.
2. Open `firmware/neck_wiper_auto/neck_wiper_auto.ino`.
3. Set your Wi-Fi name, password and time zone at the top. Change the wipe times if you want.
4. Upload.

It gets the time from the internet, so the wipes land on the clock. If Wi-Fi is down it wipes every 12 hours from power up. Press the BOOT button on the ESP32 to wipe on demand. The motor is switched off between wipes so it stays cool.

## Assembly
1. Build the wiper exactly as in the manual README, but leave the dial off.
2. Press the coupler onto the square key and pin it with filament.
3. Screw the tower onto the lid over the coupler.
4. Screw the motor onto the tower plate with its shaft down into the coupler. The flats on the shaft line up with the D hole.
5. Route the motor cable out of the notch in the cover and drop the cover over the tower.

## Torque
A 28BYJ-48 is small. Set the wiper adjuster lighter than you would for hand use, about 1 mm past first touch, so the rubber bends without folding flat. If it stalls, slow it down by raising `STEP_DELAY_US` to 3000. If it still stalls, move to the 12 V version of the motor and a 12 V supply. The printed parts are the same.

## Keep it dry
Keep the ESP32 and driver in a box away from the sump, not on the lid. Salt creep kills electronics. The cover only keeps spray off the motor.
