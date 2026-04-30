// Module: Alert Service
// Purpose: Safety alert business logic — creation, recipient resolution, visibility.
import crypto from 'crypto';
import AppError from '../utils/AppError.js';

export function createAlertService({ alertRepository, userRepository, ppeLogRepository }) {
  async function createAlert(reportPayload, senderProfile) {
    if (!reportPayload.problem) {
      throw new AppError('problem is required.', 400);
    }

    const alert = await alertRepository.create({
      description: normaliseDescription(reportPayload.problem),
    });

    return mapAlert(alert);
  }

  async function getAlertsForViewer(viewerId, viewerRole, viewerSite) {
    const rows = await alertRepository.findVisibleTo(viewerId, viewerRole, viewerSite);
    return rows.map(mapAlert);
  }

  async function createPpeAlert(reportPayload) {
    if (!ppeLogRepository) {
      throw new AppError('PPE log repository is not configured.', 500);
    }

    const violation = resolveViolationFlags(reportPayload);
    const shouldAlert = violation.helmet || violation.vest || violation.glove;
    const alertId = crypto.randomUUID();

    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toISOString().slice(11, 19);
    const description = shouldAlert ? 'PPE Not detected' : 'No alert generated';

    const event = {
      alertid: alertId,
      date,
      time,
      description,
      helmet: violation.helmet,
      vest: violation.vest,
      glove: violation.glove,
    };

    const attempts = Number(process.env.PPE_LOG_RETRY_ATTEMPTS || 3);
    const baseDelayMs = Number(process.env.PPE_LOG_RETRY_DELAY_MS || 150);
    let lastError = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        await ppeLogRepository.logPpeAlert({
          alertId,
          helmet: violation.helmet,
          vest: violation.vest,
          glove: violation.glove,
        });

        return {
          ...event,
          shouldAlert,
          loggedVia: 'postgres',
          attempts: attempt,
        };
      } catch (err) {
        lastError = err;
        if (attempt < attempts) {
          const waitMs = baseDelayMs * attempt;
          await delay(waitMs);
        }
      }
    }

    console.error(
      'Failed to write PPE event to PostgreSQL logs after retries. Falling back to console log.',
      lastError,
    );
    console.log(`PPE_ALERT_FALLBACK: ${JSON.stringify(event)}`);

    return {
      ...event,
      shouldAlert,
      loggedVia: 'console-fallback',
      attempts,
    };
  }

  // Step 4 core function: generates the description from PPE booleans.
  function generateDescription({ helmet, vest, glove }) {
    if (typeof helmet !== 'boolean' || typeof vest !== 'boolean' || typeof glove !== 'boolean') {
      throw new AppError('helmet, vest, and glove must be booleans.', 400);
    }

    const missing = [];
    if (!helmet) missing.push('no helmet');
    if (!vest) missing.push('no vest');
    if (!glove) missing.push('no glove');

    if (missing.length === 0) {
      return null;
    }

    return missing.join(', ');
  }

  // ── Private helpers ──────────────────────────────────────────

  function mapAlert(row) {
    const createdAtMs = resolveCreatedAtMs(row);

    return {
      id: row.alert_id,
      senderId: null,
      senderName: 'PPE Engine',
      senderRole: 'system',
      site: 'All Sites',
      siteId: 'All Sites',
      problem: row.description,
      severity: 'Critical',
      status: 'Active',
      recipientIds: [],
      createdAtMs,
      createdAt: new Date(createdAtMs).toISOString(),
    };
  }

  function resolveCreatedAtMs(row) {
    const datePart = formatDatePart(row.date);
    const timePart = formatTimePart(row.time);
    const ts = new Date(`${datePart}T${timePart}`).getTime();
    if (Number.isNaN(ts)) {
      return Date.now();
    }
    return ts;
  }

  function formatDatePart(value) {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    const raw = String(value || '').trim();
    if (!raw) {
      return new Date().toISOString().slice(0, 10);
    }

    if (raw.includes('T')) {
      return raw.slice(0, 10);
    }

    return raw;
  }

  function formatTimePart(value) {
    const raw = String(value || '').trim();
    if (!raw) {
      return '00:00:00';
    }

    const hhmmss = raw.split('.')[0];
    if (/^\d{2}:\d{2}:\d{2}$/.test(hhmmss)) {
      return hhmmss;
    }

    const parsed = new Date(`1970-01-01T${raw}`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(11, 19);
    }

    return '00:00:00';
  }

  function normaliseDescription(value) {
    return value
      .toLowerCase()
      .replace(/not wearing\s+/g, 'no ')
      .replace(/ppe violation/g, 'no helmet, no vest, no glove')
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .trim();
  }

  function resolveViolationFlags(payload) {
    const hasDetectedBooleans =
      typeof payload?.helmet_detected === 'boolean' &&
      typeof payload?.vest_detected === 'boolean' &&
      typeof payload?.glove_detected === 'boolean';

    if (hasDetectedBooleans) {
      return {
        helmet: !payload.helmet_detected,
        vest: !payload.vest_detected,
        glove: !payload.glove_detected,
      };
    }

    const hasViolationBooleans =
      typeof payload?.helmet === 'boolean' &&
      typeof payload?.vest === 'boolean' &&
      typeof payload?.glove === 'boolean';

    if (hasViolationBooleans) {
      return {
        helmet: payload.helmet,
        vest: payload.vest,
        glove: payload.glove,
      };
    }

    if (typeof payload?.problem === 'string' && payload.problem.trim()) {
      return deriveViolationFromProblem(payload.problem);
    }

    throw new AppError(
      'Provide helmet_detected/vest_detected/glove_detected booleans (or legacy helmet/vest/glove booleans).',
      400,
    );
  }

  function deriveViolationFromProblem(problem) {
    const text = normaliseDescription(problem);
    return {
      helmet: text.includes('no helmet'),
      vest: text.includes('no vest'),
      glove: text.includes('no glove'),
    };
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  return { createAlert, createPpeAlert, getAlertsForViewer, generateDescription };
}
