// NixDeck 2133 - Main UI Orchestration
// Core application initialization and state management

import { invoke } from '@tauri-apps/api/tauri';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const AppState = {
    currentPanel: 'ai-console',
    currentTab: 'info',
    activeLoadout: 'DEFAULT',
    systemInfo: {},
    operations: [],
    initialized: false
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[NixDeck 2133] Initializing...');
    
    // Initialize UI components
    initializeNavigation();
    initializeTabs();
    initializeSystemInfo();
    initializeStatusBar();
    initializePopups();
    
    // Load initial data
    await loadSystemInfo();
    await loadActiveLoadout();
    
    AppState.initialized = true;
    console.log('[NixDeck 2133] Initialization complete');
    
    logOperation('System initialized', 'success');
});

// ============================================================================
// NAVIGATION SYSTEM
// ============================================================================

function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const panelId = item.getAttribute('data-panel');
            switchPanel(panelId);
        });
    });
    
    console.log('[Navigation] Initialized');
}

function switchPanel(panelId) {
    // Update state
    AppState.currentPanel = panelId;
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-panel') === panelId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update panel views
    document.querySelectorAll('.panel-view').forEach(view => {
        if (view.id === `${panelId}-view`) {
            view.classList.add('active');
        } else {
            view.classList.remove('active');
        }
    });
    
    // Load panel-specific data
    loadPanelData(panelId);
    
    console.log(`[Navigation] Switched to panel: ${panelId}`);
}

async function loadPanelData(panelId) {
    switch(panelId) {
        case 'daemon-workshop':
            await loadDaemons();
            break;
        case 'cron-composer':
            await loadCronJobs();
            break;
        case 'containers':
            await loadContainers();
            break;
        case 'theme-lab':
            await loadThemes();
            break;
        case 'operations-log':
            // Log is always updated in real-time
            break;
    }
}

// ============================================================================
// TAB SYSTEM
// ============================================================================

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    console.log('[Tabs] Initialized');
}

function switchTab(tabId) {
    // Update state
    AppState.currentTab = tabId;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.rail-tab').forEach(tab => {
        if (tab.id === `${tabId}-tab`) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Load tab-specific data
    if (tabId === 'assets') {
        loadAssets();
    }
}

// ============================================================================
// SYSTEM INFO
// ============================================================================

async function loadSystemInfo() {
    try {
        const info = await invoke('get_system_info');
        AppState.systemInfo = info;
        
        // Update UI
        document.getElementById('system-hostname').textContent = info.hostname;
        document.getElementById('info-hostname').textContent = info.hostname;
        document.getElementById('info-kernel').textContent = info.kernel;
        document.getElementById('info-distro').textContent = info.distro;
        document.getElementById('info-uptime').textContent = info.uptime;
        
        console.log('[System Info] Loaded:', info);
    } catch (error) {
        console.error('[System Info] Failed to load:', error);
        logOperation(`Failed to load system info: ${error}`, 'error');
    }
}

function initializeSystemInfo() {
    // Refresh system info every 30 seconds
    setInterval(async () => {
        await loadSystemInfo();
    }, 30000);
}

// ============================================================================
// STATUS BAR
// ============================================================================

function initializeStatusBar() {
    updateTime();
    setInterval(updateTime, 1000);
}

function updateTime() {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];
    document.getElementById('system-time').textContent = timeString;
}

// ============================================================================
// AI LOADOUT
// ============================================================================

async function loadActiveLoadout() {
    try {
        const loadouts = await invoke('list_ai_loadouts');
        
        if (loadouts.length > 0) {
            AppState.activeLoadout = loadouts[0];
            document.querySelector('.loadout-name').textContent = loadouts[0];
            document.getElementById('info-loadout-name').textContent = loadouts[0];
        }
        
        console.log('[Loadout] Active:', AppState.activeLoadout);
    } catch (error) {
        console.error('[Loadout] Failed to load:', error);
    }
}

