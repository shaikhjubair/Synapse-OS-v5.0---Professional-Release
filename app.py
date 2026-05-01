import os
from dotenv import load_dotenv

# API Key লোড করার বেটার পদ্ধতি - একদম শুরুতে রাখা হলো
load_dotenv() 
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

import re
import base64
import cv2
import json
#from paddleocr import PaddleOCR
from google import genai
from google.genai import types
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import traceback
import database

app = Flask(__name__)
# CORS-কে একদম পাওয়ারফুল করে দেওয়া হলো যাতে ভেরসেলকে ব্লক না করে
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# মেইন লিংকে গেলে যেন 'Not Found' না দেখায়, সেজন্য একটা মেসেজ যোগ করা হলো
@app.route('/', methods=['GET'])
def home():
    return jsonify({"status": "Online", "message": "Synapse API is running perfectly!"})

try:
    database.init_db()
    print("✅ Database initialized successfully.")
except Exception as e:
    print(f"❌ Database initialization failed: {e}")

if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
    print("✅ Neural Engine Connected.")
else:
    print("⚠️ Warning: Gemini API Key not found! Please check your .env file.")

print("--- Synapse OS: Booting 8 Specialist Neural Networks ---")

expert_prefixes = [
    'expert_cardio', 'expert_renal', 'expert_meta', 'expert_hepatic', 
    'expert_resp', 'expert_sys', 'expert_hema', 'expert_tropical'
]

synapse_brain = {}
for prefix in expert_prefixes:
    model_path = f"saved_ai_models/{prefix}_model.pkl"
    encoder_path = f"saved_ai_models/{prefix}_encoder.pkl"
    feature_path = f"saved_ai_models/{prefix}_features.pkl"
    
    if os.path.exists(model_path) and os.path.exists(encoder_path) and os.path.exists(feature_path):
        try:
            synapse_brain[prefix] = {
                "model": joblib.load(model_path),
                "encoder": joblib.load(encoder_path),
                "features": joblib.load(feature_path)
            }
            print(f" 🟢 Loaded: {prefix.replace('expert_', '').upper()} Expert")
        except Exception as e:
            print(f" 🔴 Error loading {prefix}: {e}")
    else:
        print(f" ⚠️ Missing files for {prefix}")

print("--- Synapse OS: Booting Local Vision Engine (PaddleOCR) ---")
try:
    import logging
    logging.getLogger("ppocr").setLevel(logging.ERROR) 
    
    #ocr_engine = PaddleOCR(use_textline_orientation=True, lang='en')
    #print(" 🟢 Loaded: PaddleOCR Local Engine")
except Exception as e:
    print(f" 🔴 Error loading PaddleOCR: {e}")

