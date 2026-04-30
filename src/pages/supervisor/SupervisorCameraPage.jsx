// Module: Supervisor Camera Page
// Purpose: Render the supervisor camera feed using shared camera modules.
import RoleCameraFeedPage from '../../frontend/components/camera/RoleCameraFeedPage.jsx';
import { CAMERA_SITES } from '../../frontend/constants/cameraSites.js';

function SupervisorCameraPage() {
  return <RoleCameraFeedPage title="Live Camera Feed" description="Click any camera for details" sites={CAMERA_SITES} />;
}

export default SupervisorCameraPage;
