import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User, QuotaRequest } from '../../types';

interface QuotaRequestWithUser extends QuotaRequest {
  user?: User;
}

interface AdminQuotaRequestsProps {
  user: User;
  requests: QuotaRequestWithUser[];
  stats: {
    total: number;
    new: number;
    viewed: number;
    handled: number;
  };
  currentFilter?: string;
}

export const AdminQuotaRequests: FC<AdminQuotaRequestsProps> = ({
  user,
  requests,
  stats,
  currentFilter
}) => {
  return (
    <Layout title="ストレージ容量申請管理" user={user} activePage="admin">
      <div class="container">
        <h1 class="mb-4">ストレージ容量申請管理</h1>

        {/* Statistics Cards */}
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card">
              <div class="card-body text-center">
                <h3 class="mb-0">{stats.total}</h3>
                <small class="text-muted">総申請数</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-primary">
              <div class="card-body text-center">
                <h3 class="mb-0 text-primary">{stats.new}</h3>
                <small class="text-muted">新着</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-info">
              <div class="card-body text-center">
                <h3 class="mb-0 text-info">{stats.viewed}</h3>
                <small class="text-muted">閲覧済み</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-success">
              <div class="card-body text-center">
                <h3 class="mb-0 text-success">{stats.handled}</h3>
                <small class="text-muted">対応済み</small>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <ul class="nav nav-tabs mb-3">
          <li class="nav-item">
            <a
              class={`nav-link ${!currentFilter ? 'active' : ''}`}
              href="/admin/quota-requests"
            >
              すべて ({stats.total})
            </a>
          </li>
          <li class="nav-item">
            <a
              class={`nav-link ${currentFilter === '新着' ? 'active' : ''}`}
              href="/admin/quota-requests?status=新着"
            >
              新着 ({stats.new})
            </a>
          </li>
          <li class="nav-item">
            <a
              class={`nav-link ${currentFilter === '閲覧済み' ? 'active' : ''}`}
              href="/admin/quota-requests?status=閲覧済み"
            >
              閲覧済み ({stats.viewed})
            </a>
          </li>
          <li class="nav-item">
            <a
              class={`nav-link ${currentFilter === '対応済み' ? 'active' : ''}`}
              href="/admin/quota-requests?status=対応済み"
            >
              対応済み ({stats.handled})
            </a>
          </li>
        </ul>

        {/* Requests Table */}
        {requests.length === 0 ? (
          <div class="alert alert-info">
            {currentFilter ? `ステータス「${currentFilter}」の申請はありません` : '申請がありません'}
          </div>
        ) : (
          <div class="card">
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover align-middle">
                  <thead class="table-light">
                    <tr>
                      <th>申請日時</th>
                      <th>ユーザー</th>
                      <th>容量</th>
                      <th>ステータス</th>
                      <th>処理日時</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => {
                      const requestedMB = Math.floor(request.requested_quota / (1024 * 1024));
                      const currentMB = Math.floor(request.current_quota / (1024 * 1024));
                      const isNew = request.status === '新着';

                      return (
                        <tr class={isNew ? 'table-warning' : ''}>
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
                            {request.user ? (
                              <div>
                                <div>{request.user.name}</div>
                                <small class="text-muted">{request.user.email}</small>
                              </div>
                            ) : (
                              <small class="text-muted">ユーザー不明</small>
                            )}
                          </td>
                          <td>
                            {currentMB} MB → <strong>{requestedMB} MB</strong>
                            <br />
                            <small class="text-muted">(+{requestedMB - currentMB} MB)</small>
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
                            <a
                              href={`/admin/quota-requests/${request.id}`}
                              class="btn btn-sm btn-primary"
                            >
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

        <div class="mt-3">
          <a href="/admin/users" class="btn btn-secondary">← ユーザー管理に戻る</a>
        </div>
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
