// NixDeck 2133 - Rice Studio Module
// Handles configuration editing for various rice components

import { invoke } from '@tauri-apps/api/tauri';
import { logOperation } from './main.js';

// ============================================================================
// STATE
// ============================================================================

const RiceStudioState = {
    currentComponent: 'waybar',
    currentConfig: '',
    originalConfig: '',
    hasUnsavedChanges: false
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeRiceStudio();
});

function initializeRiceStudio() {
    const componentButtons = document.querySelectorAll('.component-btn');
    const loadConfigBtn = document.getElementById('load-config-btn');
    const previewConfigBtn = document.getElementById('preview-config-btn');
    const applyConfigBtn = document.getElementById('apply-config-btn');
    const configEditor = document.getElementById('config-editor');
    
    // Component selector
    componentButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const component = btn.getAttribute('data-component');
            selectComponent(component);
        });
    });
    
    // Action buttons
    if (loadConfigBtn) {
        loadConfigBtn.addEventListener('click', loadCurrentConfig);
    }
    
    if (previewConfigBtn) {
        previewConfigBtn.addEventListener('click', previewConfig);
    }
    
    if (applyConfigBtn) {
        applyConfigBtn.addEventListener('click', applyConfig);
    }
    
    // Editor change tracking
    if (configEditor) {
        configEditor.addEventListener('input', () => {
            RiceStudioState.hasUnsavedChanges = true;
            RiceStudioState.currentConfig = configEditor.value;
        });
    }
    
    console.log('[Rice Studio] Initialized');
}

// ============================================================================
// COMPONENT SELECTION
// ============================================================================

