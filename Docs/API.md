
# API Documentation

## REST Endpoints

### Camera Information
```http
GET /api/camera_info
Returns basic information about the connected RealSense camera.

Response
json
{
    "name": "Intel RealSense D435i",
    "serial_number": "123456789",
    "firmware_version": "05.12.14.100",
    "usb_type_descriptor": "3.2"
}
Camera Configuration
http
POST /api/configure
Updates camera stream configuration.

Request Body
json
{
    "module": "rgb|depth",
    "resolution": "640x360|1280x720",
    "frame_rate": "15|30"
}
Exposure Control
http
POST /api/exposure
Adjusts camera exposure settings.

Request Body
json
{
    "module": "rgb|depth",
    "exposure": 1000
}
Metadata Toggle
http
POST /api/set_metadata
Toggles metadata overlay for specified stream.

Request Body
json
{
    "module": "rgb|depth",
    "state": true|false
}
3D Viewer Toggle
http
POST /api/set3D
Toggles 3D point cloud visualization.

Request Body
json
{
    "show3D": true|false
}
Hard Reset
http
POST /api/hard_reset
Resets all camera settings to default values.