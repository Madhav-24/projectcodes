// Module: Project Manager Camera Page
// Purpose: Render the project manager camera feed using shared camera modules.
import RoleCameraFeedPage from '../../frontend/components/camera/RoleCameraFeedPage.jsx';
import { CAMERA_SITES } from '../../frontend/constants/cameraSites.js';

function ProjectManagerCameraPage() {
  return <RoleCameraFeedPage title="Live Camera Feed" description="Click any camera for details" sites={CAMERA_SITES} />;
}

export default ProjectManagerCameraPage;
