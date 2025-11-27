// NixDeck 2133 - Popup System Module
// Manages modal popups including the Loadout Manager

import { invoke } from '@tauri-apps/api/tauri';
import { logOperation } from './main.js';
import { setActiveLoadout } from './ai-console.js';

// ============================================================================
// STATE
// ============================================================================

const PopupState = {
    currentPopup: null,
    loadouts: [],
    activeLoadout: null
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializePopupSystem();
});

function initializePopupSystem() {
    // Listen for loadout manager open event
    window.addEventListener('open-loadout-manager', openLoadoutManager);
    
    // Close popup on background click
    const popupContainer = document.getElementById('popup-container');
    if (popupContainer) {
        popupContainer.addEventListener('click', (event) => {
            if (event.target === popupContainer) {
                closePopup();
            }
        });
    }
    
    console.log('[Popup System] Initialized');
}

// ============================================================================
// LOADOUT MANAGER
// ============================================================================

async function openLoadoutManager() {
    try {
        // Load available loadouts
        const loadouts = await invoke('list_ai_loadouts');
        PopupState.loadouts = loadouts;
        
        const loadoutsHTML = loadouts.length > 0
            ? loadouts.map(name => createLoadoutItemHTML(name)).join('')
            : '<div class="info-item">No loadouts found. Create your first loadout below.</div>';
        
        window.NixDeck.showPopup(
            'LOADOUT MANAGER',
            `
                <div class="loadout-manager-container">
                    <!-- Loadouts List -->
                    <div class="info-section">
                        <h3>AVAILABLE LOADOUTS</h3>
                        <div id="loadouts-list" style="max-height: 300px; overflow-y: auto;">
                            ${loadoutsHTML}
                        </div>
                    </div>
                    
                    <!-- Create New Loadout -->
                    <div class="info-section" style="margin-top: 24px;">
                        <h3>CREATE NEW LOADOUT</h3>
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
                            <div>
                                <label style="color: var(--color-text-dim); font-size: 11px;">LOADOUT NAME:</label>
                                <input type="text" id="new-loadout-name" placeholder="my-loadout" style="width: 100%; padding: 8px; margin-top: 4px; background: var(--color-bg-tertiary); border: var(--border); color: var(--color-text-primary); font-family: var(--font-mono);">
                            </div>
                            <div>
                                <label style="color: var(--color-text-dim); font-size: 11px;">MODEL:</label>
                                <select id="new-loadout-model" style="width: 100%; padding: 8px; margin-top: 4px; background: var(--color-bg-tertiary); border: var(--border); color: var(--color-text-primary); font-family: var(--font-mono);">
                                    <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                                    <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
                                    <option value="openai/gpt-4">GPT-4</option>
                                    <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                    <option value="google/gemini-pro">Gemini Pro</option>
                                </select>
                            </div>
                            <div>
                                <label style="color: var(--color-text-dim); font-size: 11px;">SYSTEM PROMPT:</label>
                                <textarea id="new-loadout-prompt" rows="4" placeholder="You are a helpful assistant..." style="width: 100%; padding: 8px; margin-top: 4px; background: var(--color-bg-tertiary); border: var(--border); color: var(--color-text-primary); font-family: var(--font-mono); resize: vertical;"></textarea>
                            </div>
                            <div>
                                <label style="color: var(--color-text-dim); font-size: 11px;">TEMPERATURE:</label>
                                <input type="range" id="new-loadout-temp" min="0" max="2" step="0.1" value="0.7" style="width: 100%; margin-top: 4px;">
                                <span id="temp-value" style="color: var(--color-text-accent); font-size: 11px;">0.7</span>
                            </div>
                            <div>
                                <label style="color: var(--color-text-dim); font-size: 11px;">ENABLED TOOLS:</label>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                                    <label style="display: flex; align-items: center; gap: 4px; color: var(--color-text-secondary); font-size: 11px;">
                                        <input type="checkbox" value="rice" checked> Rice Control
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 4px; color: var(--color-text-secondary); font-size: 11px;">
                                        <input type="checkbox" value="daemon" checked> Daemon Management
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 4px; color: var(--color-text-secondary); font-size: 11px;">
                                        <input type="checkbox" value="cron" checked> Cron Jobs
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 4px; color: var(--color-text-secondary); font-size: 11px;">
                                        <input type="checkbox" value="container" checked> Containers
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 4px; color: var(--color-text-secondary); font-size: 11px;">
                                        <input type="checkbox" value="file" checked> File Operations
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            [
                { label: '[CLOSE]', action: closePopup },
                { label: '[CREATE LOADOUT]', action: createNewLoadout, primary: true }
            ]
        );
        
        // Add temperature slider listener
        const tempSlider = document.getElementById('new-loadout-temp');
        const tempValue = document.getElementById('temp-value');
        if (tempSlider && tempValue) {
            tempSlider.addEventListener('input', (e) => {
                tempValue.textContent = e.target.value;
            });
        }
        
        // Add event listeners to existing loadout items
        attachLoadoutItemListeners();
        
    } catch (error) {
        console.error('[Loadout Manager] Failed to open:', error);
        logOperation(`Failed to open loadout manager: ${error}`, 'error');
    }
}

function createLoadoutItemHTML(name) {
    return `
        <div class="loadout-item" data-loadout="${name}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; background: var(--color-bg-tertiary); border: var(--border); border-left: 3px solid var(--color-accent-dim); cursor: pointer; transition: all 0.2s ease;">
            <div>
                <div style="font-weight: bold; color: var(--color-text-accent);">${name}</div>
                <div style="font-size: 10px; color: var(--color-text-dim); margin-top: 4px;">Click to activate</div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="action-btn loadout-edit-btn" data-loadout="${name}" style="font-size: 10px;">[EDIT]</button>
                <button class="action-btn loadout-delete-btn" data-loadout="${name}" style="font-size: 10px;">[DELETE]</button>
            </div>
        </div>
    `;
}

function attachLoadoutItemListeners() {
    // Activate loadout on item click
    document.querySelectorAll('.loadout-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't activate if clicking on buttons
            if (e.target.classList.contains('action-btn')) return;
            
            const loadoutName = item.getAttribute('data-loadout');
            activateLoadout(loadoutName);
        });
    });
    
    // Edit buttons
    document.querySelectorAll('.loadout-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const loadoutName = btn.getAttribute('data-loadout');
            editLoadout(loadoutName);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.loadout-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const loadoutName = btn.getAttribute('data-loadout');
            deleteLoadout(loadoutName);
        });
    });
}

// ============================================================================
// LOADOUT OPERATIONS
// ============================================================================

async function createNewLoadout() {
    const name = document.getElementById('new-loadout-name').value.trim();
    const model = document.getElementById('new-loadout-model').value;
    const systemPrompt = document.getElementById('new-loadout-prompt').value.trim();
    const temperature = parseFloat(document.getElementById('new-loadout-temp').value);
    
    if (!name) {
        alert('Please provide a loadout name');
        return;
    }
    
    // Get enabled tools
    const tools = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    const loadoutConfig = {
        name,
        model,
        system_prompt: systemPrompt || 'You are a helpful AI assistant for Linux system configuration.',
        temperature,
        max_tokens: 4096,
        tools_enabled: tools
    };
    
    try {
        await invoke('save_ai_loadout', {
            name,
            config: JSON.stringify(loadoutConfig, null, 2)
        });
        
        logOperation(`Created loadout: ${name}`, 'success');
        
        // Refresh loadout manager
        closePopup();
        setTimeout(() => openLoadoutManager(), 100);
    } catch (error) {
        console.error('[Loadout Manager] Failed to create loadout:', error);
        logOperation(`Failed to create loadout: ${error}`, 'error');
        alert(`Failed to create loadout: ${error}`);
    }
}

async function activateLoadout(name) {
    try {
        await setActiveLoadout(name);
        
        // Update UI - highlight active loadout
        document.querySelectorAll('.loadout-item').forEach(item => {
            if (item.getAttribute('data-loadout') === name) {
                item.style.borderLeftColor = 'var(--color-accent-primary)';
                item.style.background = 'var(--color-bg-elevated)';
            } else {
                item.style.borderLeftColor = 'var(--color-accent-dim)';
                item.style.background = 'var(--color-bg-tertiary)';
            }
        });
        
        logOperation(`Activated loadout: ${name}`, 'success');
    } catch (error) {
        console.error('[Loadout Manager] Failed to activate loadout:', error);
        logOperation(`Failed to activate loadout: ${error}`, 'error');
    }
}

async function editLoadout(name) {
    try {
        const configStr = await invoke('load_ai_loadout', { name });
        const config = JSON.parse(configStr);
        
        window.NixDeck.showPopup(
            `EDIT LOADOUT: ${name}`,
            `
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div>
                        <label style="color: var(--color-text-dim); font-size: 11px;">MODEL:</label>
                        <select id="edit-loadout-model" style="width: 100%; padding: 8px; margin-top: 4px; background: var(--color-bg-tertiary); border: var(--border); color: var(--color-text-primary); font-family: var(--font-mono);">
                            <option value="anthropic/claude-3.5-sonnet" ${config.model === 'anthropic/claude-3.5-sonnet' ? 'selected' : ''}>Claude 3.5 Sonnet</option>
                            <option value="anthropic/claude-3-opus" ${config.model === 'anthropic/claude-3-opus' ? 'selected' : ''}>Claude 3 Opus</option>
                            <option value="openai/gpt-4" ${config.model === 'openai/gpt-4' ? 'selected' : ''}>GPT-4</option>
                            <option value="openai/gpt-3.5-turbo" ${config.model === 'openai/gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo</option>
                            <option value="google/gemini-pro" ${config.model === 'google/gemini-pro' ? 'selected' : ''}>Gemini Pro</option>
                        </select>
                    </div>
                    <div>
                        <label style="color: var(--color-text-dim); font-size: 11px;">SYSTEM PROMPT:</label>
                        <textarea id="edit-loadout-prompt" rows="6" style="width: 100%; padding: 8px; margin-top: 4px; background: var(--color-bg-tertiary); border: var(--border); color: var(--color-text-primary); font-family: var(--font-mono); resize: vertical;">${config.system_prompt}</textarea>
                    </div>
                    <div>
                        <label style="color: var(--color-text-dim); font-size: 11px;">TEMPERATURE:</label>
                        <input type="range" id="edit-loadout-temp" min="0" max="2" step="0.1" value="${config.temperature}" style="width: 100%; margin-top: 4px;">
                        <span id="edit-temp-value" style="color: var(--color-text-accent); font-size: 11px;">${config.temperature}</span>
                    </div>
                </div>
            `,
            [
                { label: '[CANCEL]', action: () => { closePopup(); openLoadoutManager(); } },
                { label: '[SAVE]', action: () => saveLoadoutEdit(name), primary: true }
            ]
        );
        
        // Temperature slider listener
        const tempSlider = document.getElementById('edit-loadout-temp');
        const tempValue = document.getElementById('edit-temp-value');
        if (tempSlider && tempValue) {
            tempSlider.addEventListener('input', (e) => {
                tempValue.textContent = e.target.value;
            });
        }
    } catch (error) {
        console.error('[Loadout Manager] Failed to load loadout:', error);
        alert(`Failed to load loadout: ${error}`);
    }
}

async function saveLoadoutEdit(name) {
    const model = document.getElementById('edit-loadout-model').value;
    const systemPrompt = document.getElementById('edit-loadout-prompt').value.trim();
    const temperature = parseFloat(document.getElementById('edit-loadout-temp').value);
    
    try {
        // Load existing config to preserve other fields
        const existingConfigStr = await invoke('load_ai_loadout', { name });
        const existingConfig = JSON.parse(existingConfigStr);
        
        // Update fields
        existingConfig.model = model;
        existingConfig.system_prompt = systemPrompt;
        existingConfig.temperature = temperature;
        
        await invoke('save_ai_loadout', {
            name,
            config: JSON.stringify(existingConfig, null, 2)
        });
        
        logOperation(`Updated loadout: ${name}`, 'success');
        
        closePopup();
        setTimeout(() => openLoadoutManager(), 100);
    } catch (error) {
        console.error('[Loadout Manager] Failed to save loadout:', error);
        alert(`Failed to save loadout: ${error}`);
    }
}

async function deleteLoadout(name) {
    if (!confirm(`Delete loadout "${name}"?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        // TODO: Implement delete_ai_loadout backend command
        // For now, just log
        logOperation(`Delete loadout not yet implemented: ${name}`, 'warning');
        alert('Delete functionality coming soon');
    } catch (error) {
        console.error('[Loadout Manager] Failed to delete loadout:', error);
        alert(`Failed to delete loadout: ${error}`);
    }
}

// ============================================================================
// GENERIC POPUP UTILITIES
// ============================================================================

function closePopup() {
    const container = document.getElementById('popup-container');
    if (container) {
        container.classList.add('hidden');
        container.innerHTML = '';
    }
    PopupState.currentPopup = null;
}

// ============================================================================
// CONFIRMATION DIALOGS
// ============================================================================

export function confirmDialog(title, message, onConfirm, onCancel) {
    window.NixDeck.showPopup(
        title,
        `<div class="info-item" style="line-height: 1.6;">${message}</div>`,
        [
            { label: '[CANCEL]', action: onCancel || closePopup },
            { label: '[CONFIRM]', action: () => { onConfirm(); closePopup(); }, primary: true }
        ]
    );
}

// ============================================================================
// INFO DIALOGS
// ============================================================================

export function infoDialog(title, message) {
    window.NixDeck.showPopup(
        title,
        `<div class="info-item" style="line-height: 1.6;">${message}</div>`,
        [
            { label: '[OK]', action: closePopup, primary: true }
        ]
    );
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    PopupState,
    openLoadoutManager,
    closePopup,
    confirmDialog,
    infoDialog
};
