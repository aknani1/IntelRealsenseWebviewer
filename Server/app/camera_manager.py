from .metadata_helpers import gather_metadata_and_profile_info
import pyrealsense2 as rs
import numpy as np
import cv2
import time
import base64
import socketio
import traceback  # for more detailed logging
from .config import DEFAULTS
from collections import deque

import os
import math
import time

class AppState:

    def __init__(self, *args, **kwargs):
        self.WIN_NAME = 'RealSense'
        self.pitch, self.yaw = 0.0, 0.0  # Remove the math.radians(-30) and math.radians(-15)
        self.translation = np.array([0, 0, -2], dtype=np.float32)
        self.distance = 2
        self.prev_mouse = 0, 0
        self.mouse_btns = [False, False, False]
        self.paused = False
        self.decimate = 1
        self.scale = True
        self.color = True

    def reset(self):
        self.pitch, self.yaw, self.distance = 0, 0, 2
        self.translation[:] = 0, 0, -1
    

    @property
    def rotation(self):
        Rx, _ = cv2.Rodrigues((self.pitch, 0, 0))
        Ry, _ = cv2.Rodrigues((0, self.yaw, 0))
        return np.dot(Ry, Rx).astype(np.float32)

    @property
    def pivot(self):
        return self.translation + np.array((0, 0, self.distance), dtype=np.float32)

state = AppState()

