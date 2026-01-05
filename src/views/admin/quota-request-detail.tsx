import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User, QuotaRequest } from '../../types';

interface AdminQuotaRequestDetailProps {
  user: User;
  request: QuotaRequest;
  requestUser: User;
}

export const AdminQuotaRequestDetail: FC<AdminQuotaRequestDetailProps> = ({
  user,
  request,
  requestUser
}) => {
  const requestedMB = Math.floor(request.requested_quota / (1024 * 1024));
  const currentMB = Math.floor(request.current_quota / (1024 * 1024));
  const usedMB = Math.floor(requestUser.storage_used / (1024 * 1024));
  const currentUsedPercent = (requestUser.storage_used / requestUser.storage_quota) * 100;
  const afterUsedPercent = (requestUser.storage_used / request.requested_quota) * 100;
  const isPending = request.status !== '対応済み';

  return (
    <Layout title="申請詳細" user={user} activePage="admin">
      <div class="container">
        <div class="mb-4">
          <a href="/admin/quota-requests" class="btn btn-sm btn-outline-secondary">
            ← 申請一覧に戻る
          </a>
        </div>

        <h1 class="mb-4">
          ストレージ容量申請詳細
          <span class={`badge ms-2 ${getStatusBadgeClass(request.status)}`}>
            {request.status}
          </span>
        </h1>

        <div class="row">
          {/* Left Column - Request Details */}
          <div class="col-md-8">
            <div class="card mb-3">
              <div class="card-body">
                <h5 class="card-title">申請情報</h5>
                <hr />

                <div class="row mb-3">
                  <div class="col-4 text-muted">申請日時</div>
                  <div class="col-8">
                    {new Date(request.created_at).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                </div>

                <div class="row mb-3">
                  <div class="col-4 text-muted">ユーザー</div>
                  <div class="col-8">
                    <div><strong>{requestUser.name}</strong></div>
                    <div><small class="text-muted">{requestUser.email}</small></div>
                    <div class="mt-1">
                      <a href={`/admin/users/${requestUser.id}`} class="btn btn-sm btn-outline-primary">
                        ユーザー詳細
                      </a>
                    </div>
                  </div>
                </div>

                <div class="row mb-3">
                  <div class="col-4 text-muted">現在の容量</div>
                  <div class="col-8">{currentMB} MB</div>
                </div>

                <div class="row mb-3">
                  <div class="col-4 text-muted">希望容量</div>
                  <div class="col-8">
                    <strong class="fs-5">{requestedMB} MB</strong>
                    <span class="text-success ms-2">(+{requestedMB - currentMB} MB)</span>
                  </div>
                </div>

                <div class="row mb-3">
                  <div class="col-4 text-muted">申請理由</div>
                  <div class="col-8">
                    <div class="border rounded p-3 bg-light">
                      {request.reason.split('\n').map((line, i) => (
                        <>
                          {line}
                          {i < request.reason.split('\n').length - 1 && <br />}
                        </>
                      ))}
                    </div>
                  </div>
                </div>

                {request.viewed_at && (
                  <div class="row mb-3">
                    <div class="col-4 text-muted">閲覧日時</div>
                    <div class="col-8">
                      {new Date(request.viewed_at).toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                )}

                {request.handled_at && (
                  <>
                    <div class="row mb-3">
                      <div class="col-4 text-muted">処理日時</div>
                      <div class="col-8">
                        {new Date(request.handled_at).toLocaleString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {request.admin_note && (
                      <div class="row mb-3">
                        <div class="col-4 text-muted">管理者メモ</div>
                        <div class="col-8">
                          <div class="alert alert-info mb-0">
                            {request.admin_note.split('\n').map((line, i) => (
                              <>
                                {line}
                                {i < request.admin_note!.split('\n').length - 1 && <br />}
                              </>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Action Forms (only for pending requests) */}
            {isPending && (
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">操作</h5>
                  <hr />

                  <div class="row">
                    <div class="col-md-6">
                      <h6 class="text-success">承認</h6>
                      <form method="post" action={`/admin/quota-requests/${request.id}/approve`}>
                        <div class="mb-3">
                          <label for="approveNote" class="form-label">メッセージ（任意）</label>
                          <textarea
                            class="form-control"
                            id="approveNote"
                            name="adminNote"
                            rows={3}
                            placeholder="ユーザーに表示するメッセージ"
                          ></textarea>
                        </div>
                        <button type="submit" class="btn btn-success w-100">
                          承認してストレージを増加
                        </button>
                      </form>
                    </div>

                    <div class="col-md-6">
                      <h6 class="text-danger">却下</h6>
                      <form method="post" action={`/admin/quota-requests/${request.id}/reject`}>
                        <div class="mb-3">
                          <label for="rejectNote" class="form-label">理由（任意）</label>
                          <textarea
                            class="form-control"
                            id="rejectNote"
                            name="adminNote"
                            rows={3}
                            placeholder="却下理由をユーザーに説明"
                          ></textarea>
                        </div>
                        <button type="submit" class="btn btn-danger w-100">
                          却下
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - User Context */}
          <div class="col-md-4">
            <div class="card mb-3">
              <div class="card-body">
                <h6 class="card-subtitle mb-3 text-muted">ユーザー情報</h6>

                <div class="mb-3">
                  <label class="text-muted small">名前</label>
                  <div>{requestUser.name}</div>
                </div>

                <div class="mb-3">
                  <label class="text-muted small">メール</label>
                  <div><small>{requestUser.email}</small></div>
                </div>

                <div class="mb-3">
                  <label class="text-muted small">登録日</label>
                  <div>
                    <small>{new Date(requestUser.created_at).toLocaleDateString('ja-JP')}</small>
                  </div>
                </div>
              </div>
            </div>

            <div class="card mb-3">
              <div class="card-body">
                <h6 class="card-subtitle mb-3 text-muted">現在の使用状況</h6>

                <div class="progress mb-2" style="height: 20px;">
                  <div
                    class={`progress-bar ${currentUsedPercent > 90 ? 'bg-danger' : currentUsedPercent > 75 ? 'bg-warning' : 'bg-success'}`}
                    style={`width: ${currentUsedPercent}%`}
                  >
                    {currentUsedPercent.toFixed(1)}%
                  </div>
                </div>

                <small class="text-muted">
                  {usedMB} MB / {currentMB} MB
                </small>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <h6 class="card-subtitle mb-3 text-muted">承認後の使用率</h6>

                <div class="progress mb-2" style="height: 20px;">
                  <div
                    class={`progress-bar ${afterUsedPercent > 90 ? 'bg-danger' : afterUsedPercent > 75 ? 'bg-warning' : 'bg-success'}`}
                    style={`width: ${afterUsedPercent}%`}
                  >
                    {afterUsedPercent.toFixed(1)}%
                  </div>
                </div>

                <small class="text-muted">
                  {usedMB} MB / {requestedMB} MB
                </small>

                {afterUsedPercent < 50 && (
                  <div class="alert alert-success mt-2 mb-0 py-1 px-2">
                    <small>承認後も余裕があります</small>
                  </div>
                )}
              </div>
            </div>
          </div>
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
