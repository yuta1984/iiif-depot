import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User } from '../../types';

interface QuotaRequestProps {
  user: User;
  errors?: { [key: string]: string };
}

export const QuotaRequestForm: FC<QuotaRequestProps> = ({ user, errors = {} }) => {
  const usedPercent = (user.storage_used / user.storage_quota) * 100;
  const currentQuotaMB = Math.floor(user.storage_quota / (1024 * 1024));
  const usedMB = Math.floor(user.storage_used / (1024 * 1024));
  const remainingMB = currentQuotaMB - usedMB;

  return (
    <Layout title="ストレージ容量増加申請" user={user}>
      <div class="container">
        <div class="row">
          <div class="col-md-8 mx-auto">
            <h1 class="mb-4">ストレージ容量増加申請</h1>

            <div class="card mb-4">
              <div class="card-body">
                <h6 class="card-subtitle mb-3 text-muted">現在のストレージ使用状況</h6>
                <div class="progress" style="height: 25px;">
                  <div
                    class={`progress-bar ${usedPercent > 90 ? 'bg-danger' : usedPercent > 75 ? 'bg-warning' : 'bg-success'}`}
                    style={`width: ${usedPercent}%`}
                  >
                    {usedPercent.toFixed(1)}%
                  </div>
                </div>
                <div class="mt-2">
                  <small class="text-muted">
                    使用量: {usedMB} MB / {currentQuotaMB} MB (残り: {remainingMB} MB)
                  </small>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <form method="post" action="/quota/request">
                  <div class="mb-3">
                    <label for="requestedQuota" class="form-label">希望容量 (MB) *</label>
                    <input
                      type="number"
                      class={`form-control ${errors.requestedQuota ? 'is-invalid' : ''}`}
                      id="requestedQuota"
                      name="requestedQuota"
                      min={currentQuotaMB + 1}
                      max={currentQuotaMB * 10}
                      step="1"
                      required
                      placeholder={`${currentQuotaMB + 100}`}
                    />
                    {errors.requestedQuota && (
                      <div class="invalid-feedback">{errors.requestedQuota}</div>
                    )}
                    <div class="form-text">
                      現在の容量より大きい値を指定してください（最大: {currentQuotaMB * 10} MB）
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="reason" class="form-label">申請理由 *</label>
                    <textarea
                      class={`form-control ${errors.reason ? 'is-invalid' : ''}`}
                      id="reason"
                      name="reason"
                      rows={6}
                      minLength={20}
                      maxLength={1000}
                      required
                      placeholder="ストレージ容量増加が必要な理由を具体的に記入してください（20文字以上）"
                    ></textarea>
                    {errors.reason && (
                      <div class="invalid-feedback">{errors.reason}</div>
                    )}
                    <div class="form-text">
                      20文字以上1000文字以内で入力してください
                    </div>
                  </div>

                  <div class="alert alert-info">
                    <h6 class="alert-heading">申請について</h6>
                    <ul class="mb-0">
                      <li>申請は管理者が確認し、承認または却下されます</li>
                      <li>未対応の申請がある場合、新しい申請はできません</li>
                      <li>大幅な容量増加が必要な場合は、段階的に申請してください</li>
                    </ul>
                  </div>

                  <div class="d-flex justify-content-between">
                    <a href="/profile" class="btn btn-secondary">キャンセル</a>
                    <button type="submit" class="btn btn-primary">申請を送信</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
