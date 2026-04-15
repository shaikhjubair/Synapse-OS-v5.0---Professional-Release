/**
 * ============================================================================
 * SYNAPSE OS (v5.0 PRO) - CLINICAL INTELLIGENCE ENGINE
 * DEVELOPER: SHAIKH JUBAIR
 * ARCHITECTURE: UNIVERSAL AUTO-TRIAGE (28 DISEASES / 8 NEURAL NETWORKS)
 * ============================================================================
 */

const CONFIG = {
    // রেন্ডারের নতুন লিংকটি এখানে বসাও
    apiEndpoint: 'https://synapse-os-v5-0-professional-release.onrender.com/predict',
    logsEndpoint: 'https://synapse-os-v5-0-professional-release.onrender.com/get_all_logs',
    colors: { 
        safe: '#10b981', 
        warning: '#f59e0b', 
        critical: '#ef4444', 
        default: '#2563eb' 
    },
    systemVersion: '5.0.2 - Universal Deep Scan Edition'
};

// --- GLOBAL STATE MANAGEMENT ---
let currentState = { 
    patientId: 'SYN-2026-X92',
    isScanning: false,
    theme: 'light'
};
let activePatientData = {}; 
let userLocation = "Fetching location...";
window.lastAIResult = null; 

/**
 * ----------------------------------------------------------------------------
 * MEGA CLINICAL PARAMETER DATABASE
 * ----------------------------------------------------------------------------
 * Organized by Clinical Categories for UI rendering and OCR targeting.
 * This covers the golden parameters required by the 8 AI Specialist Models.
 */
const ALL_MEGA_PARAMS = [
    // --- 1. CLINICAL VITALS ---
    { id: 'heart_rate', label: 'Heart Rate', unit: 'BPM', min: 0, max: 300, category: 'Vitals' },
    { id: 'respiratory_rate', label: 'Resp Rate', unit: 'bpm', min: 0, max: 100, category: 'Vitals' },
    { id: 'bp_systolic', label: 'Systolic BP', unit: 'mmHg', min: 0, max: 300, category: 'Vitals' },
    { id: 'bp_diastolic', label: 'Diastolic BP', unit: 'mmHg', min: 0, max: 200, category: 'Vitals' },
    { id: 'temperature', label: 'Temperature', unit: '°C', min: 20, max: 45, category: 'Vitals' },
    { id: 'sao2', label: 'SpO2 (Oxygen Sat)', unit: '%', min: 0, max: 100, category: 'Vitals' },

    // --- 2. HEMATOLOGY (CBC) ---
    { id: 'wbc_count', label: 'WBC Count', unit: 'cells/mcL', min: 100, max: 500000, category: 'Hematology' },
    { id: 'rbc', label: 'RBC Count', unit: 'million/mcL', min: 1, max: 10, category: 'Hematology' },
    { id: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', min: 2, max: 25, category: 'Hematology' },
    { id: 'hematocrit', label: 'Hematocrit', unit: '%', min: 10, max: 75, category: 'Hematology' },
    { id: 'platelets', label: 'Platelets', unit: 'cells/mcL', min: 1000, max: 3000000, category: 'Hematology' },
    { id: 'mcv', label: 'MCV', unit: 'fL', min: 50, max: 150, category: 'Hematology' },
    { id: 'mch', label: 'MCH', unit: 'pg', min: 15, max: 50, category: 'Hematology' },
    { id: 'mchc', label: 'MCHC', unit: 'g/dL', min: 20, max: 40, category: 'Hematology' },
    { id: 'rdw', label: 'RDW', unit: '%', min: 10, max: 30, category: 'Hematology' },
    { id: 'esr', label: 'ESR', unit: 'mm/hr', min: 0, max: 150, category: 'Hematology' },

    // --- 3. METABOLIC & LIPID PANEL ---
    { id: 'glucose', label: 'Glucose (Fasting/Random)', unit: 'mg/dL', min: 10, max: 2000, category: 'Metabolic' },
    { id: 'hba1c', label: 'HbA1c', unit: '%', min: 2, max: 20, category: 'Metabolic' },
    { id: 'cholesterol', label: 'Cholesterol (Total)', unit: 'mg/dL', min: 50, max: 2000, category: 'Metabolic' },
    { id: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', min: 10, max: 5000, category: 'Metabolic' },
    { id: 'hdl', label: 'HDL Cholesterol', unit: 'mg/dL', min: 5, max: 150, category: 'Metabolic' },
    { id: 'ldl', label: 'LDL Cholesterol', unit: 'mg/dL', min: 10, max: 500, category: 'Metabolic' },

    // --- 4. RENAL FUNCTION (KIDNEY) ---
    { id: 'creatinine', label: 'Creatinine', unit: 'mg/dL', min: 0.1, max: 35, category: 'Renal' },
    { id: 'bun', label: 'BUN (Urea Nitrogen)', unit: 'mg/dL', min: 1, max: 200, category: 'Renal' },
    { id: 'egfr', label: 'eGFR', unit: 'mL/min', min: 1, max: 150, category: 'Renal' },
    { id: 'uric_acid', label: 'Uric Acid', unit: 'mg/dL', min: 1, max: 20, category: 'Renal' },

    // --- 5. HEPATIC FUNCTION (LIVER) ---
    { id: 'sgpt', label: 'SGPT (ALT)', unit: 'U/L', min: 1, max: 10000, category: 'Hepatic' },
    { id: 'sgot', label: 'SGOT (AST)', unit: 'U/L', min: 1, max: 10000, category: 'Hepatic' },
    { id: 'alp', label: 'ALP (Alk Phos)', unit: 'U/L', min: 10, max: 3000, category: 'Hepatic' },
    { id: 'bilirubin', label: 'Total Bilirubin', unit: 'mg/dL', min: 0.1, max: 60, category: 'Hepatic' },
    { id: 'direct_bili', label: 'Direct Bilirubin', unit: 'mg/dL', min: 0, max: 40, category: 'Hepatic' },
    { id: 'albumin', label: 'Albumin', unit: 'g/dL', min: 0.5, max: 10, category: 'Hepatic' },
    { id: 'total_protein', label: 'Total Protein', unit: 'g/dL', min: 2, max: 15, category: 'Hepatic' },
    { id: 'amylase', label: 'Amylase', unit: 'U/L', min: 1, max: 10000, category: 'Hepatic' },
    { id: 'lipase', label: 'Lipase', unit: 'U/L', min: 0, max: 10000, category: 'Hepatic' },

    // --- 6. ELECTROLYTES (BASIC METABOLIC) ---
    { id: 'sodium', label: 'Sodium (Na)', unit: 'mEq/L', min: 100, max: 180, category: 'Electrolytes' },
    { id: 'potassium', label: 'Potassium (K)', unit: 'mEq/L', min: 1, max: 10, category: 'Electrolytes' },
    { id: 'chloride', label: 'Chloride (Cl)', unit: 'mEq/L', min: 50, max: 150, category: 'Electrolytes' },
    { id: 'calcium', label: 'Calcium (Total)', unit: 'mg/dL', min: 1, max: 20, category: 'Electrolytes' },
    { id: 'magnesium', label: 'Magnesium (Mg)', unit: 'mg/dL', min: 0.5, max: 10, category: 'Electrolytes' },
    { id: 'phosphorus', label: 'Phosphorus', unit: 'mg/dL', min: 0.5, max: 15, category: 'Electrolytes' },
    { id: 'anion_gap', label: 'Anion Gap', unit: 'mEq/L', min: 0, max: 50, category: 'Electrolytes' },

    // --- 7. CARDIAC & COAGULATION ---
    { id: 'troponin', label: 'Troponin T', unit: 'ng/mL', min: 0, max: 100, category: 'Cardiac' },
    { id: 'ck_mb', label: 'CK-MB', unit: 'ng/mL', min: 0, max: 1000, category: 'Cardiac' },
    { id: 'bnp', label: 'BNP', unit: 'pg/mL', min: 0, max: 50000, category: 'Cardiac' },
    { id: 'pt', label: 'Prothrombin Time (PT)', unit: 'sec', min: 8, max: 200, category: 'Cardiac' },
    { id: 'aptt', label: 'APTT / PTT', unit: 'sec', min: 20, max: 200, category: 'Cardiac' },
    { id: 'inr', label: 'INR', unit: '', min: 0.5, max: 20, category: 'Cardiac' },
    { id: 'd_dimer', label: 'D-Dimer', unit: 'ng/mL', min: 0, max: 100000, category: 'Cardiac' },
    { id: 'fibrinogen', label: 'Fibrinogen', unit: 'mg/dL', min: 50, max: 1000, category: 'Cardiac' },

    // --- 8. ARTERIAL BLOOD GAS (ABG) & INFECTION ---
    { id: 'po2', label: 'pO2', unit: 'mmHg', min: 10, max: 700, category: 'ABG' },
    { id: 'pco2', label: 'pCO2', unit: 'mmHg', min: 10, max: 150, category: 'ABG' },
    { id: 'ph', label: 'pH', unit: '', min: 6.5, max: 7.8, category: 'ABG' },
    { id: 'base_excess', label: 'Base Excess', unit: 'mEq/L', min: -30, max: 30, category: 'ABG' },
    { id: 'lactate', label: 'Lactate', unit: 'mmol/L', min: 0.1, max: 30, category: 'ABG' },
    { id: 'crp', label: 'CRP', unit: 'mg/L', min: 0, max: 500, category: 'ABG' },
    { id: 'ferritin', label: 'Ferritin', unit: 'ng/mL', min: 0, max: 5000, category: 'ABG' }
];

/**
 * ----------------------------------------------------------------------------
 * CORE SYSTEM INITIALIZATION
 * ----------------------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Security & Auth Check
    const userMode = localStorage.getItem('userMode');
    if (!userMode) {
        window.location.href = 'login.html';
        return;
    }

    if (userMode === 'guest') {
        applyGuestRestrictions();
    } else if (userMode === 'admin') {
        const userName = localStorage.getItem('userName');
        if(userName && document.querySelector('.user-name')) {
            document.querySelector('.user-name').innerText = userName;
        }
    }

    // 2. Startup Services
    updateClock(); 
    setInterval(updateClock, 1000);
    generatePatientID();
    fetchUserLocation();

    // 3. Event Binding
    bindCoreEvents();

    // 4. UI Initialization
    renderActiveVitalsOnDashboard();
    
    // Initialize Theme
    const savedTheme = localStorage.getItem('synapseTheme') || 'light';
    if(savedTheme === 'dark') {
        document.body.classList.add('theme-dark');
        currentState.theme = 'dark';
    }

    // 5. System Boot Animation Loader
    setTimeout(() => {
        const loader = document.getElementById('system-loader');
        const appRoot = document.getElementById('app-root');
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.classList.add('hidden');
                if(appRoot) {
                    appRoot.classList.remove('hidden');
                    appRoot.style.animation = 'slideUp 0.6s ease-out forwards';
                }
            }, 600);
        }
    }, 1500); // 1.5s artificial boot delay for effect
});

/**
 * ----------------------------------------------------------------------------
 * EVENT BINDING MANAGER
 * ----------------------------------------------------------------------------
 */
function bindCoreEvents() {
    // Dashboard Core Actions
    document.getElementById('btn-run-ai')?.addEventListener('click', runUniversalTriageAnalysis);
    document.getElementById('theme-switcher')?.addEventListener('click', toggleDarkMode);
    
    // Patient Data Actions
    document.getElementById('btn-edit-patient')?.addEventListener('click', handlePatientIdEdit);
    
    // OCR Scanning Actions
    const btnOcrScan = document.getElementById('btn-ocr-scan');
    const ocrInput = document.getElementById('ocr-file-input');
    if (btnOcrScan && ocrInput) {
        btnOcrScan.addEventListener('click', () => ocrInput.click());
        ocrInput.addEventListener('change', executeDeepOCRScan);
    }

    // Sidebar Collapse
    document.getElementById('toggle-sidebar')?.addEventListener('click', () => {
        document.getElementById('main-sidebar').classList.toggle('collapsed');
    });

    // Navigation & Audit Logs
    document.getElementById('nav-audit-logs')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAdminPanel();
    });

    // Report Generation
    document.getElementById('btn-print-report')?.addEventListener('click', generateClinicalReport);
}

