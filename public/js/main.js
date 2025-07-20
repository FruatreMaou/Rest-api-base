// Main JavaScript for API Hub with Dark/Light Mode Support
class APIHub {
    constructor() {
        this.plugins = [];
        this.categories = {};
        this.currentSection = 'home';
        this.visitorCount = 0;
        this.theme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    async init() {
        // Initialize theme first
        this.initTheme();
        
        // Show loading screen
        this.showLoadingScreen();
        
        await this.loadPlugins();
        this.setupEventListeners();
        this.setupNavigation();
        this.setupAPITesting();
        this.setupThemeToggle();
        this.animateCards();
        
        // Initialize dynamic features
        this.initDynamicFeatures();
        
        // Hide loading screen after everything is loaded
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 500);
    }

    initTheme() {
        // Apply saved theme
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Create theme toggle button
        this.createThemeToggle();
    }

    createThemeToggle() {
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.setAttribute('aria-label', 'Toggle theme');
        themeToggle.innerHTML = this.getThemeIcon();
        
        document.body.appendChild(themeToggle);
        
        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    getThemeIcon() {
        return this.theme === 'dark' 
            ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>'
            : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>';
    }

    setupThemeToggle() {
        // Apply theme classes
        this.applyTheme();
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.theme);
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Update toggle button icon
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = this.getThemeIcon();
        }
        