FRONTEND_TO_BACKEND_MAP = {
    'glucose': ['Glucose', '50931', '50809'], 'cholesterol': ['Cholesterol', '50907'], 
    'triglycerides': ['Triglycerides', '51000', '50915'], 'creatinine': ['Creatinine', '50912'], 
    'bun': ['BUN', '51006'], 'wbc_count': ['WBC Count', 'WBC', '51301', '51300', '51516'],
    'rbc': ['RBC', 'Red Blood Cells', '51279'], 'hemoglobin': ['Hemoglobin', '51222', '50811'], 
    'platelets': ['Platelets', 'Platelet Count', '51265'], 'sgpt': ['SGPT', '50861'], 
    'sgot': ['SGOT', '50878'], 'bilirubin': ['Bilirubin, Total', 'Bilirubin', '50885'], 
    'albumin': ['Albumin', '50862'], 'alp': ['ALP', '50863'], 
    'sodium': ['Sodium', '50983'], 'potassium': ['Potassium', '50971'],
    'calcium': ['Calcium, Total', 'Calcium', '50893'], 'magnesium': ['Magnesium', '50960'], 
    'phosphorus': ['Phosphorus', 'Phosphate', '50970'], 'chloride': ['Chloride', '50902'], 
    'pt': ['PT', '51274'], 'aptt': ['APTT', 'PTT', '51275'], 'inr': ['INR(PT)', 'INR', '51237'],
    'lactate': ['Lactate', '50813'], 'crp': ['CRP', '50889'], 'troponin': ['Troponin_T', '51003'], 
    'ck_mb': ['CK_MB', '50911'], 'bnp': ['BNP', '50963'], 'po2': ['pO2', '50821'], 
    'pco2': ['pCO2', '50818'], 'ph': ['pH', '50820'], 'base_excess': ['Base Excess', '50802'], 
    'd_dimer': ['D_Dimer', '51196'], 'hba1c': ['% Hemoglobin A1c', 'HbA1c', '50852'],
    'heart_rate': ['Heart Rate', '220045', '211'], 'bp_systolic': ['Systolic BP', '220050'], 
    'bp_diastolic': ['Diastolic BP', '220051'], 'temperature': ['Temperature', '223762']
}

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No JSON data received"}), 400
            
        raw_vitals = data.get('vitals', {})
        location = data.get('location', 'Unknown Location')
        patient_id = data.get('patient_id', 'Unknown-ID')
        
        ip = request.remote_addr or "127.0.0.1"
        id_prefix = "BD" if "Bangladesh" in location else "INT"
        guest_id = f"{id_prefix}-GUEST-{np.random.randint(1000, 9999)}"

        valid_inputs = [v for v in raw_vitals.values() if str(v).strip() != ""]
        input_count = len(valid_inputs)

        processed_vitals = {}
        for key, val in raw_vitals.items():
            val_str = str(val).strip()
            if val_str != "":
                try:
                    processed_vitals[key] = float(val_str)
                except ValueError:
                    pass

        emergency_alerts = []
        if 'sao2' in processed_vitals and processed_vitals['sao2'] < 90:
            emergency_alerts.append(f"CRITICAL OXYGEN LEVEL ({processed_vitals['oxygen']}%) - Immediate Respiratory Support Required!")
        if 'heart_rate' in processed_vitals and processed_vitals['heart_rate'] > 120:
            emergency_alerts.append(f"SEVERE TACHYCARDIA ({processed_vitals['heart_rate']} BPM) - High Risk of Cardiac Event!")
        if 'bp_systolic' in processed_vitals and processed_vitals['bp_systolic'] > 180:
            emergency_alerts.append(f"HYPERTENSIVE CRISIS (BP {processed_vitals['bp_systolic']} mmHg) - Immediate Attention Needed!")
        if 'temperature' in processed_vitals and processed_vitals['temperature'] > 40:
            emergency_alerts.append(f"EXTREME FEVER ({processed_vitals['temperature']}°C) - Potential Sepsis or Organ Damage Risk!")

        all_results = []

        for prefix, brain in synapse_brain.items():
            model = brain["model"]
            encoder = brain["encoder"]
            features = brain["features"]
            
            full_data = {feat: 0.0 for feat in features}
            
            for front_key, val in processed_vitals.items():
                if front_key in FRONTEND_TO_BACKEND_MAP:
                    possible_names = FRONTEND_TO_BACKEND_MAP[front_key]
                    for name in possible_names:
                        if name in features:
                            full_data[name] = float(val)
                            break
                        elif str(name).isdigit() and int(name) in features:
                            full_data[int(name)] = float(val)
                            break
        
            input_df = pd.DataFrame([full_data])[features]

            try:
                probabilities = model.predict_proba(input_df)[0]
                pred_index = np.argmax(probabilities)
                highest_prob = float(probabilities[pred_index].item()) 
                disease_name = str(encoder.inverse_transform([pred_index])[0])

                if input_count == 1:
                    highest_prob *= 0.30
                elif input_count == 2:
                    highest_prob *= 0.60
                elif input_count == 3:
                    highest_prob *= 0.85

                if highest_prob > 0.50 and disease_name != 'Normal':
                    expert_name = prefix.replace('expert_', '').upper() + " EXPERT"
                    all_results.append({
                        "expert_panel": expert_name,
                        "disease": disease_name, 
                        "probability": round(highest_prob * 100, 2), 
                        "key": disease_name.upper().replace(' ', '_')
                    })
            except Exception as e:
                pass

        if not all_results:
            if len(emergency_alerts) > 0:
                database.save_log(patient_id, guest_id, ip, location, "Clinical Emergency", "95%", [])
                return jsonify({
                    "status": "success", 
                    "probability": "95%", 
                    "disease": "Critical Vital Anomaly", 
                    "expert_system": "EMERGENCY OVERRIDE",
                    "all_detailed_risks": [],
                    "secondary_alerts": [], 
                    "unique_id": guest_id,
                    "clinical_emergencies": emergency_alerts
                })
            else:
                database.save_log(patient_id, guest_id, ip, location, "Normal / Safe", "1%", [])
                return jsonify({
                    "status": "success", 
                    "probability": "1%", 
                    "disease": "No Severe Disease Detected", 
                    "expert_system": "GENERAL WELLNESS",
                    "all_detailed_risks": [],
                    "secondary_alerts": [], 
                    "unique_id": guest_id,
                    "clinical_emergencies": emergency_alerts
                })
            

        # ==============================================================
        # 🧠 THE CLINICAL OVERRIDE ENGINE (HARDCODED MEDICAL RULES)
        # ==============================================================
        
        for result in all_results:
            dis = result['disease'].lower()
            
            # Rule 1: DKA (Severe Diabetes)
            if 'diabetes' in dis:
                if processed_vitals.get('glucose', 0) > 400 and processed_vitals.get('ph', 14.0) < 7.3:
                    result['probability'] = 99.5  
                    result['disease'] = "Diabetic Ketoacidosis (DKA)"
                    
            # Rule 2: Severe Renal Failure
            if 'renal' in dis or 'kidney' in dis:
                if processed_vitals.get('creatinine', 0) > 4.0:
                    result['probability'] = max(result['probability'], 98.0)
                    
            # Rule 3: Myocardial Infarction (হার্ট অ্যাটাক)
            if 'myocardial' in dis or 'heart attack' in dis or 'cardiac' in dis:
                if processed_vitals.get('troponin', 0) > 0.5 or processed_vitals.get('ck_mb', 0) > 50:
                    result['probability'] = max(result['probability'], 99.0)
                    
            # Rule 4: Severe Respiratory Failure
            if 'respiratory' in dis or 'pneumonia' in dis:
                if processed_vitals.get('sao2', 100) < 85:
                    result['probability'] = max(result['probability'], 97.0)

            # Rule 5: Prevent False Sepsis (THE FIX)
            if 'sepsis' in dis:
                has_fever = processed_vitals.get('temperature', 37) > 38.0
                has_high_wbc = processed_vitals.get('wbc_count', 8000) > 12000
                has_low_bp = processed_vitals.get('bp_systolic', 120) < 90
                
                # যদি সেপসিসের কোনো শক্তিশালী লক্ষণ না থাকে, প্রবাবিলিটি অনেক কমিয়ে দাও
                if not (has_fever or has_high_wbc or has_low_bp):
                    result['probability'] = min(result['probability'], 20.0)

        # Safety Net: যদি এআই কোনো কারণে ডায়াবেটিস ধরতেই না পারে, কিন্তু গ্লুকোজ মারাত্মক লেভেলে থাকে!
        has_diabetes = any('diabet' in r['disease'].lower() for r in all_results)
        if not has_diabetes and processed_vitals.get('glucose', 0) > 450:
             all_results.append({
                 "expert_panel": "META EXPERT (CLINICAL OVERRIDE)",
                 "disease": "Severe Hyperglycemia / Suspected DKA", 
                 "probability": 99.5, 
                 "key": "SEVERE_HYPERGLYCEMIA"
             })

        # ==============================================================

        all_results.sort(key=lambda x: x['probability'], reverse=True)
        main_alert = all_results[0]
        
        alerts = [r for r in all_results if r['disease'] != main_alert['disease']]
        alerts = alerts[:3] 

        database.save_log(patient_id, guest_id, ip, location, main_alert['disease'], f"{main_alert['probability']}%", alerts)

        return jsonify({
            "status": "success", 
            "probability": f"{main_alert['probability']}%", 
            "disease": main_alert['disease'], 
            "expert_system": main_alert['expert_panel'],
            "all_detailed_risks": all_results,
            "secondary_alerts": alerts, 
            "unique_id": guest_id,
            "clinical_emergencies": emergency_alerts 
        })

    except Exception as e:
        print(f"Prediction Error: {traceback.format_exc()}")
        return jsonify({"status": "error", "message": "Internal Server Error."}), 500