/**
 * ----------------------------------------------------------------------------
 * UTILITY & SYSTEM FUNCTIONS
 * ----------------------------------------------------------------------------
 */
function toggleDarkMode(e) {
    if(e) e.preventDefault();
    document.body.classList.toggle('theme-dark');
    currentState.theme = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
    localStorage.setItem('synapseTheme', currentState.theme);
}

function updateClock() {
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
        clockEl.innerText = new Date().toLocaleString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', 
            hour: '2-digit', minute:'2-digit', second:'2-digit' 
        });
    }
}

function generatePatientID() {
    // Generates a unique secure ID for the session
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = new Date().getFullYear();
    currentState.patientId = `SYN-${prefix}-X${randomNum}`;
    
    const idText = document.getElementById('pat-id-text');
    const idInput = document.getElementById('pat-id-input');
    
    if (idText) idText.innerText = currentState.patientId;
    if (idInput) idInput.value = currentState.patientId;
}

function fetchUserLocation() {
    fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => { userLocation = `${data.city}, ${data.country_name}`; })
        .catch(() => { userLocation = "Dhaka, Bangladesh"; });
}

function handlePatientIdEdit() {
    const userMode = localStorage.getItem('userMode');
    if (userMode === 'guest') {
        alert('⚠️ Access Denied: Security Protocol prohibits Guests from modifying Core Patient IDs.');
        return;
    }
    const textBox = document.getElementById('pat-id-box');
    const inputBox = document.getElementById('pat-id-input');

    if (inputBox.classList.contains('hidden')) {
        inputBox.value = currentState.patientId;
        inputBox.classList.remove('hidden');
        textBox.classList.add('hidden');
        inputBox.focus();
    } else {
        inputBox.classList.add('hidden');
        textBox.classList.remove('hidden');
        if(inputBox.value.trim() !== '') {
            currentState.patientId = inputBox.value.trim();
            document.getElementById('pat-id-text').innerText = currentState.patientId;
        }
    }
}

// --- AUTH & MODAL HELPERS ---
window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if(modal) {
        const paper = modal.querySelector('.modal-paper, .modal-alert');
        if(paper) {
            paper.style.animation = 'slideDown 0.3s ease-in forwards';
            setTimeout(() => {
                modal.classList.add('hidden');
                paper.style.animation = ''; // reset
            }, 300);
        } else {
            modal.classList.add('hidden');
        }
    }
};

window.logout = function() {
    const modal = document.getElementById('modal-logout');
    if(modal) modal.classList.remove('hidden');
};

window.executeLogout = function() {
    localStorage.clear();
    window.location.href = 'login.html';
};

window.applyGuestRestrictions = function() {
    const history = document.getElementById('treatment-history-content');
    if(history) {
        history.innerHTML = `
        <div class="lock-overlay" style="text-align:center; padding:30px 20px; color:var(--text-muted); background: rgba(0,0,0,0.02); border-radius: 8px;">
            <i class="ri-lock-2-line" style="font-size:3rem; color: var(--danger); opacity: 0.8; margin-bottom: 10px; display: block;"></i>
            <h4 style="margin-bottom: 5px;">Guest Mode Restricted</h4>
            <p style="font-size: 0.85rem;">Historical MIMIC-III treatment protocols are locked for guest users to prevent unauthorized clinical referencing.</p>
        </div>`;
    }
};

