import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User, IIIFResource } from '../../types';

interface AdminUserDetailProps {
  user: User;
  targetUser: User;
  resources: IIIFResource[];
}

export const AdminUserDetail: FC<AdminUserDetailProps> = ({ user, targetUser, resources }) => {
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

  const quotaMB = Math.round(targetUser.storage_quota / (1024 * 1024));
  const percent = formatPercent(targetUser.storage_used, targetUser.storage_quota);

  let progressClass = 'bg-success';
  if (percent >= 90) progressClass = 'bg-danger';
  else if (percent >= 75) progressClass = 'bg-warning';

  return (
    <Layout title={`ユーザー詳細: ${targetUser.name}`} user={user}>
      <div class="container">
        <div class="row">
          <div class="col-md-10 mx-auto">
            <nav aria-label="breadcrumb" class="mb-3">
              <ol class="breadcrumb">
                <li class="breadcrumb-item">
                  <a href="/admin/users">ユーザー管理</a>
                </li>
                <li class="breadcrumb-item active">{targetUser.name}</li>
              </ol>
            </nav>

            <h1 class="mb-4">ユーザー詳細</h1>

            <div class="row">
              {/* User Info */}
              <div class="col-md-4">
                <div class="card mb-4">
                  <div class="card-body text-center">
                    {targetUser.avatar_url && (
                      <img
                        src={targetUser.avatar_url}
                        alt={targetUser.name}
                        class="rounded-circle mb-3"
                        width="100"
                        height="100"
                      />
                    )}
                    <h5 class="card-title">{targetUser.name}</h5>
                    <p class="card-text text-muted">{targetUser.email}</p>
                    {targetUser.is_admin && (
                      <span class="badge bg-primary mb-3">管理者</span>
                    )}
                    {targetUser.profile && (
                      <p class="card-text small">{targetUser.profile}</p>
                    )}
                    <hr />
                    <div class="text-start">
                      <small class="text-muted">登録日</small>
                      <div>{new Date(targetUser.created_at).toLocaleDateString('ja-JP')}</div>
                      <small class="text-muted mt-2 d-block">最終更新</small>
                      <div>{new Date(targetUser.updated_at).toLocaleDateString('ja-JP')}</div>
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">管理者操作</h6>

                    {/* Toggle Admin Status */}
                    {user.id !== targetUser.id && (
                      <form method="post" action={`/admin/users/${targetUser.id}/admin`} class="mb-3">
                        <button
                          type="submit"
                          class={`btn btn-sm w-100 ${targetUser.is_admin ? 'btn-outline-warning' : 'btn-outline-primary'}`}
                        >
                          {targetUser.is_admin ? '管理者権限を削除' : '管理者権限を付与'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              {/* Storage & Resources */}
              <div class="col-md-8">
                {/* Storage Management */}
                <div class="card mb-4">
                  <div class="card-body">
                    <h5 class="card-title">ストレージ管理</h5>

                    <div class="mb-3">
                      <label class="text-muted small">使用状況</label>
                      <div class="progress mb-2" style="height: 25px;">
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
                      <div class="d-flex justify-content-between">
                        <span>{formatBytes(targetUser.storage_used)} 使用中</span>
                        <span>{formatBytes(targetUser.storage_quota)} / 総容量</span>
                      </div>
                    </div>

                    <hr />

                    <form method="post" action={`/admin/users/${targetUser.id}/quota`}>
                      <div class="mb-3">
                        <label for="quota" class="form-label">
                          ストレージクォータ (MB)
                        </label>
                        <input
                          type="number"
                          class="form-control"
                          id="quota"
                          name="quota"
                          value={quotaMB}
                          min={0}
                          step={10}
                          required
                        />
                        <div class="form-text">
                          現在の使用量: {formatBytes(targetUser.storage_used)}
                        </div>
                      </div>
                      <button type="submit" class="btn btn-primary">
                        クォータを更新
                      </button>
                    </form>
                  </div>
                </div>

                {/* Resources */}
                <div class="card">
                  <div class="card-body">
                    <h5 class="card-title">リソース一覧 ({resources.length})</h5>

                    {resources.length === 0 ? (
                      <p class="text-muted">リソースがありません</p>
                    ) : (
                      <div class="table-responsive">
                        <table class="table table-sm">
                          <thead>
                            <tr>
                              <th>タイトル</th>
                              <th>ステータス</th>
                              <th>公開設定</th>
                              <th>作成日</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {resources.map((resource) => {
                              let statusBadge;
                              if (resource.status === 'ready') {
                                statusBadge = <span class="badge bg-success">完了</span>;
                              } else if (resource.status === 'processing') {
                                statusBadge = <span class="badge bg-warning">処理中</span>;
                              } else {
                                statusBadge = <span class="badge bg-danger">失敗</span>;
                              }

                              return (
                                <tr key={resource.id}>
                                  <td>{resource.title}</td>
                                  <td>{statusBadge}</td>
                                  <td>
                                    {resource.visibility === 'public' ? (
                                      <span class="badge bg-info">公開</span>
                                    ) : (
                                      <span class="badge bg-secondary">非公開</span>
                                    )}
                                  </td>
                                  <td>
                                    <small class="text-muted">
                                      {new Date(resource.created_at).toLocaleDateString('ja-JP')}
                                    </small>
                                  </td>
                                  <td>
                                    <a
                                      href={`/resources/${resource.id}`}
                                      class="btn btn-sm btn-outline-primary"
                                    >
                                      表示
                                    </a>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
