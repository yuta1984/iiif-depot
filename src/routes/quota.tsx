import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import * as db from '../db/queries';
import { QuotaRequestForm } from '../views/quota/request';
import { QuotaHistory } from '../views/quota/history';
import { QuotaDetail } from '../views/quota/detail';
import { sanitizeString } from '../utils/validators';
import { v4 as uuidv4 } from 'uuid';

const quota = new Hono();

// All routes require authentication
quota.use('*', requireAuth);

// GET /quota/request - Display quota request form
quota.get('/request', async (c) => {
  const user = c.get('user')!;

  // Check if user already has a pending request
  const pendingRequest = db.getPendingQuotaRequestByUserId(user.id);
  if (pendingRequest) {
    return c.redirect('/quota/history?error=pending_request_exists');
  }

  return c.html(<QuotaRequestForm user={user} />);
});

// POST /quota/request - Submit quota request
quota.post('/request', async (c) => {
  const user = c.get('user')!;

  // Check if user already has a pending request
  const pendingRequest = db.getPendingQuotaRequestByUserId(user.id);
  if (pendingRequest) {
    return c.redirect('/quota/history?error=pending_request_exists');
  }

  const formData = await c.req.parseBody();
  const requestedQuotaMB = parseInt(formData.requestedQuota as string, 10);
  const reason = sanitizeString(formData.reason as string);

  const errors: { [key: string]: string } = {};

  // Validate requested quota
  const currentQuotaMB = Math.floor(user.storage_quota / (1024 * 1024));

  if (isNaN(requestedQuotaMB) || requestedQuotaMB <= 0) {
    errors.requestedQuota = '有効な容量を入力してください';
  } else if (requestedQuotaMB <= currentQuotaMB) {
    errors.requestedQuota = `現在の容量 (${currentQuotaMB} MB) より大きい値を指定してください`;
  } else if (requestedQuotaMB > currentQuotaMB * 10) {
    errors.requestedQuota = '現在の容量の10倍を超える申請はできません。段階的に申請してください';
  }

  // Validate reason
  if (!reason || reason.trim().length === 0) {
    errors.reason = '申請理由は必須です';
  } else if (reason.length < 20) {
    errors.reason = '申請理由は20文字以上で入力してください';
  } else if (reason.length > 1000) {
    errors.reason = '申請理由は1000文字以内で入力してください';
  }

  // If there are validation errors, redisplay form
  if (Object.keys(errors).length > 0) {
    return c.html(<QuotaRequestForm user={user} errors={errors} />);
  }

  // Create the quota request
  const requestedQuotaBytes = requestedQuotaMB * 1024 * 1024;

  try {
    db.createQuotaRequest({
      id: uuidv4(),
      user_id: user.id,
      current_quota: user.storage_quota,
      requested_quota: requestedQuotaBytes,
      reason: reason,
      status: '新着',
      admin_note: null,
      admin_id: null,
      viewed_at: null,
      handled_at: null
    });

    return c.redirect('/quota/history?success=request_created');
  } catch (error) {
    console.error('Failed to create quota request:', error);
    errors.reason = '申請の送信に失敗しました。もう一度お試しください';
    return c.html(<QuotaRequestForm user={user} errors={errors} />);
  }
});

// GET /quota/history - Display user's quota request history
quota.get('/history', async (c) => {
  const user = c.get('user')!;

  const requests = db.getQuotaRequestsByUserId(user.id);
  const pendingRequest = db.getPendingQuotaRequestByUserId(user.id);

  return c.html(
    <QuotaHistory
      user={user}
      requests={requests}
      hasPendingRequest={!!pendingRequest}
    />
  );
});

// GET /quota/request/:id - Display quota request detail
quota.get('/request/:id', async (c) => {
  const user = c.get('user')!;
  const requestId = c.req.param('id');

  const request = db.getQuotaRequestById(requestId);

  // Check if request exists and belongs to user
  if (!request || request.user_id !== user.id) {
    return c.redirect('/quota/history?error=not_found');
  }

  return c.html(<QuotaDetail user={user} request={request} />);
});

export default quota;