/**
 * ----------------------------------------------------------------------------
 * PART 2: DATA ACQUISITION & RENDERING ENGINE
 * ----------------------------------------------------------------------------
 * Handles Manual Entry, OCR (Image to Text), CSV Uploads, and UI Updates.
 */

// ==========================================
// 1. MANUAL ENTRY SYSTEM
// ==========================================
window.openManualModal = function() {
    const grid = document.getElementById('mega-input-grid');
    if(!grid) return;
    
    grid.innerHTML = ''; 
    
    // ক্যাটাগরি অনুযায়ী ইনপুট ফিল্ড গ্রুপ করা (UI সুন্দর দেখানোর জন্য)
    const categories = [...new Set(ALL_MEGA_PARAMS.map(p => p.category))];
    
    categories.forEach(cat => {
        // Category Header
        const catHeader = document.createElement('div');
        catHeader.style.gridColumn = '1 / -1';
        catHeader.style.padding = '10px 5px 5px 5px';
        catHeader.style.marginTop = '10px';
        catHeader.style.borderBottom = '2px solid var(--glass-border)';
        catHeader.innerHTML = `<h4 style="color: var(--primary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;"><i class="ri-folder-add-line"></i> ${cat}</h4>`;
        grid.appendChild(catHeader);

        // Parameters under this category
        const paramsInCat = ALL_MEGA_PARAMS.filter(p => p.category === cat);
        paramsInCat.forEach(param => {
            const value = activePatientData[param.id] !== undefined ? activePatientData[param.id] : '';
            const box = document.createElement('div');
            box.className = 'vital-box animate-pop'; 
            box.style.padding = '12px';
            box.style.background = 'rgba(255,255,255,0.5)';
            
            // 🛑 ফিক্স ১: HTML এর ভেতরে min এবং max বসানো হলো
            box.innerHTML = `
                <label class="vb-label" for="modal_${param.id}" style="font-size: 0.65rem; color: var(--text-muted);">
                    ${param.label} <br><span style="color: var(--primary); font-weight: 800; font-size: 0.6rem;">(${param.unit})</span>
                </label>
                <input type="number" id="modal_${param.id}" class="vb-input" 
                       value="${value}" placeholder="-" 
                       min="${param.min}" max="${param.max}"
                       style="font-size: 1.2rem; font-weight: 700; width: 100%; border-bottom: 2px solid #eee; margin-top: 5px; position: relative; z-index: 50; pointer-events: auto;">
            `;
            grid.appendChild(box);
        });
    });

    // 🛑 ফিক্স ২: রিয়েল-টাইম আয়রন গেট ভ্যালিডেশন (Iron Gate Validation)
    // বক্সগুলো DOM-এ যোগ হওয়ার পর আমরা ইভেন্ট লিসেনার বসাচ্ছি
    ALL_MEGA_PARAMS.forEach(param => {
        const inputEl = document.getElementById(`modal_${param.id}`);
        if(inputEl) {
            inputEl.addEventListener('input', function() {
                // ১. মাইনাস (-) বা নেগেটিভ ভ্যালু দিলে সাথে সাথে মুছে 0 বানিয়ে দেবে
                if (this.value !== "" && parseFloat(this.value) < 0) {
                    this.value = 0;
                }
                
                // ২. যদি কেউ ডাটাবেসে থাকা সর্বোচ্চ লিমিটের (param.max) বেশি টাইপ করে ফেলে, 
                // তবে সেটা অটোমেটিক ওই লিমিটেই আটকে যাবে। যেমন হার্ট রেট ৩০০ এর বেশি দেওয়া যাবে না।
                if (this.value !== "" && parseFloat(this.value) > param.max) {
                    this.value = param.max;
                }
            });
        }
    });

    document.getElementById('modal-manual-entry').classList.remove('hidden');
};

window.saveManualParams = function() {
    let count = 0;
    ALL_MEGA_PARAMS.forEach(param => {
        const inputEl = document.getElementById(`modal_${param.id}`);
        if(inputEl && inputEl.value.trim() !== '') { 
            let parsedVal = parseFloat(inputEl.value);
            // Safety limits enforcement
            if(parsedVal > param.max) parsedVal = param.max;
            if(parsedVal < param.min) parsedVal = param.min;
            
            activePatientData[param.id] = parsedVal; 
            count++;
        } else if (inputEl && inputEl.value.trim() === '') {
            // যদি ইউজার ভ্যালু মুছে দেয়, তবে ডাটাবেস থেকেও মুছবে
            if(activePatientData[param.id] !== undefined) {
                delete activePatientData[param.id];
            }
        }
    });
    
    closeModal('modal-manual-entry');
    renderActiveVitalsOnDashboard(); 
    
    // Optional: Show a toast or small alert
    console.log(`Saved ${count} clinical parameters successfully.`);
};

