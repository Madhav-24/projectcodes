// Module: Backend Server
// Purpose: Start the backend HTTP server in local and production environments.
import app from './app.js';

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
