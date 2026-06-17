import { post } from './api';

/**
 * Trigger admin job
 * @param {boolean} forceSendReport - Whether to force send report
 * @returns {Promise<Object>} - Response with status and message
 */
export async function triggerJob(forceSendReport = false) {
  return post('/api/admin/trigger-job', {
    force_send_report: forceSendReport,
  });
}
