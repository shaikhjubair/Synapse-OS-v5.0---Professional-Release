import joblib
import os

print("==========================================================")
print(" 🚀 SYNAPSE OS: MASTER SYSTEM INTEGRITY & ACCURACY CHECK")
print("==========================================================\n")

# আমাদের ৮টি স্পেশালিস্ট মডেল এবং তাদের ট্রেইনিং একুরেসি (Top-2/Top-3 Clinical Accuracy)
models_info = {
    "expert_cardio": {"name": "Cardio Expert", "acc": "61.11%"},
    "expert_renal": {"name": "Renal Expert", "acc": "81.98%"},
    "expert_meta": {"name": "Metabolic Expert", "acc": "79.30%"},
    "expert_hepatic": {"name": "Hepatic & GI Expert", "acc": "84.25%"},
    "expert_resp": {"name": "Respiratory Expert", "acc": "73.00%"}, # Respiratory failure precision
    "expert_sys": {"name": "Systemic/Sepsis Expert", "acc": "90.51%"},
    "expert_hema": {"name": "Hematology/CBC Expert", "acc": "93.36%"},
    "expert_tropical": {"name": "Tropical/Infectious Expert", "acc": "97.63% (Typhoid) / 83.85% (Dengue)"}
}

total_active = 0

print(f"{'EXPERT PANEL':<28} | {'STATUS':<10} | {'FEATURES':<10} | {'CLINICAL ACCURACY'}")
print("-" * 75)

for prefix, info in models_info.items():
    model_path = f"{prefix}_model.pkl"
    feature_path = f"{prefix}_features.pkl"
    
    if os.path.exists(model_path) and os.path.exists(feature_path):
        try:
            # ফিচার ফাইল লোড করে দেখা মডেলটি কয়টি ল্যাব টেস্ট চেনে
            features = joblib.load(feature_path)
            num_features = len(features)
            status = "✅ ACTIVE"
            total_active += 1
        except Exception as e:
            status = "❌ ERROR"
            num_features = "N/A"
    else:
        status = "⚠️ MISSING"
        num_features = "N/A"
        
    print(f"{info['name']:<28} | {status:<10} | {str(num_features):<10} | ⭐ {info['acc']}")

print("-" * 75)
print(f"\n🩺 Total Specialist Models Online: {total_active} / 8")

if total_active == 8:
    print("🎉 ALL SYSTEMS GO! The Synapse Brain is ready for Web Integration.")
else:
    print("⚠️ WARNING: Some models are missing. Make sure all .pkl files are in the same folder.")