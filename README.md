# TEAM_ASTRA_EchoRoute

## 1. Introduction
[cite_start]Echo Route is an intelligent system designed to improve daily commuting decisions while reducing noise pollution impact on residents and pedestrians[cite: 46]. [cite_start]Unlike traditional navigation systems that focus only on time, Echo Route considers environmental and health factors[cite: 47].

## 2. Problem Statement
**Theme:** Intelligent Systems for Real-World Decision Making 
[cite_start]Urban areas face severe traffic congestion and noise pollution, exposing people living near roads and pedestrians to harmful noise levels[cite: 49]. [cite_start]Existing systems do not consider noise or health impact in routing decisions[cite: 50].

## 3. Objectives
* [cite_start]Optimize daily travel decisions[cite: 52].
* [cite_start]Reduce noise exposure and protect residents and pedestrians[cite: 53, 54].
* [cite_start]Introduce intelligent decision-making in routing[cite: 55].

## 4. Key Features
* [cite_start]Smart route recommendation[cite: 75].
* [cite_start]Noise heatmap visualization[cite: 76].
* [cite_start]Real-time alerts & Health impact indicator (Safe/Moderate/Harmful)[cite: 77, 78].
* [cite_start]EV-aware routing[cite: 79].

## 5. Decision Logic
[cite_start]Our routing engine calculates the optimal path based on simulated IoT sensor data[cite: 63, 86]. 
The algorithm calculates a route score using the following logic:
[cite_start]$Score=0.6\times\text{Noise}+0.3\times\text{Traffic}+0.1\times\text{Vehicle Impact}$[cite: 69].
[cite_start]A lower score indicates a better route, with noise given the highest priority to ensure health safety[cite: 70]. [cite_start]Vehicle type is treated as a minor factor to minimize the impact of incorrect user input[cite: 73].

## 6. Tech Stack
* **Language:** Python
* [cite_start]**Data Processing:** Rule-based logic with simulated data[cite: 86, 90].
* [cite_start]**UI:** Simplified Map UI[cite: 91].

## 7. Setup & Demo Instructions
1. Clone the repository: `git clone https://github.com/Pruthvi-cs/TEAM_ASTRA_EchoRoute`
2. Install requirements: `pip install -r requirements.txt`
3. Run the main script: `python app.py` (or your specific run command)
4. [cite_start]Select your vehicle type (EV/Petrol/Heavy) and view the recommended path and health impact alerts[cite: 60, 81, 84].
