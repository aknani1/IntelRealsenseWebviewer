import pyrealsense2 as rs

def gather_metadata_and_profile_info(frame):
    lines = []
    # Check and add FPS if available
    if frame.supports_frame_metadata(rs.frame_metadata_value.actual_fps):
        hw_fps = frame.get_frame_metadata(rs.frame_metadata_value.actual_fps)
        lines.append(f"hardware FPS: {hw_fps}")

    # Check frame counter metadata
    if frame.supports_frame_metadata(rs.frame_metadata_value.frame_counter):
        fc = frame.get_frame_metadata(rs.frame_metadata_value.frame_counter)
        lines.append(f"Frame Count: {fc}")

    # Add resolution and pixel format
    profile = rs.video_stream_profile(frame.get_profile())
    w = profile.width()
    h = profile.height()
    fmt = profile.format()
    lines.append(f"Resolution: {w}x{h}")
    lines.append(f"Pixel Format: {fmt}")

    return lines
