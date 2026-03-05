(function () {
    const STATES = [
        { val: "Alabama", label: "Alabama" }, { val: "Alaska", label: "Alaska" }, { val: "Arizona", label: "Arizona" }, { val: "Arkansas", label: "Arkansas" },
        { val: "California", label: "California" }, { val: "Colorado", label: "Colorado" }, { val: "Connecticut", label: "Connecticut" }, { val: "Delaware", label: "Delaware" },
        { val: "Florida", label: "Florida" }, { val: "Georgia", label: "Georgia" }, { val: "Hawaii", label: "Hawaii" }, { val: "Idaho", label: "Idaho" },
        { val: "Illinois", label: "Illinois" }, { val: "Indiana", label: "Indiana" }, { val: "Iowa", label: "Iowa" }, { val: "Kansas", label: "Kansas" },
        { val: "Kentucky", label: "Kentucky" }, { val: "Louisiana", label: "Louisiana" }, { val: "Maine", label: "Maine" }, { val: "Maryland", label: "Maryland" },
        { val: "Massachusetts", label: "Massachusetts" }, { val: "Michigan", label: "Michigan" }, { val: "Minnesota", label: "Minnesota" }, { val: "Mississippi", label: "Mississippi" },
        { val: "Missouri", label: "Missouri" }, { val: "Montana", label: "Montana" }, { val: "Nebraska", label: "Nebraska" }, { val: "Nevada", label: "Nevada" },
        { val: "New Hampshire", label: "New Hampshire" }, { val: "New Jersey", label: "New Jersey" }, { val: "New Mexico", label: "New Mexico" }, { val: "New York", label: "New York" },
        { val: "North Carolina", label: "North Carolina" }, { val: "North Dakota", label: "North Dakota" }, { val: "Ohio", label: "Ohio" }, { val: "Oklahoma", label: "Oklahoma" },
        { val: "Oregon", label: "Oregon" }, { val: "Pennsylvania", label: "Pennsylvania" }, { val: "Rhode Island", label: "Rhode Island" }, { val: "South Carolina", label: "South Carolina" },
        { val: "South Dakota", label: "South Dakota" }, { val: "Tennessee", label: "Tennessee" }, { val: "Texas", label: "Texas" }, { val: "Utah", label: "Utah" },
        { val: "Vermont", label: "Vermont" }, { val: "Virginia", label: "Virginia" }, { val: "Washington", label: "Washington" }, { val: "West Virginia", label: "West Virginia" },
        { val: "Wisconsin", label: "Wisconsin" }, { val: "Wyoming", label: "Wyoming" }
    ];

    const BANK_DATA = {
        'Bancorp': { 'All Locations': '031101114' },
        'Bank of America': {
            'Alabama': '051000017', 'Alaska': '051000017', 'Arizona': '122101706', 'Arkansas': '082000073', 'California': '121000358',
            'Colorado': '123103716', 'Connecticut': '011900571', 'Delaware': '031202084', 'District of Columbia': '054001204', 'Florida East': '063000047',
            'Florida West': '063100277', 'Georgia': '061000052', 'Hawaii': '051000017', 'Idaho': '123103716', 'Illinois': '081904808',
            'Indiana': '071214579', 'Iowa': '073000176', 'Kansas': '101100045', 'Kentucky': '051000017', 'Louisiana': '051000017',
            'Maine': '011200365', 'Maryland': '052001633', 'Massachusetts': '011000138', 'Michigan': '051000017', 'Minnesota': '071214579',
            'Mississippi': '051000017', 'Missouri East': '081000032', 'Missouri West': '101000035', 'Montana': '051000017', 'Nebraska': '051000017',
            'Nevada': '122400724', 'New Hampshire': '011400495', 'New Jersey': '021200339', 'New Mexico': '107000327', 'New York': '021000322',
            'North Carolina': '053000196', 'North Dakota': '051000017', 'Ohio': '051000017', 'Oklahoma': '103000017', 'Oregon': '323070380',
            'Pennsylvania': '031202084', 'Rhode Island': '011500010', 'South Carolina': '053904483', 'South Dakota': '051000017', 'Tennessee': '064000020',
            'Texas, North': '111000025', 'Texas, South': '113000023', 'Utah': '051000017', 'Vermont': '051000017', 'Virginia': '051000017',
            'Washington': '125000024', 'West Virginia': '051000017', 'Wisconsin': '051000017', 'Wyoming': '051000017'
        },
        'Branch Bank': {
            'Alabama': '062203984', 'District of Columbia': '054001547', 'Florida': '263191387', 'Georgia': '061113415', 'Indiana': '083974289',
            'Kentucky': '083900680', 'Maryland': '055003308', 'North Carolina': '053101121', 'South Carolina': '053201607', 'Tennessee': '064208165',
            'Texas': '111017694', 'Virginia': '051404260', 'West Virginia': '051503394'
        },
        'Bonneville Bank': { 'All Locations': '124302529' },
        'Chase Bank': {
            'Arizona': '122100024', 'California': '322271627', 'Colorado': '102001017', 'Connecticut': '021100361', 'Florida': '267084131',
            'Georgia': '061092387', 'Idaho': '123271978', 'Illinois': '071000013', 'Indiana': '074000010', 'Kentucky': '083000137',
            'Louisiana': '065400137', 'Michigan': '072000326', 'Nevada': '322271627', 'New Jersey': '021202337', 'New York – Downstate': '021000021',
            'New York – Upstate': '022300173', 'Ohio': '044000037', 'Oklahoma': '103000648', 'Oregon': '325070760', 'Texas': '111000614',
            'Utah': '124001545', 'Washington': '325070760', 'West Virginia': '051900366', 'Wisconsin': '075000019'
        },
        'Fifth Third Bank': {
            'Florida - Central': '063109935', 'Florida - North': '063113057', 'Florida - South': '067091719', 'Florida - Tampa': '063103915',
            'Georgia': '263190812', 'Illinois': '071923909', 'Indiana - Central': '074908594', 'Indiana - Southern': '086300041',
            'Kentucky - Central': '042101190', 'Kentucky - Northern': '042100230', 'Kentucky - Southwestern': '083002342', 'Michigan - Eastern': '072405455',
            'Michigan - Northern': '072401404', 'Michigan - Western': '072400052', 'Missouri': '081019104', 'North Carolina': '053100737',
            'Ohio - Cincinnati': '042000314', 'Ohio - Columbus': '044002161', 'Ohio - Northeastern': '041002711', 'Ohio - Northwestern': '041200050',
            'Ohio - Southern': '042207735', 'Ohio - Western': '042202196', 'Pennsylvania': '043018868', 'Tennessee': '064103833'
        },
        'First California Bank': { 'All Locations': '122244184' },
        'First National Bank Texas': { 'Arizona': '122106455', 'New Mexico': '122106455', 'Texas': '111906271' },
        'M&T Bank': {
            'Delaware': '031302955', 'District of Columbia': '052000113', 'Maryland': '052000113', 'New York': '022000046',
            'Pennsylvania': '031302955', 'Virginia': '052000113', 'West Virginia': '052000113'
        },
        'MetaBank': { 'MetaBank': '073972181', 'MetaBank Memphis': '084003997', 'Brookins Division - MetaBank': '291471024' },
        'Navy Federal Credit Union': { 'All Locations': '256074974' },
        'PNC Bank': {
            'Delaware': '031100089', 'Florida': '267084199', 'Greater Washington Area': '054000030', 'Illinois': '071921891', 'Indiana': '074909564',
            'Kentucky': '083000108', 'Kentucky - Northern': '083000108', 'New Jersey': '031207607', 'Michigan': '041215537', 'Missouri': '081000210',
            'Ohio': '042000398', 'Ohio Alternate': '042000398', 'Ohio - Youngstown': '043300738', 'Pennsylvania - Central, North': '031000053',
            'Pennsylvania - Central, South': '031000053', 'Pennsylvania - Northeast': '031300012', 'Pennsylvania - Northwest': '031300012',
            'Pennsylvania - Philadelphia': '031000053', 'Pennsylvania - Pittsburgh': '043300738', 'Wisconsin': '071921891'
        },
        'Regions Bank': {
            'Alabama': '062005690', 'Arkansas': '082000109', 'Florida': '063104668', 'Georgia': '061101375', 'Illinois': '071122661',
            'Indiana': '074014213', 'Iowa': '073902766', 'Kentucky': '083901744', 'Louisiana': '065303360', 'Mississippi': '065303360',
            'Missouri': '081003476', 'North Carolina': '053012029', 'South Carolina': '053012029', 'Tennessee': '064000017', 'Texas': '111900659', 'Virginia': '051009296'
        },
        'SunTrust Bank': { 'All Locations': '061000104' },
        'TD Bank': {
            'Connecticut': '011103093', 'Delaware': '031201360', 'District of Columbia': '054001204', 'Florida': '067014822', 'Maine': '011200365',
            'Maryland': '054001204', 'Massachusetts': '011400071', 'New Hampshire': '011400495', 'New Jersey': '031201360', 'New York - Metro': '021410928',
            'New York - Upstate': '021302567', 'North Carolina': '053902197', 'Pennsylvania': '036001808', 'Rhode Island': '011500010',
            'South Carolina': '053902197', 'Vermont': '011600033', 'Virginia': '054001204'
        },
        'USAA Federal Savings Bank': { 'All Locations': '314074269' },
        'US Bank': {
            'Arizona': '122235821', 'Arkansas': '082000549', 'California - Northern': '121122676', 'California - Southern': '122235821',
            'Colorado - Aspen': '102000021', 'Colorado - All other areas': '102000021', 'Idaho': '123103716', 'Illinois - Northern': '071004200',
            'Illinois - Southern': '071004200', 'Indiana': '074900783', 'Iowa - Council Bluffs': '104000016', 'Iowa - All other areas': '104000016',
            'Kansas': '101000019', 'Kentucky - Northern': '083900363', 'Kentucky - Western': '083900363', 'Minnesota - East Grand Forks': '091000022',
            'Minnesota - Moorhead': '091000022', 'Minnesota - All other areas': '091000022', 'Missouri': '081000210', 'Montana': '092905249',
            'Nebraska': '104000016', 'Nevada': '122400724', 'New Mexico': '107000327', 'North Dakota': '091300023', 'Ohio - Cleveland': '041000124',
            'Ohio - All other areas': '041000124', 'Oregon': '123000220', 'South Dakota': '091300023', 'Tennessee': '064000017', 'Utah': '124085066',
            'Washington': '125000024', 'Wisconsin': '075900575', 'Wyoming': '102000021', 'All other states': '091000022'
        },
        'Wells Fargo': {
            'Alabama': '062000080', 'Alaska': '125000024', 'Arizona': '122105278', 'Arkansas': '082000073', 'California': '121000248',
            'Colorado': '102000076', 'Connecticut': '011400071', 'Delaware': '031100351', 'District of Columbia': '054001204', 'Florida': '063107513',
            'Georgia': '061000227', 'Hawaii': '121301025', 'Idaho': '123103716', 'Illinois': '071101307', 'Indiana': '074900275',
            'Iowa': '073902766', 'Kansas': '101000019', 'Kentucky': '083900363', 'Louisiana': '065000090', 'Maine': '011200365',
            'Maryland': '054001204', 'Massachusetts': '011400071', 'Michigan': '072403004', 'Minnesota': '091000022', 'Mississippi': '065000090',
            'Missouri': '081000032', 'Montana': '092905249', 'Nebraska': '104000016', 'Nevada': '122400724', 'New Hampshire': '011400495',
            'New Jersey': '021200339', 'New Mexico': '107000327', 'New York': '026005092', 'North Carolina': '053000196', 'North Dakota': '091300023',
            'Ohio': '041000124', 'Oklahoma': '103000017', 'Oregon': '123000220', 'Pennsylvania': '031000503', 'Rhode Island': '011500010',
            'South Carolina': '053000196', 'South Dakota': '091300023', 'Tennessee': '064000020', 'Texas': '111900659', 'Texas - El Paso': '112000066',
            'Utah': '124085066', 'Vermont': '011600033', 'Virginia': '051000017', 'Washington': '125000024', 'West Virginia': '051000017',
            'Wisconsin': '075900575', 'Wyoming': '102000021'
        }
    };

    var PingTree = {
        config: {
            apiKey: null,
            formId: null,
            formConfig: null,
            publicIP: null,
            endpoint: 'https://pingtree.vellko.com/api/v1/public/leads/ingest'
        },

        init: async function (apiKey, options = {}) {
            this.config.apiKey = apiKey;

            // Auto-detect endpoint if not provided and not hardcoded
            if (!options.endpoint && this.config.endpoint.includes('vellko.com')) {
                const scriptEl = document.querySelector('script[src*="/static/pingtree.js"]');
                if (scriptEl && scriptEl.src) {
                    try {
                        const scriptOrigin = new URL(scriptEl.src).origin;
                        this.config.endpoint = `${scriptOrigin}/api/v1/public/leads/ingest`;
                    } catch (e) {
                        console.warn('PingTree: Could not auto-detect endpoint from script src');
                    }
                }
            } else if (options.endpoint) {
                this.config.endpoint = options.endpoint;
            }


            // Capture Public IP early
            this.getPublicIP();

            if (options.formId) {
                this.config.formId = options.formId;
                await this.fetchFormConfig();
                await this.loadExternalScripts();
            }
        },

        getPublicIP: async function () {
            try {
                const res = await fetch('https://api.ipify.org?format=json');
                const data = await res.json();
                this.config.publicIP = data.ip;
            } catch (e) {
                console.warn('PingTree: Could not capture client IP via JS', e);
            }
        },

        fetchFormConfig: async function () {
            if (!this.config.formId) return;
            try {
                // Derived from endpoint
                const baseApi = this.config.endpoint.split('/public/')[0];
                const url = `${baseApi}/public/forms/${this.config.formId}`;

                const response = await fetch(url);
                if (response.ok) {
                    this.config.formConfig = await response.json();
                } else {
                    console.error(`PingTree: Failed to fetch form config. Status: ${response.status}`, url);
                }
            } catch (e) {
                console.error("PingTree: Exception during fetchFormConfig", e);
            }
        },

        fetchBankDetails: async function (bankName) {
            if (!bankName) return null;
            try {
                const urls = [];
                const seen = new Set();
                const addUrl = (url) => {
                    if (!url || seen.has(url)) return;
                    seen.add(url);
                    urls.push(url);
                };

                if (this.config.endpoint && this.config.endpoint.includes('/public/')) {
                    const baseApi = this.config.endpoint.split('/public/')[0];
                    addUrl(`${baseApi}/public/banks/lookup?bank_name=${encodeURIComponent(bankName)}`);
                }

                // Fallback 1: same host as frontend.
                addUrl(`${window.location.origin}/api/v1/public/banks/lookup?bank_name=${encodeURIComponent(bankName)}`);

                // Fallback 2: same host that served pingtree.js (common local setup: :8000).
                const scriptEl = document.querySelector('script[src*="/static/pingtree.js"]');
                if (scriptEl && scriptEl.src) {
                    try {
                        const scriptOrigin = new URL(scriptEl.src).origin;
                        addUrl(`${scriptOrigin}/api/v1/public/banks/lookup?bank_name=${encodeURIComponent(bankName)}`);
                    } catch (_) {
                        // no-op
                    }
                }

                for (const url of urls) {
                    try {
                        const response = await fetch(url);
                        if (!response.ok) continue;
                        const data = await response.json();
                        if (data && (data.state || data.routing_number)) return data;
                    } catch (lookupErr) {
                        console.warn("PingTree: Bank lookup attempt failed", url, lookupErr);
                    }
                }
                return null;
            } catch (e) {
                console.warn("PingTree: Failed to fetch bank lookup details", e);
                return null;
            }
        },

        fetchZipDetails: async function (zip) {
            if (!zip || zip.length !== 5) return null;
            try {
                const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
                if (!response.ok) return null;
                const data = await response.json();
                if (data && data.places && data.places.length > 0) {
                    return {
                        city: data.places[0]['place name'],
                        state: data.places[0]['state abbreviation'],
                        fullState: data.places[0]['state']
                    };
                }
            } catch (e) {
                console.warn("PingTree: Zip lookup failed", e);
            }
            return null;
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

            for (const config of this.config.formConfig.click_id_configs) {
                let val = null;
                if (config.method === 'url') {
                    const urlParams = new URLSearchParams(window.location.search);
                    val = urlParams.get(config.param_name || config.key);
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

                } else if (config.method === 'custom' && config.param_name) {
                    try {
                        val = eval(config.param_name);
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

                // Consolidate all captured click/rtk values into a single 'click_id' field
                const clickIdValues = Object.values(clickIds).filter(v => v);
                if (clickIdValues.length > 0) {
                    data.click_id = clickIdValues[0];
                }
            }

            // Inject Client-Side captured IP if available
            if (this.config.publicIP) {
                data.Ip_Address = this.config.publicIP;
            }

            // Capture User-Agent
            data.User_Agent = navigator.userAgent;

            // Capture Tracking Parameters from URL
            const urlParams = new URLSearchParams(window.location.search);
            const trackingParams = [
                'gclid', 'fbp', 'fbc', 'utm_source', 'utm_medium', 'utm_campaign',
                'utm_term', 'utm_content', 'eventid', 'unique_id', 'subsource', 'source'
            ];
            trackingParams.forEach(param => {
                data[param] = urlParams.get(param) || "";
            });


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
            const container = document.getElementById(containerId);
            if (!container) return;

            // Update config from options if provided
            if (options.apiKey) this.config.apiKey = options.apiKey;
            if (options.endpoint) this.config.endpoint = options.endpoint;
            if (options.formId) this.config.formId = options.formId;
            if (options.style) this.config.style = options.style;

            // 1. Instant Premium Loader Injection
            const loaderHtml = `
                <div class="pt-premium-loader-wrapper">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                        .pt-premium-loader {
                            font-family: 'Inter', sans-serif;
                            background: #ffffff;
                            border: 1px solid #e2e8f0;
                            border-radius: 16px;
                            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
                            padding: 60px 40px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                            max-width: 900px;
                            margin: 0 auto;
                        }
                        .pt-spinner-container { position: relative; width: 80px; height: 80px; margin-bottom: 24px; }
                        .pt-spinner-track { position: absolute; inset: 0; border: 4px solid #f1f5f9; border-radius: 50%; }
                        .pt-spinner-ring { position: absolute; inset: 0; border: 4px solid transparent; border-top-color: #14b8a6; border-radius: 50%; animation: pt-spin 1s linear infinite; }
                        .pt-spinner-center { position: absolute; inset: 12px; background: #f0fdfa; border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: pt-pulse 2s ease-in-out infinite; }
                        .pt-spinner-icon { width: 24px; height: 24px; color: #0d9488; }
                        .pt-loader-title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
                        .pt-loader-subtitle { font-size: 13px; color: #64748b; max-width: 320px; margin: 0 0 20px 0; line-height: 1.5; }
                        .pt-status-badge { display: flex; align-items: center; gap: 10px; padding: 6px 14px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 100px; }
                        .pt-dots { display: flex; gap: 3px; }
                        .pt-dot { width: 5px; height: 5px; background: #14b8a6; border-radius: 50%; animation: pt-bounce 1.4s infinite ease-in-out both; }
                        .pt-dot:nth-child(2) { animation-delay: 0.16s; }
                        .pt-dot:nth-child(3) { animation-delay: 0.32s; }
                        .pt-secure-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 5px; }
                        @keyframes pt-spin { to { transform: rotate(360deg); } }
                        @keyframes pt-pulse { 0%, 100% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.05); opacity: 1; } }
                        @keyframes pt-bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
                    </style>
                    <div class="pt-premium-loader">
                        <div class="pt-spinner-container">
                            <div class="pt-spinner-track"></div>
                            <div class="pt-spinner-ring"></div>
                            <div class="pt-spinner-center">
                                <svg class="pt-spinner-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>
                        <h2 class="pt-loader-title">Establishing Secure Connect</h2>
                        <p class="pt-loader-subtitle">Preparing your personalized application form...</p>
                        <div class="pt-status-badge">
                            <div class="pt-dots">
                                <div class="pt-dot"></div><div class="pt-dot"></div><div class="pt-dot"></div>
                            </div>
                            <span class="pt-secure-label">Encrypted Connection</span>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML = loaderHtml;

            // 2. Fetch Config & Scripts (Async)
            if (options.formId && !this.config.formConfig) {
                this.config.formId = options.formId;
                await this.fetchFormConfig();
                await this.loadExternalScripts();
            }

            const primaryColor = options.primaryColor || '#28a745';

            // Override style from formConfig if not explicitly passed in options
            const formStyle = options.style || (this.config.formConfig ? this.config.formConfig.style : 'multi-step');

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
                    max-width: 900px;
                    margin: 0 auto;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
                    overflow: hidden;
                }
                .pt-form-single-step .pt-section {
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 24px;
                    margin-bottom: 24px;
                }
                .pt-form-single-step .pt-section-no-border {
                    border-bottom: none;
                    padding-bottom: 0;
                    margin-bottom: 0;
                }
                .pt-header {
                    background: ${primaryColor};
                    color: #fff;
                    text-align: center;
                    padding: 40px 24px;
                }
                .pt-header h1 { margin: 0; font-size: 30px; line-height: 1.2; font-weight: 700; letter-spacing: -0.02em; }
                .pt-header p { margin: 12px 0 0; font-size: 15px; opacity: 0.95; }

                .pt-body { padding: 40px; background: #ffffff; }
                .pt-main-title {
                    text-align: center;
                    color: #0f172a;
                    font-size: 22px;
                    margin: 0 0 36px;
                    font-weight: 600;
                    letter-spacing: -0.01em;
                }
                .pt-step-meta {
                    margin: 0;
                    color: #64748b;
                    font-size: 13px;
                    font-weight: 600;
                    letter-spacing: 0.01em;
                }
                .pt-progress-wrap {
                    margin: -18px 0 26px;
                }
                .pt-progress-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    gap: 12px;
                    margin-bottom: 8px;
                }
                .pt-step-percent {
                    color: #334155;
                    font-size: 13px;
                    font-weight: 600;
                }
                .pt-progress-track {
                    width: 100%;
                    height: 10px;
                    border-radius: 999px;
                    background: #e2e8f0;
                    overflow: hidden;
                }
                .pt-progress-fill {
                    height: 100%;
                    width: 0%;
                    border-radius: 999px;
                    background: ${primaryColor};
                    transition: width 0.25s ease;
                }

                .pt-section {
                    display: grid;
                    grid-template-columns: 170px 1fr;
                    gap: 28px;
                    margin-bottom: 28px;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 28px;
                }
                .pt-step-hidden { display: none; }
                .pt-section-no-border { border: none; padding-bottom: 0; }
                .pt-section-label {
                    color: #64748b;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-top: 8px;
                    letter-spacing: 0.08em;
                }

                .pt-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
                .pt-grid-two-col { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                .pt-grid-wide { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 24px; }

                .pt-group { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
                .pt-label { font-size: 13px; color: #334155; font-weight: 600; display: flex; align-items: center; gap: 6px; line-height: 1.35; }

                .pt-input, .pt-select {
                    height: 46px;
                    padding: 0 14px;
                    border: 1px solid #cbd5e1;
                    border-radius: 10px;
                    font-size: 14px;
                    background: #ffffff;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
                    box-sizing: border-box;
                    width: 100%;
                    color: #0f172a;
                }
                .pt-input::placeholder { color: #94a3b8; }
                .pt-input:hover, .pt-select:hover { border-color: #94a3b8; }
                .pt-input:focus, .pt-select:focus {
                    outline: none;
                    border-color: ${primaryColor};
                    box-shadow: 0 0 0 3px ${primaryColor}22;
                    background: #ffffff;
                }

                .pt-input.is-invalid, .pt-select.is-invalid { border-color: #ef4444; background: #fff5f5; }
                .pt-input.is-invalid:focus, .pt-select.is-invalid:focus { box-shadow: 0 0 0 3px #ef444422; }
                .pt-error-hint { font-size: 12px; color: #dc2626; font-weight: 500; margin-top: 2px; display: none; line-height: 1.3; }
                .pt-group.has-error .pt-error-hint { display: block; }
                .pt-error-hint-light { color: #fee2e2; }

                .pt-dob-grid { display: grid; grid-template-columns: 1.2fr 1fr 1.5fr; gap: 10px; }
                .pt-subtext { font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.5; }
                .pt-subtext b { color: #334155; }

                .pt-radio-row { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 6px; }
                input[type="radio"] { accent-color: ${primaryColor}; width: 18px; height: 18px; cursor: pointer; }
                .radio-label { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: #334155; font-size: 14px; }

                .pt-banking {
                    background: ${primaryColor};
                    padding: 28px;
                    border-radius: 14px;
                    color: #ffffff;
                    margin-top: 6px;
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 10px 24px rgba(15, 23, 42, 0.2);
                    filter: brightness(0.9);
                }
                .pt-banking h3 {
                    font-size: 15px;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin: 0 0 18px;
                    letter-spacing: 0.04em;
                }
                .pt-banking .pt-label { color: #f8fafc; }
                .pt-banking .pt-input, .pt-banking .pt-select {
                    background: #ffffff;
                    color: #0f172a;
                    border: 1px solid #dbe3ea;
                }
                .pt-banking .pt-input:focus, .pt-banking .pt-select:focus { border-color: ${primaryColor}; box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3); }

                .pt-bank-state-row { display: flex; align-items: center; gap: 14px; }
                .pt-bank-state-select { flex: 1; }
                .pt-ssl { display: flex; align-items: center; gap: 10px; font-size: 10px; text-transform: uppercase; font-weight: 700; color: #f8fafc; opacity: 0.9; line-height: 1.35; white-space: nowrap; }
                .pt-ssl-icon { width: 24px; }

                .pt-terms { font-size: 12px; color: rgba(255, 255, 255, 0.92); line-height: 1.7; margin: 18px 0 20px; }
                .pt-step-nav {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 2px 0 22px;
                    gap: 12px;
                }
                .pt-step-btn {
                    border: 1px solid #cbd5e1;
                    background: #fff;
                    color: #0f172a;
                    border-radius: 10px;
                    padding: 11px 16px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .pt-step-btn:hover { border-color: #94a3b8; background: #f8fafc; }
                .pt-step-btn:focus-visible { outline: 3px solid ${primaryColor}22; outline-offset: 1px; }
                .pt-step-btn-primary {
                    background: ${primaryColor};
                    border-color: ${primaryColor};
                    color: #fff;
                    margin-left: auto;
                }
                .pt-step-btn-primary:hover { 
                    background: ${primaryColor} !important;
                    border-color: ${primaryColor} !important;
                    filter: brightness(1.1); 
                }

                .pt-footer-btn {
                    background: #ffffff;
                    color: ${primaryColor};
                    border: none;
                    padding: 16px 24px;
                    font-weight: 700;
                    font-size: 16px;
                    border-radius: 10px;
                    cursor: pointer;
                    width: 100%;
                    transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                }
                .pt-footer-btn:hover { filter: brightness(1.05); transform: translateY(-1px); box-shadow: 0 12px 24px rgba(8, 47, 73, 0.25); }
                .pt-footer-btn:active { transform: translateY(0); }
                .pt-footer-btn:focus-visible { outline: 3px solid rgba(255, 255, 255, 0.65); outline-offset: 2px; }
                .pt-footer-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; box-shadow: none; }

                .pt-success-msg { text-align: center; padding: 72px 20px; }
                .pt-success-msg h2 { color: #10b981; font-size: 30px; margin-bottom: 14px; letter-spacing: -0.02em; }
                .pt-success-msg p { color: #475569; font-size: 16px; margin: 0; line-height: 1.55; }
                .pt-success-copy { margin-top: 20px; }
                .pt-status-error { color: #dc2626; margin-top: 20px; text-align: center; font-weight: 600; }


                @media (max-width: 900px) {
                    .pt-section { grid-template-columns: 1fr; gap: 14px; }
                    .pt-section-label { margin-top: 0; }
                    .pt-grid-two-col { grid-template-columns: 1fr; }
                    .pt-bank-state-row { flex-direction: column; align-items: flex-start; }
                }
                @media (max-width: 768px) {
                    .pt-body { padding: 24px; }
                    .pt-header { padding: 32px 20px; }
                    .pt-header h1 { font-size: 26px; }
                    .pt-main-title { font-size: 20px; margin-bottom: 28px; }
                    .pt-progress-wrap { margin-top: -12px; margin-bottom: 20px; }
                    .pt-grid, .pt-grid-wide { grid-template-columns: 1fr; gap: 16px; }
                    .pt-dob-grid { grid-template-columns: 1fr 1fr 1fr; }
                    .pt-banking { padding: 22px; }
                    .pt-ssl { white-space: normal; }
                }
                @media (max-width: 520px) {
                    .pt-form-wrapper { border-radius: 12px; }
                    .pt-body { padding: 18px; }
                    .pt-header h1 { font-size: 22px; }
                    .pt-progress-head { align-items: center; }
                    .pt-step-meta, .pt-step-percent { font-size: 12px; }
                    .pt-step-nav { flex-wrap: nowrap; }
                    .pt-step-btn { width: auto; flex: 1; }
                    .pt-step-btn-primary { margin-left: 0; }
                    .pt-dob-grid { grid-template-columns: 1fr; }
                }

                .pt-zip-success {
                    margin-top: 10px;
                    padding: 12px;
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 8px;
                    display: flex;
                    gap: 12px;
                    font-size: 13px;
                    color: #166534;
                    font-weight: 600;
                }
                .pt-zip-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .pt-zip-item::after {
                    content: "";
                    width: 4px;
                    height: 4px;
                    background: #86efac;
                    border-radius: 50%;
                }
                .pt-zip-item:last-child::after { display: none; }
            `;

            let stateOptions = STATES.map(s => `<option value="${s.val}">${s.label}</option>`).join('');
            const siteOrigin = window.location.origin;
            const privacyUrl = `${siteOrigin}/privacy-policy`;
            const termsUrl = `${siteOrigin}/terms-and-conditions`;

            container.innerHTML = `
                <div class="pt-form-wrapper">
                    <div class="pt-header">
                        <h1>Your loan is just a few steps away!</h1>
                        <p>Get your loan online as soon as next business day!</p>
                    </div>
                    <form id="ptDesignForm" class="pt-body ${formStyle === 'single-step' ? 'pt-form-single-step' : ''}" novalidate>
                        <h2 class="pt-main-title">Get a decision online in minutes with no paperwork</h2>
                            <div id="pt-progress-container" class="pt-progress-wrap" ${formStyle === 'single-step' ? 'style="display:none;"' : ''}>
                                <div class="pt-progress-head">
                                    <div id="pt-step-meta" class="pt-step-meta"></div>
                                    <div id="pt-step-percent" class="pt-step-percent"></div>
                                </div>
                                <div class="pt-progress-track">
                                    <div id="pt-step-progress" class="pt-progress-fill"></div>
                                </div>
                            </div>
                        
                        <!-- Section: YOUR LOAN -->
                        <div class="pt-section">
                            <div class="pt-section-label">Your Loan</div>
                            <div class="pt-grid">
                                <div class="pt-group">
                                    <label class="pt-label">Loan Amount</label>
                                    <select class="pt-select" name="loanAmount" required>
                                        <option value="" disabled selected>Please select</option>
                                        <option value="100">$100</option>
                                        <option value="200">$200</option>
                                        <option value="300">$300</option>
                                        <option value="400">$400</option>
                                        <option value="500">$500</option>
                                        <option value="600">$600</option>
                                        <option value="700">$700</option>
                                        <option value="800">$800</option>
                                        <option value="900">$900</option>
                                        <option value="1000">$1000</option>
                                        <option value="1500">$1500</option>
                                        <option value="2000">$2000</option>
                                        <option value="3000">$3000</option>
                                        <option value="4000">$4000</option>
                                        <option value="5000">$5000</option>
                                        <option value="6000">$6000</option>
                                        <option value="7000">$7000</option>
                                        <option value="8000">$8000</option>
                                        <option value="9000">$9000</option>
                                        <option value="10000">$10000</option>
                                        <option value="11000">$11000</option>
                                        <option value="12000">$12000</option>
                                        <option value="13000">$13000</option>
                                        <option value="14000">$14000</option>
                                        <option value="15000">$15000</option>
                                        <option value="20000">$20000</option>
                                        <option value="25000">$25000</option>
                                        <option value="30000">$30000</option>
                                        <option value="35000">$35000</option>
                                    </select>
                                    <div class="pt-error-hint">Please select an amount</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">Loan Purpose</label>
                                    <select class="pt-select" name="loanPurpose" required>
                                        <option value="" disabled selected>Please select</option>
                                        <option value="AUTO_REPAIR">Auto Repair</option>
                                        <option value="CREDIT_CARD_CONSOLIDATION">Credit Card Consolidation</option>
                                        <option value="DEBT_CONSOLIDATION">Debt Consolidation</option>
                                        <option value="EMERGENCY_SITUATION">Emergency Situation</option>
                                        <option value="HOME_IMPROVEMENT">Home Improvement</option>
                                        <option value="MAJOR_PURCHASE">Major Purchase</option>
                                        <option value="MEDICAL_EXPENSES">Medical Expenses</option>
                                        <option value="MOVING">Moving</option>
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
                                    <input type="date" class="pt-input" name="dob" required>
                                    <div class="pt-error-hint">Date of Birth is required (18+)</div>
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
                            <div class="pt-grid pt-grid-two-col">
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
                                        <option value="BIWEEKLY">Biweekly</option>
                                        <option value="TWICEMONTHLY">Semimonthly</option>
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
                                        <option value="SAVING">Savings</option>
                                    </select>
                                    <div class="pt-error-hint">Select account type</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">How do you get paid?</label>
                                    <select class="pt-select" name="incomeMethod" required>
                                        <option value="" disabled selected>Please select</option>
                                        <option value="YES">Direct Deposit</option>
                                        <option value="NO">Paper Check</option>
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
                                        <option value="EMPLOYMENT">Job Income</option>
                                        <option value="BENEFITS">Benefits</option>
                                    </select>
                                    <div class="pt-error-hint">Select income source</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">Are you in the military? <img src="https://img.icons8.com/material-outlined/12/94a3b8/info--v1.png"/></label>
                                    <select class="pt-select" name="isMilitary" required>
                                        <option value="" disabled selected>Please select</option>
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
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
                                        <option value="6000">More than $5,000</option>
                                        <option value="5000">$4,501 - $5,000</option>
                                        <option value="4500">$4,001 - $4,500</option>
                                        <option value="4000">$3,501 - $4,000</option>
                                        <option value="3500">$3,001 - $3,500</option>
                                        <option value="3000">$2,501 - $3,000</option>
                                        <option value="2500">$2,001 - $2,500</option>
                                        <option value="2000">$1,501 - $2,000</option>
                                        <option value="1500">$1,000 - $1,500</option>
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
                                    <div class="pt-radio-row">
                                        <label class="radio-label"><input type="radio" name="debtAssistance" value="yes"> Yes</label>
                                        <label class="radio-label"><input type="radio" name="debtAssistance" value="no" checked> No</label>
                                    </div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">What's your approximate credit rating?</label>
                                    <select class="pt-select" name="creditRating" required>
                                        <option value="" disabled selected>Please select</option>
                                        <option value="GREAT">Great (700+)</option>
                                        <option value="GOOD">Good (600 - 699)</option>
                                        <option value="FAIR">Fair (500 - 599)</option>
                                        <option value="POOR">Poor (500 and below)</option>
                                    </select>
                                    <div class="pt-error-hint">Select rating</div>
                                </div>
                                <div class="pt-group">
                                    <label class="pt-label">Do you own your vehicle free and clear? <img src="https://img.icons8.com/material-outlined/12/94a3b8/info--v1.png"/></label>
                                    <div class="pt-radio-row">
                                        <label class="radio-label"><input type="radio" name="ownVehicle" value="yes"> Yes</label>
                                        <label class="radio-label"><input type="radio" name="ownVehicle" value="no" checked> No</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Section: FINALLY (Teal Area) -->
                        <div class="pt-section pt-section-no-border">
                            <div class="pt-section-label">Finally</div>
                            <div class="pt-banking">
                                <h3>Deposit Loan Into:</h3>
                                <div class="pt-grid pt-grid-wide">
                                    <div class="pt-group">
                                        <label class="pt-label">Select your Bank</label>
                                        <select class="pt-select" name="bankName" required>
                                            <option value="" disabled selected>Please select</option>
                                            <option value="Other">Other (not in the list)</option>
                                            <option value="Bancorp">Bancorp</option>
                                            <option value="Bank of America">Bank of America</option>
                                            <option value="Branch Bank">Branch Bank</option>
                                            <option value="Bonneville Bank">Bonneville Bank</option>
                                            <option value="Chase Bank">Chase Bank</option>
                                            <option value="Fifth Third Bank">Fifth Third Bank</option>
                                            <option value="First California Bank">First California Bank</option>
                                            <option value="First National Bank Texas">First National Bank Texas</option>
                                            <option value="M&T Bank">M&T Bank</option>
                                            <option value="MetaBank">MetaBank</option>
                                            <option value="Navy Federal Credit Union">Navy Federal Credit Union</option>
                                            <option value="PNC Bank">PNC Bank</option>
                                            <option value="Regions Bank">Regions Bank</option>
                                            <option value="SunTrust Bank">SunTrust Bank</option>
                                            <option value="TD Bank">TD Bank</option>
                                            <option value="USAA Federal Savings Bank">USAA Federal Savings Bank</option>
                                            <option value="US Bank">US Bank</option>
                                            <option value="Wells Fargo">Wells Fargo</option>
                                        </select>
                                        <div class="pt-error-hint pt-error-hint-light">Selection required</div>
                                    </div>
                                    <div class="pt-group">
                                        <label class="pt-label">Select your Bank's State</label>
                                        <div class="pt-bank-state-row">
                                            <select class="pt-select pt-bank-state-select" name="bankState" required>
                                                <option value="" disabled selected>Please select</option>
                                                ${stateOptions}
                                            </select>
                                            <div class="pt-ssl">
                                                <img src="https://img.icons8.com/material-outlined/32/ffffff/lock--v1.png" class="pt-ssl-icon"/>
                                                DATA ENCRYPTED<br>WITH 256 BIT SSL
                                            </div>
                                        </div>
                                        <div class="pt-error-hint pt-error-hint-light">Selection required</div>
                                    </div>
                                    <div class="pt-group">
                                        <label class="pt-label">ABA/Routing Number <img src="https://img.icons8.com/material-outlined/12/ffffff/info--v1.png"/></label>
                                        <input type="text" class="pt-input" name="routingNumber" placeholder="9 Digits" maxlength="9" required>
                                        <div class="pt-error-hint pt-error-hint-light">9-digit routing number required</div>
                                    </div>
                                    <div class="pt-group">
                                        <label class="pt-label">Account Number <img src="https://img.icons8.com/material-outlined/12/ffffff/info--v1.png"/></label>
                                        <input type="text" class="pt-input" name="accountNumber" placeholder="Account Number" minlength="4" required>
                                        <div class="pt-error-hint pt-error-hint-light">Account number required</div>
                                    </div>
                                </div>
                                
                                <div class="pt-terms">
                                    By clicking "AGREE AND SUBMIT" I acknowledge that I have read and agree to the terms of the <a href="${privacyUrl}" target="_blank" style="color: inherit; text-decoration: underline;">Privacy Policy</a> and <a href="${termsUrl}" target="_blank" style="color: inherit; text-decoration: underline;">Terms of Use</a>, which contain a mandatory arbitration clause.
                                    <br><br>
                                    I also consent to receive marketing and other texts or calls from myreliablefunds and/or its marketing partners at the number previously provided, by any means or technology, including an automatic dialing system, to the phone number I have provided, even if that number is on a national or state Do-Not-Call registry. Carrier and data rates may apply. I understand that my consent to such calls and text messages is not required to purchase products from or use the services of myreliablefunds and/or its marketing partners.
                                </div>
                                
                                <button type="submit" class="pt-footer-btn" id="pt-submit-btn">AGREE AND SUBMIT</button>
                            </div>
                        </div>

                        <div class="pt-step-nav" ${formStyle === 'single-step' ? 'style="display:none;"' : ''}>
                            <button type="button" class="pt-step-btn" id="pt-prev-btn">Back</button>
                            <button type="button" class="pt-step-btn pt-step-btn-primary" id="pt-next-btn">Continue</button>
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
                    } else if (field.name === 'dob') {
                        const birthDate = new Date(field.value);
                        const now = new Date();
                        if (!isNaN(birthDate.getTime())) {
                            const age = now.getFullYear() - birthDate.getFullYear();
                            const m = now.getMonth() - birthDate.getMonth();
                            const isAtLeast18 = age > 18 || (age === 18 && m >= 0 && now.getDate() >= birthDate.getDate());
                            isValid = isAtLeast18 && birthDate.getFullYear() > 1900;
                        } else {
                            isValid = false;
                        }
                    } else if (field.name === 'Zip' || field.name === 'routingNumber') {
                        isValid = /^\d+$/.test(field.value) && field.value.length === Number(field.getAttribute('maxlength'));
                    }
                }

                if (!isValid || group.dataset.zipError === 'true' || group.dataset.zipLoading === 'true') {
                    group.classList.add('has-error');
                    field.classList.add('is-invalid');
                    return false;
                } else {
                    group.classList.remove('has-error');
                    field.classList.remove('is-invalid');
                }
                return true;
            };

            // Multi-step form logic
            const sections = Array.from(form.querySelectorAll('.pt-section'));
            const stepMeta = document.getElementById('pt-step-meta');
            const stepPercent = document.getElementById('pt-step-percent');
            const stepProgress = document.getElementById('pt-step-progress');
            const bankNameField = form.querySelector('select[name="bankName"]');
            const bankStateField = form.querySelector('select[name="bankState"]');
            const routingField = form.querySelector('input[name="routingNumber"]');
            const prevBtn = document.getElementById('pt-prev-btn');
            const nextBtn = document.getElementById('pt-next-btn');
            let currentStep = 0;

            const nextPayDateField = form.querySelector('input[name="nextPayDate"]');
            if (nextPayDateField) {
                nextPayDateField.min = new Date().toISOString().split('T')[0];
            }

            if (bankStateField) bankStateField.disabled = true;

            const showStep = (targetStep) => {
                currentStep = Math.max(0, Math.min(targetStep, sections.length - 1));
                sections.forEach((section, idx) => {
                    if (formStyle === 'single-step') {
                        section.classList.remove('pt-step-hidden');
                    } else {
                        section.classList.toggle('pt-step-hidden', idx !== currentStep);
                    }
                });
                const currentLabelEl = sections[currentStep].querySelector('.pt-section-label');
                const currentLabel = currentLabelEl ? currentLabelEl.textContent.trim() : `Step ${currentStep + 1}`;
                const progressPercent = Math.round(((currentStep + 1) / sections.length) * 100);
                if (stepMeta) {
                    stepMeta.textContent = `Step ${currentStep + 1} of ${sections.length}: ${currentLabel}`;
                }
                if (stepPercent) {
                    stepPercent.textContent = `${progressPercent}%`;
                }
                if (stepProgress) {
                    stepProgress.style.width = `${progressPercent}%`;
                }
                prevBtn.style.display = currentStep === 0 ? 'none' : 'inline-flex';
                nextBtn.style.display = currentStep === sections.length - 1 ? 'none' : 'inline-flex';
            };

            const validateStep = (stepIdx) => {
                const step = sections[stepIdx];
                if (!step) return true;
                let valid = true;
                step.querySelectorAll('input, select').forEach((field) => {
                    if (!validateField(field)) valid = false;
                });
                return valid;
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
                if (input.type === 'date') {
                    input.addEventListener('click', () => {
                        try {
                            if (typeof input.showPicker === 'function') {
                                input.showPicker();
                            }
                        } catch (err) {
                            console.error('showPicker error:', err);
                        }
                    });
                }

                input.addEventListener('input', (e) => {
                    if (input.name === 'Phone') e.target.value = maskPhone(e.target.value);
                    if (input.name === 'SSN') e.target.value = maskSSN(e.target.value);
                    if (input.classList.contains('is-invalid')) validateField(input);
                });
                input.addEventListener('blur', () => validateField(input));
            });

            const zipField = form.querySelector('input[name="Zip"]');
            if (zipField) {
                zipField.addEventListener('input', async (e) => {
                    const zip = e.target.value.replace(/\D/g, '');
                    const group = zipField.closest('.pt-group');

                    // Clear previous dynamic fields
                    const existingSuccess = group.querySelector('.pt-zip-success');
                    if (existingSuccess) existingSuccess.remove();
                    group.querySelectorAll('input[type="hidden"]').forEach(h => h.remove());
                    delete group.dataset.zipError;
                    delete group.dataset.zipLoading;

                    if (zip.length === 5) {
                        group.dataset.zipLoading = 'true';
                        const details = await this.fetchZipDetails(zip);

                        delete group.dataset.zipLoading;

                        // Check again because user might have typed more or deleted during fetch
                        if (zipField.value.replace(/\D/g, '') !== zip) return;

                        if (details) {
                            // Valid Zip
                            const successDiv = document.createElement('div');
                            successDiv.className = 'omForm-group__field is-success pt-zip-success';
                            successDiv.innerHTML = `
                                <span id="omForm-city-placeholder" class="omForm-address-placeholder__item pt-zip-item">${details.city}</span>
                                <span id="omForm-fullState-placeholder" class="omForm-address-placeholder__item pt-zip-item">${details.fullState}</span>
                            `;
                            group.appendChild(successDiv);

                            // Hidden inputs for submission
                            const hCity = document.createElement('input');
                            hCity.type = 'hidden'; hCity.name = 'city'; hCity.value = details.city.toUpperCase();
                            hCity.className = 'is-filled';
                            const hState = document.createElement('input');
                            hState.type = 'hidden'; hState.name = 'state'; hState.value = details.state;
                            hState.className = 'is-filled';
                            const hFullState = document.createElement('input');
                            hFullState.type = 'hidden'; hFullState.name = 'fullState'; hFullState.value = details.fullState;
                            hFullState.className = 'is-filled';

                            group.appendChild(hCity);
                            group.appendChild(hState);
                            group.appendChild(hFullState);

                            zipField.classList.remove('is-invalid');
                            group.classList.remove('has-error');
                        } else {
                            // Invalid/Unsupported Zip
                            const errMsg = "We're sorry, we currently do not offer any services in your state. Please check back with us in the future. If you have any questions, please don't hesitate to contact our customer service team. Thank you!";
                            console.error(errMsg);
                            alert(errMsg);
                            zipField.classList.add('is-invalid');
                            group.classList.add('has-error');
                            group.dataset.zipError = 'true';
                        }
                    }
                });
            }

            nextBtn.addEventListener('click', () => {
                const isCurrentStepValid = validateStep(currentStep);
                if (!isCurrentStepValid) {
                    const firstError = sections[currentStep].querySelector('.is-invalid');
                    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
                showStep(currentStep + 1);
            });

            prevBtn.addEventListener('click', () => showStep(currentStep - 1));
            showStep(0);

            if (bankNameField && bankStateField && routingField) {
                const updateBankStateOptions = (bankName) => {
                    const bankInfo = BANK_DATA[bankName];
                    let optionsHtml = '<option value="" disabled selected>Please select</option>';

                    if (!bankName || !bankInfo || bankInfo['All Locations']) {
                        // Show all states if no bank selected, not in database, or bank is "All Locations"
                        optionsHtml += STATES.map(s => `<option value="${s.val}">${s.label}</option>`).join('');
                    } else {
                        // Show only specific states/regions for this bank
                        Object.keys(bankInfo).forEach(key => {
                            optionsHtml += `<option value="${key}">${key}</option>`;
                        });
                    }
                    bankStateField.innerHTML = optionsHtml;
                    bankStateField.disabled = !bankName;
                };

                const populateFromLocal = () => {
                    const bankName = bankNameField.value;
                    const bankState = bankStateField.value;
                    if (!bankName) return false;

                    const bankInfo = BANK_DATA[bankName];
                    if (!bankInfo) return false;

                    let routing = null;
                    if (bankInfo['All Locations']) {
                        routing = bankInfo['All Locations'];
                    } else if (bankState && bankInfo[bankState]) {
                        routing = bankInfo[bankState];
                    }

                    if (routing) {
                        routingField.value = routing;
                        routingField.classList.remove('is-invalid');
                        const routingGroup = routingField.closest('.pt-group');
                        if (routingGroup) routingGroup.classList.remove('has-error');
                        return true;
                    } else {
                        routingField.value = "";
                    }
                    return false;
                };

                bankNameField.addEventListener('change', async () => {
                    const bankName = bankNameField.value;

                    // Update states first
                    updateBankStateOptions(bankName);
                    routingField.value = "";

                    if (!bankName) return;

                    // 1. Try Local Lookup First
                    const foundLocal = populateFromLocal();
                    if (foundLocal) return;

                    // 2. Fallback to API Lookup
                    const details = await this.fetchBankDetails(bankName);
                    if (!details) return;

                    if (details.state && bankStateField.querySelector(`option[value="${details.state}"]`)) {
                        bankStateField.value = details.state;
                        bankStateField.classList.remove('is-invalid');
                        const bankStateGroup = bankStateField.closest('.pt-group');
                        if (bankStateGroup) bankStateGroup.classList.remove('has-error');
                    }
                    if (details.routing_number) {
                        routingField.value = details.routing_number;
                        routingField.classList.remove('is-invalid');
                        const routingGroup = routingField.closest('.pt-group');
                        if (routingGroup) routingGroup.classList.remove('has-error');
                    }
                });

                bankStateField.addEventListener('change', () => {
                    populateFromLocal();
                });
            }

            form.onsubmit = async (e) => {
                e.preventDefault();

                if (formStyle !== 'single-step' && currentStep < sections.length - 1) {
                    const isCurrentStepValid = validateStep(currentStep);
                    if (!isCurrentStepValid) {
                        const firstError = sections[currentStep].querySelector('.is-invalid');
                        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return;
                    }
                    showStep(currentStep + 1);
                    return;
                }

                let isFormValid = true;
                inputs.forEach(input => { if (!validateField(input)) isFormValid = false; });

                if (!isFormValid) {
                    const firstError = form.querySelector('.is-invalid');
                    if (firstError) {
                        const errorSection = firstError.closest('.pt-section');
                        const errorStepIdx = sections.indexOf(errorSection);
                        if (errorStepIdx >= 0 && errorStepIdx !== currentStep) {
                            showStep(errorStepIdx);
                        }
                        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                }

                const btn = document.getElementById('pt-submit-btn');
                const status = document.getElementById('pt-form-status');

                btn.disabled = true;
                btn.innerText = 'Processing your application...';

                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                if (data.Date_Of_Birth) {
                    data.dob = data.Date_Of_Birth;
                }

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
                            <p class="pt-success-copy">
                                ${res.status === 'sold'
                            ? "Your application was accepted! We'll contact you shortly via email with the next steps."
                            : "Thank you for your submission. Our team will review your application and get back to you if there's a match."}
                            </p>
                        </div>
                    `;
                } catch (err) {
                    btn.disabled = false;
                    btn.innerText = 'Agree and Submit';
                    status.innerHTML = `<div class="pt-status-error">${err.message || 'Error submitting lead. Please check your data and try again.'}</div>`;
                }
            };
        }
    };

    // --- AUTO-INITIALIZATION LOGIC ---
    const autoInit = async () => {
        // Find the current script tag
        const scripts = document.getElementsByTagName('script');
        let currentScript = null;
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src.includes('pingtree.js')) {
                currentScript = scripts[i];
                break;
            }
        }

        if (currentScript) {
            const apiKey = currentScript.getAttribute('data-api-key');
            const formId = currentScript.getAttribute('data-form-id');
            const containerId = currentScript.getAttribute('data-container-id');
            const primaryColor = currentScript.getAttribute('data-primary-color');
            const formStyle = currentScript.getAttribute('data-style');

            if (apiKey && containerId) {
                console.log("PingTree: Auto-initializing script...");
                await PingTree.init(apiKey, { endpoint: currentScript.getAttribute('data-endpoint') });

                if (formId) {
                    PingTree.render(containerId, {
                        formId,
                        primaryColor: primaryColor || undefined,
                        style: formStyle || undefined
                    });
                }
            }
        }
    };

    // Run auto-init on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

    window.PingTree = PingTree;
})();
