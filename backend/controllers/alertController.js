// Module: Alert Controller
// Purpose: Handle safety alert HTTP endpoints.
import { sendSuccess } from '../utils/apiResponse.js';

export function createAlertController({ alertService }) {
  async function createAlert(req, res) {
    const senderProfile = { ...req.userProfile, id: req.user.id };
    const alert = await alertService.createAlert(req.body, senderProfile);
    return sendSuccess(res, 'Alert created.', alert, 201);
  }

  async function getAlerts(req, res) {
    const { id, role, email } = req.user;
    const assignedSite = req.userProfile?.assigned_site || null;
    const alerts = await alertService.getAlertsForViewer(id, role, assignedSite);
    return sendSuccess(res, 'Alerts fetched.', alerts);
  }

  async function createPpeAlert(req, res) {
    const result = await alertService.createPpeAlert(req.body);
    if (result.shouldAlert) {
      return sendSuccess(res, 'PPE violation logged.', result, 201);
    }
    return sendSuccess(res, 'PPE detection logged. No alert generated.', result, 200);
  }

  return { createAlert, getAlerts, createPpeAlert };
}