        this.applyTheme();
    }

    applyTheme() {
        const body = document.body;
        const html = document.documentElement;
        
        if (this.theme === 'dark') {
            body.classList.add('dark');
            html.classList.add('dark');
        } else {
            body.classList.remove('dark');
            html.classList.remove('dark');
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            
            // Animate logo
            const logo = document.getElementById('animatedLogo');
            if (logo) {
                logo.style.animation = 'spin 2s linear infinite';
            }
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
    }

    setupEventListeners() {
        // Handle hash changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            if (hash) {
                this.showSection(hash);
            }
        });

        // Initialize with current hash
        const currentHash = window.location.hash.substring(1);
        if (currentHash) {
            this.showSection(currentHash);
        }
    }

    initDynamicFeatures() {
        this.updateTime();
        this.updateBattery();
        this.updateIPAddress();
        this.animateVisitorCount();
        
        // Update time every second
        setInterval(() => {
            this.updateTime();
        }, 1000);
        
        // Update battery every 30 seconds
        setInterval(() => {
            this.updateBattery();
        }, 30000);
    }

    animateVisitorCount() {
        const visitorEl = document.getElementById('visitorCount');
        if (visitorEl) {
            // Simulate visitor count
            const targetCount = Math.floor(Math.random() * 1000) + 100;
            this.animateNumber(visitorEl, 0, targetCount, 2000);
        }
    }

    updateTime() {
        const timeEl = document.getElementById('currentTime');
        const dateEl = document.getElementById('currentDate');
        
        const now = new Date();
        
        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString();
        }
        
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    async updateBattery() {
        const batteryLevelEl = document.getElementById('batteryLevel');
        const batteryStatusEl = document.getElementById('batteryStatus');
        
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                
                if (batteryLevelEl) {
                    batteryLevelEl.textContent = Math.round(battery.level * 100) + '%';
                }
                
                if (batteryStatusEl) {
                    const status = battery.charging ? 'Charging' : 'Not charging';
                    const time = battery.charging 
                        ? (battery.chargingTime === Infinity ? '' : ` (${Math.round(battery.chargingTime / 3600)}h ${Math.round((battery.chargingTime % 3600) / 60)}m remaining)`)
                        : (battery.dischargingTime === Infinity ? '' : ` (${Math.round(battery.dischargingTime / 3600)}h ${Math.round((battery.dischargingTime % 3600) / 60)}m remaining)`);
                    
                    batteryStatusEl.textContent = status + time;
                }
            }
        } catch (error) {
            if (batteryLevelEl) {
                batteryLevelEl.textContent = 'N/A';
            }
            if (batteryStatusEl) {
                batteryStatusEl.textContent = 'Unable to access battery info';
            }
        }
    }

    async updateIPAddress() {
        const ipEl = document.getElementById('userIP');
        const locationEl = document.getElementById('userLocation');
        
        try {
            // Try to get IP from a free service
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            
            if (ipEl) {
                ipEl.textContent = data.ip;
            }
            
            // Try to get location info
            try {
                const locationResponse = await fetch(`https://ipapi.co/${data.ip}/json/`);
                const locationData = await locationResponse.json();
                
                if (locationEl && locationData.city && locationData.country_name) {
                    locationEl.textContent = `${locationData.city}, ${locationData.country_name}`;
                }
            } catch (locationError) {
                if (locationEl) {
                    locationEl.textContent = 'Location unavailable';
                }
            }
            
        } catch (error) {
            if (ipEl) {
                ipEl.textContent = 'Unable to fetch';
            }
            if (locationEl) {
                locationEl.textContent = 'IP service unavailable';
            }
        }
    }

    animateNumber(element, start, end, duration) {
        const startTime = Date.now();
        const range = end - start;
        
        const updateNumber = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (range * progress));
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };
        
        updateNumber();
    }

    async loadPlugins() {
        try {
            const response = await fetch('/api/plugins');
            const data = await response.json();
            this.plugins = data.plugins;
            this.categories = data.categories;
        } catch (error) {
            console.error('Failed to load plugins:', error);
        }
    }

    setupNavigation() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href')?.substring(1) || e.target.dataset.target;
                if (target) {
                    this.showSection(target);
                }
            });
        });

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Filter buttons in docs section
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterEndpoints(filter);
                
                // Update active state
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.target.classList.add('active');
            });
        });
    }

    setupAPITesting() {
        // API test forms
        document.querySelectorAll('.api-test-form').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.sendAPIRequest(form);
            });
        });

        // Copy response buttons
        document.querySelectorAll('.copy-response').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const responseBody = e.target.closest('.endpoint-card').querySelector('.response-body');
                if (responseBody) {
                    navigator.clipboard.writeText(responseBody.textContent).then(() => {
                        this.showNotification('Response copied to clipboard!', 'success');
                    });
                }
            });
        });
    }

    async sendAPIRequest(form) {
        const endpointCard = form.closest('.endpoint-card');
        const tryBtn = endpointCard.querySelector('.try-api-btn');
        const endpoint = JSON.parse(tryBtn.dataset.endpoint);
        
        const sendBtn = form.querySelector('.send-request-btn');
        const buttonText = sendBtn.querySelector('.button-text');
        const loading = sendBtn.querySelector('.loading');
        const responseSection = endpointCard.querySelector('.response-section');
        
        // Show loading state
        sendBtn.disabled = true;
        buttonText.textContent = 'Sending...';
        loading.classList.remove('hidden');
        
        const startTime = Date.now();
        
        try {
            let url = endpoint.path;
            const method = endpoint.method.toUpperCase();
            
            let options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };
            
            // Collect form data from individual input fields
            const requestData = {};
            const inputs = form.querySelectorAll('input[name], select[name], textarea[name]');
            
            inputs.forEach(input => {
                const key = input.name;
                let value = input.value;
                
                // Handle different input types
                if (input.type === 'checkbox') {
                    requestData[key] = input.checked;
                } else if (input.type === 'number') {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                        requestData[key] = numValue;
                    }
                } else if (value && value.trim() !== '') {
                    // Handle arrays as comma-separated values
                    if (input.placeholder && input.placeholder.includes('comma-separated')) {
                        requestData[key] = value.split(',').map(item => item.trim()).filter(item => item);
                    } else {
                        // Try to parse as number if it looks like a number
                        const numValue = parseFloat(value.trim());
                        if (!isNaN(numValue) && isFinite(numValue) && value.trim() === numValue.toString()) {
                            requestData[key] = numValue;
                        } else {
                            requestData[key] = value.trim();
                        }
                    }
                }
            });
            
            console.log('Endpoint:', endpoint);
            console.log('Method:', method);
            console.log('Request data:', requestData);
            
            // Build the full URL
            const baseUrl = window.location.origin;
            const fullUrl = baseUrl + url;
            
            if (method === 'GET') {
                // Build query string for GET requests
                const params = new URLSearchParams();
                
                for (const [key, value] of Object.entries(requestData)) {
                    if (Array.isArray(value)) {
                        params.append(key, value.join(','));
                    } else if (value !== undefined && value !== null) {
                        params.append(key, value.toString());
                    }
                }
                
                const queryString = params.toString();
                const finalUrl = queryString ? `${fullUrl}?${queryString}` : fullUrl;
                
                console.log('Final GET URL:', finalUrl);
                
                // Don't send body for GET requests
                delete options.body;
                
                const response = await fetch(finalUrl, options);
                const responseTime = Date.now() - startTime;
                
                await this.handleResponse(response, responseTime, endpointCard);
                
            } else {
                // Use request body for POST/PUT/PATCH requests
                if (Object.keys(requestData).length > 0) {
                    options.body = JSON.stringify(requestData);
                }
                
                console.log('Final POST URL:', fullUrl);
                console.log('Final options:', options);
                
                const response = await fetch(fullUrl, options);
                const responseTime = Date.now() - startTime;
                
                await this.handleResponse(response, responseTime, endpointCard);
            }
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            console.error('Request error:', error);
            this.displayResponse(endpointCard, 'Error', responseTime, { 
                error: error.message,
                type: 'Network/Request Error',
                stack: error.stack
            });
        } finally {
            // Reset button state
            sendBtn.disabled = false;
            buttonText.textContent = 'Send Request';
            loading.classList.add('hidden');
        }
    }

    async handleResponse(response, responseTime, endpointCard) {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        let responseData;
        const contentType = response.headers.get('content-type');
        
        try {
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                const textResponse = await response.text();
                responseData = {
                    message: 'Non-JSON response received',
                    rawResponse: textResponse,
                    contentType: contentType || 'unknown'
                };
            }
        } catch (parseError) {
            const textResponse = await response.text();
            responseData = { 
                error: 'Failed to parse response', 
                rawResponse: textResponse,
                parseError: parseError.message,
                contentType: contentType || 'unknown'
            };
        }
        
        this.displayResponse(endpointCard, response.status, responseTime, responseData);
    }

    displayResponse(endpointCard, status, time, data) {
        const responseSection = endpointCard.querySelector('.response-section');
        const responseStatus = endpointCard.querySelector('.response-status');
        const responseTime = endpointCard.querySelector('.response-time');
        const responseBody = endpointCard.querySelector('.response-body');
        
        // Show response section
        responseSection.classList.remove('hidden');
        
        // Set status with color
        responseStatus.textContent = status;
        responseStatus.className = status >= 200 && status < 300 ? 'status-online font-semibold' : 'status-offline font-semibold';
        
        // Set response time
        responseTime.textContent = `${time}ms`;
        responseTime.className = 'text-blue-400 font-semibold';
        
        // Set response body
        responseBody.textContent = JSON.stringify(data, null, 2);
        
        // Scroll to response
        responseSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Update URL hash
            window.location.hash = sectionId;
            
            // Update navigation active states
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            document.querySelectorAll(`[href="#${sectionId}"], [data-target="${sectionId}"]`).forEach(link => {
                link.classList.add('active');
            });
            
            // Animate cards if in docs section
            if (sectionId === 'docs') {
                this.animateEndpointCards();
            }
        }
    }

    filterEndpoints(filter) {
        const endpoints = document.querySelectorAll('.endpoint-card');
        
        endpoints.forEach((card, index) => {
            if (filter === 'all' || card.dataset.category === filter) {
                card.style.display = 'block';
                card.style.animationDelay = `${index * 0.1}s`;
            } else {
                card.style.display = 'none';
            }
        });
    }

    animateCards() {
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }

    animateEndpointCards() {
        const cards = document.querySelectorAll('.endpoint-card:not([style*="display: none"]');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Global functions for two-click functionality
function toggleEndpointInfo(headerElement) {
    const endpointCard = headerElement.closest('.endpoint-card');
    const endpointInfo = endpointCard.querySelector('.endpoint-info');
    const arrow = headerElement.querySelector('.info-arrow');
    
    // Close all other endpoint info sections
    document.querySelectorAll('.endpoint-info').forEach(info => {
        if (info !== endpointInfo) {
            info.classList.add('hidden');
            const otherArrow = info.closest('.endpoint-card').querySelector('.info-arrow');
            if (otherArrow) {
                otherArrow.style.transform = 'rotate(0deg)';
            }
        }
    });
    
    // Close all API testers
    document.querySelectorAll('.api-tester').forEach(tester => {
        tester.classList.add('hidden');
    });
    
    // Toggle current endpoint info
    if (endpointInfo.classList.contains('hidden')) {
        endpointInfo.classList.remove('hidden');
        arrow.style.transform = 'rotate(180deg)';
        
        // Scroll to the endpoint info
        setTimeout(() => {
            endpointInfo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    } else {
        endpointInfo.classList.add('hidden');
        arrow.style.transform = 'rotate(0deg)';
    }
}

function toggleAPITester(buttonElement) {
    const endpointCard = buttonElement.closest('.endpoint-card');
    const apiTester = endpointCard.querySelector('.api-tester');
    
    // Close all other API testers
    document.querySelectorAll('.api-tester').forEach(tester => {
        if (tester !== apiTester) {
            tester.classList.add('hidden');
        }
    });
    
    // Toggle current API tester
    if (apiTester.classList.contains('hidden')) {
        apiTester.classList.remove('hidden');
        buttonElement.innerHTML = `
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Hide Tester
        `;
        
        // Scroll to the API tester
        setTimeout(() => {
            apiTester.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    } else {
        apiTester.classList.add('hidden');
        buttonElement.innerHTML = `
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            Try This API
        `;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new APIHub();
});