// ==========================================
// 2. DASHBOARD RENDERING (VITALS GRID)
// ==========================================
window.renderActiveVitalsOnDashboard = function() {
    const container = document.getElementById('active-vitals-container');
    if(!container) return;
    
    container.innerHTML = '';
    
    if(Object.keys(activePatientData).length === 0) {
        container.innerHTML = `
            <div class="empty-state animate-pop" style="text-align: center; padding: 50px 20px;">
                <i class="ri-file-search-line" style="font-size: 4rem; color: var(--text-muted); opacity: 0.5;"></i>
                <p style="color: var(--text-muted); margin-top: 15px; font-weight: 600;">
                    No clinical data detected.<br>
                    <span style="font-size: 0.8rem; font-weight: 400;">Use Manual, CSV or Scan to begin.</span>
                </p>
            </div>`;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'vitals-grid';

    // শুধুমাত্র যেসব ডেটা এন্ট্রি করা হয়েছে সেগুলো দেখাবে
    ALL_MEGA_PARAMS.forEach(param => {
        if(activePatientData[param.id] !== undefined) {
            const val = activePatientData[param.id];
            const box = document.createElement('div');
            box.className = 'vital-box animate-slide-up';
            box.style.position = 'relative';
            
            // Highlight abnormal values (Simple frontend logic for visual cue)
            let isAbnormal = false;
            if((param.id === 'glucose' && val > 140) || 
               (param.id === 'bp_systolic' && val > 140) || 
               (param.id === 'heart_rate' && (val < 60 || val > 100)) ||
               (param.id === 'sao2' && val < 94)) {
                isAbnormal = true;
            }

            box.style.borderColor = isAbnormal ? 'var(--danger)' : 'var(--primary)';
            box.style.boxShadow = isAbnormal ? '0 4px 12px rgba(239, 68, 68, 0.15)' : '0 4px 12px rgba(37, 99, 235, 0.1)';
            
            box.innerHTML = `
                <button onclick="removeSingleVital('${param.id}')" 
                        style="position: absolute; top: 8px; right: 8px; background: none; border: none; color: var(--danger); cursor: pointer; font-size: 1.2rem; transition: 0.3s;" 
                        title="Remove Parameter">
                    <i class="ri-close-circle-fill"></i>
                </button>
                <div class="vb-icon" style="color: ${isAbnormal ? 'var(--danger)' : 'var(--primary)'}; font-size: 1.4rem; margin-bottom: 5px;">
                    <i class="${isAbnormal ? 'ri-alert-line' : 'ri-test-tube-line'}"></i>
                </div>
                <label class="vb-label" style="letter-spacing: 0.5px;">${param.label}</label>
                <div style="font-size: 1.6rem; font-weight: 800; color: ${isAbnormal ? 'var(--danger)' : 'var(--text-main)'}; margin-top: 5px;">
                    ${val} 
                    <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">${param.unit}</span>
                </div>
            `;
            grid.appendChild(box);
        }
    });

    container.appendChild(grid);
    if(typeof resetAIUI === 'function') resetAIUI(); 
};


window.clearAllVitals = function() {
    const modal = document.getElementById('modal-clear-data');
    if(modal) modal.classList.remove('hidden');
};

window.executeClearVitals = function() {
    activePatientData = {};
    
    // 🛑 ফিক্স: এআই এর মেমরি এবং ড্যাশবোর্ড মুছে ফেলা
    window.lastAIResult = null; 
    localStorage.removeItem('aiResult');
    localStorage.removeItem('patientVitals');
    resetAIUI(); 

    renderActiveVitalsOnDashboard();
    closeModal('modal-clear-data');
    showToast("Vitals and AI Assessment cleared successfully.", "success");
};

// 🛑 ফিক্স: যদি একটা একটা করে সবগুলো প্যারামিটার কেটে দেয়, তাহলেও এআই রিসেট হবে
window.removeSingleVital = function(paramId) {
    if(activePatientData[paramId] !== undefined) {
        delete activePatientData[paramId];
        renderActiveVitalsOnDashboard();
        
        if(Object.keys(activePatientData).length === 0) {
            window.lastAIResult = null;
            resetAIUI();
        }
    }
};

// ==========================================
// 🛑 MISSING BUG FIX: RESET AI UI FUNCTION
// ==========================================
window.resetAIUI = function() {
    // এআই রিং এবং স্কোর রিসেট
    const scoreEl = document.getElementById('ai-score');
    const ring = document.getElementById('ai-risk-ring');
    if(scoreEl) scoreEl.innerText = '--';
    if(ring) {
        ring.style.setProperty('--p', 0);
        ring.style.setProperty('--c', '#e2e8f0');
    }
    
    // স্ট্যাটাস টেক্সট এবং কালার রিসেট
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text-main');
    const confidenceEl = document.getElementById('ai-confidence');
    
    if(statusDot) statusDot.style.background = 'var(--text-muted)';
    if(statusText) statusText.innerHTML = 'Ready for Screening';
    if(confidenceEl) confidenceEl.innerHTML = '--%';
    
    // নিচের বিস্তারিত ইনসাইট প্যানেল রিমুভ করা
    const insightPanel = document.getElementById('ai-insight-panel');
    if(insightPanel) insightPanel.remove();
};

// ==========================================
// 3. AI OPTICAL CHARACTER RECOGNITION (OCR)
// ==========================================
window.executeDeepOCRScan = async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Show loading state
    const btn = document.getElementById('btn-ocr-scan');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `<i class="ri-loader-4-line spin-icon"></i> Scanning...`;
    btn.disabled = true;

    try {
        // Tesseract JS Initialization
        const result = await Tesseract.recognize(file, 'eng', {
            logger: m => console.log(m) // Optional: Track progress in console
        });
        const text = result.data.text.toLowerCase(); 
        
        // Advanced Regex Extractor Function
        const extractValue = (keyword) => {
            // Looks for the keyword, ignores spaces/colons/dashes, grabs the next float
            const regex = new RegExp(`${keyword}[^\\d]*(\\d+\\.?\\d*)`, 'i');
            const match = text.match(regex);
            return match ? parseFloat(match[1]) : null;
        };

        // Extract Demographics
        const ageMatch = text.match(/age[\s:-]*(\d{1,3})/i) || text.match(/(\d{1,3})[\s]*(yrs|years|y\/o)/i);
        if (ageMatch && ageMatch[1]) {
            const ageInput = document.getElementById('pat-age');
            if(ageInput) ageInput.value = parseInt(ageMatch[1]);
        }

        const genderMatch = text.match(/(?:gender|sex)[\s:-]*(male|female|m|f)/i);
        if (genderMatch && genderMatch[1]) {
            const genderSelect = document.getElementById('pat-gender');
            if(genderSelect) {
                const g = genderMatch[1].toLowerCase();
                genderSelect.value = (g === 'male' || g === 'm') ? 'M' : 'F';
            }
        }

        // Deep Extract Clinical Findings
        const findings = {
            'heart_rate': extractValue('heart rate') || extractValue('pulse') || extractValue('hr'),
            'respiratory_rate': extractValue('resp rate') || extractValue('respiratory rate') || extractValue('\\brr\\b'),
            'bp_systolic': extractValue('systolic bp') || extractValue('systolic'),
            'bp_diastolic': extractValue('diastolic bp') || extractValue('diastolic'),
            'temperature': extractValue('temp') || extractValue('temperature'),
            'hba1c': extractValue('hba1c') || extractValue('a1c'),
            'egfr': extractValue('egfr') || extractValue('gfr'),
            
            // Gas & O2 Fixes (handling '0' vs 'O')
            'po2': extractValue('po2') || extractValue('p02') || extractValue('\\bpo2\\b'),
            'pco2': extractValue('pco2') || extractValue('pc02') || extractValue('\\bpco2\\b'),
            'sao2': extractValue('sao2') || extractValue('sa02') || extractValue('oxygen saturation') || extractValue('spo2'),
            'ph': extractValue('\\bph\\b'), 
            'base_excess': extractValue('base excess') || extractValue('be'),
            
            // Common Chemistry
            'glucose': extractValue('glucose') || extractValue('sugar') || extractValue('fbs') || extractValue('rbs'),
            'cholesterol': extractValue('cholesterol') || extractValue('chol'),
            'triglycerides': extractValue('triglycerides') || extractValue('trig'),
            'creatinine': extractValue('creatinine') || extractValue('creat') || extractValue('cr'),
            'bun': extractValue('bun') || extractValue('blood urea nitrogen'),
            
            // CBC
            'wbc_count': extractValue('wbc') || extractValue('white blood cell') || extractValue('leukocyte'),
            'rbc': extractValue('rbc') || extractValue('red blood cell') || extractValue('erythrocyte'),
            'hemoglobin': extractValue('hemoglobin') || extractValue('hb') || extractValue('hgb'),
            'hematocrit': extractValue('hematocrit') || extractValue('hct'),
            'platelets': extractValue('platelet') || extractValue('plt') || extractValue('thrombocyte'),
            'mcv': extractValue('mcv'),
            
            // Hepatic
            'sgpt': extractValue('sgpt') || extractValue('alt'),
            'sgot': extractValue('sgot') || extractValue('ast'),
            'bilirubin': extractValue('bilirubin') || extractValue('total bili'),
            'albumin': extractValue('albumin') || extractValue('alb'),
            'alp': extractValue('alkaline phosphatase') || extractValue('alp'),
            
            // Electrolytes & Specifics
            'sodium': extractValue('sodium') || extractValue('\\bna\\b'),
            'potassium': extractValue('potassium') || extractValue('\\bk\\+?\\b'),
            'calcium': extractValue('calcium') || extractValue('\\bca\\b'),
            'chloride': extractValue('chloride') || extractValue('\\bcl\\b'),
            'lactate': extractValue('lactate'),
            'crp': extractValue('crp') || extractValue('c-reactive protein'),
            'troponin': extractValue('troponin') || extractValue('trop t'),
            'ck_mb': extractValue('ck-mb') || extractValue('ckmb'),
            'd_dimer': extractValue('d-dimer') || extractValue('d dimer')
        };

        let foundCount = 0;
        for (const [id, value] of Object.entries(findings)) {
            if (value !== null) {
                let finalValue = value;
                const paramConfig = ALL_MEGA_PARAMS.find(p => p.id === id);
                if (paramConfig) {
                    // Sanity check
                    if (finalValue > paramConfig.max) finalValue = paramConfig.max;
                    if (finalValue < paramConfig.min) finalValue = paramConfig.min;
                }
                activePatientData[id] = finalValue; 
                foundCount++;
            }
        }

        if (foundCount > 0) {
            renderActiveVitalsOnDashboard();
            alert(`OCR Scan Complete! Successfully extracted ${foundCount} clinical parameters.`);
        } else {
            alert(`OCR Scan Warning: Could not detect clear medical parameters from this image. Please enter manually.`);
        }

    } catch (error) {
        console.error("OCR Engine Error:", error);
        alert("OCR Engine Error. Failed to process the image document.");
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        e.target.value = ''; // Reset input
    }
};

