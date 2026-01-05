import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import * as db from '../db/queries';
import { AdminUsers } from '../views/admin/users';
import { AdminUserDetail } from '../views/admin/user-detail';
import { AdminQuotaRequests } from '../views/admin/quota-requests';
import { AdminQuotaRequestDetail } from '../views/admin/quota-request-detail';
import { sanitizeString } from '../utils/validators';
import { logger } from '../utils/logger';

const admin = new Hono();

// Apply auth and admin middleware to all routes
admin.use('*', requireAuth);
admin.use('*', requireAdmin);

// User list
admin.get('/users', async (c) => {
  const currentUser = c.get('user')!; // Guaranteed by requireAuth and requireAdmin

  // Get all users
  const users = db.getAllUsers();

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    totalStorage: users.reduce((sum, u) => sum + u.storage_used, 0),
    totalQuota: users.reduce((sum, u) => sum + u.storage_quota, 0),
  };

  return c.html(<AdminUsers user={currentUser} users={users} stats={stats} />);
});

// User detail/edit
admin.get('/users/:id', async (c) => {
  const currentUser = c.get('user')!; // Guaranteed by requireAuth and requireAdmin
  const userId = c.req.param('id');

  const user = db.getUserById(userId);
  if (!user) {
    return c.notFound();
  }

  // Get user's resources
  const resources = db.getResourcesByUserId(userId);

  return c.html(<AdminUserDetail user={currentUser} targetUser={user} resources={resources} />);
});

// Update user quota
admin.post('/users/:id/quota', async (c) => {
  const userId = c.req.param('id');
  const body = await c.req.parseBody();

  const user = db.getUserById(userId);
  if (!user) {
    return c.notFound();
  }

  const quotaMB = parseInt(body.quota as string, 10);
  if (isNaN(quotaMB) || quotaMB < 0) {
    return c.redirect(`/admin/users/${userId}?error=invalid_quota`);
  }

  const quotaBytes = quotaMB * 1024 * 1024;
  const oldQuota = user.storage_quota;

  db.updateUserQuota(userId, quotaBytes);

  // Add notification if quota was increased
  let redirectUrl = `/admin/users/${userId}?success=quota_updated`;
  if (quotaBytes > oldQuota) {
    redirectUrl += '&info=quota_increased_by_admin';
  }

  return c.redirect(redirectUrl);
});

// Toggle admin status
admin.post('/users/:id/admin', async (c) => {
  const currentUser = c.get('user')!; // Guaranteed by requireAuth and requireAdmin
  const userId = c.req.param('id');

  // Don't allow removing own admin status
  if (userId === currentUser.id) {
    return c.redirect(`/admin/users/${userId}?error=cannot_modify_self`);
  }

  const user = db.getUserById(userId);
  if (!user) {
    return c.notFound();
  }

  db.updateUserAdmin(userId, !user.is_admin);

  return c.redirect(`/admin/users/${userId}?success=admin_updated`);
});

// Quota Requests Management

// List all quota requests
admin.get('/quota-requests', async (c) => {
  const currentUser = c.get('user')!;
  const statusFilter = c.req.query('status');

  // Get requests with optional status filter
  const requests = statusFilter
    ? db.getAllQuotaRequests(statusFilter)
    : db.getAllQuotaRequests();

  // Get statistics
  const stats = db.getQuotaRequestStats();

  // Attach user information to each request
  const requestsWithUsers = requests.map(request => {
    const user = db.getUserById(request.user_id) || undefined;
    return { ...request, user };
  });

  return c.html(
    <AdminQuotaRequests
      user={currentUser}
      requests={requestsWithUsers}
      stats={stats}
      currentFilter={statusFilter}
    />
  );
});

// View quota request detail
admin.get('/quota-requests/:id', async (c) => {
  const currentUser = c.get('user')!;
  const requestId = c.req.param('id');

  const request = db.getQuotaRequestById(requestId);
  if (!request) {
    return c.redirect('/admin/quota-requests?error=not_found');
  }

  const requestUser = db.getUserById(request.user_id);
  if (!requestUser) {
    return c.redirect('/admin/quota-requests?error=user_not_found');
  }

  // Automatically mark as viewed if status is '新着'
  if (request.status === '新着') {
    db.markQuotaRequestAsViewed(requestId);
    logger.info(`Quota request ${requestId} marked as viewed by admin ${currentUser.id}`);
  }

  // Fetch the updated request
  const updatedRequest = db.getQuotaRequestById(requestId) || request;

  return c.html(
    <AdminQuotaRequestDetail
      user={currentUser}
      request={updatedRequest}
      requestUser={requestUser}
    />
  );
});

// Approve quota request
admin.post('/quota-requests/:id/approve', async (c) => {
  const currentUser = c.get('user')!;
  const requestId = c.req.param('id');
  const formData = await c.req.parseBody();
  const adminNote = sanitizeString((formData.adminNote as string) || '');

  const request = db.getQuotaRequestById(requestId);
  if (!request) {
    return c.redirect('/admin/quota-requests?error=not_found');
  }

  if (request.status === '対応済み') {
    return c.redirect(`/admin/quota-requests/${requestId}?error=already_handled`);
  }

  const requestUser = db.getUserById(request.user_id);
  if (!requestUser) {
    return c.redirect('/admin/quota-requests?error=user_not_found');
  }

  try {
    // Update user's quota
    db.updateUserQuota(request.user_id, request.requested_quota);

    // Mark request as handled
    db.markQuotaRequestAsHandled(requestId, currentUser.id, adminNote);

    logger.info(`Quota request ${requestId} approved by admin ${currentUser.id}. User ${request.user_id} quota updated to ${request.requested_quota} bytes`);

    return c.redirect(`/admin/quota-requests/${requestId}?success=request_approved`);
  } catch (error) {
    logger.error(`Failed to approve quota request ${requestId}:`, error);
    return c.redirect(`/admin/quota-requests/${requestId}?error=approval_failed`);
  }
});

// Reject quota request
admin.post('/quota-requests/:id/reject', async (c) => {
  const currentUser = c.get('user')!;
  const requestId = c.req.param('id');
  const formData = await c.req.parseBody();
  const adminNote = sanitizeString((formData.adminNote as string) || '');

  const request = db.getQuotaRequestById(requestId);
  if (!request) {
    return c.redirect('/admin/quota-requests?error=not_found');
  }

  if (request.status === '対応済み') {
    return c.redirect(`/admin/quota-requests/${requestId}?error=already_handled`);
  }

  try {
    // Mark request as handled (without updating quota)
    db.markQuotaRequestAsHandled(requestId, currentUser.id, adminNote);

    logger.info(`Quota request ${requestId} rejected by admin ${currentUser.id}`);

    return c.redirect(`/admin/quota-requests/${requestId}?success=request_rejected`);
  } catch (error) {
    logger.error(`Failed to reject quota request ${requestId}:`, error);
    return c.redirect(`/admin/quota-requests/${requestId}?error=rejection_failed`);
  }
});

export default admin;
