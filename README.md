# REOS — Renewable Energy Operating System
### *Solar System Sizing, Engineering, & Financial Analysis Platform*

REOS is a state-of-the-art monorepo application designed to democratize and professionalize solar PV system engineering. By combining rigorous electrical standards with an intuitive user experience, REOS enables homeowners, local solar installers, and clean energy investors to design, validate, and analyze solar installations.

---

## 📋 Table of Contents
1. [Core Vision & Objectives](#-core-vision--objectives)
2. [Target Audience & Key Benefits](#-target-audience--key-benefits)
   - [For Homeowners / End Users](#1-for-homeowners--end-users)
   - [For Local Solar Installers & Engineers](#2-for-local-solar-installers--engineers)
   - [For Local Investors & Project Developers](#3-for-local-investors--project-developers)
3. [System Navigation Guide](#-system-navigation-guide)
   - [Workflow & Step-by-Step Sizing](#workflow--step-by-step-sizing)
   - [Special Features](#special-features)
4. [Architecture & Resilience (Graceful Degradation)](#-architecture--resilience-graceful-degradation)
5. [Getting Started & Local Execution](#-getting-started--local-execution)

---

## 🎯 Core Vision & Objectives
Solar installations in developing markets are frequently plagued by **under-sizing** (leading to premature battery failure and blackouts) or **over-sizing** (resulting in prohibitively expensive capital requirements). 

REOS solves this by providing a unified platform to:
* **Perform Accurate Load Assessments:** Model appliance duty cycles hour-by-hour rather than relying on rough daily averages.
* **Automate Multi-Layer Sizing:** Dynamically size the solar PV array, battery storage bank, and inverter rating based on the load profile.
* **Ensure Electrical Compliance:** Validate cable thickness and voltage drops against international standards (**IEC 60364**).
* **Project Financial Feasibility:** Deliver transparent ROI, payback periods, and 25-year net savings calculations.

---

## 👥 Target Audience & Key Benefits

### 1. For Homeowners / End Users
* **Simple Mode:** Hides complex engineering variables (losses, derating factors, temperature coefficients) and focuses purely on what matters: inputting appliances, daily hours of use, and seeing a clear system recommendation.
* **Financial Clarity:** Directly projects monthly grid bill savings, how much the system will cost (CAPEX), and how many years it will take for the system to pay for itself.
* **Informed Purchasing:** Homeowners can generate a report to cross-check quotes from local installers, protecting themselves from inflated pricing or inadequate designs.

### 2. For Local Solar Installers & Engineers
* **Professional Mode:** Unlocks advanced parameters including system losses, temperature derating, battery depth of discharge (DoD), days of autonomy, and cable run lengths.
* **IEC 60364 Cable Coordination:** Instantly computes voltage drop percentage based on design current, cable area (mm²), and run length, providing an explicit **PASS/FAIL** safety check.
* **PDF Engineering Reports:** One-click generation of a professional, client-ready PDF report summarizing the load profile, wiring configurations (series/parallel connections), and financial projections.

### 3. For Local Investors & Project Developers
* **Standardized Sizing Reports:** High-quality, reliable PDF outputs that serve as standardized project proposals for underwriting solar loans.
* **Risk Mitigation:** Automated compliance checks (cable safety, inverter surge capacity, and grid-tie anti-islanding notes) reduce technical risks.
* **Net-Metering & ROI Analysis:** Models grid-export scenarios to calculate payback periods and NPV (Net Present Value) based on local utility tariffs.

---

## 🧭 System Navigation Guide

The REOS interface is divided into a three-column layout (on web) or a tabbed layout (on mobile) comprising the **Control Panel**, **Engineering Cards**, and the **AI Copilot Panel**.

### Workflow & Step-by-Step Sizing

#### 1. Choose User Mode & Role (Header)
* In the top-right header, toggle between **Simple Mode** (ideal for homeowners) and **Professional Mode** (ideal for installers/engineers).
* Toggle the **Theme** (Light/Dark) according to preference.

#### 2. Load Assessment & Appliance Inventory
* Enter the appliances you intend to power.
* **Adding Custom Appliances:** Click `➕ Add Custom Appliance`, enter the name, power rating (Watts), quantity, and estimated daily hours.
* **Adjusting Quantities:** Use the `+` and `-` buttons next to each appliance. 
* *Note: The list starts at `0` quantities by default to ensure you only size for your active appliances.*
* Click **"Calculate Load Profile"** to see your peak demand (W) and daily consumption (kWh).

#### 3. Solar PV Array Sizing
* Input the average **Peak Sun Hours (PSH)** for your location (e.g., 4.8 hrs/day for West Africa).
* Under *Professional Mode*, adjust the **System Losses** and **Temperature Derating** to match local ambient conditions.
* Select your target **Panel Rating (W)**.
* See the required system size (kWp), number of panels, and expected annual generation (kWh).

#### 4. Battery Storage Bank Sizing
* Choose your battery technology: **Lithium (LiFePO4)** or **Lead-Acid (AGM/VRLA)**.
* Adjust **Autonomy Days** (how many days the battery should run without sun) and **Depth of Discharge (DoD)** (e.g., 80% for Lithium, 50% for Lead-Acid).
* The system automatically generates the **Battery Bank Wiring Configuration**, telling you exactly how many units are required in series (to match the DC bus voltage) and parallel.

#### 5. Inverter Sizing
* Select your **Inverter Type** (On-Grid, Off-Grid, or Hybrid).
* Define the **Safety Margin** (default 1.25 or 25% overhead).
* The system will auto-size the inverter or allow a **Manual Override** to test a specific inverter rating.

#### 6. Cable Sizing & Voltage Drop (IEC 60364)
* Input the **Cable Run Length (meters)** and select a **Cable Cross-Section (mm²)** (e.g., 4mm², 6mm², 10mm²).
* The system calculates the exact voltage drop in volts and percentage, indicating a green **PASS** (under 3% drop) or red **FAIL**.

#### 7. Financial & ROI Summary
* Select your local currency (e.g., `NGN`, `USD`, `ZAR`).
* Input the **Grid Tariff Rate** (cost per kWh from your distribution company) and your **CAPEX Budget**.
* The system instantly calculates your monthly savings, payback period in years, and 25-year net savings.

---

### Special Features

* **AI Copilot (Right Panel):** Click `Get AI Sizing Insights` at any time. The AI assistant will review your entire system design and output three highly technical, actionable engineering recommendations.
* **Grid Export Wizard:** Click the `Grid Export Wizard` button in the header. If you have a hybrid/on-grid system, you can input your utility provider and account number to simulate real-time credit accumulation from exporting surplus power back to the grid.
* **Download Report:** Click `Download Design Report` at the bottom of the screen to download a beautifully formatted PDF engineering report directly to your computer.

---

## 🛡️ Architecture & Resilience (Graceful Degradation)

REOS is engineered to remain fully operational even during backend service outages, ensuring local installers in remote areas with poor internet connectivity can continue working.

| Backend Service | If Unavailable / Offline | Fallback Behavior & Graceful Degradation |
| :--- | :--- | :--- |
| **Authentication** | Server Down | The application remains fully functional in **Guest Mode**. Users can perform all calculations and save designs. |
| **Project Storage** | DB Connection Fails | The app catches the error, sets `isDbOffline: true`, and seamlessly falls back to the browser's **`localStorage`**. The user can save, load, and manage projects locally. |
| **AI Copilot** | OpenAI/Gemini API Down | The Copilot catches the network failure and activates a **Local Sizing Rule-Engine**. It analyzes the active design (such as checking if cable voltage drop exceeds 3%) and outputs local engineering recommendations. |
| **Grid Export / Billing** | Billing API Down | Credit accumulation and net-metering compliance are simulated directly in the client-side state, ensuring the wizard remains interactive. |

---

## 🚀 Getting Started & Local Execution

### Prerequisites
* **Node.js**: Version 18.x or newer (Note: If running on Node 18, the system automatically preloads a polyfill for `Array.prototype.toReversed`).
* **npm**: Version 9.x or newer.

### Installation
From the root of the monorepo, install all dependencies for the workspaces:
```bash
npm install
```

### Running the Services

#### 1. Start the Backend API
```bash
npm run backend:dev
```
*The backend will run on [http://localhost:3000/api](http://localhost:3000/api). If PostgreSQL is not running, it will automatically start in database-offline mode.*

#### 2. Start the Frontend Web App
```bash
npm run web --workspace=apps/frontend
```
*The web app will bundle and start on [http://localhost:8081](http://localhost:8081).*
