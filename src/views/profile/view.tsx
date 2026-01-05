import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User } from '../../types';

interface ProfileViewProps {
  user: User;
}

export const ProfileView: FC<ProfileViewProps> = ({ user }) => {
  const usedPercent = (user.storage_used / user.storage_quota) * 100;

  return (
    <Layout title="プロフィール" user={user}>
      <div class="container">
        <div class="row">
          <div class="col-md-8 mx-auto">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h1>プロフィール</h1>
              <a href="/profile/edit" class="btn btn-primary">編集</a>
            </div>

            <div class="card mb-4">
              <div class="card-body">
                <div class="row">
                  <div class="col-md-3 text-center mb-3 mb-md-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        class="rounded-circle img-fluid"
                        style="max-width: 150px;"
                      />
                    ) : (
                      <div
                        class="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white mx-auto"
                        style="width: 150px; height: 150px; font-size: 48px;"
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div class="col-md-9">
                    <h2 class="h4 mb-3">{user.name}</h2>

                    <div class="mb-3">
                      <label class="text-muted small">メールアドレス</label>
                      <div>{user.email}</div>
                    </div>

                    {user.profile && (
                      <div class="mb-3">
                        <label class="text-muted small">プロフィール</label>
                        <div>{user.profile}</div>
                      </div>
                    )}

                    {user.is_admin && (
                      <div class="mb-3">
                        <span class="badge bg-danger">管理者</span>
                      </div>
                    )}

                    <div class="mb-3">
                      <label class="text-muted small">登録日</label>
                      <div>{new Date(user.created_at).toLocaleDateString('ja-JP')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <h3 class="h5 mb-3">ストレージ使用状況</h3>
                <div class="mb-2">
                  <div class="d-flex justify-content-between mb-1">
                    <span>{formatBytes(user.storage_used)} 使用中</span>
                    <span>{formatBytes(user.storage_quota)} まで</span>
                  </div>
                  <div class="progress" style="height: 25px;">
                    <div
                      class={`progress-bar ${usedPercent > 90 ? 'bg-danger' : usedPercent > 75 ? 'bg-warning' : 'bg-success'}`}
                      role="progressbar"
                      style={`width: ${usedPercent}%`}
                      aria-valuenow={usedPercent}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {usedPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <small class="text-muted">
                  残り {formatBytes(user.storage_quota - user.storage_used)}
                </small>
                <div class="mt-3">
                  <a href="/quota/request" class="btn btn-sm btn-outline-primary">
                    ストレージ容量増加を申請
                  </a>
                  <a href="/quota/history" class="btn btn-sm btn-outline-secondary ms-2">
                    申請履歴
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
