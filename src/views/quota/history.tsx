import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User, QuotaRequest } from '../../types';

interface QuotaHistoryProps {
  user: User;
  requests: QuotaRequest[];
  hasPendingRequest: boolean;
}

export const QuotaHistory: FC<QuotaHistoryProps> = ({ user, requests, hasPendingRequest }) => {
  return (
    <Layout title="申請履歴" user={user}>
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1>ストレージ容量増加申請履歴</h1>
          <a
            href="/quota/request"
            class={`btn btn-primary ${hasPendingRequest ? 'disabled' : ''}`}
            aria-disabled={hasPendingRequest}
          >
            新規申請
          </a>
        </div>

        {hasPendingRequest && (
          <div class="alert alert-warning">
            未対応の申請があるため、新しい申請を作成できません
          </div>
        )}

        {requests.length === 0 ? (
          <div class="alert alert-info">
            <h4 class="alert-heading">申請履歴がありません</h4>
            <p>まだストレージ容量増加の申請を行っていません。</p>
            <hr />
            <a href="/quota/request" class="btn btn-primary">
              申請を作成
            </a>
          </div>
        ) : (
          <div class="card">
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover align-middle">
                  <thead class="table-light">
                    <tr>
                      <th>申請日時</th>
                      <th>希望容量</th>
                      <th>ステータス</th>
                      <th>処理日時</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => {
                      const requestedMB = Math.floor(request.requested_quota / (1024 * 1024));
                      const currentMB = Math.floor(request.current_quota / (1024 * 1024));

                      return (
                        <tr>
                          <td>
                            <small>{new Date(request.created_at).toLocaleString('ja-JP', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</small>
                          </td>
                          <td>
                            {currentMB} MB → {requestedMB} MB
                          </td>
                          <td>
                            <span class={`badge ${getStatusBadgeClass(request.status)}`}>
                              {request.status}
                            </span>
                          </td>
                          <td>
                            {request.handled_at ? (
                              <small>{new Date(request.handled_at).toLocaleString('ja-JP', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</small>
                            ) : (
                              <small class="text-muted">-</small>
                            )}
                          </td>
                          <td>
                            <a href={`/quota/request/${request.id}`} class="btn btn-sm btn-outline-primary">
                              詳細
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case '新着':
      return 'bg-primary';
    case '閲覧済み':
      return 'bg-info';
    case '対応済み':
      return 'bg-success';
    default:
      return 'bg-secondary';
  }
}
