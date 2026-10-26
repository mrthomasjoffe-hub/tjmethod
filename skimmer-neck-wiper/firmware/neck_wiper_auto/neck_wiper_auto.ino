// Automatic skimmer neck wiper
// ESP32 + ULN2003 + 28BYJ-48. Turns the wiper one full revolution at set times each day.
// Press the BOOT button on the ESP32 for a wipe on demand.
//
// Board: Seeed XIAO ESP32-C3 or any classic ESP32 dev board, Arduino core. No extra libraries needed.
// Pins switch automatically from the board you pick in the Arduino IDE.

#include <WiFi.h>
#include <time.h>

// ---------- settings ----------
const char* WIFI_SSID = "your-wifi";
const char* WIFI_PASS = "your-password";

// POSIX time zone. Eastern US shown. Others: "PST8PDT,M3.2.0,M11.1.0", "GMT0BST,M3.5.0/1,M10.5.0", "CET-1CEST,M3.5.0,M10.5.0/3"
const char* TZ_INFO = "EST5EDT,M3.2.0,M11.1.0";

// Wipe times, 24 hour clock
const int WIPE_HOURS[]   = {8, 20};
const int WIPE_MINUTES[] = {0, 0};
const int WIPE_COUNT     = 2;

// Without Wi-Fi it falls back to one wipe every 12 hours from power up
const unsigned long FALLBACK_INTERVAL_MS = 12UL * 60UL * 60UL * 1000UL;

const int  REVOLUTIONS   = 1;      // 360 degrees
const bool CLOCKWISE     = true;   // flip if it turns the wrong way
const int  STEP_DELAY_US = 2000;   // slower gives more torque. 2000 is about 8 s per turn

// ---------- hardware ----------
#if CONFIG_IDF_TARGET_ESP32C3
// Seeed XIAO ESP32-C3. D1..D4. D0 is skipped because GPIO2 is a boot strapping pin
const int COIL_PINS[4] = {3, 4, 5, 6};       // ULN2003 IN1..IN4
const int BUTTON_PIN   = 9;                  // the BOOT button on the XIAO
#else
// Classic ESP32 DevKit, 30 or 38 pin
const int COIL_PINS[4] = {16, 17, 18, 19};   // ULN2003 IN1..IN4
const int BUTTON_PIN   = 0;                  // the BOOT button on most ESP32 boards
#endif
const int STEPS_PER_REV = 4076;              // 28BYJ-48 half steps, real gear ratio 63.68:1

const uint8_t HALF_STEP[8] = {
  0b1000, 0b1100, 0b0100, 0b0110, 0b0010, 0b0011, 0b0001, 0b1001
};

int  phase = 0;
int  lastWipeSlot = -1;
int  lastWipeYday = -1;
bool timeValid = false;
unsigned long lastFallbackWipe = 0;
unsigned long lastReconnect = 0;

void setCoils(uint8_t pattern) {
  for (int i = 0; i < 4; i++) digitalWrite(COIL_PINS[i], (pattern >> (3 - i)) & 1);
}

void releaseCoils() {
  setCoils(0);   // no holding current, keeps the motor cool
}

void wipe() {
  Serial.println("Wiping");
  long steps = (long)STEPS_PER_REV * REVOLUTIONS;
  for (long s = 0; s < steps; s++) {
    phase = (phase + (CLOCKWISE ? 1 : 7)) % 8;
    setCoils(HALF_STEP[phase]);
    delayMicroseconds(STEP_DELAY_US);
    if ((s & 255) == 0) yield();
  }
  releaseCoils();
  Serial.println("Done");
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) delay(250);
  // set up NTP either way. it syncs on its own once Wi-Fi comes up
  configTzTime(TZ_INFO, "pool.ntp.org", "time.nist.gov");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Wi-Fi connected, syncing time");
  } else {
    Serial.println("No Wi-Fi, using 12 hour fallback timer");
  }
}

void checkSchedule() {
  struct tm now;
  if (getLocalTime(&now, 10)) {
    timeValid = true;
    for (int i = 0; i < WIPE_COUNT; i++) {
      bool due = now.tm_hour == WIPE_HOURS[i] && now.tm_min == WIPE_MINUTES[i];
      bool alreadyDone = lastWipeSlot == i && lastWipeYday == now.tm_yday;
      if (due && !alreadyDone) {
        lastWipeSlot = i;
        lastWipeYday = now.tm_yday;
        wipe();
      }
    }
  } else if (!timeValid && millis() - lastFallbackWipe >= FALLBACK_INTERVAL_MS) {
    lastFallbackWipe = millis();
    wipe();
  }
}

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 4; i++) pinMode(COIL_PINS[i], OUTPUT);
  releaseCoils();
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  connectWifi();
  lastFallbackWipe = millis();
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(50);
    if (digitalRead(BUTTON_PIN) == LOW) {
      wipe();
      while (digitalRead(BUTTON_PIN) == LOW) delay(10);
    }
  }
  if (WiFi.status() != WL_CONNECTED && millis() - lastReconnect > 600000UL) {
    lastReconnect = millis();
    WiFi.reconnect();
  }
  checkSchedule();
  delay(200);
}
