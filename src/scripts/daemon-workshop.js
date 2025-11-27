// NixDeck 2133 - Daemon Workshop Module
// Extended daemon management functionality

import { invoke } from '@tauri-apps/api/tauri';
import { logOperation } from './main.js';

// ============================================================================
// STATE
// ============================================================================

const DaemonWorkshopState = {
    services: [],
    selectedService: null
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeDaemonWorkshop();
});

function initializeDaemonWorkshop() {
    const refreshBtn = document.getElementById('refresh-daemons-btn');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await window.NixDeck.loadDaemons();
            logOperation('Refreshed daemon list', 'info');
        });
    }
    
    console.log('[Daemon Workshop] Initialized');
}

// ============================================================================
// SERVICE TEMPLATES
// ============================================================================

const SERVICE_TEMPLATES = {
    'basic': `[Unit]
Description=My Custom Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/my-command
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=default.target`,
    
    'timer': `[Unit]
Description=My Timer Service
Requires=my-timer.timer

[Service]
Type=oneshot
ExecStart=/usr/bin/my-script.sh`,
    
    'monitor': `[Unit]
Description=System Monitor Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/watch -n 5 /usr/bin/my-monitor-script
Restart=always
RestartSec=10s

[Install]
WantedBy=default.target`,
    
    'wallpaper-rotator': `[Unit]
Description=Wallpaper Rotation Service
After=graphical-session.target

[Service]
Type=simple
ExecStart=/usr/bin/bash -c 'while true; do feh --bg-fill --randomize ~/Pictures/Wallpapers/*; sleep 300; done'
Restart=always

[Install]
WantedBy=default.target`,
    
    'eww-refresh': `[Unit]
Description=EWW Widget Auto-refresh
After=graphical-session.target

[Service]
Type=simple
ExecStart=/usr/bin/bash -c 'while true; do eww reload; sleep 3600; done'
Restart=always

[Install]
WantedBy=default.target`
};

// ============================================================================
// TEMPLATE SELECTION
// ============================================================================

export function showServiceTemplates(callback) {
    const templatesHTML = Object.keys(SERVICE_TEMPLATES).map(key => 
        `<button class="popup-btn" style="width: 100%; margin-bottom: 8px;" data-template="${key}">[${key.toUpperCase()}]</button>`
    ).join('');
    
    window.NixDeck.showPopup(
        'Service Templates',
        `
            <div class="info-item" style="margin-bottom: 16px;">
                Select a template to get started:
            </div>
            ${templatesHTML}
        `,
        [
            { label: '[CANCEL]', action: window.NixDeck.closePopup }
        ]
    );
    
    // Add template button listeners
    document.querySelectorAll('[data-template]').forEach(btn => {
        btn.addEventListener('click', () => {
            const template = btn.getAttribute('data-template');
            callback(SERVICE_TEMPLATES[template]);
            window.NixDeck.closePopup();
        });
    });
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    DaemonWorkshopState,
    SERVICE_TEMPLATES
};
