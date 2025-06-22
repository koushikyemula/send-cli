# Send CLI

> Instantly share files, folders, and links between mobile and desktop using QR codes - no external app required!

[![npm version](https://badge.fury.io/js/send-cli.svg)](https://badge.fury.io/js/send-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Requirement

**Both devices must be connected to the same network (WiFi/LAN) for this to work.**

## Features

- **QR Code sharing** - Share files, folders, and URLs instantly with mobile devices
- **No app required** - Works directly in mobile browsers
- **File upload** - Receive files from mobile devices to your computer
- **Clipboard sharing** - Share your clipboard content instantly
- **Optional authentication** - Secure your shared content with username/password
- **Cross-platform** - Works on Windows, macOS, and Linux

## Installation

### Global installation (recommended)

```bash
npm install -g send-cli
```

### Using npx (without installation)

```bash
npx send-cli [options] <path>
```

## Usage

### Basic Examples

```bash
# Share a file
send /path/to/file.pdf

# Share a directory
send /path/to/folder

# Share clipboard content
send -c

# Share a URL
send --url https://example.com

# Receive files from mobile
send --receive /destination/folder
```

### Advanced Usage

```bash
# Share with authentication
send -u myuser -p mypass /path/to/file

# Share on specific port
send --port 8080 /path/to/file

# Share via HTTPS
send --ssl --cert cert.pem --key key.pem /path/to/file

# Debug mode
send --debug /path/to/file
```

##  Options

| Option                         | Alias | Description                                |
| ------------------------------ | ----- | ------------------------------------------ |
| `--clipboard`                  | `-c`  | Share clipboard content                    |
| `--url <url>`                  |       | Share a URL                                |
| `--receive`                    | `-r`  | Receive files from mobile devices          |
| `--port <port>`                |       | Change the default port                    |
| `--ip <ip>`                    |       | Specify your machine's public IP address   |
| `--username <user>`            | `-u`  | Set basic authentication username          |
| `--password <pass>`            | `-p`  | Set basic authentication password          |
| `--ssl`                        | `-s`  | Enable HTTPS                               |
| `--cert <path>`                |       | Path to SSL certificate file               |
| `--key <path>`                 |       | Path to SSL key file                       |
| `--tmpdir <path>`              | `-t`  | Clipboard temporary files directory        |
| `--on-windows-native-terminal` | `-w`  | Enable QR-Code for Windows native terminal |
| `--debug`                      |       | Enable debug logs                          |
| `--help`                       |       | Show help                                  |

##  How it Works

1. **Start sharing**: Run `send` with your file/folder path
2. **QR code appears**: A QR code is generated in your terminal
3. **Scan with mobile**: Use your phone's camera to scan the QR code
4. **Access content**: Your mobile browser opens with access to the shared content

##  Security Features

### Basic Authentication
Protect your shared content with username and password:

```bash
send -u admin -p secret123 /private/documents
```

### HTTPS Support
Enable secure connections with SSL certificates:

```bash
send --ssl --cert certificate.pem --key private-key.pem /secure/files
```

## Development

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/koushikyemula/send-cli.git
   cd send-cli
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

### Project Structure

```
send-cli/
├── src/
│   ├── app.ts          # Express server setup
│   ├── config.ts       # Configuration management
│   ├── index.ts        # Main CLI entry point
│   ├── utils.ts        # Utility functions
│   ├── templates/      # HTML templates
│   └── types/          # TypeScript type definitions
├── bin/
│   └── send           # Binary executable
└── dist/              # Built files
```

## Contributing

I welcome contributions! Here's how you can help:

### Reporting Issues

1. Check if the issue already exists in [GitHub Issues](https://github.com/koushikyemula/send-cli/issues)
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (OS, Node.js version, etc.)

### Submitting Changes

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/send-cli.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation if needed

4. **Test your changes**
   ```bash
   npm run test
   npm run build
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: add awesome new feature"
   ```

6. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.