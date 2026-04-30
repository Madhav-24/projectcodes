"""Application entrypoint for the PPE inspection UI.

This module intentionally contains minimal logic and delegates all inference
and reporting behavior to the ppe_system package.
"""

from __future__ import annotations

import gradio as gr

from ppe_system.config import load_settings
from ppe_system.ui import build_gradio_app


def main() -> None:
    """Start the Gradio app with production-friendly runtime settings.

    Returns:
    - None
    """
    settings = load_settings()
    print(f"Configured model path: {settings.model_path}")
    print("Model loading is lazy and will happen on first inference request.")
    print(f"Starting local server at http://{settings.host}:{settings.port}")

    app = build_gradio_app()
    app.launch(
        server_name=settings.host,
        server_port=settings.port,
        theme=gr.themes.Soft(),
    )


if __name__ == "__main__":
    main()