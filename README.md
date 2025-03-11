# Intel RealSense Web Viewer

A web-based viewer for Intel RealSense cameras with real-time streaming capabilities.

## Features
- Real-time RGB and Depth streaming
- 3D Point Cloud visualization
- Camera controls (resolution, FPS, exposure)
- Metadata overlay support
- Network streaming capability

## Prerequisites
- Python 3.10 (and not higher!)
- Node.js (v14 or higher)
- npm (v6 or higher)
- Intel RealSense SDK 2.0
- Compatible RealSense camera (tested on D435)

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/realsense-web-viewer.git
cd realsense-web-viewer  
```

### 2. Server Setup
```bash
# Navigate to server directory
cd server

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Client Setup
```bash
# Navigate to client directory
cd ../client

# Install Node dependencies
npm install

# Configure server address (if needed)
# Edit src/environments/environment.ts with your server IP
```

## Running the Application

### 1. Start the Server
```bash
# From the server directory with venv activated
python run.py
```
The server will start on http://localhost:5000

### 2. Start the Client
```bash
# From the client directory
ng serve --host 0.0.0.0 --port 4200
```
The application will be available at http://localhost:4200

## Development

### Server Development
The Flask server handles:
- Camera communication via RealSense SDK
- Real-time frame processing
- WebSocket streaming
- REST API endpoints

Key files:
- `server/app/camera.py` - Camera management
- `server/app/routes.py` - API endpoints
- `server/app/config.py` - Configuration settings

### Client Development
The Angular client provides:
- Real-time video display
- Camera controls interface
- 3D visualization
- Settings management

Key files:
- `client/src/app/components/` - UI components
- `client/src/app/services/` - Data services
- `client/src/environments/` - Configuration

## Project Structure
```
realsense-web-viewer/
├── server/                     # Flask Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── camera.py
│   │   ├── camera_manager.py
│   │   ├── config.py
│   │   ├── metadata_helpers.py
│   │   └── routes.py
│   ├── run.py
│   └── requirements.txt
│
├── client/                     # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   └── environments/
│   ├── package.json
│   ├── package-lock.json
│   ├── angular.json
│   └── tsconfig.json
│
├── docs/                       # Documentation
│   ├── API.md
│   ├── SETUP.md
│   └── DEVELOPMENT.md
│
├── .gitignore                 # Combined gitignore
├── README.md                  # Main project documentation
└── LICENSE
```

## API Documentation
See [docs/API.md](docs/API.md) for detailed API documentation.

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues
1. Camera not detected
   - Ensure RealSense SDK is installed
   - Check USB connection
   - Verify camera compatibility

2. Connection errors
   - Check if server is running
   - Verify IP addresses in environment.ts
   - Check firewall settings for ports 5000 and 4200

3. Build errors
   - Ensure all dependencies are installed
   - Check Node.js and Python versions
   - Clear cache and node_modules if needed

4. Network Access Issues
   - Ensure both ports 5000 and 4200 are open in your firewall
   - When accessing from another device, use the host machine's IP address
   - Make sure both devices are on the same network

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Intel RealSense SDK team
- Angular team
- Flask team
