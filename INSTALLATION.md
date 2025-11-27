# NixDeck 2133 - Installation Guide

## Prerequisites

### System Requirements
- **OS**: Arch Linux (or Arch-based distro)
- **RAM**: Minimum 2GB
- **Disk**: 500MB free space
- **Display**: X11 or Wayland

### Required Packages
```bash
# Tauri dependencies
sudo pacman -S webkit2gtk base-devel curl wget openssl appmenu-gtk-module gtk3 libappindicator-gtk3 librsvg libvips

# Rust (if not installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Node.js (if not installed)
sudo pacman -S nodejs npm
```

## Installation Steps

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/nixdeck-2133.git
cd nixdeck-2133
```

### 2. Install Dependencies
```bash
# Install Node dependencies
npm install

# Verify Rust installation
rustc --version
cargo --version
```

### 3. Development Build
```bash
# Run in development mode
npm run tauri dev
```

### 4. Production Build
```bash
# Build production binary
npm run tauri build

# Binary will be located at:
# src-tauri/target/release/nixdeck-2133

# Optional: Install system-wide
sudo cp src-tauri/target/release/nixdeck-2133 /usr/local/bin/
```

## Configuration

### First Launch

On first launch, NixDeck 2133 will create:
- `~/.nixdeck/` - Main configuration directory
- `~/.nixdeck/loadouts/` - AI loadout storage
- `~/.nixdeck/snapshots/` - System snapshots
- `~/.nixdeck/containers/` - Desktop containers
- `~/.nixdeck/themes/` - Custom themes

### OpenRouter API (Optional)

For AI features, you'll need an OpenRouter API key:

1. Get API key from: https://openrouter.ai
2. Set environment variable:
```bash
   export OPENROUTER_API_KEY="your-key-here"
```
3. Or configure in-app (coming soon)

## Troubleshooting

### Build Errors

**Error: webkit2gtk not found**
```bash
sudo pacman -S webkit2gtk
```

**Error: cargo not found**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Runtime Errors

**Error: Cannot access /home/user/.config**
```bash
# Ensure proper permissions
chmod 755 ~/.config
```

**Error: systemctl not found**
```bash
# Install systemd
sudo pacman -S systemd
```

### Performance Issues

If the application feels slow:
1. Close unused applications
2. Check system resources: `htop`
3. Rebuild in release mode: `npm run tauri build`

## Uninstallation
```bash
# Remove binary
sudo rm /usr/local/bin/nixdeck-2133

# Remove configuration (optional)
rm -rf ~/.nixdeck

# Remove source
cd ..
rm -rf nixdeck-2133
```

## Next Steps

After installation:
1. Create your first AI loadout
2. Snapshot your current configuration
3. Explore the Rice Studio
4. Set up automated daemons
5. Create a desktop container

See README.md for detailed usage instructions.

---

*the deck awaits*
