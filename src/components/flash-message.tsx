import { FC } from 'hono/jsx';

interface FlashMessageProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  message?: string;
}

export const FlashMessage: FC<FlashMessageProps> = ({ type = 'info', message }) => {
  if (!message) return null;

  const alertClass = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;

  return (
    <div class={alertClass} role="alert">
      {message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  );
};

interface FlashMessagesProps {
  url?: string;
}

export const FlashMessages: FC<FlashMessagesProps> = ({ url }) => {
  if (!url) return null;

  const urlObj = new URL(url, 'http://localhost');
  const successMsg = urlObj.searchParams.get('success');
  const errorMsg = urlObj.searchParams.get('error');
  const warningMsg = urlObj.searchParams.get('warning');
  const infoMsg = urlObj.searchParams.get('info');

  // Map common message keys to user-friendly text
  const messageMap: Record<string, string> = {
    // Profile
    profile_updated: 'プロフィールを更新しました',
    // Resources
    resource_created: 'リソースを作成しました。画像を処理中です...',
    resource_updated: 'リソースを更新しました',
    resource_deleted: 'リソースを削除しました',
    quota_exceeded: 'ストレージ容量が不足しています',
    // Admin
    quota_updated: 'ストレージクォータを更新しました',
    admin_updated: '管理者権限を更新しました',
    cannot_modify_self: '自分自身の管理者権限は変更できません',
    invalid_quota: '無効なクォータ値です',
    // Quota Requests
    request_created: 'ストレージ容量増加申請を送信しました',
    pending_request_exists: '処理中の申請があるため、新しい申請を作成できません',
    request_approved: '申請が承認されました',
    quota_approved: 'ストレージ容量が増加されました',
    request_rejected: '申請が却下されました',
    approval_failed: '承認処理に失敗しました',
    rejection_failed: '却下処理に失敗しました',
    already_handled: 'この申請は既に処理済みです',
    not_found: '申請が見つかりません',
    user_not_found: 'ユーザーが見つかりません',
    // Storage threshold warnings
    storage_80_warning: 'ストレージ使用量が80%を超えました',
    storage_90_warning: 'ストレージ使用量が90%を超えました。容量増加を検討してください',
    quota_increased_by_admin: 'ストレージ容量が管理者によって増加されました',
  };

  const getMessage = (key: string | null): string | null => {
    if (!key) return null;
    return messageMap[key] || key;
  };

  return (
    <>
      {successMsg && <FlashMessage type="success" message={getMessage(successMsg) || undefined} />}
      {errorMsg && <FlashMessage type="error" message={getMessage(errorMsg) || undefined} />}
      {warningMsg && <FlashMessage type="warning" message={getMessage(warningMsg) || undefined} />}
      {infoMsg && <FlashMessage type="info" message={getMessage(infoMsg) || undefined} />}
    </>
  );
};