// ============================================================================
// DAEMONS
// ============================================================================

async function loadDaemons() {
    try {
        const services = await invoke('list_systemd_services');
        const daemonList = document.getElementById('daemon-list');
        
        if (!daemonList) return;
        
        daemonList.innerHTML = '';
        
        if (services.length === 0) {
            daemonList.innerHTML = '<div class="info-item">No services found</div>';
            return;
        }
        
        services.forEach(service => {
            const card = createDaemonCard(service);
            daemonList.appendChild(card);
        });
        
        console.log('[Daemons] Loaded:', services.length);
    } catch (error) {
        console.error('[Daemons] Failed to load:', error);
        logOperation(`Failed to load daemons: ${error}`, 'error');
    }
}

function createDaemonCard(serviceInfo) {
    const card = document.createElement('div');
    card.className = 'daemon-card';
    
    // Parse service name from systemctl output
    const serviceName = serviceInfo.split(/\s+/)[0] || 'unknown.service';
    const isActive = serviceInfo.includes('active') || serviceInfo.includes('running');
    
    card.innerHTML = `
        <div class="daemon-header">
            <span class="daemon-name">${serviceName}</span>
            <span class="daemon-status ${isActive ? 'active' : 'inactive'}">
                ${isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
        </div>
        <div class="daemon-actions">
            <button class="daemon-action-btn" data-action="start" data-service="${serviceName}">[START]</button>
            <button class="daemon-action-btn" data-action="stop" data-service="${serviceName}">[STOP]</button>
            <button class="daemon-action-btn" data-action="restart" data-service="${serviceName}">[RESTART]</button>
            <button class="daemon-action-btn" data-action="status" data-service="${serviceName}">[STATUS]</button>
        </div>
    `;
    
    // Add event listeners
    card.querySelectorAll('.daemon-action-btn').forEach(btn => {
        btn.addEventListener('click', handleDaemonAction);
    });
    
    return card;
}

async function handleDaemonAction(event) {
    const action = event.target.getAttribute('data-action');
    const service = event.target.getAttribute('data-service');
    
    try {
        switch(action) {
            case 'start':
                await invoke('start_systemd_service', { name: service });
                logOperation(`Started service: ${service}`, 'success');
                break;
            case 'stop':
                await invoke('stop_systemd_service', { name: service });
                logOperation(`Stopped service: ${service}`, 'success');
                break;
            case 'restart':
                await invoke('stop_systemd_service', { name: service });
                await invoke('start_systemd_service', { name: service });
                logOperation(`Restarted service: ${service}`, 'success');
                break;
            case 'status':
                const status = await invoke('get_service_status', { name: service });
                showPopup('Service Status', `<pre>${status}</pre>`);
                break;
        }
        
        // Reload daemon list
        await loadDaemons();
    } catch (error) {
        console.error('[Daemon Action] Failed:', error);
        logOperation(`Daemon action failed: ${error}`, 'error');
    }
}

// ============================================================================
// CRON JOBS
// ============================================================================

async function loadCronJobs() {
    try {
        const jobs = await invoke('list_cron_jobs');
        const cronList = document.getElementById('cron-list');
        
        if (!cronList) return;
        
        cronList.innerHTML = '';
        
        if (jobs.length === 0) {
            cronList.innerHTML = '<div class="info-item">No cron jobs found</div>';
            return;
        }
        
        jobs.forEach((job, index) => {
            const card = createCronCard(job, index);
            cronList.appendChild(card);
        });
        
        console.log('[Cron] Loaded:', jobs.length);
    } catch (error) {
        console.error('[Cron] Failed to load:', error);
        logOperation(`Failed to load cron jobs: ${error}`, 'error');
    }
}

