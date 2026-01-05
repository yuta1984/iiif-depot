import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User, QuotaRequest } from '../../types';

interface QuotaDetailProps {
  user: User;
  request: QuotaRequest;
}

export const QuotaDetail: FC<QuotaDetailProps> = ({ user, request }) => {
  const requestedMB = Math.floor(request.requested_quota / (1024 * 1024));
  const currentMB = Math.floor(request.current_quota / (1024 * 1024));

  return (
    <Layout title="申請詳細" user={user}>
      <div class="container">
        <div class="mb-4">
          <a href="/quota/history" class="btn btn-sm btn-outline-secondary">← 申請履歴に戻る</a>
        </div>

        <h1 class="mb-4">申請詳細</h1>

        <div class="row">
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
                  <div class="col-4 text-muted">現在の容量</div>
                  <div class="col-8">{currentMB} MB</div>
                </div>

                <div class="row mb-3">
                  <div class="col-4 text-muted">希望容量</div>
                  <div class="col-8">
                    <strong>{requestedMB} MB</strong>
                    <span class="text-muted ms-2">(+{requestedMB - currentMB} MB)</span>
                  </div>
                </div>

                <div class="row mb-3">
                  <div class="col-4 text-muted">ステータス</div>
                  <div class="col-8">
                    <span class={`badge ${getStatusBadgeClass(request.status)}`}>
                      {request.status}
                    </span>
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
                )}

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

                {request.admin_note && (
                  <div class="row mb-3">
                    <div class="col-4 text-muted">管理者からのメッセージ</div>
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
              </div>
            </div>
          </div>

          <div class="col-md-4">
            <div class="card">
              <div class="card-body">
                <h6 class="card-subtitle mb-3 text-muted">申請ステータスについて</h6>
                <dl>
                  <dt class="mb-1">
                    <span class="badge bg-primary">新着</span>
                  </dt>
                  <dd class="mb-3 small text-muted">
                    申請が送信され、管理者の確認待ちです
                  </dd>

                  <dt class="mb-1">
                    <span class="badge bg-info">閲覧済み</span>
                  </dt>
                  <dd class="mb-3 small text-muted">
                    管理者が申請を確認しました
                  </dd>

                  <dt class="mb-1">
                    <span class="badge bg-success">対応済み</span>
                  </dt>
                  <dd class="mb-0 small text-muted">
                    管理者が申請を承認または却下しました
                  </dd>
                </dl>
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
