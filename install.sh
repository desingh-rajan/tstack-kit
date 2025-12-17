#!/bin/sh
# TStack Kit Installer
# One-command install: curl -fsSL https://raw.githubusercontent.com/desingh-rajan/tstack-kit/main/install.sh | sh
#
# No git required - downloads tarball directly from GitHub releases

set -e

TSTACK_VERSION="1.3.0"
TSTACK_RELEASE_URL="https://github.com/desingh-rajan/tstack-kit/archive/refs/tags/v${TSTACK_VERSION}.tar.gz"
TSTACK_INSTALL_DIR="$HOME/.tstack"

# Colors (only if terminal supports it)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

info() {
    printf "${BLUE}[info]${NC} %s\n" "$1"
}

success() {
    printf "${GREEN}[ok]${NC} %s\n" "$1"
}

warn() {
    printf "${YELLOW}[warn]${NC} %s\n" "$1"
}

error() {
    printf "${RED}[error]${NC} %s\n" "$1"
    exit 1
}

# Check for required commands
check_command() {
    command -v "$1" >/dev/null 2>&1
}

# Download file using curl or wget
download() {
    local url="$1"
    local output="$2"
    
    if check_command curl; then
        curl -fsSL "$url" -o "$output"
    elif check_command wget; then
        wget -q "$url" -O "$output"
    else
        error "Neither curl nor wget found. Please install one of them."
    fi
}

# Detect shell config file
get_shell_config() {
    case "$SHELL" in
        */zsh)
            echo "$HOME/.zshrc"
            ;;
        */bash)
            if [ -f "$HOME/.bashrc" ]; then
                echo "$HOME/.bashrc"
            else
                echo "$HOME/.bash_profile"
            fi
            ;;
        */fish)
            echo "$HOME/.config/fish/config.fish"
            ;;
        *)
            echo "$HOME/.profile"
            ;;
    esac
}

# Add to PATH
add_to_path() {
    local path_entry="$1"
    local shell_config
    shell_config=$(get_shell_config)
    
    # Check if already in PATH
    case ":$PATH:" in
        *":$path_entry:"*)
            return 0
            ;;
    esac
    
    # Add to shell config
    if [ -f "$shell_config" ]; then
        if ! grep -q "$path_entry" "$shell_config" 2>/dev/null; then
            echo "" >> "$shell_config"
            echo "# TStack CLI" >> "$shell_config"
            echo "export PATH=\"$path_entry:\$PATH\"" >> "$shell_config"
            success "Added $path_entry to $shell_config"
        fi
    fi
}

main() {
    echo ""
    printf "${GREEN}TStack Kit Installer v${TSTACK_VERSION}${NC}\n"
    echo "======================================="
    echo ""
    
    # Check for curl or wget
    if ! check_command curl && ! check_command wget; then
        error "This installer requires curl or wget. Please install one of them."
    fi
    
    # Check for unzip (required by Deno installer)
    if ! check_command unzip; then
        warn "unzip not found (required for Deno installation)"
        info "Please install unzip: apt install unzip (Debian/Ubuntu) or yum install unzip (RHEL/CentOS)"
        error "Cannot proceed without unzip"
    fi
    
    # Step 1: Check/Install Deno
    info "Checking for Deno..."
    if check_command deno; then
        DENO_VERSION=$(deno --version | head -n 1 | cut -d ' ' -f 2)
        success "Deno $DENO_VERSION found"
    else
        info "Deno not found. Installing Deno..."
        if check_command curl; then
            curl -fsSL https://deno.land/install.sh | sh
        else
            wget -qO- https://deno.land/install.sh | sh
        fi
        
        # Add Deno to PATH for this session
        export DENO_INSTALL="$HOME/.deno"
        export PATH="$DENO_INSTALL/bin:$PATH"
        
        if check_command deno; then
            success "Deno installed successfully"
        else
            error "Failed to install Deno. Please install manually: https://deno.land"
        fi
    fi
    
    # Step 2: Check Deno version (need 2.0+)
    DENO_MAJOR=$(deno --version | head -n 1 | cut -d ' ' -f 2 | cut -d '.' -f 1)
    if [ "$DENO_MAJOR" -lt 2 ]; then
        warn "TStack requires Deno 2.0+. You have Deno $DENO_MAJOR.x"
        info "Upgrading Deno..."
        deno upgrade
        success "Deno upgraded"
    fi
    
    # Step 3: Download TStack Kit (no git required!)
    info "Downloading TStack Kit v${TSTACK_VERSION}..."
    
    # Clean previous installation
    if [ -d "$TSTACK_INSTALL_DIR" ]; then
        info "Removing previous installation..."
        rm -rf "$TSTACK_INSTALL_DIR"
    fi
    
    # Create install directory
    mkdir -p "$TSTACK_INSTALL_DIR"
    
    # Download and extract tarball
    TEMP_TAR=$(mktemp)
    download "$TSTACK_RELEASE_URL" "$TEMP_TAR"
    
    # Extract to install directory (strip the version prefix from paths)
    tar -xzf "$TEMP_TAR" -C "$TSTACK_INSTALL_DIR" --strip-components=1
    rm -f "$TEMP_TAR"
    
    success "Downloaded TStack Kit"
    
    # Step 4: Install CLI globally
    info "Installing tstack command..."
    cd "$TSTACK_INSTALL_DIR/packages/cli"
    
    # Cache dependencies first
    deno cache mod.ts
    
    # Create a wrapper script that includes the config
    DENO_BIN="$HOME/.deno/bin"
    mkdir -p "$DENO_BIN"
    
    cat > "$DENO_BIN/tstack" << 'WRAPPER'
#!/bin/sh
exec deno run \
    --allow-read \
    --allow-write \
    --allow-env \
    --allow-run \
    --allow-net \
    --unstable-kv \
    --config "$HOME/.tstack/packages/cli/deno.json" \
    "$HOME/.tstack/packages/cli/mod.ts" "$@"
WRAPPER
    
    chmod +x "$DENO_BIN/tstack"
    
    success "CLI installed"
    
    # Step 5: Add to PATH
    add_to_path "$HOME/.deno/bin"
    
    # Step 6: Verify installation
    export PATH="$HOME/.deno/bin:$PATH"
    if check_command tstack; then
        success "tstack command available"
    else
        warn "tstack installed but may not be in PATH yet"
    fi
    
    echo ""
    echo "======================================="
    printf "${GREEN}Installation complete!${NC}\n"
    echo ""
    echo "Verify installation:"
    echo "  tstack --version"
    echo ""
    echo "If command not found, restart your terminal or run:"
    echo "  source $(get_shell_config)"
    echo ""
    echo "Create your first project:"
    echo "  tstack create workspace my-app"
    echo ""
}

main "$@"