function createCronCard(jobString, index) {
    const card = document.createElement('div');
    card.className = 'cron-card';
    
    card.innerHTML = `
        <div class="cron-header">
            <span class="cron-name">Job #${index + 1}</span>
        </div>
        <div class="cron-content">
            <code>${jobString}</code>
        </div>
        <div class="cron-actions">
            <button class="cron-action-btn" data-action="delete" data-id="${index}">[DELETE]</button>
        </div>
    `;
    
    // Add event listeners
    card.querySelectorAll('.cron-action-btn').forEach(btn => {
        btn.addEventListener('click', handleCronAction);
    });
    
    return card;
}

async function handleCronAction(event) {
    const action = event.target.getAttribute('data-action');
    const id = event.target.getAttribute('data-id');
    
    try {
        if (action === 'delete') {
            await invoke('delete_cron_job', { id });
            logOperation(`Deleted cron job #${parseInt(id) + 1}`, 'success');
            await loadCronJobs();
        }
    } catch (error) {
        console.error('[Cron Action] Failed:', error);
        logOperation(`Cron action failed: ${error}`, 'error');
    }
}

// ============================================================================
// CONTAINERS
// ============================================================================

async function loadContainers() {
    try {
        const containers = await invoke('list_containers');
        const containersGrid = document.getElementById('containers-grid');
        
        if (!containersGrid) return;
        
        containersGrid.innerHTML = '';
        
        if (containers.length === 0) {
            containersGrid.innerHTML = '<div class="info-item">No containers found</div>';
            return;
        }
        
        containers.forEach(container => {
            const card = createContainerCard(container);
            containersGrid.appendChild(card);
        });
        
        console.log('[Containers] Loaded:', containers.length);
    } catch (error) {
        console.error('[Containers] Failed to load:', error);
        logOperation(`Failed to load containers: ${error}`, 'error');
    }
}

function createContainerCard(containerName) {
    const card = document.createElement('div');
    card.className = 'container-card';
    
    card.innerHTML = `
        <div class="container-name">${containerName}</div>
        <div class="container-info">Desktop container snapshot</div>
        <div class="container-actions">
            <button class="container-action-btn" data-action="load" data-container="${containerName}">[LOAD]</button>
            <button class="container-action-btn" data-action="export" data-container="${containerName}">[EXPORT]</button>
            <button class="container-action-btn" data-action="delete" data-container="${containerName}">[DELETE]</button>
        </div>
    `;
    
    // Add event listeners
    card.querySelectorAll('.container-action-btn').forEach(btn => {
        btn.addEventListener('click', handleContainerAction);
    });
    
    return card;
}

async function handleContainerAction(event) {
    const action = event.target.getAttribute('data-action');
    const container = event.target.getAttribute('data-container');
    
    try {
        switch(action) {
            case 'load':
                await invoke('load_container', { name: container });
                logOperation(`Loaded container: ${container}`, 'success');
                break;
            case 'export':
                // TODO: Implement file dialog for export path
                logOperation(`Export not yet implemented`, 'warning');
                break;
            case 'delete':
                if (confirm(`Delete container "${container}"?`)) {
                    await invoke('delete_container', { name: container });
                    logOperation(`Deleted container: ${container}`, 'success');
                    await loadContainers();
                }
                break;
        }
    } catch (error) {
        console.error('[Container Action] Failed:', error);
        logOperation(`Container action failed: ${error}`, 'error');
    }
}

// ============================================================================
// THEMES
// ============================================================================

async function loadThemes() {
    try {
        const themes = await invoke('list_themes');
        const themeList = document.getElementById('theme-list');
        
        if (!themeList) return;
        
        themeList.innerHTML = '';
        
        themes.forEach(theme => {
            const card = createThemeCard(theme);
            themeList.appendChild(card);
        });
        
        console.log('[Themes] Loaded:', themes.length);
    } catch (error) {
        console.error('[Themes] Failed to load:', error);
        logOperation(`Failed to load themes: ${error}`, 'error');
    }
}

