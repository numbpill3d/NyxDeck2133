// NixDeck 2133 - Cron Composer Module
// Visual cron job creation and management

import { invoke } from '@tauri-apps/api/tauri';
import { logOperation } from './main.js';

// ============================================================================
// STATE
// ============================================================================

const CronComposerState = {
    jobs: [],
    selectedJob: null
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeCronComposer();
});

function initializeCronComposer() {
    const refreshBtn = document.getElementById('refresh-cron-btn');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await window.NixDeck.loadCronJobs();
            logOperation('Refreshed cron jobs', 'info');
        });
    }
    
    console.log('[Cron Composer] Initialized');
}

// ============================================================================
// CRON SCHEDULE HELPERS
// ============================================================================

const CRON_PRESETS = {
    'Every minute': '* * * * *',
    'Every 5 minutes': '*/5 * * * *',
    'Every 15 minutes': '*/15 * * * *',
    'Every 30 minutes': '*/30 * * * *',
    'Every hour': '0 * * * *',
    'Every 6 hours': '0 */6 * * *',
    'Every 12 hours': '0 */12 * * *',
    'Daily at midnight': '0 0 * * *',
    'Daily at noon': '0 12 * * *',
    'Weekly on Sunday': '0 0 * * 0',
    'Monthly on 1st': '0 0 1 * *',
    'Every weekday': '0 9 * * 1-5'
};

export function showCronPresets(callback) {
    const presetsHTML = Object.entries(CRON_PRESETS).map(([label, schedule]) => 
        `<button class="popup-btn" style="width: 100%; margin-bottom: 8px; text-align: left;" data-schedule="${schedule}">
            <strong>${label}</strong><br>
            <span style="color: var(--color-text-dim); font-size: 10px;">${schedule}</span>
        </button>`
    ).join('');
    
    window.NixDeck.showPopup(
        'Cron Schedule Presets',
        `
            <div class="info-item" style="margin-bottom: 16px;">
                Select a preset schedule or enter custom:
            </div>
            ${presetsHTML}
            <div style="margin-top: 16px;">
                <label>Custom schedule:</label>
                <input type="text" id="custom-cron-schedule" placeholder="* * * * *" style="width: 100%; padding: 8px; background: var(--color-bg-tertiary); border: var(--border); color: var(--color-text-primary); font-family: var(--font-mono); margin-top: 8px;">
            </div>
        `,
        [
            { label: '[CANCEL]', action: window.NixDeck.closePopup },
            { label: '[USE CUSTOM]', action: () => {
                const custom = document.getElementById('custom-cron-schedule').value;
                if (custom) {
                    callback(custom);
                    window.NixDeck.closePopup();
                }
            }, primary: true }
        ]
    );
    
    // Add preset button listeners
    document.querySelectorAll('[data-schedule]').forEach(btn => {
        btn.addEventListener('click', () => {
            const schedule = btn.getAttribute('data-schedule');
            callback(schedule);
            window.NixDeck.closePopup();
        });
    });
}

// ============================================================================
// CRON JOB TEMPLATES
// ============================================================================

const CRON_TEMPLATES = {
    'cleanup-tmp': {
        name: 'Clean /tmp directory',
        schedule: '0 2 * * *',
        command: 'find /tmp -type f -atime +7 -delete'
    },
    'update-system': {
        name: 'System update check',
        schedule: '0 3 * * 0',
        command: 'pacman -Sy'
    },
    'backup-configs': {
        name: 'Backup configurations',
        schedule: '0 4 * * *',
        command: 'tar -czf ~/backups/configs-$(date +%Y%m%d).tar.gz ~/.config'
    },
    'rotate-wallpaper': {
        name: 'Rotate wallpaper',
        schedule: '*/30 * * * *',
        command: 'feh --bg-fill --randomize ~/Pictures/Wallpapers/*'
    },
    'reload-eww': {
        name: 'Reload EWW widgets',
        schedule: '0 */6 * * *',
        command: 'eww reload'
    }
};

export function showCronTemplates(callback) {
    const templatesHTML = Object.entries(CRON_TEMPLATES).map(([key, template]) => 
        `<button class="popup-btn" style="width: 100%; margin-bottom: 8px; text-align: left;" data-template="${key}">
            <strong>${template.name}</strong><br>
            <span style="color: var(--color-text-dim); font-size: 10px;">${template.schedule} ${template.command}</span>
        </button>`
    ).join('');
    
    window.NixDeck.showPopup(
        'Cron Job Templates',
        `
            <div class="info-item" style="margin-bottom: 16px;">
                Select a template:
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
            const key = btn.getAttribute('data-template');
            const template = CRON_TEMPLATES[key];
            callback(template.schedule, template.command);
            window.NixDeck.closePopup();
        });
    });
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    CronComposerState,
    CRON_PRESETS,
    CRON_TEMPLATES
};
