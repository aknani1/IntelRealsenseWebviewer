import pyrealsense2 as rs
import numpy as np
import cv2
import base64
from app import socketio

streaming = {"status": True}  # Mutable dictionary
framerate = {"status": 15}
exposure_value = {"status": 80}
metadata_toggles = {
    "rgb": False,
    "depth": False
}
config = rs.config()
config.enable_stream(rs.stream.color, 640, 360, rs.format.bgr8, framerate["status"])
config.enable_stream(rs.stream.depth, 640, 360, rs.format.z16, framerate["status"])


def generate_frames():
    global color_sensor
    streaming["status"] = True
    pipeline = rs.pipeline()
    config.enable_stream(rs.stream.color, 640, 360, rs.format.bgr8, framerate["status"])
    config.enable_stream(rs.stream.depth, 640, 360, rs.format.z16, framerate["status"])
    profile = pipeline.start(config)

    device = profile.get_device()
    sensors = device.query_sensors()

    for sensor in sensors:
        if sensor.get_info(rs.camera_info.name) == "RGB Camera":
            color_sensor = sensor
            break

    if color_sensor is None:
        raise RuntimeError("Color sensor not found!")

    # Step 4: Disable auto-exposure
    color_sensor.set_option(rs.option.enable_auto_exposure, 0)

    # Step 5: Set manual exposure (e.g., 1000 microseconds)
    #exposure_value = 1000  # Adjust this value as needed
    print(f"Manual exposure set to {exposure_value} microseconds.")


    try:
        while streaming["status"]:
            frames = pipeline.wait_for_frames()
            color_frame = frames.get_color_frame()
            depth_frame = frames.get_depth_frame()

            if not color_frame or not depth_frame or not streaming:
                continue
            color_image = np.asanyarray(color_frame.get_data())
            depth_colorized = rs.colorizer().colorize(depth_frame)
            depth_image = np.asanyarray(depth_colorized.get_data())
                        # Metadata
            hardware_fps = color_frame.get_frame_metadata(rs.frame_metadata_value.actual_fps)
            resolution_rgb = f"{color_image.shape[1]}x{color_image.shape[0]}"
            resolution_depth = f"{depth_image.shape[1]}x{depth_image.shape[0]}"
            if metadata_toggles["rgb"]:
                cv2.putText(color_image, f"FPS: {hardware_fps}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                cv2.putText(color_image, f"Resolution: {resolution_rgb}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            if metadata_toggles["depth"]:
                cv2.putText(depth_image, f"FPS: {hardware_fps}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
                cv2.putText(depth_image, f"Resolution: {resolution_depth}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
            _, color_buffer = cv2.imencode('.jpg', color_image)
            _, depth_buffer = cv2.imencode('.jpg', depth_image)
            color_frame_encoded = base64.b64encode(color_buffer).decode('utf-8')
            depth_frame_encoded = base64.b64encode(depth_buffer).decode('utf-8')

            yield {"color": color_frame_encoded, "depth": depth_frame_encoded}
        pipeline.stop()
        
    finally:
        pipeline.stop()

def change_exposure():
    color_sensor.set_option(rs.option.exposure, exposure_value["status"])

def stop_generating_frames():
    streaming["status"] = False


def toggle_metadata(module):
    if module in metadata_toggles:
        metadata_toggles[module] = not metadata_toggles[module]