function createThemeCard(themeName) {
    const card = document.createElement('div');
    card.className = 'theme-card';
    if (themeName === 'blacksite') {
        card.classList.add('active');
    }
    
    card.innerHTML = `
        <div class="theme-preview"></div>
        <div class="theme-name">${themeName}</div>
    `;
    
    card.addEventListener('click', () => loadTheme(themeName));
    
    return card;
}

async function loadTheme(themeName) {
    try {
        const themeCSS = await invoke('load_theme', { name: themeName });
        
        // Create or update theme style element
        let styleElement = document.getElementById('dynamic-theme');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'dynamic-theme';
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = themeCSS;
        
        logOperation(`Loaded theme: ${themeName}`, 'success');
    } catch (error) {
        console.error('[Theme] Failed to load:', error);
        logOperation(`Failed to load theme: ${error}`, 'error');
    }
}

// ============================================================================
// ASSETS
// ============================================================================

async function loadAssets() {
    await loadSnapshotsList();
    await loadThemesList();
}

async function loadSnapshotsList() {
    try {
        const snapshots = await invoke('list_snapshots');
        const snapshotsList = document.getElementById('snapshots-list');
        
        if (!snapshotsList) return;
        
        snapshotsList.innerHTML = '';
        
        if (snapshots.length === 0) {
            snapshotsList.innerHTML = '<div class="asset-item">No snapshots</div>';
            return;
        }
        
        snapshots.forEach(snapshot => {
            const item = document.createElement('div');
            item.className = 'asset-item';
            item.textContent = snapshot;
            item.addEventListener('click', () => restoreSnapshot(snapshot));
            snapshotsList.appendChild(item);
        });
    } catch (error) {
        console.error('[Assets] Failed to load snapshots:', error);
    }
}

async function loadThemesList() {
    try {
        const themes = await invoke('list_themes');
        const themesList = document.getElementById('themes-list-assets');
        
        if (!themesList) return;
        
        themesList.innerHTML = '';
        
        themes.forEach(theme => {
            const item = document.createElement('div');
            item.className = 'asset-item';
            item.textContent = theme;
            item.addEventListener('click', () => loadTheme(theme));
            themesList.appendChild(item);
        });
    } catch (error) {
        console.error('[Assets] Failed to load themes:', error);
    }
}

async function restoreSnapshot(snapshotName) {
    if (!confirm(`Restore snapshot "${snapshotName}"? This will replace current configs.`)) {
        return;
    }
    
    try {
        await invoke('restore_snapshot', { name: snapshotName });
        logOperation(`Restored snapshot: ${snapshotName}`, 'success');
    } catch (error) {
        console.error('[Snapshot] Failed to restore:', error);
        logOperation(`Failed to restore snapshot: ${error}`, 'error');
    }
}

// ============================================================================
// POPUP SYSTEM
// ============================================================================

function initializePopups() {
    // Loadout Manager button
    const loadoutBtn = document.getElementById('loadout-manager-btn');
    if (loadoutBtn) {
        loadoutBtn.addEventListener('click', openLoadoutManager);
    }
    
    // New daemon button
    const newDaemonBtn = document.getElementById('new-daemon-btn');
    if (newDaemonBtn) {
        newDaemonBtn.addEventListener('click', openNewDaemonPopup);
    }
    
    // New cron button
    const newCronBtn = document.getElementById('new-cron-btn');
    if (newCronBtn) {
        newCronBtn.addEventListener('click', openNewCronPopup);
    }
    
    // New container button
    const newContainerBtn = document.getElementById('new-container-btn');
    if (newContainerBtn) {
        newContainerBtn.addEventListener('click', openNewContainerPopup);
    }
    
    console.log('[Popups] Initialized');
}

function openLoadoutManager() {
    // This will be implemented in popups.js
    window.dispatchEvent(new CustomEvent('open-loadout-manager'));
}

