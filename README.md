# 🧬 Synapse OS v5.0 - Professional Release
**An Intelligent Clinical Risk Prediction & Universal Triage System**

![Synapse OS Banner](https://img.shields.io/badge/Status-Live-success) ![Version](https://img.shields.io/badge/Version-5.0.2_PRO-blue) ![Python](https://img.shields.io/badge/Python-3.11%2B-yellow) ![AI](https://img.shields.io/badge/AI_Models-XGBoost-orange)

Synapse OS is a state-of-the-art web-based clinical intelligence platform. It utilizes a multi-model AI architecture to analyze patient vitals and lab reports in real-time, predicting up to 28 severe clinical risks (e.g., Sepsis, DKA, Renal Failure) across 8 specialized medical domains.

## 🚀 Key Features

* **Universal Deep Scan:** Analyzes patient data through 8 independent AI Expert Models (Cardiovascular, Renal, Metabolic, Hepatic, Respiratory, Systemic, Hematological, Tropical) simultaneously.
* **Smart Lab Report OCR:** Features a Hybrid Vision Engine. Upload an image of a medical report, and it extracts vital parameters using Cloud AI (Google Gemini Vision).
* **Automated Clinical Triage:** Instantly flags critical emergencies (e.g., Severe Tachycardia, Hypertensive Crisis) bypassing the standard AI pipeline for immediate alerts.
* **Dynamic Guidelines generation:** Generates detailed clinical assessments and dietary/lifestyle guidelines using LLM integration.
* **Professional PDF Reporting:** Export detailed medical assessments with a single click.

## 🛠️ Technology Stack

* **Frontend:** HTML5, CSS3, JavaScript (Hosted on Vercel)
* **Backend:** Python, Flask, Gunicorn, CORS (Hosted on Render)
* **Machine Learning:** Scikit-Learn, XGBoost, Pandas, Joblib
* **Cloud Vision & LLM:** Google GenAI SDK (Gemini 1.5 Flash / 2.5 Flash)

## 📊 AI Model Training & Dataset
The AI models powering Synapse OS were trained using engineered clinical datasets inspired by the **MIMIC-III** clinical database. The models prioritize high sensitivity for critical diseases to ensure minimal false negatives in emergency scenarios.

## ⚙️ How it Works
1.  **Data Entry:** Users input clinical parameters manually or via the OCR scanner.
2.  **Routing:** The `app.py` backend routes the valid parameters to the relevant saved `.pkl` models.
3.  **Prediction:** The ensemble of XGBoost models calculates probabilities.
4.  **Clinical Override:** A hardcoded clinical rule engine overrides AI predictions if specific life-threatening thresholds (e.g., extreme glucose + low pH) are met.
5.  **Output:** Results are sorted and displayed on the interactive glassmorphism dashboard.

## 👨‍💻 Developer
Developed by **Shaikh Jubair** - AI Enthusiast & Developer.
*Driven by the goal of integrating advanced AI into scalable business solutions.*
