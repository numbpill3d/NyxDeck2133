// NixDeck 2133 - AI Console Module
// Handles AI chat interface and OpenRouter integration

import { invoke } from '@tauri-apps/api/tauri';
import { logOperation } from './main.js';

// ============================================================================
// STATE
// ============================================================================

const AIConsoleState = {
    messages: [],
    activeLoadout: 'DEFAULT',
    isProcessing: false,
    operations: []
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeAIConsole();
});

function initializeAIConsole() {
    const aiInput = document.getElementById('ai-input');
    const sendBtn = document.getElementById('send-btn');
    const changeLoadoutBtn = document.getElementById('change-loadout-btn');
    
    if (aiInput) {
        aiInput.addEventListener('keypress', handleKeyPress);
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (changeLoadoutBtn) {
        changeLoadoutBtn.addEventListener('click', openLoadoutSelector);
    }
    
    console.log('[AI Console] Initialized');
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('ai-input');
    const message = input.value.trim();
    
    if (!message || AIConsoleState.isProcessing) {
        return;
    }
    
    // Clear input
    input.value = '';
    
    // Add user message to chat
    addMessageToChat('USER', message, 'user-message');
    
    // Set processing state
    AIConsoleState.isProcessing = true;
    updateSendButton(true);
    
    try {
        // Send to backend
        const response = await invoke('send_ai_message', {
            message,
            loadout: AIConsoleState.activeLoadout
        });
        
        // Add AI response to chat
        addMessageToChat('AI', response, 'ai-message');
        
        // Check if response contains operation commands
        parseOperations(response);
        
        logOperation('AI message sent and received', 'success');
    } catch (error) {
        console.error('[AI Console] Error:', error);
        addMessageToChat('SYSTEM', `Error: ${error}`, 'system-message');
        logOperation(`AI error: ${error}`, 'error');
    } finally {
        AIConsoleState.isProcessing = false;
        updateSendButton(false);
    }
}

function addMessageToChat(sender, content, className) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    const timestamp = new Date().toTimeString().split(' ')[0];
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.innerHTML = `
        <span class="message-time">${timestamp}</span>
        <span class="message-sender">[${sender}]</span>
        <span class="message-content">${escapeHtml(content)}</span>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Store in state
    AIConsoleState.messages.push({
        timestamp,
        sender,
        content,
        className
    });
}

function updateSendButton(isProcessing) {
    const sendBtn = document.getElementById('send-btn');
    if (!sendBtn) return;
    
    if (isProcessing) {
        sendBtn.textContent = '[PROCESSING...]';
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
    } else {
        sendBtn.textContent = '[SEND]';
        sendBtn.disabled = false;
        sendBtn.style.opacity = '1';
    }
}

// ============================================================================
// OPERATIONS PARSING
// ============================================================================

function parseOperations(response) {
    // Look for operation markers in AI response
    // Format: [OPERATION:type:name]
    const operationRegex = /\[OPERATION:(\w+):(.+?)\]/g;
    let match;
    
    while ((match = operationRegex.exec(response)) !== null) {
        const [, type, name] = match;
        createOperation(type, name, response);
    }
}

function createOperation(type, name, context) {
    const operation = {
        id: Date.now(),
        type,
        name,
        context,
        status: 'pending'
    };
    
    AIConsoleState.operations.push(operation);
    addOperationCard(operation);
    
    logOperation(`New operation: ${type} - ${name}`, 'info');
}

function addOperationCard(operation) {
    const operationsList = document.getElementById('operations-list');
    if (!operationsList) return;
    
    const card = document.createElement('div');
    card.className = 'operation-card';
    card.setAttribute('data-operation-id', operation.id);
    
    card.innerHTML = `
        <div class="operation-title">${operation.name}</div>
        <div class="operation-status">Status: ${operation.status}</div>
        <div class="operation-actions" style="margin-top: 8px; display: flex; gap: 4px;">
            <button class="action-btn" data-action="preview" data-id="${operation.id}">[PREVIEW]</button>
            <button class="action-btn" data-action="apply" data-id="${operation.id}">[APPLY]</button>
            <button class="action-btn" data-action="cancel" data-id="${operation.id}">[CANCEL]</button>
        </div>
    `;
    
    // Add event listeners
    card.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', handleOperationAction);
    });
    
    operationsList.appendChild(card);
    updateOperationCount();
}

async function handleOperationAction(event) {
    const action = event.target.getAttribute('data-action');
    const operationId = parseInt(event.target.getAttribute('data-id'));
    
    const operation = AIConsoleState.operations.find(op => op.id === operationId);
    if (!operation) return;
    
    switch (action) {
        case 'preview':
            previewOperation(operation);
            break;
        case 'apply':
            await applyOperation(operation);
            break;
        case 'cancel':
            cancelOperation(operation);
            break;
    }
}

function previewOperation(operation) {
    window.NixDeck.showPopup(
        `Operation Preview: ${operation.name}`,
        `
            <div class="info-item">
                <strong>Type:</strong> ${operation.type}
            </div>
            <div class="info-item">
                <strong>Name:</strong> ${operation.name}
            </div>
            <div class="info-item" style="margin-top: 16px;">
                <strong>Context:</strong>
                <pre style="background: var(--color-bg-tertiary); padding: 8px; margin-top: 8px; max-height: 300px; overflow-y: auto;">${escapeHtml(operation.context)}</pre>
            </div>
        `,
        [
            { label: '[CLOSE]', action: window.NixDeck.closePopup }
        ]
    );
}

async function applyOperation(operation) {
    try {
        operation.status = 'applying';
        updateOperationCard(operation);
        
        // TODO: Implement actual operation application based on type
        // For now, just simulate
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        operation.status = 'completed';
        updateOperationCard(operation);
        
        logOperation(`Applied operation: ${operation.name}`, 'success');
        
        // Remove after a delay
        setTimeout(() => {
            removeOperationCard(operation);
        }, 3000);
    } catch (error) {
        operation.status = 'failed';
        updateOperationCard(operation);
        logOperation(`Operation failed: ${error}`, 'error');
    }
}

function cancelOperation(operation) {
    operation.status = 'cancelled';
    removeOperationCard(operation);
    logOperation(`Cancelled operation: ${operation.name}`, 'info');
}

function updateOperationCard(operation) {
    const card = document.querySelector(`[data-operation-id="${operation.id}"]`);
    if (!card) return;
    
    const statusElement = card.querySelector('.operation-status');
    if (statusElement) {
        statusElement.textContent = `Status: ${operation.status}`;
    }
    
    // Update styling based on status
    if (operation.status === 'completed') {
        card.style.borderLeftColor = 'var(--color-success)';
    } else if (operation.status === 'failed') {
        card.style.borderLeftColor = 'var(--color-error)';
    } else if (operation.status === 'applying') {
        card.style.borderLeftColor = 'var(--color-warning)';
    }
}

function removeOperationCard(operation) {
    const card = document.querySelector(`[data-operation-id="${operation.id}"]`);
    if (card) {
        card.remove();
    }
    
    // Remove from state
    AIConsoleState.operations = AIConsoleState.operations.filter(op => op.id !== operation.id);
    updateOperationCount();
}

function updateOperationCount() {
    const countElement = document.querySelector('.queue-count');
    if (countElement) {
        countElement.textContent = AIConsoleState.operations.length;
    }
}

// ============================================================================
// LOADOUT MANAGEMENT
// ============================================================================

function openLoadoutSelector() {
    window.dispatchEvent(new CustomEvent('open-loadout-manager'));
}

export async function setActiveLoadout(loadoutName) {
    AIConsoleState.activeLoadout = loadoutName;
    
    // Update UI
    document.querySelector('.loadout-name').textContent = loadoutName;
    document.getElementById('info-loadout-name').textContent = loadoutName;
    
    // Add system message
    addMessageToChat('SYSTEM', `Switched to loadout: ${loadoutName}`, 'system-message');
    
    logOperation(`Switched to loadout: ${loadoutName}`, 'info');
}

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
    AIConsoleState,
    addMessageToChat,
    setActiveLoadout,
    createOperation
};