function selectComponent(component) {
    if (RiceStudioState.hasUnsavedChanges) {
        if (!confirm('You have unsaved changes. Switch component anyway?')) {
            return;
        }
    }
    
    // Update state
    RiceStudioState.currentComponent = component;
    RiceStudioState.hasUnsavedChanges = false;
    
    // Update UI
    document.querySelectorAll('.component-btn').forEach(btn => {
        if (btn.getAttribute('data-component') === component) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    document.getElementById('current-component').textContent = component;
    
    // Clear editor
    const editor = document.getElementById('config-editor');
    if (editor) {
        editor.value = '';
        editor.placeholder = `// Load ${component} configuration...`;
    }
    
    logOperation(`Selected component: ${component}`, 'info');
}

// ============================================================================
// CONFIGURATION LOADING
// ============================================================================

async function loadCurrentConfig() {
    const component = RiceStudioState.currentComponent;
    const editor = document.getElementById('config-editor');
    
    if (!editor) return;
    
    try {
        editor.placeholder = 'Loading configuration...';
        
        const config = await invoke('get_rice_config', { component });
        
        RiceStudioState.originalConfig = config;
        RiceStudioState.currentConfig = config;
        RiceStudioState.hasUnsavedChanges = false;
        
        editor.value = config;
        editor.placeholder = '';
        
        logOperation(`Loaded ${component} configuration`, 'success');
    } catch (error) {
        console.error('[Rice Studio] Failed to load config:', error);
        editor.placeholder = `Error loading configuration: ${error}`;
        logOperation(`Failed to load ${component} config: ${error}`, 'error');
    }
}

// ============================================================================
// CONFIGURATION PREVIEW
// ============================================================================

async function previewConfig() {
    const component = RiceStudioState.currentComponent;
    const config = RiceStudioState.currentConfig;
    
    if (!config) {
        alert('No configuration to preview. Load a config first.');
        return;
    }
    
    try {
        const diff = await invoke('preview_rice_config', { 
            component, 
            config 
        });
        
        window.NixDeck.showPopup(
            `Preview: ${component}`,
            `
                <div class="info-item">
                    <strong>Component:</strong> ${component}
                </div>
                <div class="info-item" style="margin-top: 16px;">
                    <strong>Changes:</strong>
                    <pre style="background: var(--color-bg-tertiary); padding: 8px; margin-top: 8px; max-height: 400px; overflow-y: auto; font-size: 11px;">${escapeHtml(diff)}</pre>
                </div>
                <div class="info-item" style="margin-top: 16px; color: var(--color-warning); font-size: 11px;">
                    Warning: This is a simplified preview. Actual changes may vary.
                </div>
            `,
            [
                { label: '[CLOSE]', action: window.NixDeck.closePopup }
            ]
        );
        
        logOperation(`Previewed ${component} configuration`, 'info');
    } catch (error) {
        console.error('[Rice Studio] Preview error:', error);
        logOperation(`Preview failed: ${error}`, 'error');
        alert(`Preview failed: ${error}`);
    }
}

// ============================================================================
// CONFIGURATION APPLICATION
// ============================================================================

async function applyConfig() {
    const component = RiceStudioState.currentComponent;
    const config = RiceStudioState.currentConfig;
    
    if (!config) {
        alert('No configuration to apply. Load a config first.');
        return;
    }
    
    if (!RiceStudioState.hasUnsavedChanges) {
        alert('No changes to apply.');
        return;
    }
    
    // Confirmation dialog
    const confirmed = confirm(
        `Apply configuration to ${component}?\n\n` +
        'This will:\n' +
        '1. Create a backup of the current config\n' +
        '2. Write the new configuration\n' +
        '3. You may need to reload the component\n\n' +
        'Continue?'
    );
    
    if (!confirmed) return;
    
    try {
        // Create snapshot first
        const snapshotName = `${component}-${Date.now()}`;
        await invoke('create_snapshot', { name: snapshotName });
        logOperation(`Created snapshot: ${snapshotName}`, 'success');
        
        // Apply configuration
        await invoke('apply_rice_config', { 
            component, 
            config 
        });
        
        RiceStudioState.originalConfig = config;
        RiceStudioState.hasUnsavedChanges = false;
        
        logOperation(`Applied ${component} configuration`, 'success');
        
        // Success dialog
        window.NixDeck.showPopup(
            'Configuration Applied',
            `
                <div class="info-item">
                    <strong>Component:</strong> ${component}
                </div>
                <div class="info-item" style="margin-top: 16px;">
                    <strong>Status:</strong> <span style="color: var(--color-success);">Successfully applied</span>
                </div>
                <div class="info-item" style="margin-top: 16px;">
                    <strong>Backup:</strong> ${snapshotName}
                </div>
                <div class="info-item" style="margin-top: 16px; color: var(--color-text-dim); font-size: 11px;">
                    You may need to reload ${component} for changes to take effect.
                </div>
            `,
            [
                { label: '[CLOSE]', action: window.NixDeck.closePopup },
                { label: '[RELOAD COMPONENT]', action: () => reloadComponent(component), primary: true }
            ]
        );
    } catch (error) {
        console.error('[Rice Studio] Apply error:', error);
        logOperation(`Failed to apply ${component} config: ${error}`, 'error');
        alert(`Failed to apply configuration: ${error}`);
    }
}

// ============================================================================
// COMPONENT RELOADING
// ============================================================================

async function reloadComponent(component) {
    window.NixDeck.closePopup();
    
    const reloadCommands = {
        'waybar': 'killall waybar && waybar &',
        'polybar': 'killall polybar && polybar &',
        'eww': 'eww reload',
        'conky': 'killall conky && conky &',
        'picom': 'killall picom && picom &',
        'dunst': 'killall dunst && dunst &',
        'kitty': 'echo "Restart Kitty terminal manually"',
        'alacritty': 'echo "Restart Alacritty terminal manually"',
        'rofi': 'echo "Rofi will use new config on next launch"'
    };
    
    const command = reloadCommands[component];
    
    if (!command) {
        alert(`No reload command defined for ${component}`);
        return;
    }
    
    try {
        const result = await invoke('execute_command', { command });
        
        if (result.success) {
            logOperation(`Reloaded ${component}`, 'success');
            alert(`${component} reloaded successfully`);
        } else {
            logOperation(`Failed to reload ${component}: ${result.stderr}`, 'error');
            alert(`Reload command completed but may have issues:\n${result.stderr}`);
        }
    } catch (error) {
        console.error('[Rice Studio] Reload error:', error);
        logOperation(`Failed to reload ${component}: ${error}`, 'error');
        alert(`Failed to reload ${component}: ${error}`);
    }
}

// ============================================================================
// AI ASSIST
// ============================================================================

// TODO: Implement AI-assisted rice generation
// This would integrate with the AI console to generate configurations

// ============================================================================
// UTILITIES
// ============================================================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    RiceStudioState,
    selectComponent,
    loadCurrentConfig,
    applyConfig
};