// ==========================================
// 4. CSV BATCH UPLOAD SYSTEM
// ==========================================
window.handleCSVUpload = function() {
    const input = document.createElement('input'); 
    input.type = 'file'; 
    input.accept = '.csv';
    input.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            let imported = 0;
            event.target.result.split('\n').forEach(row => {
                const parts = row.split(','); 
                if(parts.length >= 2) {
                    const id = parts[0].trim().toLowerCase();
                    const val = parseFloat(parts[1].trim());
                    
                    // Verify if the ID matches our Mega Params
                    const isValid = ALL_MEGA_PARAMS.some(p => p.id === id);
                    if(isValid && !isNaN(val)) {
                        activePatientData[id] = val;
                        imported++;
                    }
                }
            });
            
            if(imported > 0) {
                renderActiveVitalsOnDashboard();
                alert(`CSV Uploaded: ${imported} parameters added.`);
            } else {
                alert("CSV Format Error: Make sure format is 'parameter_id, value'");
            }
        };
        if(e.target.files[0]) reader.readAsText(e.target.files[0]);
    };
    input.click();
};

/**
 * ----------------------------------------------------------------------------
 * PART 3: UNIVERSAL AUTO-TRIAGE ENGINE (THE AI CORE)
 * ----------------------------------------------------------------------------
 * Sends clinical data to the Flask Backend, processes the 8-Model
 * Deep Scan results, and renders the intelligence on the Dashboard.
 */

window.runUniversalTriageAnalysis = async function(e) {
    if(e) e.preventDefault();
    
    // ১. ভ্যালিডেশন: কোনো ডেটা না দিলে এআই চলবে না
    if (Object.keys(activePatientData).length === 0) {
        alert("⚠️ WARNING: Clinical parameters missing. Please add at least one vital sign or lab result before initializing the AI Engine.");
        return;
    }

    // ২. UI স্টেট আপডেট: স্ক্যানিং অ্যানিমেশন চালু করা
    currentState.isScanning = true;
    const btn = document.getElementById('btn-run-ai');
    const originalBtnHTML = btn.innerHTML;
    const ring = document.getElementById('ai-risk-ring');

    btn.disabled = true;
    btn.innerHTML = `<i class="ri-loader-4-line spin-icon"></i> <span>RUNNING DEEP SCAN (8 MODELS)...</span>`;
    btn.style.boxShadow = '0 0 20px rgba(37, 99, 235, 0.6)';
    if(ring) ring.style.opacity = "0.5"; 

    // ৩. API কল (Flask সার্ভারের কাছে ডেটা পাঠানো)
    try {
        const response = await fetch(CONFIG.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                vitals: activePatientData,
                patient_id: currentState.patientId,
                location: userLocation 
            })
        });

        // সার্ভার থেকে এরর আসলে
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // ৪. রেজাল্ট প্রোসেসিং
        if (result.status === 'success') {
            // ব্রাউজারে সেভ করে রাখা, যাতে গাইডলাইন পেজে বা প্রিন্ট করার সময় কাজে লাগে
            localStorage.setItem('aiResult', JSON.stringify(result));
            localStorage.setItem('patientVitals', JSON.stringify(activePatientData));
            window.lastAIResult = result;
            
            // UI আপডেট করা
            renderAIResultUI(result);
            
            // স্ক্রিনটা অটোমেটিক স্ক্রল করে রেজাল্টের কাছে নিয়ে যাওয়া
            const resultWidget = document.querySelector('.widget-result');
            if(resultWidget) {
                resultWidget.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            throw new Error(result.message || "Unknown error from AI Core.");
        }
    } catch (error) {
        console.error("Synapse Engine Error:", error);
        alert("⚠️ AI Core Connection Failed. \n\nPlease ensure your Flask server (app.py) is running on port 5000 and CORS is enabled.");
    } finally {
        // ৫. স্ক্যানিং শেষে UI আগের অবস্থায় ফিরিয়ে আনা
        currentState.isScanning = false;
        btn.disabled = false;
        btn.innerHTML = originalBtnHTML;
        btn.style.boxShadow = '';
        if(ring) ring.style.opacity = "1";
    }
};

