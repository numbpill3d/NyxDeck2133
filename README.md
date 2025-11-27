# NixDeck 2133

> the blacksite control room for your linux reality

## What is NixDeck 2133?

NixDeck 2133 is a plug-and-play, fully skinnable Arch-native ricing and automation control system. It is both an AI ops terminal and a universal rice-orchestrator—a convergence point for aesthetics, automation, system daemons, and AI loadouts under one unified GUI.

This is not a settings panel. **This is a deck.** A place where you configure the soul of your system.

## Core Features

- **AI Orchestration**: OpenRouter integration with switchable personality loadouts
- **Full Ricing Control**: Conky, Waybar, Plymouth, SDDM, Eww, and beyond
- **Daemon Engineering**: Visual systemd service creation and management
- **Cron Composer**: Drag-and-drop scheduling interface
- **Desktop Containers**: Save/restore entire system configurations as "world states"
- **Theme Lab**: HTML+CSS skinnable interface with unlimited customization
- **Operation Automation**: AI-supervised long-running task execution

## Architecture

NixDeck 2133 is built on:
- **Frontend**: HTML/CSS/JavaScript (fully skinnable)
- **Backend**: Rust (Tauri framework)
- **AI Layer**: OpenRouter API integration
- **System Layer**: systemd, cron, config file management
- **Safety Layer**: Dry-run validation, diff viewing, versioned snapshots, rollback

## Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/nixdeck-2133.git
cd nixdeck-2133

# Install Tauri prerequisites (Arch Linux)
sudo pacman -S webkit2gtk base-devel curl wget openssl appmenu-gtk-module gtk3 libappindicator-gtk3 librsvg libvips

# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install frontend dependencies
npm install

# Run development build
npm run tauri dev

# Build production release
npm run tauri build
```

## Project Structure