@app.route('/smart_vision_scan', methods=['POST'])
def smart_vision_scan():
    try:
        data = request.get_json()
        image_base64 = data.get('image_data')

        if not image_base64:
            return jsonify({"status": "error", "message": "No image data received"}), 400

        image_bytes = base64.b64decode(image_base64.split(',')[1])
        
        print("Trying Local Engine (PaddleOCR)...")
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            result = ocr_engine.ocr(img, cls=True)
            paddle_text = " ".join([line[1][0].lower() for line in result[0]]) if result[0] else ""
            
            extracted_local = {}
            patterns = {
                'heart_rate': r'(?:heart rate|pulse|hr)[^\d]*(\d{2,3})',
                'bp_systolic': r'(?:bp|blood pressure|systolic)[^\d]*(\d{2,3})',
                'temperature': r'(?:temp|temperature)[^\d]*(\d{2}\.?\d*)',
                'glucose': r'(?:glucose|sugar|fbs)[^\d]*(\d{2,4})',
                'wbc_count': r'(?:wbc)[^\d]*(\d{3,6})',
                'hemoglobin': r'(?:hemoglobin|hb)[^\d]*(\d{1,2}\.?\d*)'
            }
            
            for key, pattern in patterns.items():
                match = re.search(pattern, paddle_text)
                if match:
                    extracted_local[key] = float(match.group(1))
            
            if len(extracted_local) >= 3:
                print(f"Local Engine Success! Found {len(extracted_local)} params. Sending fast response.")
                return jsonify({"status": "success", "source": "PaddleOCR (Local)", "data": extracted_local})
            else:
                print("Local Engine found too little data. Handwriting might be messy.")
                
        except Exception as local_err:
            print(f"Local Engine Error: {local_err}")

        print("Routing to Gemini Vision AI for Deep Scan...")
        
        prompt = (
            "You are an expert clinical data extractor. Analyze this medical lab report or prescription. "
            "Extract the core clinical parameters even if handwriting is messy. "
            "Return ONLY a strictly formatted JSON object. "
            "Use ONLY these keys: heart_rate, respiratory_rate, bp_systolic, bp_diastolic, temperature, "
            "sao2, wbc_count, rbc, hemoglobin, hematocrit, platelets, glucose, creatinine, bun, sgpt, sgot. "
            "Convert all values to numbers."
        )

        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg')
            ]
        )

        response_text = response.text.replace('```json', '').replace('```', '').strip()
        extracted_gemini = json.loads(response_text)

        print(f"Gemini Vision Success! Found {len(extracted_gemini)} params.")
        return jsonify({"status": "success", "source": "Gemini AI (Cloud)", "data": extracted_gemini})

    except Exception as e:
        print(f"Hybrid OCR Error: {e}")
        return jsonify({"status": "error", "message": "Both Local and Cloud Vision Engines failed."}), 500

