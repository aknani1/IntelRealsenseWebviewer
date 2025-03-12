# Camera Management Documentation (docs/CAMERA.md)

## CameraManager Class
Manages Intel RealSense camera operations and frame processing.

**Key Properties:**
```python
pipeline: rs.pipeline               # RealSense pipeline instance
config: rs.config                   # Configuration for the pipeline
current_settings: dict              # Holds current resolution, FPS, etc.
device_connected: bool              # Connection state of the camera
is_streaming: bool                  # Streaming status
metadata_toggles: dict              # Which metadata overlays are enabled
exposure_value_rgb: int             # Exposure value for RGB
exposure_value_depth: int           # Exposure value for Depth
color_sensor: rs.sensor             # Reference to the color sensor
depth_sensor: rs.sensor             # Reference to the depth sensor
```

**Core Methods:**

- **configure_pipeline()**
  ```python
  def configure_pipeline(self):
      """
      Configures and starts the RealSense pipeline with current settings.
      
      - Enables RGB and depth streams with specified resolution and frame rate.
      - Stores sensor references.
      
      Raises:
          RuntimeError: If pipeline startup fails.
      """
  ```

- **generate_frames()**
  ```python
  def generate_frames(self):
      """
      Yields processed frames from the camera.
      
      Yields:
          dict: Contains:
              - color: Base64 encoded RGB frame.
              - depth: Base64 encoded depth frame.
              - D3: Base64 encoded 3D view frame (if 3D is enabled).
              - metadata: Dictionary of metadata for RGB and depth.
      
      Raises:
          RuntimeError: If frame acquisition fails.
      """
  ```

- **set_exposure(module: str, value: int)**
  ```python
  def set_exposure(self, module: str, value: int):
      """
      Adjusts the exposure value for the specified module.
      
      Args:
          module (str): 'rgb' or 'depth'
          value (int): Exposure value (e.g., 0-10000)
      
      Raises:
          ValueError: If module is not valid.
      """
  ```

- **update_resolution_and_fps(module: str, width: int, height: int, fps: int)**
  ```python
  def update_resolution_and_fps(self, module: str, width: int, height: int, fps: int):
      """
      Updates resolution and FPS settings for the given module.
      
      Args:
          module (str): 'rgb' or 'depth'
          width (int): Width of the stream
          height (int): Height of the stream
          fps (int): Frames per second
      
      Raises:
          ValueError or RuntimeError: If setting update fails.
      """
  ```

- **get_device_info()**
  ```python
  def get_device_info(self):
      """
      Retrieves basic information about the connected RealSense device.
      
      Returns:
          dict: Containing 'name', 'serial_number', 'firmware_version', and 'usb_type_descriptor'.
      
      Raises:
          RuntimeError: If device info cannot be retrieved.
      """
  ```