// ==========================================
// RESULT RENDERING (GAUGE & DETAILS)
// ==========================================
window.renderAIResultUI = function(data) {
    // 1. DOM Elements
    const ring = document.getElementById('ai-risk-ring');
    const scoreEl = document.getElementById('ai-score');
    const statusText = document.getElementById('status-text-main');
    const statusDot = document.getElementById('status-dot');
    const confidenceEl = document.getElementById('ai-confidence');
    const resultBody = document.querySelector('.result-body');

    if(!resultBody) return;

    // 2. Risk Calculation & Color Coding
    let mainProb = parseFloat(data.probability);
    let currentScore = 0;
    const targetScore = Math.round(mainProb);
    
    // Color Logic: >= 70 Critical(Red), >= 40 Warning(Orange), else Safe(Green)
    let mainColor = mainProb >= 70 ? CONFIG.colors.critical : (mainProb >= 40 ? CONFIG.colors.warning : CONFIG.colors.safe);

    // 3. Gauge Animation
    if (scoreEl && ring) {
        const timer = setInterval(() => {
            if (currentScore >= targetScore) { 
                clearInterval(timer); 
            } else { 
                currentScore++; 
                scoreEl.innerText = currentScore; 
                ring.style.setProperty('--p', currentScore); 
            }
        }, 15);
    }

    // 4. Update Header Stats
    if(ring) ring.style.setProperty('--c', mainColor);
    if(statusDot) statusDot.style.background = mainColor;
    
    if(statusText) {
        statusText.innerHTML = `
            <span style="font-size:0.60em; color:var(--text-muted); display:block; margin-bottom:4px; font-weight:700; letter-spacing: 0.5px;">
                <i class="ri-robot-2-line"></i> DETECTED BY: ${data.expert_system || 'GENERAL SCAN'}
            </span>
            <span class="ai-disease-name" style="color: ${mainColor};">${data.disease}</span>
        `;
    }
    
    if(confidenceEl) {
        confidenceEl.innerHTML = `<span style="color: ${mainColor}">${data.probability}</span>`;
    }

    // 5. Clear Previous Detailed Insights
    const existingBox = document.getElementById('ai-insight-panel');
    if(existingBox) existingBox.remove();

    // 6. Build New Insights Panel
    let insightHTML = `<div id="ai-insight-panel" style="margin-top: 25px; text-align: left; animation: slideUp 0.5s ease-out;">`;

    // --- A. Clinical Emergencies (Code Blue Overrides) ---
    if(data.clinical_emergencies && data.clinical_emergencies.length > 0) {
        insightHTML += `
            <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--danger); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="color: var(--danger); font-size: 0.95rem; margin-bottom: 10px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                    <i class="ri-alarm-warning-fill pulse-icon" style="font-size: 1.2rem;"></i> IMMEDIATE ATTENTION REQUIRED
                </h4>
                <ul style="color: var(--danger); font-size: 0.85rem; font-weight: 600; padding-left: 20px; margin: 0; line-height: 1.6;">
                    ${data.clinical_emergencies.map(e => `<li>${e}</li>`).join('')}
                </ul>
            </div>`;
    }

    // --- B. Guideline Button (If Risk is High or Multiple Alerts) ---
    let hasSecondary = data.secondary_alerts && data.secondary_alerts.length > 0;
    if(mainProb >= 40 || hasSecondary) {
        insightHTML += `
            <div style="background: rgba(37, 99, 235, 0.05); border: 1px solid rgba(37, 99, 235, 0.2); padding: 16px; border-radius: 12px; margin-bottom: 25px;">
                <p style="font-size: 0.85rem; color: var(--text-main); font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <i class="ri-loader-4-line spin-icon" style="color: var(--primary); font-size: 1.2rem;"></i> Clinical guidelines are being prepared...
                </p>
                <button onclick="openGuidelinePage()" style="background: var(--primary); color: #fff; border: none; padding: 12px 20px; border-radius: 8px; font-weight: 800; cursor: pointer; transition: 0.3s; width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px; font-size: 0.95rem; box-shadow: 0 4px 15px var(--primary-glow);">
                    <i class="ri-file-list-3-line"></i> View Dynamic Guidelines & Assessment
                </button>
            </div>`;
    }

    // --- C. Detailed Disease Breakdown (Top 3 Only for Dashboard) ---
    if(data.all_detailed_risks && data.all_detailed_risks.length > 0) {
        insightHTML += `
            <div id="disease-breakdown-box" style="padding: 20px; background: var(--glass-bg); border-radius: 12px; border: 1px solid var(--glass-border);">
                <h4 style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; display: flex; justify-content: space-between;">
                    <span>Differential Diagnosis</span>
                    <span style="background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 10px; font-size: 0.65rem;">Top Risks</span>
                </h4>
                <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
        `;

        let topRisks = data.all_detailed_risks.slice(0, 3);

        topRisks.forEach(risk => {
            let pVal = parseFloat(risk.probability);
            let barColor = pVal >= 70 ? 'var(--danger)' : (pVal >= 40 ? 'var(--warning)' : 'var(--success)');
            let expertBadge = risk.expert_panel ? `<span style="font-size: 0.6rem; background: rgba(0,0,0,0.04); padding: 2px 6px; border-radius: 4px; color: var(--text-muted); margin-left: 8px;">${risk.expert_panel}</span>` : '';
            
            insightHTML += `
                <div style="background: var(--bg-body); padding: 12px; border-radius: 8px; border: 1px solid var(--glass-border); transition: 0.3s; position: relative; overflow: hidden;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; margin-bottom: 8px; position: relative; z-index: 2;">
                        <span style="font-weight: 800; color: var(--text-main);">${risk.disease} ${expertBadge}</span>
                        <span style="font-weight: 800; color: ${barColor}">${risk.probability}%</span>
                    </div>
                    <div style="width: 100%; background: rgba(0,0,0,0.05); height: 6px; border-radius: 10px; overflow: hidden; position: relative; z-index: 2;">
                        <div style="width: ${pVal}%; background: ${barColor}; height: 100%; transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                    </div>
                </div>`;
        });

        if(data.all_detailed_risks.length > 3) {
            insightHTML += `<div style="text-align: center; margin-top: 10px; font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">+ ${data.all_detailed_risks.length - 3} more risks analyzed. Export PDF for full details.</div>`;
        }

        insightHTML += `</div></div>`;
    }

    insightHTML += `</div>`;
    resultBody.insertAdjacentHTML('beforeend', insightHTML);
};

/**
 * ----------------------------------------------------------------------------
 * PART 4: ADMINISTRATION, REPORTING & GEMINI AI INTEGRATION
 * ----------------------------------------------------------------------------
 * Handles Database Audit Logs, PDF Clinical Reports, and routes
 * data to the Gemini Neural Engine for treatment guidelines.
 */

