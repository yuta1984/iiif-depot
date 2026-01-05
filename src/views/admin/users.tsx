import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User } from '../../types';

interface AdminUsersProps {
  user: User;
  users: User[];
  stats: {
    totalUsers: number;
    totalStorage: number;
    totalQuota: number;
  };
}

export const AdminUsers: FC<AdminUsersProps> = ({ user, users, stats }) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatPercent = (used: number, quota: number): number => {
    if (quota === 0) return 0;
    return Math.round((used / quota) * 100);
  };

  return (
    <Layout title="ユーザー管理" user={user}>
      <div class="container">
        <div class="row">
          <div class="col-md-12">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h1 class="mb-0">ユーザー管理</h1>
              <a href="/admin/quota-requests" class="btn btn-primary">
                容量申請管理
              </a>
            </div>

            {/* Stats Cards */}
            <div class="row mb-4">
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-subtitle mb-2 text-muted">総ユーザー数</h6>
                    <h3 class="card-title mb-0">{stats.totalUsers}</h3>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-subtitle mb-2 text-muted">総使用容量</h6>
                    <h3 class="card-title mb-0">{formatBytes(stats.totalStorage)}</h3>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-subtitle mb-2 text-muted">総クォータ</h6>
                    <h3 class="card-title mb-0">{formatBytes(stats.totalQuota)}</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* User Table */}
            <div class="card">
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>ユーザー</th>
                        <th>メール</th>
                        <th>ストレージ使用状況</th>
                        <th>クォータ</th>
                        <th>管理者</th>
                        <th>登録日</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const percent = formatPercent(u.storage_used, u.storage_quota);
                        let progressClass = 'bg-success';
                        if (percent >= 90) progressClass = 'bg-danger';
                        else if (percent >= 75) progressClass = 'bg-warning';

                        return (
                          <tr key={u.id}>
                            <td>
                              <div class="d-flex align-items-center">
                                {u.avatar_url && (
                                  <img
                                    src={u.avatar_url}
                                    alt={u.name}
                                    class="rounded-circle me-2"
                                    width="32"
                                    height="32"
                                  />
                                )}
                                <span>{u.name}</span>
                              </div>
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <div class="progress" style="width: 150px;">
                                <div
                                  class={`progress-bar ${progressClass}`}
                                  role="progressbar"
                                  style={`width: ${percent}%`}
                                  aria-valuenow={percent}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                >
                                  {percent}%
                                </div>
                              </div>
                              <small class="text-muted">
                                {formatBytes(u.storage_used)} / {formatBytes(u.storage_quota)}
                              </small>
                            </td>
                            <td>{formatBytes(u.storage_quota)}</td>
                            <td>
                              {u.is_admin ? (
                                <span class="badge bg-primary">管理者</span>
                              ) : (
                                <span class="badge bg-secondary">一般</span>
                              )}
                            </td>
                            <td>
                              <small class="text-muted">
                                {new Date(u.created_at).toLocaleDateString('ja-JP')}
                              </small>
                            </td>
                            <td>
                              <a href={`/admin/users/${u.id}`} class="btn btn-sm btn-outline-primary">
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
          </div>
        </div>
      </div>
    </Layout>
  );
};