@app.route('/get_all_logs', methods=['GET'])
def get_logs():
    try:
        logs = database.get_all_logs()
        formatted_logs = []
        for log in logs:
            formatted_logs.append({
                "id": log[0], "patient_id": log[1], "guest_id": log[2],
                "ip": log[3], "location": log[4], "disease": log[5],
                "risk": log[6], "secondary": log[7], "time": log[8]
            })
        return jsonify({"status": "success", "logs": formatted_logs})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/generate_guideline', methods=['POST'])
def generate_guideline():
    try:
        data = request.get_json()
        disease_name = data.get('disease', '')
        vitals = data.get('vitals', {})
        age = data.get('age', '')      
        gender = data.get('gender', '') 
        location = data.get('location', 'Dhaka, Bangladesh')

        print(f"--- Requesting Independent Assessment for Patient in {location} ---")

        # রোগ অনুযায়ী সঠিক ক্যাটাগরির ডাক্তার সিলেক্ট করা
        doc_category = "general"
        dis_lower = disease_name.lower()
        if any(k in dis_lower for k in ['heart', 'cardio', 'stroke', 'hypertension', 'fibrillation', 'myocardial']): 
            doc_category = "cardio"
        elif any(k in dis_lower for k in ['kidney', 'renal', 'uti']): 
            doc_category = "renal"
        elif any(k in dis_lower for k in ['diabet', 'thyroid', 'gout', 'cushing', 'acidosis', 'hyperlipidemia']): 
            doc_category = "meta"
        elif any(k in dis_lower for k in ['liver', 'hepatic', 'pancreatitis', 'cirrhosis']): 
            doc_category = "hepatic"
        elif any(k in dis_lower for k in ['resp', 'pneumonia', 'asthma', 'copd']): 
            doc_category = "resp"

        suggested_doctors = LOCAL_DOCTORS_DB.get(doc_category, LOCAL_DOCTORS_DB["general"])

        prompt = (
            f"বয়স: {age}, লিঙ্গ: {gender}, বর্তমান অবস্থান: {location}\n"
            f"ল্যাব রিপোর্ট ও ভাইটালস: {vitals}\n\n"
            f"উপরোক্ত ডেটার ওপর ভিত্তি করে একজন বিশেষজ্ঞ চিকিৎসকের মতো সরাসরি ক্লিনিক্যাল অ্যাসেসমেন্ট এবং গাইডলাইন দাও। '{disease_name}' এর ঝুঁকির বিষয়টিও বিবেচনায় রাখবে।\n\n"
            f"শর্তাবলি (অবশ্যই মানতে হবে):\n"
            f"১. কোনোভাবেই উল্লেখ করা যাবে না যে তুমি একজন এআই।\n"
            f"২. কোনো ধরনের ভূমিকা বা বিদায়ী কথা লেখা যাবে না। সরাসরি মূল কথায় আসবে।\n"
            f"৩. গুরুত্বপূর্ণ পয়েন্টগুলো সুন্দর করে বুলেট পয়েন্ট (*) এবং সাব-হেডিং বোল্ড (**) করে সাজিয়ে লিখবে।\n"
            f"৪. রোগীর চিকিৎসার জন্য নিচে দেওয়া চিকিৎসকদের তালিকা হুবহু ব্যবহার করে 'চিকিৎসকের সিরিয়াল' অংশে দেখাবে। নিজে থেকে কোনো ডাক্তারের নাম বানাবে না:\n"
            f"{suggested_doctors}\n"
            f"৫. একদম শেষে নতুন লাইনে লিখতে হবে: 'Generated by Synapse-OS'\n\n"
            f"লেখাটি শুধু নিচের ৩টি ভাগে ভাগ করে দাও:\n\n"
            f"**অংশ ১: ক্লিনিক্যাল অ্যাসেসমেন্ট**\n"
            f"**অংশ ২: গাইডলাইন**\n"
            f"**অংশ ৩: চিকিৎসকের সিরিয়াল**"
        )

        try:
            # সরাসরি সবচেয়ে ভালো মডেলকে (gemini-1.5-pro) কল করা হচ্ছে
            response = client.models.generate_content(model="gemini-1.5-pro", contents=prompt)
            clean_text = response.text.replace('`', '')
        except Exception as e1:
            print(f"Primary AI Failed: {e1}. Trying Backup...")
            # ব্যাকআপ মডেল
            response = client.models.generate_content(model="gemini-1.5-flash", contents=prompt)
            clean_text = response.text.replace('`', '')
            
        if "Generated by Synapse-OS" not in clean_text:
             clean_text = clean_text.strip() + "\n\nGenerated by Synapse-OS"
             
        return jsonify({"status": "success", "guideline": clean_text})

    except Exception as e:
        print(f"Critical Backend Error: {e}")
        return jsonify({"status": "error", "message": "Failed to connect to Neural Engine."}), 500

if __name__ == '__main__':
    print("Synapse API is Live on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