class CameraManager:
    """
    Manages Intel RealSense pipeline, configuration, and streaming for RGB & depth.
    """
    
    def __init__(self):
        self.pipeline = rs.pipeline()
        self.config = rs.config()
        self.default_settings = DEFAULTS
        self.color_frame_times = deque(maxlen=10)
        self.depth_frame_times = deque(maxlen=10)
        self.profile = None
        self.stream3D = False

        self.current_settings = {
            "color": {
                "width": self.default_settings["color"]["width"],
                "height": self.default_settings["color"]["height"],
                "fps": self.default_settings["color"]["fps"]
            },
            "depth": {
                "width": self.default_settings["depth"]["width"],
                "height": self.default_settings["depth"]["height"],
                "fps": self.default_settings["depth"]["fps"]
            }
        }

        # Device connection status
        self.device_connected = False

        # Streaming state
        self.is_streaming = False

        # Metadata toggles
        self.metadata_toggles = {"rgb": False, "depth": False}

        # Exposure values
        self.exposure_value_rgb = self.default_settings["color"]["exposure"]
        self.exposure_value_depth = self.default_settings["depth"]["exposure"]

        # FPS tracking
        self.last_color_time = 0.0
        self.last_depth_time = 0.0
        self.displayed_color_fps = 0.0
        self.displayed_depth_fps = 0.0

        # Sensor references
        self.color_sensor = None
        self.depth_sensor = None
    
    def set3D(self, stream3D):
        self.stream3D = stream3D
        
        
    def get_device_info(self):
        """
        Returns basic info about the connected RealSense device.
        If pipeline isn't running, attempt to start it so we can query device info.
        """
        if not self.is_streaming:
            try:
                self.configure_pipeline()
            except Exception as e:
                print("[CameraManager] Could not start pipeline for get_device_info:", e)
                raise e  # or handle differently

        try:
            self.profile = self.pipeline.get_active_profile()
            device = self.profile.get_device()
            info = {
                "name": device.get_info(rs.camera_info.name),
                "serial_number": device.get_info(rs.camera_info.serial_number),
                "firmware_version": device.get_info(rs.camera_info.firmware_version),
                "usb_type_descriptor": device.get_info(rs.camera_info.usb_type_descriptor),
            }
            self.device_connected = True
            return info
        except RuntimeError as e:
            print("[CameraManager] get_active_profile() error:", e)
            raise

    def reset_to_default(self):
        """Full hardware-aware reset"""
        self.stop_stream()
        try:
            # Hardware-level reset
            ctx = rs.context()
            if ctx.query_devices().size() > 0:
                ctx.remove_device(ctx.query_devices()[0].get_info(rs.camera_info.serial_number))
        except:
            pass
        
        # Reinitialize fresh
        self.__init__()
        print("[CameraManager] Full hardware reset complete")
    
    def configure_pipeline(self):
        if self.is_streaming:
            self.stop_stream()

            
        self.config.disable_all_streams()
        self.color_frame_times.clear()
        self.depth_frame_times.clear()
        # Enable color stream
        c = self.current_settings["color"]
        self.config.enable_stream(
            rs.stream.color,
            c["width"], c["height"], rs.format.bgr8, c["fps"]
        )

        # Enable depth stream
        d = self.current_settings["depth"]
        self.config.enable_stream(
            rs.stream.depth,
            d["width"], d["height"], rs.format.z16, d["fps"]
        )

        try:
            self.profile = self.pipeline.start(self.config)
            self.is_streaming = True
            self.device_connected = True
            print("[CameraManager] Pipeline started with:", self.current_settings)
            self._cache_sensors(self.profile)
        except Exception as e:
            self.device_connected = False
            self.is_streaming = False
            print(f"[CameraManager] Failed to start pipeline: {e}")
            raise

    def _cache_sensors(self, profile: rs.pipeline_profile):
        """
        Store references to RGB and Depth sensors once pipeline is started.
        """
        device = profile.get_device()
        sensors = device.query_sensors()
        for sensor in sensors:
            name = sensor.get_info(rs.camera_info.name).lower()
            if "rgb" in name:
                self.color_sensor = sensor
            elif "depth" in name:
                self.depth_sensor = sensor

        # Disable auto-exposure for color
        if self.color_sensor is not None:
            self.color_sensor.set_option(rs.option.enable_auto_exposure, 0)
            self.color_sensor.set_option(rs.option.exposure, self.exposure_value_rgb)

        # Disable auto-exposure for depth
        if self.depth_sensor is not None:
            self.depth_sensor.set_option(rs.option.enable_auto_exposure, 0)
            self.depth_sensor.set_option(rs.option.exposure, self.exposure_value_depth)

    def stop_stream(self):
        """
        Stops the pipeline if running.
        """
        self.is_streaming = False
        try:
            self.pipeline.stop()
            print("[CameraManager] Pipeline stopped.")
        except Exception:
            pass  # Already stopped

    def update_resolution_and_fps(self, module: str, width: int, height: int, fps: int):
        """
        Update resolution/fps in current_settings and reconfigure pipeline.
        """
        if module == "rgb":
            self.current_settings["color"].update({"width": width, "height": height, "fps": fps})
        elif module == "depth":
            self.current_settings["depth"].update({"width": width, "height": height, "fps": fps})
        else:
            raise ValueError("Unknown module name")

        self.configure_pipeline()

    def set_metadata(self, module: str, state: bool):
        """Set metadata overlay state for specified module"""
        if module in self.metadata_toggles:
            self.metadata_toggles[module] = state
        print(f"[CameraManager] Metadata for {module} set to {state}")

    def set_exposure(self, module: str, value: int):
        """
        Update exposure for the specified module (rgb or depth).
        """
        if module == "rgb" and self.color_sensor:
            self.exposure_value_rgb = value
            self.color_sensor.set_option(rs.option.exposure, value)
            print(f"[CameraManager] RGB exposure set to {value}")
        elif module == "depth" and self.depth_sensor:
            self.exposure_value_depth = value
            self.depth_sensor.set_option(rs.option.exposure, value)
            print(f"[CameraManager] Depth exposure set to {value}")
        else:
            print(f"[CameraManager] Invalid module or sensor not found for module={module}")

    def mouse_cb(self, event, x, y, flags, param):

        if event == cv2.EVENT_LBUTTONDOWN:
            state.mouse_btns[0] = True

        if event == cv2.EVENT_LBUTTONUP:
            state.mouse_btns[0] = False

        if event == cv2.EVENT_RBUTTONDOWN:
            state.mouse_btns[1] = True

        if event == cv2.EVENT_RBUTTONUP:
            state.mouse_btns[1] = False

        if event == cv2.EVENT_MBUTTONDOWN:
            state.mouse_btns[2] = True

        if event == cv2.EVENT_MBUTTONUP:
            state.mouse_btns[2] = False

        if event == cv2.EVENT_MOUSEMOVE:

            h, w = out.shape[:2]
            dx, dy = x - state.prev_mouse[0], y - state.prev_mouse[1]

            if state.mouse_btns[0]:
                state.yaw += float(dx) / w * 2
                state.pitch -= float(dy) / h * 2

            elif state.mouse_btns[1]:
                dp = np.array((dx / w, dy / h, 0), dtype=np.float32)
                state.translation -= np.dot(state.rotation, dp)

            elif state.mouse_btns[2]:
                dz = math.sqrt(dx**2 + dy**2) * math.copysign(0.01, -dy)
                state.translation[2] += dz
                state.distance -= dz

        if event == cv2.EVENT_MOUSEWHEEL:
            dz = math.copysign(0.1, flags)
            state.translation[2] += dz
            state.distance -= dz

        state.prev_mouse = (x, y)
    
    def project(self, v):
        """project 3d vector array to 2d"""
        h, w = out.shape[:2]
        view_aspect = float(h)/w

        # ignore divide by zero for invalid depth
        with np.errstate(divide='ignore', invalid='ignore'):
            proj = v[:, :-1] / v[:, -1, np.newaxis] * \
                (w*view_aspect, h) + (w/2.0, h/2.0)

        # near clipping
        znear = 0.03
        proj[v[:, 2] < znear] = np.nan
        return proj

    def view(self, v):
        """apply view transformation on vector array"""
        return np.dot(v - state.pivot, state.rotation) + state.pivot - state.translation


    def line3d(self, out, pt1, pt2, color=(0x80, 0x80, 0x80), thickness=1):
        """draw a 3d line from pt1 to pt2"""
        p0 = self.project(pt1.reshape(-1, 3))[0]
        p1 = self.project(pt2.reshape(-1, 3))[0]
        if np.isnan(p0).any() or np.isnan(p1).any():
            return
        p0 = tuple(p0.astype(int))
        p1 = tuple(p1.astype(int))
        rect = (0, 0, out.shape[1], out.shape[0])
        inside, p0, p1 = cv2.clipLine(rect, p0, p1)
        if inside:
            cv2.line(out, p0, p1, color, thickness, cv2.LINE_AA)

    def grid(self, out, pos, rotation=np.eye(3), size=1, n=10, color=(0x80, 0x80, 0x80)):
        """draw a grid on xz plane"""
        pos = np.array(pos)
        s = size / float(n)
        s2 = 0.5 * size
        for i in range(0, n+1):
            x = -s2 + i*s
            self.line3d(out, self.view(pos + np.dot((x, 0, -s2), rotation)),
                self.view(pos + np.dot((x, 0, s2), rotation)), color)
        for i in range(0, n+1):
            z = -s2 + i*s
            self.line3d(out, self.view(pos + np.dot((-s2, 0, z), rotation)),
                self.view(pos + np.dot((s2, 0, z), rotation)), color)


    def axes(self, out, pos, rotation=np.eye(3), size=0.075, thickness=2):
        """draw 3d axes"""
        self.line3d(out, pos, pos +
            np.dot((0, 0, size), rotation), (0xff, 0, 0), thickness)
        self.line3d(out, pos, pos +
            np.dot((0, size, 0), rotation), (0, 0xff, 0), thickness)
        self.line3d(out, pos, pos +
            np.dot((size, 0, 0), rotation), (0, 0, 0xff), thickness)

    def frustum(self, out, intrinsics, color=(0x40, 0x40, 0x40)):
        """draw camera's frustum"""
        orig = self.view([0, 0, 0])
        w, h = intrinsics.width, intrinsics.height

        for d in range(1, 6, 2):
            def get_point(x, y):
                p = rs.rs2_deproject_pixel_to_point(intrinsics, [x, y], d)
                self.line3d(out, orig, self.view(p), color)
                return p

            top_left = get_point(0, 0)
            top_right = get_point(w, 0)
            bottom_right = get_point(w, h)
            bottom_left = get_point(0, h)

            self.line3d(out, self.view(top_left), self.view(top_right), color)
            self.line3d(out, self.view(top_right), self.view(bottom_right), color)
            self.line3d(out, self.view(bottom_right), self.view(bottom_left), color)
            self.line3d(out, self.view(bottom_left), self.view(top_left), color)

    def pointcloud(self, out, verts, texcoords, color, painter=True):
        """draw point cloud with optional painter's algorithm"""
        if painter:
            # Painter's algo, sort points from back to front

            # get reverse sorted indices by z (in view-space)
            # https://gist.github.com/stevenvo/e3dad127598842459b68
            v = self.view(verts)
            s = v[:, 2].argsort()[::-1]
            proj = self.project(v[s])
        else:
            proj = self.project(self.view(verts))

        if state.scale:
            proj *= 0.5**state.decimate

        h, w = out.shape[:2]

        # proj now contains 2d image coordinates
        j, i = proj.astype(np.uint32).T

        # create a mask to ignore out-of-bound indices
        im = (i >= 0) & (i < h)
        jm = (j >= 0) & (j < w)
        m = im & jm

        cw, ch = color.shape[:2][::-1]
        if painter:
            # sort texcoord with same indices as above
            # texcoords are [0..1] and relative to top-left pixel corner,
            # multiply by size and add 0.5 to center
            v, u = (texcoords[s] * (cw, ch) + 0.5).astype(np.uint32).T
        else:
            v, u = (texcoords * (cw, ch) + 0.5).astype(np.uint32).T
        # clip texcoords to image
        np.clip(u, 0, ch-1, out=u)
        np.clip(v, 0, cw-1, out=v)

        # perform uv-mapping
        out[i[m], j[m]] = color[u[m], v[m]]

    def generate_frames(self):
            """
            Generator that yields frames in real time. If the camera
            accidentally disconnects (e.g., cable pulled), we detect it
            and emit server->client events via Socket.IO.
            """
            global out
            # Ensure streaming is started
            if not self.is_streaming:
                self.configure_pipeline()

            depth_profile = rs.video_stream_profile(self.profile.get_stream(rs.stream.color))
            depth_intrinsics = depth_profile.get_intrinsics()
            w, h = depth_intrinsics.width, depth_intrinsics.height
            
            # Processing blocks
            pc = rs.pointcloud()
            decimate = rs.decimation_filter()
            decimate.set_option(rs.option.filter_magnitude, 2 ** state.decimate)
            colorizer = rs.colorizer()

            cv2.namedWindow(state.WIN_NAME, cv2.WINDOW_AUTOSIZE)
            cv2.resizeWindow(state.WIN_NAME, w, h)
            cv2.setMouseCallback(state.WIN_NAME, self.mouse_cb)

            out = np.empty((h, w, 3), dtype=np.uint8)

            try:
                while self.is_streaming:
                    try:
                        frameset = self.pipeline.wait_for_frames()
                    except RuntimeError as e:
                        # This is raised if frames no longer arrive; camera offline?
                        if "Frame didn't arrive within 5000" in str(e):
                            print("[CameraManager] Physical camera disconnection detected!")
                            self.device_connected = False
                            # Stop streaming so we don't keep spamming errors
                            self.stop_stream()

                            # Emit a status event with reason
                            socketio.emit('device_status', {
                                'connected': False,
                                'reason': 'camera_disconnected'
                            })
                            break
                        else:
                            print("[CameraManager] Other runtime error while waiting for frames:")
                            traceback.print_exc()
                            raise e

                    color_frame = frameset.get_color_frame()
                    depth_frame = frameset.get_depth_frame()
                    if not color_frame or not depth_frame:
                        continue
                    D3_encoded = None
                                            # Compute displayed FPS (Color)


                    color_image = np.asanyarray(color_frame.get_data())
                    depth_colorized = rs.colorizer().colorize(depth_frame)
                    depth_image = np.asanyarray(depth_colorized.get_data())
                    if self.stream3D:
                        depth_frame = decimate.process(depth_frame)

                        depth_intrinsics = rs.video_stream_profile(
                            depth_frame.profile).get_intrinsics()
                        w, h = depth_intrinsics.width, depth_intrinsics.height


                        # Convert frames to JPG+base64
                        
                        
                        depth_colormap = np.asanyarray(
                        colorizer.colorize(depth_frame).get_data())

                        mapped_frame, color_source = depth_frame, depth_colormap


                        points = pc.calculate(depth_frame)
                        pc.map_to(mapped_frame)

                        # Pointcloud data to arrays
                        v, t = points.get_vertices(), points.get_texture_coordinates()
                        verts = np.asanyarray(v).view(np.float32).reshape(-1, 3)  # xyz
                        texcoords = np.asanyarray(t).view(np.float32).reshape(-1, 2)  # uv
                        
                        # Render
                        now = time.time()

                        out.fill(0)

                        self.grid(out, (0, 0.5, 1), size=1, n=10)
                        self.frustum(out, depth_intrinsics)
                        self.axes(out, self.view([0, 0, 0]), state.rotation, size=0.1, thickness=1)

                        if not state.scale or out.shape[:2] == (h, w):
                            self.pointcloud(out, verts, texcoords, color_source)
                        else:
                            tmp = np.zeros((h, w, 3), dtype=np.uint8)
                            self.pointcloud(tmp, verts, texcoords, color_source)
                            tmp = cv2.resize(
                                tmp, out.shape[:2][::-1], interpolation=cv2.INTER_NEAREST)
                            np.putmask(out, tmp > 0, tmp)

                        if any(state.mouse_btns):
                            self.axes(out, self.view(state.pivot), state.rotation, thickness=4)

                        dt = time.time() - now

                        cv2.setWindowTitle(
                            state.WIN_NAME, "RealSense (%dx%d) %dFPS (%.2fms) %s" %
                            (w, h, 1.0/dt, dt*1000, "PAUSED" if state.paused else ""))

                        cv2.imshow(state.WIN_NAME, out)
                        key = cv2.waitKey(1)
                        _, D3_buf = cv2.imencode(".jpg", out)
                        D3_encoded = base64.b64encode(D3_buf).decode("utf-8")

                    now_c = time.time()
                    if self.last_color_time != 0:
                        dt_c = now_c - self.last_color_time
                        if dt_c > 0:
                            self.color_frame_times.append(dt_c)
                            avg_dt_c = sum(self.color_frame_times) / len(self.color_frame_times)
                            self.displayed_color_fps = 1.0 / avg_dt_c
                    self.last_color_time = now_c

                    # Compute displayed FPS (Depth)
                    now_d = time.time()
                    if self.last_depth_time != 0:
                        dt_d = now_d - self.last_depth_time
                        if dt_d > 0:
                            self.depth_frame_times.append(dt_c)
                            avg_dt_d = sum(self.depth_frame_times) / len(self.depth_frame_times)
                            self.displayed_depth_fps = 1.0 / avg_dt_d
                    self.last_depth_time = now_d

                    _, color_buf = cv2.imencode(".jpg", color_image)
                    _, depth_buf = cv2.imencode(".jpg", depth_image)

                    color_encoded = base64.b64encode(color_buf).decode("utf-8")
                    depth_encoded = base64.b64encode(depth_buf).decode("utf-8")
                    

                    # Gather metadata if toggled
                    lines_rgb = []
                    lines_depth = []
                    if self.metadata_toggles["rgb"]:
                        lines_rgb = gather_metadata_and_profile_info(color_frame)
                        lines_rgb.append(f"Displayed FPS: {self.displayed_color_fps:.1f}")
                    if self.metadata_toggles["depth"]:
                        lines_depth = gather_metadata_and_profile_info(depth_frame)
                        lines_depth.append(f"Displayed FPS: {self.displayed_depth_fps:.1f}")

                    yield {
                        "color": color_encoded,
                        "depth": depth_encoded,
                        "metadata": {
                            "rgb": lines_rgb,
                            "depth": lines_depth
                        },
                        "D3": D3_encoded
                    }

            except Exception as e:
                print("[CameraManager] Exception during streaming:")
                traceback.print_exc()
                self.device_connected = False
                self.stop_stream()
            finally:
                self.stop_stream()
