# TEAM ASTRA 🔱 — Echo Route

## 1. Introduction

Echo Route is an intelligent system designed to improve daily commuting decisions while reducing noise pollution impact on residents and pedestrians.
Unlike traditional navigation systems that focus only on time, Echo Route considers environmental and health factors.

---

## 2. Problem Statement

**Theme:** Intelligent Systems for Real-World Decision Making

Urban areas face severe traffic congestion and noise pollution, exposing people living near roads and pedestrians to harmful noise levels.
Existing systems do not consider noise or health impact in routing decisions.

---

## 3. Objectives

* Optimize daily travel decisions
* Reduce noise exposure and protect residents and pedestrians
* Introduce intelligent decision-making in routing

---

## 4. Key Features

* Smart route recommendation
* Noise heatmap visualization
* Real-time alerts & health impact indicator (Safe / Moderate / Harmful)
* EV-aware routing

---

## 5. Decision Logic

Our routing engine calculates the optimal path based on simulated IoT sensor data.

The route score is calculated using:

```
Score = 0.6 × Noise + 0.3 × Traffic + 0.1 × Vehicle Impact
```

* A lower score indicates a better route
* Noise is given highest priority to ensure health safety
* Vehicle type is treated as a minor factor to minimize the impact of incorrect user input

---

## 6. Tech Stack

* **Language:** Python
* **Data Processing:** Rule-based logic with simulated data (JSON / GeoJSON)
* **UI:** Simplified map-based or interactive interface

---

## 7. Setup & Demo Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/Pruthvi-cs/TEAM_ASTRA_EchoRoute
   ```
2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```
3. Run the application:

   ```bash
   python app.py
   ```
4. Select your vehicle type (EV / Petrol / Heavy) and view:

   * Recommended route
   * Noise levels
   * Health impact alerts

---

## 🏁 Conclusion

Echo Route is a practical and scalable solution that combines traffic optimization with public health awareness, enabling smarter and safer urban mobility.
