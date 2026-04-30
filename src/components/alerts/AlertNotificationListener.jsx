import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import notificationSound from '../../notification_sound/notification.mp3'; // notification sound file
import { subscribeToSafetyReports } from '../../services/alertReportService.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { wasRecentlyShownViaWs } from '../../services/ppeAlertDedup.js';

const SOUND_PREF_KEY = 'construction:alert-sound-enabled';

function getAssignedSites(profile) {
  if (Array.isArray(profile?.assignedSites)) {
    return profile.assignedSites.filter(Boolean);
  }

  if (Array.isArray(profile?.assignedSite)) {
    return profile.assignedSite.filter(Boolean);
  }

  if (typeof profile?.assignedSite === 'string' && profile.assignedSite.trim()) {
    return [profile.assignedSite.trim()];
  }

  return [];
}

function isSoundEnabled() {
  if (typeof window === 'undefined') {
    return false;
  }

  const raw = window.localStorage.getItem(SOUND_PREF_KEY);
  if (raw === null) {
    return true;
  }

  return raw === 'true';
}

function AlertNotificationListener() {
  const { profile } = useAuth();
  const knownAlertIdsRef = useRef(new Set());
  const initializedRef = useRef(false);
  const audioRef = useRef(typeof Audio !== 'undefined' ? new Audio(notificationSound) : null);

  useEffect(() => {
    if (!profile?.uid || !profile?.role) {
      knownAlertIdsRef.current.clear();
      initializedRef.current = false;
      return;
    }

    const viewer = {
      uid: profile.uid,
      role: profile.role,
      assignedSites: getAssignedSites(profile),
    };

    const unsubscribe = subscribeToSafetyReports(viewer, (alerts) => {
      const seen = knownAlertIdsRef.current;

      if (!initializedRef.current) {
        alerts.forEach((alert) => seen.add(alert.id));
        initializedRef.current = true;
        return;
      }

      for (const alert of alerts) {
        if (seen.has(alert.id)) {
          continue;
        }

        seen.add(alert.id);

        // Skip alerts the current user sent themselves.
        if (alert.senderId && alert.senderId === profile.uid) {
          continue;
        }

        // For PPE system alerts (senderRole === 'system'), suppress the polling toast if the
        // same violation was already shown immediately via the live WebSocket stream (AdminCamera).
        // This prevents a double notification roughly 2s after the real-time one.
        if (alert.senderRole === 'system' && wasRecentlyShownViaWs(alert.problem)) {
          continue;
        }

        const label =
          alert.senderRole === 'system'
            ? `PPE Violation at ${alert.site}: ${alert.problem}`
            : `New ${alert.severity || 'Safety'} alert from ${alert.site}: ${alert.problem}`;

        toast.info(label, {
          autoClose: 5000,
        });

        if (isSoundEnabled() && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      }
    });

    return unsubscribe;
  }, [profile?.uid, profile?.role, profile?.assignedSite, profile?.assignedSites]);

  return null;
}

export default AlertNotificationListener;
