
# API Documentation

## REST Endpoints

### `GET /api/camera_info`
Retrieves connected camera information.

**Response:**
```json
{
  "name": "Intel RealSense D435",
  "serial_number": "ABC123XYZ456",
  "firmware_version": "5.12.15.0",
  "usb_type_descriptor": "USB 3.2 Gen 1"
}
```

---

### `POST /api/configure`
Updates camera stream configuration.

**Request Body:**
```json
{
  "module": "rgb",
  "resolution": "1280x720",
  "frame_rate": 30
}
```

**Success Response:**
```json
{
  "message": "RGB updated to 1280x720 @ 30 FPS"
}
```

---

### `POST /api/exposure`
Adjusts camera exposure settings.

**Request Body:**
```json
{
  "module": "depth",
  "exposure": 8500
}
```

**Success Response:**
```json
{
  "message": "Depth exposure updated",
  "exposure": 8500
}
```

---

### `POST /api/set_metadata`
Toggles metadata overlay for the specified stream.

**Request Body:**
```json
{
  "module": "rgb",
  "state": true
}
```

---

### `POST /api/set3D`
Toggles 3D point cloud visualization.

**Request Body:**
```json
{
  "show3D": true
}
```

---

### `POST /api/hard_reset`
Resets all camera settings to default values.

**Success Response:**
```json
{
  "message": "Full system reset complete"
}
```


  

