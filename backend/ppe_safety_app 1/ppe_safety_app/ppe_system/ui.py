"""Gradio UI adapter for the PPE detection service.

UI-only concerns stay in this module while detection logic remains in the
service layer so backend and frontend share one source of truth.
"""

from __future__ import annotations

from typing import Tuple

import gradio as gr

from .camera_registry import CAMERA_REGISTRY, resolve_camera_context
from .schemas import DetectionRequest
from .service import detect_image


def on_camera_selected(camera_id: str) -> Tuple[str, str]:
    """Auto-fill site and GPS based on selected camera.

    Parameters:
    - camera_id: Camera key selected in dropdown.

    Returns:
    - Tuple of (site_name, gps_coords).
    """
    entry = resolve_camera_context(camera_id)
    return entry["site"], entry["gps"]


def detect_ppe_for_ui(image, site_name, gps_coords, camera_id, task_type, is_height_work, confidence):
    """UI callback that adapts Gradio values to service request/response.

    Parameters:
    - image: Numpy array from Gradio image input.
    - site_name: User-entered or auto-filled site string.
    - gps_coords: GPS coordinate string.
    - camera_id: Selected camera id.
    - task_type: Work task context.
    - is_height_work: Height work toggle.

    Returns:
    - Tuple[annotated_image_rgb, report_text].
    """
    if image is None:
        return None, "No image provided."

    response = detect_image(
        DetectionRequest(
            image=image,
            site_name=site_name or "",
            gps_coords=gps_coords or "",
            camera_id=camera_id or "Manual Entry",
            task_type=task_type or "General Work",
            is_height_work=bool(is_height_work),
            confidence=confidence,
        )
    )
    return response.annotated_image_rgb, response.report_text


def build_gradio_app() -> gr.Blocks:
    """Create and return the Gradio application.

    Returns:
    - Configured Gradio Blocks instance.
    """
    with gr.Blocks() as app:
        gr.Markdown("<center><h1>Road Safety and PPE Inspector</h1></center>")
        gr.Markdown(
            "<center>Upload an image to detect workers and PPE "
            "(helmet, vest, safety shoes, gloves, harness).</center>"
        )

        gr.Markdown("### Construction Site Location")
        gr.Markdown(
            "_Select a registered CCTV camera to auto-fill the site location, "
            "or choose **Manual Entry** to type it in. "
            "Register cameras in ppe_system/camera_registry.py for live deployment._"
        )

        with gr.Row():
            camera_selector = gr.Dropdown(
                choices=list(CAMERA_REGISTRY.keys()),
                value="Manual Entry",
                label="CCTV Camera / Source",
                scale=2,
            )
            site_name = gr.Textbox(
                label="Site Name / Address",
                placeholder="Auto-filled from camera registry, or type manually",
                scale=3,
            )
            gps_coords = gr.Textbox(
                label="GPS Coordinates (Latitude, Longitude)",
                placeholder="Auto-filled from camera registry, or click Detect",
                scale=3,
            )
            detect_location_btn = gr.Button("Detect My Location", scale=1, variant="secondary")

        gr.Markdown("### Work Context (for task-aware PPE validation)")
        with gr.Row():
            task_selector = gr.Dropdown(
                choices=[
                    "General Work",
                    "Welding",
                    "Chemical Handling",
                    "Electrical Work",
                    "Material Cutting/Grinding",
                    "Heavy Lifting",
                ],
                value="General Work",
                label="Current Task / Operation",
                scale=3,
            )
            height_work_checkbox = gr.Checkbox(
                value=False,
                label="Workers operating at height",
                info="Enable harness compliance for elevated operations.",
                scale=2,
            )

        with gr.Row():
            with gr.Column():
                input_image = gr.Image(label="Input Image (manual upload)")
                confidence_slider = gr.Slider(
                    minimum=0.25,
                    maximum=0.9,
                    value=0.65,
                    step=0.05,
                    label="Detection Confidence Threshold",
                    info="Higher values reduce false positives; lower values catch more borderline detections.",
                )
                inspect_btn = gr.Button("Run Inspection", variant="primary")
            with gr.Column():
                output_image = gr.Image(label="Detection Result")
                output_report = gr.Textbox(label="Inspection Report", lines=18)

        camera_selector.change(
            fn=on_camera_selected,
            inputs=camera_selector,
            outputs=[site_name, gps_coords],
        )

        detect_location_btn.click(
            fn=None,
            outputs=gps_coords,
            js="""
            async () => {
                return new Promise((resolve) => {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (pos) => {
                                const lat = pos.coords.latitude.toFixed(6);
                                const lon = pos.coords.longitude.toFixed(6);
                                resolve(lat + ", " + lon);
                            },
                            () => resolve("Location access denied or unavailable")
                        );
                    } else {
                        resolve("Geolocation not supported by this browser");
                    }
                });
            }
            """,
        )

        inspect_btn.click(
            fn=detect_ppe_for_ui,
            inputs=[input_image, site_name, gps_coords, camera_selector, task_selector, height_work_checkbox, confidence_slider],
            outputs=[output_image, output_report],
        )

    return app