function openNewDaemonPopup() {
    showPopup('Create New Daemon', `
        <div class="info-item">
            <label>Service Name:</label>
            <input type="text" id="daemon-name" placeholder="my-service" style="width: 100%; padding: 8px; background: var(--color-bg-tertiary); border: var(--border); color: var(--color-text-primary); font-family: var(--font-mono);">
        </div>
        <div class="info-item" style="margin-top: 16px;">
            <label>Service Configuration:</label>
            <textarea id="daemon-config" rows="15" style="width: 100%; padding: 8px; background: var(--color-bg-tertiary); border: var(--border); color: var(--color-text-primary); font-family: var(--font-mono);" placeholder="[Unit]
Description=My Service

[Service]
ExecStart=/usr/bin/my-command

[Install]
WantedBy=default.target"></textarea>
        </div>
    `, [
        { label: '[CANCEL]', action: closePopup },
        { label: '[CREATE]', action: createDaemon, primary: true }
    ]);
}

async function createDaemon() {
    const name = document.getElementById('daemon-name').value;
    const config = document.getElementById('daemon-config').value;
    
    if (!name || !config) {
        alert('Please provide both name and configuration');
        return;
    }
    
    try {
        await invoke('create_systemd_service', { name, content: config });
        logOperation(`Created daemon: ${name}`, 'success');
        closePopup();
        await loadDaemons();
    } catch (error) {
        console.error('[Daemon] Failed to create:', error);
        logOperation(`Failed to create daemon: ${error}`, 'error');
    }
}

function openNewCronPopup() {
    showPopup('Create New Cron Job', `
        <div class="info-item">
            <label>Schedule (cron format):</label>
            <input type="text" id="cron-schedule" placeholder="0 * * * *" style="width: 100%; padding: 8px; background: var(--color-bg-tertiary); border: var(--border); color: var(--color-text-primary); font-family: var(--font-mono);">
        </div>
        <div class="info-item" style="margin-top: 16px;">
            <label>Command:</label>
            <input type="text" id="cron-command" placeholder="/usr/bin/my-script.sh" style="width: 100%; padding: 8px; background: var(--color-bg-tertiary); border: var(--border); color: var(--color-text-primary); font-family: var(--font-mono);">
        </div>
        <div class="info-item" style="margin-top: 16px; color: var(--color-text-dim); font-size: 11px;">
            Examples:<br>
            0 * * * * - Every hour<br>
            */5 * * * * - Every 5 minutes<br>
            0 0 * * * - Daily at midnight
        </div>
    `, [
        { label: '[CANCEL]', action: closePopup },
        { label: '[CREATE]', action: createCronJob, primary: true }
    ]);
}

async function createCronJob() {
    const schedule = document.getElementById('cron-schedule').value;
    const command = document.getElementById('cron-command').value;
    
    if (!schedule || !command) {
        alert('Please provide both schedule and command');
        return;
    }
    
    try {
        await invoke('create_cron_job', { schedule, command });
        logOperation(`Created cron job: ${schedule} ${command}`, 'success');
        closePopup();
        await loadCronJobs();
    } catch (error) {
        console.error('[Cron] Failed to create:', error);
        logOperation(`Failed to create cron job: ${error}`, 'error');
    }
}

function openNewContainerPopup() {
    showPopup('Create New Container', `
        <div class="info-item">
            <label>Container Name:</label>
            <input type="text" id="container-name" placeholder="my-desktop-config" style="width: 100%; padding: 8px; background: var(--color-bg-tertiary); border: var(--border); color: var(--color-text-primary); font-family: var(--font-mono);">
        </div>
        <div class="info-item" style="margin-top: 16px; color: var(--color-text-dim); font-size: 11px;">
            This will snapshot your current desktop configuration including:
            waybar, polybar, eww, conky, kitty, alacritty, picom, dunst, rofi, and GTK themes.
        </div>
    `, [
        { label: '[CANCEL]', action: closePopup },
        { label: '[CREATE]', action: createContainer, primary: true }
    ]);
}