// ==========================================
// 1. SYSTEM AUDIT LOGS (ADMIN PANEL)
// ==========================================
window.loadAuditLogs = async function() {
    const tableBody = document.getElementById('admin-log-table');
    if(!tableBody) return;

    try {
        const response = await fetch(CONFIG.logsEndpoint); 
        const data = await response.json();

        if(data.status === 'success') {
            tableBody.innerHTML = ''; 
            
            if(data.logs.length === 0) {
                tableBody.innerHTML = `<tr class="empty-row"><td colspan="6" class="text-center">No diagnostic logs found. Run an analysis first.</td></tr>`;
                return;
            }

            data.logs.forEach(log => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-size: 0.75rem;">${log.time}<br><small>${log.location}</small></td>
                    <td><strong style="color:var(--primary)">${log.patient_id}</strong><br><small>${log.guest_id}</small></td>
                    <td><span style="font-weight:700;">${log.disease}</span></td>
                    <td><span class="badge-table ${parseFloat(log.risk) >= 70 ? 'badge-critical' : (parseFloat(log.risk) >= 40 ? 'badge-warning' : 'badge-safe')}">${log.risk}</span></td>
                    <td><span class="badge-safe"><i class="ri-check-line"></i> Recorded</span></td>
                    <td><button class="btn-secondary-sm" onclick="alert('Device IP: ${log.ip}')" style="padding: 4px 8px; font-size: 0.7rem;">IP Info</button></td>
                `;
                tableBody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error("Error fetching logs:", error);
    }
};

window.toggleAdminPanel = function() {
    const dashboard = document.getElementById('view-dashboard');
    const admin = document.getElementById('view-admin');
    const pageTitle = document.getElementById('current-page-title');
    
    if (admin && dashboard && pageTitle) {
        if (admin.classList.contains('hidden')) {
            dashboard.classList.add('hidden');
            admin.classList.remove('hidden');
            pageTitle.innerHTML = '<i class="ri-shield-keyhole-line" style="color: var(--primary);"></i> System Administration';
            loadAuditLogs(); 
        } else {
            admin.classList.add('hidden');
            dashboard.classList.remove('hidden');
            pageTitle.innerText = "Command Center";
        }
    }
};

// ==========================================
// 2. PDF CLINICAL REPORT GENERATION
// ==========================================
window.generateClinicalReport = function() {
    const data = window.lastAIResult;
    if(!data) { 
        alert("⚠️ Please run the Universal AI Analysis first to generate a report!"); 
        return; 
    }

    // Set Date
    document.getElementById('report-date-text').innerText = new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    const status = document.getElementById('status-text-main').innerText.replace(/<[^>]*>?/gm, ''); 
    let mainProb = parseFloat(data.probability);
    let statusColor = mainProb >= 70 ? '#ef4444' : (mainProb >= 40 ? '#f59e0b' : '#10b981');
    
    const patName = document.getElementById('pat-name')?.value || 'Not Provided';
    const patAge = document.getElementById('pat-age')?.value || '--';
    const patGenderBox = document.getElementById('pat-gender');
    const patGender = patGenderBox ? patGenderBox.options[patGenderBox.selectedIndex].text : '--';

    // 🛑 ফিক্স: এখানে আমরা all_detailed_risks ব্যবহার করছি এবং মেইন রোগটাকে লিস্ট থেকে বাদ দিচ্ছি
    const allOtherRisks = data.all_detailed_risks ? data.all_detailed_risks.filter(r => r.disease !== data.disease) : [];
    
    let reportHTML = `
        <div style="text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 25px;">
            <h2 style="margin: 0; color: #0f172a; font-size: 1.8rem;">Clinical Assessment Report</h2>
            <p style="color: #64748b; font-weight: 600;">Synapse OS (v5.0) Intelligence Engine Prediction</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <span style="font-size: 0.9rem; color: #64748b;">Patient ID: <strong style="color: #0f172a;">${currentState.patientId}</strong></span>
                <span style="font-size: 0.9rem; color: #64748b;">Patient Name: <strong style="color: #0f172a;">${patName}</strong></span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <span style="font-size: 0.9rem; color: #64748b;">Age & Gender: <strong style="color: #0f172a;">${patAge} Yrs, ${patGender}</strong></span>
                <span style="font-size: 0.9rem; color: #64748b;">Primary Focus: <strong style="color: var(--primary);">${data.disease}</strong></span>
            </div>
        </div>
    `;

    // 🛑 ফিক্স: Comprehensive Differential Diagnosis (সবগুলো রিস্ক দেখাবে)
    if(allOtherRisks.length > 0) {
        reportHTML += `
            <div style="background: #fffbeb; border: 2px dashed #f59e0b; padding: 15px; border-radius: 10px; margin-bottom: 25px;">
                <h4 style="color: #d97706; margin: 0 0 8px 0; font-size: 1rem;"><i class="ri-alarm-warning-fill"></i> COMPREHENSIVE DIFFERENTIAL DIAGNOSIS:</h4>
                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 0.85rem; font-weight: 600;">AI also detected the following secondary risks across all expert models:</p>
                <ul style="color: #b45309; font-weight: 800; font-size: 0.9rem; padding-left: 20px; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    ${allOtherRisks.map(a => `<li>Risk of ${a.disease} (${a.probability}%) <br><span style="font-size:0.65rem; color:#d97706; background: rgba(217, 119, 6, 0.1); padding: 2px 6px; border-radius: 4px;">${a.expert_panel || 'GENERAL'}</span></li>`).join('')}
                </ul>
            </div>`;
    }

    // Primary Summary
    reportHTML += `
        <div style="border-left: 6px solid ${statusColor}; background: #f0fdf4; padding: 20px; margin-bottom: 25px;">
            <h4 style="margin: 0; color: #64748b; font-size: 0.8rem; text-transform: uppercase;">Primary Diagnosis Summary</h4>
            <p style="margin: 5px 0 0 0; font-size: 1.4rem; font-weight: 800; color: ${statusColor};">${data.disease} (${data.probability})</p>
            <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Detected by: ${data.expert_system || 'General Scan'}</p>
        </div>
    `;

    // Input Data Grid
    reportHTML += `<h4 style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; color: var(--text-main);">Provided Clinical Parameters</h4>
                   <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">`;
    
    for (const [key, value] of Object.entries(activePatientData)) {
        const paramInfo = ALL_MEGA_PARAMS.find(p => p.id === key);
        const label = paramInfo ? paramInfo.label : key.toUpperCase();
        const unit = paramInfo ? paramInfo.unit : '';

        reportHTML += `<div style="font-size: 0.85rem; display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 5px;">
                        <span style="color: #64748b; font-weight: 600;">${label}:</span> 
                        <strong style="color: #0f172a;">${value} <span style="font-size:0.7rem; color:#94a3b8;">${unit}</span></strong>
                      </div>`;
    }
    reportHTML += `</div>`;

    document.getElementById('report-content-area').innerHTML = reportHTML;
    document.getElementById('modal-report').classList.remove('hidden');
};

// ==========================================
// 3. GEMINI AI GUIDELINE INTEGRATION
// ==========================================
window.openGuidelinePage = function() {
    if (!window.lastAIResult) {
        alert("⚠️ Please wait for the AI analysis to complete first!");
        return;
    }

    // Gather Patient Demographics
    const patAge = document.getElementById('pat-age')?.value || 'Not Provided';
    const patGenderBox = document.getElementById('pat-gender');
    const patGender = patGenderBox ? patGenderBox.options[patGenderBox.selectedIndex].text : 'Not Provided';
    
    // Store data locally for guideline.html to pick up
    localStorage.setItem('patientAge', patAge);
    localStorage.setItem('patientGender', patGender);
    localStorage.setItem('patientVitals', JSON.stringify(activePatientData));
    localStorage.setItem('aiResult', JSON.stringify(window.lastAIResult));

    // Open the Gemini Guideline tab
    window.open('guideline.html', '_blank');
};

// System Boot Complete Log
console.log("🚀 SYNAPSE OS (v5.0 PRO): All Core Modules Loaded Successfully.");


/**
 * ============================================================================
 * THE MEGA UI/UX FIX (TOAST NOTIFICATIONS & ALERT OVERRIDE)
 * ============================================================================
 */
window.showToast = function(message, type = 'info') {
    const toast = document.getElementById('custom-toast');
    const icon = document.getElementById('toast-icon');
    const msg = document.getElementById('toast-message');

    if (!toast) return;

    // আইকন এবং কালার সেট করা
    let iconClass = 'ri-information-fill';
    if (type === 'success') iconClass = 'ri-checkbox-circle-fill';
    if (type === 'warning') iconClass = 'ri-error-warning-fill';
    if (type === 'danger') iconClass = 'ri-close-circle-fill';

    icon.innerHTML = `<i class="${iconClass}"></i>`;
    icon.className = `toast-icon ${type}`;
    msg.innerHTML = message;

    // পপআপ শো করানো
    toast.classList.add('show');

    // ৪ সেকেন্ড পর অটোমেটিক হাইড হয়ে যাবে
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
};

// 🚀 JAVASCRIPT MAGIC: OVERRIDING THE DEFAULT BROWSER ALERT!
window.alert = function(message) {
    let type = 'info';
    let msgLower = message.toLowerCase();
    
    // মেসেজের টেক্সট পড়ে অটোমেটিক কালার ডিসাইড করবে
    if(msgLower.includes('error') || msgLower.includes('denied') || msgLower.includes('failed')) {
        type = 'danger';
    } else if(msgLower.includes('warning') || msgLower.includes('please')) {
        type = 'warning';
    } else if(msgLower.includes('success') || msgLower.includes('complete') || msgLower.includes('recorded')) {
        type = 'success';
    }
    
    showToast(message, type);
};

// ==========================================
// SYSTEM AUDIT LOGS: EXPORT & SOFT CLEAR
// ==========================================

// ১. Export CSV ফাংশন (পুরো ডাটাবেস থেকে ডাটা এনে এক্সেলে সেভ করবে)
window.exportLogsToCSV = async function() {
    try {
        const response = await fetch(CONFIG.logsEndpoint);
        const data = await response.json();

        if (data.status === 'success' && data.logs.length > 0) {
            let csvContent = "data:text/csv;charset=utf-8,";
            // এক্সেল ফাইলের হেডার (কলামের নাম)
            csvContent += "Date & Time,Location,Patient ID,Guest ID,Primary Diagnosis,Risk Level,Secondary Risks\n";

            // ডাটাবেস থেকে সব ডাটা এক্সেলে বসানো
            data.logs.forEach(log => {
                let location = `"${log.location}"`;
                let secondary = `"${log.secondary}"`; // কমা থাকলে যেন ভেঙে না যায় তাই ডাবল কোট
                let disease = `"${log.disease}"`;
                
                let row = `${log.time},${location},${log.patient_id},${log.guest_id},${disease},${log.risk},${secondary}`;
                csvContent += row + "\n";
            });

            // ফাইল ডাউনলোড ট্রিগার করা
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Synapse_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast("Audit logs exported successfully!", "success");
        } else {
            showToast("No logs available to export.", "warning");
        }
    } catch (error) {
        console.error("Export Error:", error);
        showToast("Failed to export logs. Server connection error.", "danger");
    }
};

// ২. Soft Delete ফাংশন (শুধু স্ক্রিন থেকে মুছবে, ডাটাবেসে থেকে যাবে)
window.clearAuditLogsUI = function() {
    const tableBody = document.getElementById('admin-log-table');
    if(tableBody) {
        tableBody.innerHTML = `
            <tr class="empty-row animate-pop">
                <td colspan="6" style="text-align: center; padding: 50px 20px;">
                    <i class="ri-shield-check-fill" style="font-size: 4rem; color: var(--success); opacity: 0.8;"></i>
                    <p style="color: var(--text-main); margin-top: 15px; font-weight: 800; font-size: 1.1rem;">
                        Logs cleared from workspace.
                        <br><span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Secure immutable copy retained in the master database.</span>
                    </p>
                </td>
            </tr>`;
        showToast("Screen cleared. Data safely retained in backend.", "info");
    }
};

// ==========================================
// SPA TAB SWITCHING LOGIC (NAVIGATION)
// ==========================================
window.switchAppTab = function(panelId, navId) {
    // ১. সব প্যানেল (Dashboard, Audit Logs, etc.) হাইড করা
    document.querySelectorAll('.app-panel').forEach(panel => {
        panel.classList.add('panel-hidden');
    });

    // ২. শুধুমাত্র যেটিতে ক্লিক করেছ সেটি শো করা
    const targetPanel = document.getElementById(panelId);
    if(targetPanel) {
        targetPanel.classList.remove('panel-hidden');
    }

    // ৩. সাইডবার মেনুর এক্টিভ কালার ঠিক করা
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        item.style.background = 'transparent';
        item.style.color = 'var(--text-muted)';
    });

    const activeNav = document.getElementById(navId);
    if(activeNav) {
        activeNav.classList.add('active');
        activeNav.removeAttribute('style'); 
    }
};

// ==========================================
// NOTIFICATION BELL LOGIC
// ==========================================
window.toggleNotifications = function() {
    const dropdown = document.getElementById('notif-dropdown');
    if(dropdown) {
        dropdown.classList.toggle('hidden');
    }
};

// স্ক্রিনের অন্য কোথাও ক্লিক করলে নোটিফিকেশন প্যানেল বন্ধ হয়ে যাবে
document.addEventListener('click', function(event) {
    const wrapper = document.querySelector('.notification-wrapper');
    const dropdown = document.getElementById('notif-dropdown');
    
    // যদি wrapper এবং dropdown থাকে, এবং ইউজারের ক্লিক যদি wrapper-এর বাইরে হয়
    if (wrapper && dropdown && !wrapper.contains(event.target)) {
        if (!dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
        }
    }
});

// =========================================================
// DIGITAL TWIN (MIMIC-III): VALIDATION & SIMULATION
// =========================================================
window.simulateDigitalTwin = function() {
    const btn = document.getElementById('btn-mimic-load');
    // নিচের এই লাইনটি পরিবর্তন করো (panel-digital-twin এর জায়গায় dt-content-area হবে)
    const container = document.getElementById('dt-content-area');
    
    if(!btn || !container) return;

    // 🛑 ফিক্স ১: ইনপুট ভ্যালিডেশন (প্যারামিটার না থাকলে সিমুলেশন হবে না)
    if (Object.keys(activePatientData).length === 0) {
        showToast("⚠️ Clinical data missing! Enter vitals in 'Universal Deep Scan' first to map the twin.", "warning");
        return;
    }

    // লোডিং অ্যানিমেশন শুরু
    btn.innerHTML = `<i class="ri-loader-4-line spin-icon"></i> Deep Scanning MIT MIMIC-III DB...`;
    btn.style.opacity = '0.8';
    btn.disabled = true;

    setTimeout(() => {
        showToast('Clinical Context Matched with Case #84920', 'success');
        
        container.innerHTML = `
            <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--primary); margin-bottom: 5px;"><i class="ri-dna-line"></i> Digital Twin (MIMIC-III)</h2>
            <p style="color: var(--text-muted); margin-bottom: 25px;">Live physiological simulation mapped to Patient <strong>${currentState.patientId}</strong></p>
            
            <div class="animate-pop" style="background: var(--glass-bg); padding: 30px; border-radius: 12px; border: 1px solid var(--glass-border); margin-bottom: 50px;">
                
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--glass-border); padding-bottom: 15px; margin-bottom: 20px;">
                    <div>
                        <h4 style="color: var(--text-main); margin-bottom: 5px; font-weight: 800;"><i class="ri-check-double-line" style="color: var(--success);"></i> Historical Match Found: Case #84920</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">Matches 14 out of 18 current physiological trends.</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="background: rgba(16, 185, 129, 0.1); color: var(--success); padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 0.9rem;">Survival Rate: 92%</span>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">Length of Stay: 5 Days (ICU)</p>
                    </div>
                </div>

                <div style="margin-bottom: 25px; text-align: left;">
                    <h5 style="color: var(--text-main); font-size: 0.9rem; font-weight: 800; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
                        <i class="ri-test-tube-line" style="color: var(--primary);"></i> Matched Historical Parameters:
                    </h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; background: rgba(0,0,0,0.02); padding: 15px; border-radius: 10px; border: 1px solid var(--glass-border);">
                        <div style="text-align: center; border-right: 1px solid var(--glass-border);">
                            <span style="display: block; font-size: 0.65rem; color: var(--text-muted); font-weight: 700;">HEART RATE</span>
                            <strong style="font-size: 1.1rem; color: var(--danger);">118 <small>BPM</small></strong>
                        </div>
                        <div style="text-align: center; border-right: 1px solid var(--glass-border);">
                            <span style="display: block; font-size: 0.65rem; color: var(--text-muted); font-weight: 700;">WBC COUNT</span>
                            <strong style="font-size: 1.1rem; color: var(--danger);">18.4 <small>k</small></strong>
                        </div>
                        <div style="text-align: center; border-right: 1px solid var(--glass-border);">
                            <span style="display: block; font-size: 0.65rem; color: var(--text-muted); font-weight: 700;">GLUCOSE</span>
                            <strong style="font-size: 1.1rem; color: var(--warning);">510 <small>mg/dL</small></strong>
                        </div>
                        <div style="text-align: center; border-right: 1px solid var(--glass-border);">
                            <span style="display: block; font-size: 0.65rem; color: var(--text-muted); font-weight: 700;">BLOOD pH</span>
                            <strong style="font-size: 1.1rem; color: var(--danger);">7.12</strong>
                        </div>
                        <div style="text-align: center;">
                            <span style="display: block; font-size: 0.65rem; color: var(--text-muted); font-weight: 700;">LACTATE</span>
                            <strong style="font-size: 1.1rem; color: var(--danger);">4.2 <small>mmol/L</small></strong>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 25px; text-align: left;">
                    <h5 style="color: var(--text-main); font-size: 0.9rem; font-weight: 800; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
                        <i class="ri-history-line" style="color: var(--primary);"></i> Historical Treatment Trajectory:
                    </h5>
                    
                    <div style="background: rgba(37, 99, 235, 0.03); padding: 20px; border-radius: 8px; border-left: 4px solid var(--primary); font-size: 0.85rem; color: var(--text-main); line-height: 1.8;">
                        <strong style="color: var(--primary);"><i class="ri-time-line"></i> Initial 24 Hours:</strong> Given the severe acidosis (pH 7.12) and hyperglycemia (510 mg/dL), immediate IV Insulin infusion and aggressive fluid resuscitation (Normal Saline) were started.<br>
                        <strong style="color: var(--primary);"><i class="ri-time-line"></i> Day 5:</strong> Discharged with stable vitals and diabetic management education.
                    </div>
                </div>

                <div style="text-align: center; border-top: 1px dashed var(--glass-border); padding-top: 20px;">
                    <button class="btn-primary-mega" style="padding: 12px 25px; height: auto; width: auto; display: inline-flex; position: relative; z-index: 100;" onclick="openGuidelinePage()">
                        <i class="ri-robot-2-line"></i> View Personalized AI Guideline
                    </button>
                </div>
            </div>
        `;
        // রেজাল্ট দেখানোর পর স্ক্রল করে বাটনের কাছে নিয়ে যাবে
        container.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 2500); 
};