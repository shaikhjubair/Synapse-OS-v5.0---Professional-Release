import sqlite3
import json
from datetime import datetime

# ১. ডাটাবেস এবং টেবিল তৈরি করা
def init_db():
    conn = sqlite3.connect('synapse.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            unique_guest_id TEXT,
            ip_address TEXT,
            location TEXT,
            primary_disease TEXT,
            primary_risk TEXT,
            secondary_alerts TEXT,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

# ২. রিপোর্টে আসা সব ডেটা সেভ করার ফাংশন
def save_log(patient_id, guest_id, ip, location, disease, risk, secondary_alerts):
    conn = sqlite3.connect('synapse.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO audit_logs (patient_id, unique_guest_id, ip_address, location, primary_disease, primary_risk, secondary_alerts, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        patient_id, guest_id, ip, location, 
        disease, risk, json.dumps(secondary_alerts), # লিস্টকে টেক্সট হিসেবে সেভ করা
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    conn.commit()
    conn.close()

# ৩. সব লগস দেখার ফাংশন (Audit Logs এর জন্য)
def get_all_logs():
    conn = sqlite3.connect('synapse.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM audit_logs ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()
    return rows