async function createContainer() {
    const name = document.getElementById('container-name').value;
    
    if (!name) {
        alert('Please provide a container name');
        return;
    }
    
    try {
        await invoke('create_container', { name });
        logOperation(`Created container: ${name}`, 'success');
        closePopup();
        await loadContainers();
    } catch (error) {
        console.error('[Container] Failed to create:', error);
        logOperation(`Failed to create container: ${error}`, 'error');
    }
}

function showPopup(title, content, buttons = []) {
    const container = document.getElementById('popup-container');
    if (!container) return;
    
    const popup = document.createElement('div');
    popup.className = 'popup';
    
    const buttonsHTML = buttons.map(btn => 
        `<button class="popup-btn ${btn.primary ? 'primary' : ''}" data-action="${btn.label}">${btn.label}</button>`
    ).join('');
    
    popup.innerHTML = `
        <div class="popup-header">
            <div class="popup-title">${title}</div>
            <button class="popup-close">[X]</button>
        </div>
        <div class="popup-content">
            ${content}
        </div>
        <div class="popup-footer">
            ${buttonsHTML}
        </div>
    `;
    
    // Add event listeners
    popup.querySelector('.popup-close').addEventListener('click', closePopup);
    
    buttons.forEach(btn => {
        const btnElement = popup.querySelector(`[data-action="${btn.label}"]`);
        if (btnElement) {
            btnElement.addEventListener('click', btn.action);
        }
    });
    
    container.innerHTML = '';
    container.appendChild(popup);
    container.classList.remove('hidden');
}

function closePopup() {
    const container = document.getElementById('popup-container');
    if (container) {
        container.classList.add('hidden');
        container.innerHTML = '';
    }
}

// ============================================================================
// OPERATIONS LOG
// ============================================================================

function logOperation(message, type = 'info') {
    const timestamp = new Date().toTimeString().split(' ')[0];
    const logEntry = {
        timestamp,
        message,
        type
    };
    
    AppState.operations.push(logEntry);
    
    // Update operations log view
    const logOutput = document.getElementById('operations-log');
    if (logOutput) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${timestamp}] ${message}`;
        logOutput.appendChild(entry);
        logOutput.scrollTop = logOutput.scrollHeight;
    }
    
    console.log(`[Operation] ${type.toUpperCase()}: ${message}`);
}

// ============================================================================
// MINI TERMINAL
// ============================================================================

const miniTerminalInput = document.getElementById('mini-terminal-input');
if (miniTerminalInput) {
    miniTerminalInput.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter') {
            const command = miniTerminalInput.value.trim();
            if (!command) return;
            
            const output = document.getElementById('mini-terminal-output');
            
            // Add command to output
            const cmdLine = document.createElement('div');
            cmdLine.className = 'terminal-line';
            cmdLine.textContent = `$ ${command}`;
            output.appendChild(cmdLine);
            
            miniTerminalInput.value = '';
            
            try {
                const result = await invoke('execute_command', { command });
                
                const resultLine = document.createElement('div');
                resultLine.className = 'terminal-line';
                resultLine.textContent = result.stdout || result.stderr || '(no output)';
                output.appendChild(resultLine);
                
                if (!result.success) {
                    logOperation(`Command failed: ${command}`, 'error');
                }
            } catch (error) {
                const errorLine = document.createElement('div');
                errorLine.className = 'terminal-line';
                errorLine.style.color = 'var(--color-error)';
                errorLine.textContent = `Error: ${error}`;
                output.appendChild(errorLine);
                
                logOperation(`Command error: ${error}`, 'error');
            }
            
            output.scrollTop = output.scrollHeight;
        }
    });
}

// ============================================================================
// EXPORTS
// ============================================================================

window.NixDeck = {
    AppState,
    switchPanel,
    switchTab,
    logOperation,
    showPopup,
    closePopup,
    loadSystemInfo,
    loadDaemons,
    loadCronJobs,
    loadContainers,
    loadThemes
};

export {
    AppState,
    switchPanel,
    switchTab,
    logOperation,
    showPopup,
    closePopup
};
