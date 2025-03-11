# WebSocket Documentation

## Connection URL
```
ws://YOUR_SERVER_IP:5000
```

## Events

### Server → Client

- **video_frame**  
  Emitted when new frames are available from the camera.

  **Payload Example:**
  ```json
  {
    "color": "base64_encoded_jpeg",
    "depth": "base64_encoded_jpeg",
    "D3": "base64_encoded_jpeg",
    "metadata": {
      "rgb": ["FPS: 30", "Resolution: 1280x720"],
      "depth": ["FPS: 30", "Resolution: 1280x720"]
    }
  }
  ```

- **device_status**  
  Emitted when device connection status changes.

  **Payload Example:**
  ```json
  {
    "connected": true,
    "reason": null
  }
  ```

### Client → Server

- **start_stream**  
  Requests the server to start streaming frames.

- **stop_stream**  
  Requests the server to stop streaming frames.

- **disconnect**  
  Closes the WebSocket connection and stops streaming.

