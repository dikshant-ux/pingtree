(function () {
    const STATES = [
        { val: "AL", label: "Alabama" }, { val: "AK", label: "Alaska" }, { val: "AZ", label: "Arizona" }, { val: "AR", label: "Arkansas" },
        { val: "CA", label: "California" }, { val: "CO", label: "Colorado" }, { val: "CT", label: "Connecticut" }, { val: "DE", label: "Delaware" },
        { val: "FL", label: "Florida" }, { val: "GA", label: "Georgia" }, { val: "HI", label: "Hawaii" }, { val: "ID", label: "Idaho" },
        { val: "IL", label: "Illinois" }, { val: "IN", label: "Indiana" }, { val: "IA", label: "Iowa" }, { val: "KS", label: "Kansas" },
        { val: "KY", label: "Kentucky" }, { val: "LA", label: "Louisiana" }, { val: "ME", label: "Maine" }, { val: "MD", label: "Maryland" },
        { val: "MA", label: "Massachusetts" }, { val: "MI", label: "Michigan" }, { val: "MN", label: "Minnesota" }, { val: "MS", label: "Mississippi" },
        { val: "MO", label: "Missouri" }, { val: "MT", label: "Montana" }, { val: "NE", label: "Nebraska" }, { val: "NV", label: "Nevada" },
        { val: "NH", label: "New Hampshire" }, { val: "NJ", label: "New Jersey" }, { val: "NM", label: "New Mexico" }, { val: "NY", label: "New York" },
        { val: "NC", label: "North Carolina" }, { val: "ND", label: "North Dakota" }, { val: "OH", label: "Ohio" }, { val: "OK", label: "Oklahoma" },
        { val: "OR", label: "Oregon" }, { val: "PA", label: "Pennsylvania" }, { val: "RI", label: "Rhode Island" }, { val: "SC", label: "South Carolina" },
        { val: "SD", label: "South Dakota" }, { val: "TN", label: "Tennessee" }, { val: "TX", label: "Texas" }, { val: "UT", label: "Utah" },
        { val: "VT", label: "Vermont" }, { val: "VA", label: "Virginia" }, { val: "WA", label: "Washington" }, { val: "WV", label: "West Virginia" },
        { val: "WI", label: "Wisconsin" }, { val: "WY", label: "Wyoming" }
    ];

    var PingTree = {
        config: {
            apiKey: null,
            formId: null,
            formConfig: null,
            publicIP: null,
            endpoint: 'https://js.trustedagentforyou.com/api/v1/public/leads/ingest'
        },

        init: async function (apiKey, options = {}) {
            this.config.apiKey = apiKey;
            if (options.endpoint) {
                this.config.endpoint = options.endpoint;
            }

            // Capture Public IP early
            this.getPublicIP();

            if (options.formId) {
                this.config.formId = options.formId;
                await this.fetchFormConfig();
                await this.loadExternalScripts();
            }
            console.log('PingTree Ingestion Script Initialized');
        },

        getPublicIP: async function () {
            try {
                const res = await fetch('https://api.ipify.org?format=json');
                const data = await res.json();
                this.config.publicIP = data.ip;
                console.log('PingTree: Captured Client IP:', data.ip);
            } catch (e) {
                console.warn('PingTree: Could not capture client IP via JS', e);
            }
        },

        fetchFormConfig: async function () {
            if (!this.config.formId) return;
            try {
                // Derived from endpoint
                const baseApi = this.config.endpoint.split('/public/')[0];
                const response = await fetch(`${baseApi}/public/forms/${this.config.formId}`);
                if (response.ok) {
                    this.config.formConfig = await response.json();
                }
            } catch (e) {
                console.error("PingTree: Failed to fetch form config", e);
            }
        },

        loadExternalScripts: async function () {
            if (!this.config.formConfig || !this.config.formConfig.click_id_configs) return;

            for (const config of this.config.formConfig.click_id_configs) {
                if (config.method === 'rtk' && config.script_url) {
                    if (!document.querySelector(`script[src*="${config.script_url}"]`)) {
                        const script = document.createElement('script');
                        script.src = config.script_url;
                        script.async = true;
                        document.head.appendChild(script);
                    }
                }
            }
        },

        captureClickIds: function () {
            const captured = {};
            if (!this.config.formConfig || !this.config.formConfig.click_id_configs) {
                console.log('PingTree: No Click ID configs found');
                return captured;
            }

            console.log('PingTree: Capturing Click IDs...', this.config.formConfig.click_id_configs);

            for (const config of this.config.formConfig.click_id_configs) {
                let val = null;
                if (config.method === 'url') {
                    const urlParams = new URLSearchParams(window.location.search);
                    val = urlParams.get(config.param_name || config.key);
                    console.log(`PingTree: URL Param capture [${config.key}]:`, val);
                } else if (config.method === 'rtk') {
                    const getCookie = (name) => {
                        let value = "; " + document.cookie;
                        let parts = value.split("; " + name + "=");
                        if (parts.length === 2) return parts.pop().split(";").shift();
                    };

                    // Priority 1: Window variables (common in RedTrack)
                    val = window.rtkClickID || window.rtkClickId || window.rtk_clickid;

                    // Priority 2: Cookies
                    if (!val) val = getCookie('rtkClickID') || getCookie('rtkClickId') || getCookie('rtk_clickid');

                    // Priority 3: Session Storage
                    if (!val) {
                        val = sessionStorage.getItem('rtkclickid') ||
                            sessionStorage.getItem('rtkClickID') ||
                            sessionStorage.getItem('rtkClickId');
                    }

                    // Priority 4: URL Parameter (fallback if script didn't move it yet)
                    if (!val) {
                        const urlParams = new URLSearchParams(window.location.search);
                        val = urlParams.get('rtkClickID') || urlParams.get('rtkClickId') || urlParams.get('clickid');
                    }

                    console.log(`PingTree: RTK capture [${config.key}]:`, val);
                } else if (config.method === 'custom' && config.param_name) {
                    try {
                        val = eval(config.param_name);
                        console.log(`PingTree: Custom JS capture [${config.key}]:`, val);
                    } catch (e) {
                        console.warn(`PingTree: Custom JS capture failed for [${config.key}]:`, e);
                    }
                }

                if (val) captured[config.key] = val;
            }
            return captured;
        },

        submit: async function (data) {
            if (!this.config.apiKey) {
                console.error('PingTree Error: API Key not set. Call PingTree.init("YOUR_API_KEY")');
                return Promise.reject(new Error("API Key missing"));
            }

            // Sync with Click ID configs
            if (this.config.formConfig) {
                const clickIds = this.captureClickIds();
                Object.assign(data, clickIds);
            }

            // Inject Client-Side captured IP if available
            if (this.config.publicIP) {
                data.captured_ip = this.config.publicIP;
            }

            console.log('PingTree: Final data for submission:', data);

            try {
                const response = await fetch(this.config.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.config.apiKey
                    },
                    body: JSON.stringify(data)
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const result = await response.json();
                console.log('PingTree Lead Submitted:', result);
                return result;
            } catch (error) {
                console.error('PingTree Submission Failed:', error);
                throw error;
            }
        },

        hijack: function (formId, options) {
            const form = document.getElementById(formId);
            if (!form) return;

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                try {
                    const res = await this.submit(data);
                    if (options && options.onSuccess) options.onSuccess(res);
                    if (options && options.redirectUrl) window.location.href = options.redirectUrl;
                } catch (err) {
                    if (options && options.onError) options.onError(err);
                }
            });
        },

        getTrustedFormCertUrl: function () {
            const el =
                document.getElementById("xxTrustedFormCertUrl") ||
                document.querySelector('input[name="xxTrustedFormCertUrl"]') ||
                document.querySelector('input[name="trustedform_cert_url"]');

            if (el && el.value) {
                return el.value;
            }

            return null;
        },

        waitForTrustedForm: function (timeout = 3000) {
            return new Promise((resolve) => {
                const start = Date.now();
                const interval = setInterval(() => {
                    const cert = this.getTrustedFormCertUrl();
                    if (cert) {
                        clearInterval(interval);
                        resolve(cert);
                    }
                    if (Date.now() - start > timeout) {
                        clearInterval(interval);
                        resolve(null);
                    }
                }, 100);
            });
        },

        render: async function (containerId, options = {}) {
            if (options.formId && !this.config.formConfig) {
                this.config.formId = options.formId;
                await this.fetchFormConfig();
                await this.loadExternalScripts();
            }

            const container = document.getElementById(containerId);
            if (!container) return;

            const primaryColor = options.primaryColor || '#28a745';
            const bankingBg = '#5fa08d';
            const btnColor = '#24947d';

            // Load TrustedForm script dynamically
            const loadTrustedForm = () => {
                if (window.__trustedFormLoaded) return;
                window.__trustedFormLoaded = true;
                const tf = document.createElement("script");
                tf.type = "text/javascript";
                tf.async = true;
                tf.src = (document.location.protocol === "https:" ? "https://" : "http://") +
                    "api.trustedform.com/trustedform.js?field=xxTrustedFormCertUrl";
                document.head.appendChild(tf);
            };

            // Call it
            loadTrustedForm();

            // Inject Premium Polished CSS
            const styleId = 'pingtree-premium-style';
            let style = document.getElementById(styleId);
            if (!style) {
                style = document.createElement('style');
                style.id = styleId;
                document.head.appendChild(style);
            }
            style.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                .pt-form-wrapper {
                    font-family: 'Inter', sans-serif;
                    max-width: 850px;
                    margin: 0 auto;
                    background: #ffffff;
                    border: 1px solid #eef2f6;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                }
                .pt-header {
                    background: ${primaryColor};
                    color: #fff;
                    text-align: center;
                    padding: 35px 20px;
                    border-top-left-radius: 8px;
                    border-top-right-radius: 8px;
                }
                .pt-header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
                .pt-header p { margin: 10px 0 0; font-size: 15px; opacity: 0.95; font-weight: 400; }
                
                .pt-body { padding: 45px; background: #fff; }
                .pt-main-title { text-align: center; color: #1e293b; font-size: 20px; margin-bottom: 45px; font-weight: 500; }
                
                .pt-section { display: grid; grid-template-cols: 160px 1fr; gap: 40px; margin-bottom: 35px; border-bottom: 1px solid #f1f5f9; padding-bottom: 35px; }
                .pt-section-label { color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-top: 10px; letter-spacing: 0.05em; }
                
                .pt-grid { display: grid; grid-template-cols: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; }
                .pt-group { display: flex; flex-direction: column; gap: 8px; position: relative; }
                .pt-label { font-size: 13px; color: #475569; font-weight: 500; display: flex; align-items: center; gap: 4px; }
                
                .pt-input, .pt-select {
                    padding: 12px 14px;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    font-size: 14px;
                    background: #fff;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-sizing: border-box;
                    width: 100%;
                    color: #1e293b;
                }
                .pt-input::placeholder { color: #94a3b8; }
                .pt-input:hover, .pt-select:hover { border-color: #94a3b8; }
                .pt-input:focus, .pt-select:focus { outline: none; border-color: ${primaryColor}; box-shadow: 0 0 0 3px ${primaryColor}15; background: #fff; }
                
                .pt-input.is-invalid { border-color: #ef4444; background: #fef2f2; }
                .pt-input.is-invalid:focus { box-shadow: 0 0 0 3px #ef444415; }
                .pt-error-hint { font-size: 11px; color: #ef4444; font-weight: 500; margin-top: 4px; display: none; }
                .pt-group.has-error .pt-error-hint { display: block; }
                
                .pt-dob-grid { display: grid; grid-template-cols: 1.2fr 1fr 1.5fr; gap: 12px; }
                
                .pt-subtext { font-size: 11px; color: #64748b; margin-top: 6px; line-height: 1.5; }
                .pt-subtext b { color: #334155; }
                
                .pt-banking { background: ${bankingBg}; padding: 35px; border-radius: 12px; color: #fff; margin-top: 25px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
                .pt-banking h3 { font-size: 15px; font-weight: 700; text-transform: uppercase; margin: 0 0 25px 0; letter-spacing: 0.02em; }
                .pt-banking .pt-label { color: #fff; opacity: 0.95; }
                .pt-banking .pt-input, .pt-banking .pt-select { background: #fff; color: #1e293b; border: none; }
                
                .pt-ssl { display: flex; align-items: center; gap: 10px; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #fff; opacity: 0.9; }
                
                .pt-terms { font-size: 12px; color: rgba(255, 255, 255, 0.9); line-height: 1.7; margin: 25px 0; }
                
                .pt-footer-btn { 
                    background: ${btnColor}; color: #fff; border: none; padding: 18px 45px; 
                    font-weight: 700; font-size: 17px; border-radius: 6px; cursor: pointer; width: 100%; 
                    transition: all 0.3s ease; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .pt-footer-btn:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 6px 8px rgba(0,0,0,0.15); }
                .pt-footer-btn:active { transform: translateY(0); }
                .pt-footer-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

                .pt-success-msg { text-align: center; padding: 80px 20px; }
                .pt-success-msg h2 { color: #10b981; font-size: 28px; margin-bottom: 15px; }
                .pt-success-msg p { color: #4b5563; font-size: 16px; }
                
                @media (max-width: 768px) {
                    .pt-section { grid-template-cols: 1fr; gap: 15px; }
                    .pt-grid { grid-template-cols: 1fr; }
                    .pt-body { padding: 25px; }
                }

                input[type="radio"] { accent-color: ${primaryColor}; width: 18px; height: 18px; cursor: pointer; }
                .radio-label { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #475569; font-size: 14px; }
            `;

            let stateOptions = STATES.map(s => `<option value="${s.val}">${s.label}</option>`).join('');

            container.innerHTML = `
                <div class="pt-form-wrapper">
                    <div class="pt-header">
                        <h1>Your loan is just a few steps away!</h1>
                        <p>Get your loan online as soon as next business day!</p>
                    </div>
                    <form id="ptDesignForm" class="pt-body" novalidate>
                        <h2 class="pt-main-title">Get a decision online in minutes with no paperwork</h2>
                        
                        <!-- Section: YOUR LOAN -->
                        <div class="pt-section">
                            <div class="pt-section-label">Your Loan</div>
                            <div class="pt-grid">
                                <div class="pt-group">
                                    <label class="pt-label">Loan Amount</label>
                                    <select class="pt-select" name="loanAmount" required>
                                        <option value="" disabled selected>Please select</option>
                                        <option value="100">$100 - $500</option>
                                        <option value="500">$500 - $1,000</option>
                                        <option value="1000">$1,000 - $2,500</option>
                                        <option value="2500">$2,500 - $5,000</option>
                                        <option value="5000">$5,000 - $10,000</option>
                                        <option value="10000">$10,000 - $25,000</option>
                                        <option value="25000">$25,000+</option>
                                    </select>
                                    <div class="pt-error-hint">Please select an amount</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">Loan Purpose</label>
                                    <select class="pt-select" name="loanPurpose" required>
                                        <option value="" disabled selected>Please select</option>
                                        <option value="DEBT_CONSOLIDATION">Debt Consolidation</option>
                                        <option value="HOME_IMPROVEMENT">Home Improvement</option>
                                        <option value="MAJOR_PURCHASE">Major Purchase</option>
                                        <option value="EMERGENCY">Emergency Situation</option>
                                        <option value="CAR_REPAIR">Car Repair</option>
                                        <option value="VACATION">Vacation/Travel</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                    <div class="pt-error-hint">Please select a purpose</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">Email Address</label>
                                    <input type="email" class="pt-input" name="Email" placeholder="you@example.com" required>
                                    <div class="pt-error-hint">Please enter a valid email</div>
                                </div>
                            </div>
                        </div>

                        <!-- Section: ABOUT YOU -->
                        <div class="pt-section">
                            <div class="pt-section-label">About You</div>
                            <div class="pt-grid">
                                <div class="pt-group">
                                    <label class="pt-label">First Name</label>
                                    <input type="text" class="pt-input" name="First_Name" placeholder="First Name" required minlength="2">
                                    <div class="pt-error-hint">First name is required</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">Last Name</label>
                                    <input type="text" class="pt-input" name="Last_Name" placeholder="Last Name" required minlength="2">
                                    <div class="pt-error-hint">Last name is required</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">Date of Birth</label>
                                    <div class="pt-dob-grid">
                                        <select class="pt-select" name="dob_mm" required>
                                            <option value="">MM</option>
                                            ${[...Array(12).keys()].map(i => `<option value="${String(i + 1).padStart(2, '0')}">${String(i + 1).padStart(2, '0')}</option>`).join('')}
                                        </select>
                                        <select class="pt-select" name="dob_dd" required>
                                            <option value="">DD</option>
                                            ${[...Array(31).keys()].map(i => `<option value="${String(i + 1).padStart(2, '0')}">${String(i + 1).padStart(2, '0')}</option>`).join('')}
                                        </select>
                                        <select class="pt-select" name="dob_yyyy" required>
                                            <option value="">YYYY</option>
                                            ${[...Array(80).keys()].map(i => `<option value="${2007 - i}">${2007 - i}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div class="pt-error-hint">Must be 18 or older</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">Primary Phone Number <img src="https://img.icons8.com/material-outlined/12/94a3b8/info--v1.png"/></label>
                                    <input type="tel" class="pt-input" name="Phone" placeholder="(000) 000-0000" required>
                                    <div class="pt-error-hint">Valid phone number required</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">Your SSN</label>
                                    <input type="text" class="pt-input" name="SSN" placeholder="XXX-XX-XXXX" required>
                                    <div class="pt-error-hint">Valid SSN required</div>
                                    <div class="pt-subtext">This will NOT affect your credit.<br><b>SSN is used to verify your identity.</b></div>
                                </div>
                            </div>
                        </div>

                        <!-- Section: YOUR ADDRESS -->
                        <div class="pt-section">
                            <div class="pt-section-label">Your Address</div>
                            <div class="pt-grid" style="grid-template-cols: 1fr 1fr;">
                                <div class="pt-group">
                                    <label class="pt-label">Zip code</label>
                                    <input type="text" class="pt-input" name="Zip" placeholder="5 Digits" maxlength="5" required>
                                    <div class="pt-error-hint">5-digit zip required</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">What is your Street Address?</label>
                                    <input type="text" class="pt-input" name="Address" placeholder="123 Main St" required>
                                    <div class="pt-error-hint">Address is required</div>
                                </div>
                            </div>
                        </div>

                        <!-- Section: YOUR INCOME -->
                        <div class="pt-section">
                            <div class="pt-section-label">Your Income</div>
                            <div class="pt-grid">
                                <div class="pt-group">
                                    <label class="pt-label">How often do you get paid?</label>
                                    <select class="pt-select" name="payFrequency" required>
                                        <option value="" disabled selected>Please select</option>
                                        <option value="WEEKLY">Weekly</option>
                                        <option value="BIWEEKLY">Every 2 Weeks</option>
                                        <option value="TWICEMONTHLY">Twice a Month</option>
                                        <option value="MONTHLY">Monthly</option>
                                    </select>
                                    <div class="pt-error-hint">Please select frequency</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">Next Paydate</label>
                                    <input type="date" class="pt-input" name="nextPayDate" required>
                                    <div class="pt-error-hint">Next paydate is required</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">Type of Account</label>
                                    <select class="pt-select" name="bankAccountType" required>
                                        <option value="" disabled selected>Please select</option>
                                        <option value="CHECKING">Checking</option>
                                        <option value="SAVINGS">Savings</option>
                                    </select>
                                    <div class="pt-error-hint">Select account type</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">How do you get paid?</label>
                                    <select class="pt-select" name="incomeMethod" required>
                                        <option value="" disabled selected>Please select</option>
                                        <option value="DIRECT_DEPOSIT">Direct Deposit</option>
                                        <option value="PAPER_CHECK">Paper Check</option>
                                        <option value="CASH">Cash</option>
                                    </select>
                                    <div class="pt-error-hint">Select payment method</div>
                                </div>
                            </div>
                        </div>

                        <!-- Section: YOUR EMPLOYMENT -->
                        <div class="pt-section">
                            <div class="pt-section-label">Your Employment</div>
                            <div class="pt-grid">
                                <div class="pt-group">
                                    <label class="pt-label">Your Income Source</label>
                                    <select class="pt-select" name="incomeType" required>
                                        <option value="" disabled selected>Please select</option>
                                        <option value="EMPLOYMENT">Employment (W2)</option>
                                        <option value="SELF_EMPLOYED">Self-Employed (1099)</option>
                                        <option value="BENEFITS">Benefits (Social Security, etc.)</option>
                                        <option value="MILITARY">Military</option>
                                    </select>
                                    <div class="pt-error-hint">Select income source</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">Are you in the military? <img src="https://img.icons8.com/material-outlined/12/94a3b8/info--v1.png"/></label>
                                    <select class="pt-select" name="isMilitary" required>
                                        <option value="" disabled selected>Please select</option>
                                        <option value="false">No</option>
                                        <option value="true">Yes</option>
                                    </select>
                                    <div class="pt-error-hint">Selection required</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">Your Employer Name</label>
                                    <input type="text" class="pt-input" name="Employer" placeholder="Company Name" required>
                                    <div class="pt-error-hint">Employer is required</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">Your Monthly Net Income</label>
                                    <select class="pt-select" name="incomeNetMonthly" required>
                                        <option value="" disabled selected>Please select</option>
                                        <option value="1200">$800 - $1,500</option>
                                        <option value="2000">$1,500 - $2,500</option>
                                        <option value="3500">$2,500 - $4,500</option>
                                        <option value="5000">$4,500 - $7,000</option>
                                        <option value="8000">$7,000+</option>
                                    </select>
                                    <div class="pt-error-hint">Select income amount</div>
                                </div>
                            </div>
                        </div>

                        <!-- Section: YOUR CREDIT -->
                        <div class="pt-section">
                            <div class="pt-section-label">Your Credit</div>
                            <div class="pt-grid">
                                <div class="pt-group">
                                    <label class="pt-label">Select 'Yes' if you have $10,000+ in unsecured debt... <img src="https://img.icons8.com/material-outlined/12/94a3b8/info--v1.png"/></label>
                                    <div style="display:flex; gap: 24px; margin-top: 8px;">
                                        <label class="radio-label"><input type="radio" name="debtAssistance" value="yes"> Yes</label>
                                        <label class="radio-label"><input type="radio" name="debtAssistance" value="no" checked> No</label>
                                    </div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">What's your approximate credit rating?</label>
                                    <select class="pt-select" name="creditRating" required>
                                        <option value="" disabled selected>Please select</option>
                                        <option value="EXCELLENT">Excellent (720+)</option>
                                        <option value="GOOD">Good (660-719)</option>
                                        <option value="FAIR">Fair (600-659)</option>
                                        <option value="POOR">Poor (Below 600)</option>
                                    </select>
                                    <div class="pt-error-hint">Select rating</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">Do you own your vehicle free and clear? <img src="https://img.icons8.com/material-outlined/12/94a3b8/info--v1.png"/></label>
                                    <div style="display:flex; gap: 24px; margin-top: 8px;">
                                        <label class="radio-label"><input type="radio" name="ownVehicle" value="yes"> Yes</label>
                                        <label class="radio-label"><input type="radio" name="ownVehicle" value="no" checked> No</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Section: FINALLY (Teal Area) -->
                        <div class="pt-section" style="border:none;">
                            <div class="pt-section-label">Finally</div>
                            <div class="pt-banking">
                                <h3>Deposit Loan Into:</h3>
                                <div class="pt-grid" style="grid-template-cols: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 25px; gap: 30px;">
                                    <div class="pt-group">
                                        <label class="pt-label">Select your Bank</label>
                                        <select class="pt-select" name="bankName" required>
                                            <option value="" disabled selected>Please select</option>
                                            <option value="CHASE">JPMorgan Chase</option>
                                            <option value="BOA">Bank of America</option>
                                            <option value="WELLSFARGO">Wells Fargo</option>
                                            <option value="CITI">Citibank</option>
                                            <option value="US_BANK">U.S. Bank</option>
                                            <option value="PNC">PNC Bank</option>
                                            <option value="TRUIST">Truist Bank</option>
                                            <option value="OTHER">Other Bank/Credit Union</option>
                                        </select>
                                        <div class="pt-error-hint" style="color:#ffd0d0;">Selection required</div>
                                    </div>
                                    <div class="pt-group">
                                        <label class="pt-label">Select your Bank's State</label>
                                        <div style="display:flex; align-items:center; gap: 15px;">
                                            <select class="pt-select" name="bankState" required style="flex:1;">
                                                <option value="" disabled selected>Please select</option>
                                                ${stateOptions}
                                            </select>
                                            <div class="pt-ssl">
                                                <img src="https://img.icons8.com/material-outlined/32/ffffff/lock--v1.png" style="width:24px;"/>
                                                DATA ENCRYPTED<br>WITH 256 BIT SSL
                                            </div>
                                        </div>
                                        <div class="pt-error-hint" style="color:#ffd0d0;">Selection required</div>
                                    </div>
                                    <div class="pt-group">
                                        <label class="pt-label">ABA/Routing Number <img src="https://img.icons8.com/material-outlined/12/ffffff/info--v1.png"/></label>
                                        <input type="text" class="pt-input" name="routingNumber" placeholder="9 Digits" maxlength="9" required>
                                        <div class="pt-error-hint" style="color:#ffd0d0;">9-digit routing number required</div>
                                    </div>
                                    <div class="pt-group">
                                        <label class="pt-label">Account Number <img src="https://img.icons8.com/material-outlined/12/ffffff/info--v1.png"/></label>
                                        <input type="text" class="pt-input" name="accountNumber" placeholder="Account Number" minlength="4" required>
                                        <div class="pt-error-hint" style="color:#ffd0d0;">Account number required</div>
                                    </div>
                                </div>
                                
                                <div class="pt-terms">
                                    By clicking "AGREE AND SUBMIT" I acknowledge that I have read and agree to the terms...
                                    I also consent to receive marketing and other texts or calls from Lendyou...
                                </div>
                                
                                <button type="submit" class="pt-footer-btn" id="pt-submit-btn">Agree and Submit</button>
                            </div>
                        </div>
                        
                        <div id="pt-form-status"></div>
                    </form>
                </div>
            `;

            // VALDIATION & MASKING LOGIC
            const form = document.getElementById('ptDesignForm');
            const inputs = form.querySelectorAll('input, select');

            const validateField = (field) => {
                const group = field.closest('.pt-group');
                let isValid = field.checkValidity();

                // Custom Regex Validations
                if (isValid) {
                    if (field.name === 'Email') {
                        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
                    } else if (field.name === 'Phone') {
                        isValid = field.value.replace(/\D/g, '').length === 10;
                    } else if (field.name === 'SSN') {
                        isValid = field.value.replace(/\D/g, '').length === 9;
                    } else if (field.name === 'Zip' || field.name === 'routingNumber') {
                        isValid = /^\d+$/.test(field.value) && field.value.length === Number(field.getAttribute('maxlength'));
                    }
                }

                if (!isValid) {
                    group.classList.add('has-error');
                    field.classList.add('is-invalid');
                } else {
                    group.classList.remove('has-error');
                    field.classList.remove('is-invalid');
                }
                return isValid;
            };

            // Masking Functions
            const maskPhone = (v) => {
                let x = v.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
                return !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
            };

            const maskSSN = (v) => {
                let x = v.replace(/\D/g, '').match(/(\d{0,3})(\d{0,2})(\d{0,4})/);
                return !x[2] ? x[1] : x[1] + '-' + x[2] + (x[3] ? '-' + x[3] : '');
            };

            inputs.forEach(input => {
                input.addEventListener('input', (e) => {
                    if (input.name === 'Phone') e.target.value = maskPhone(e.target.value);
                    if (input.name === 'SSN') e.target.value = maskSSN(e.target.value);
                    if (input.classList.contains('is-invalid')) validateField(input);
                });
                input.addEventListener('blur', () => validateField(input));
            });

            form.onsubmit = async (e) => {
                e.preventDefault();
                let isFormValid = true;
                inputs.forEach(input => { if (!validateField(input)) isFormValid = false; });

                if (!isFormValid) {
                    const firstError = form.querySelector('.is-invalid');
                    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }

                const btn = document.getElementById('pt-submit-btn');
                const status = document.getElementById('pt-form-status');

                btn.disabled = true;
                btn.innerText = 'Processing your application...';

                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                data.dob = `${data.dob_yyyy}-${data.dob_mm}-${data.dob_dd}`;

                // Add Tracking Metadata
                if (options.formId) data.form_id = options.formId;
                data.source_url = window.location.href;
                data.source_domain = window.location.host;

                // Wait for TrustedForm certificate
                const tfCert = await this.waitForTrustedForm();
                if (tfCert) {
                    data.trusted_form_url = tfCert;
                    const match = tfCert.match(/trustedform.com\/([^\/?#]+)/);
                    if (match) {
                        data.trusted_form_token = match[1];
                    }
                } else {
                    console.warn("TrustedForm certificate not ready");
                }

                try {
                    const res = await this.submit(data);

                    // Handle Redirection if URL is provided (Sold redirect or Reject redirect)
                    if (res.redirect_url) {
                        form.innerHTML = `
                            <div class="pt-success-msg">
                                <h2>${res.status === 'sold' ? 'Redirecting...' : 'Thank You!'}</h2>
                                <p>${res.status === 'sold' ? 'Hold on! We are taking you to your next step.' : 'Redirecting you to our partner page...'}</p>
                            </div>
                        `;
                        setTimeout(() => {
                            window.location.href = res.redirect_url;
                        }, 1500);
                        return;
                    }

                    // Otherwise show success / thank you
                    form.innerHTML = `
                        <div class="pt-success-msg">
                            <h2>${res.status === 'sold' ? 'Application Success!' : 'Thank You!'}</h2>
                            <p>Reference ID: <b>${res.lead_id}</b></p>
                            <p style="margin-top:20px;">
                                ${res.status === 'sold'
                            ? "Your application was accepted! We'll contact you shortly via email with the next steps."
                            : "Thank you for your submission. Our team will review your application and get back to you if there's a match."}
                            </p>
                        </div>
                    `;
                } catch (err) {
                    btn.disabled = false;
                    btn.innerText = 'Agree and Submit';
                    status.innerHTML = `<div style="color:#ef4444; margin-top:20px; text-align:center; font-weight:600;">${err.message || 'Error submitting lead. Please check your data and try again.'}</div>`;
                }
            };
        }
    };

    window.PingTree = PingTree;
})();
