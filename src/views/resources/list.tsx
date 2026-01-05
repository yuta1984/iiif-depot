import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User, IIIFResource, Image } from '../../types';
import { CONFIG } from '../../config';

interface ResourceWithThumbnail extends IIIFResource {
  thumbnail?: Image | null;
  imageCount: number;
}

interface ResourceListProps {
  user: User;
  resources: ResourceWithThumbnail[];
}

export const ResourceList: FC<ResourceListProps> = ({ user, resources }) => {
  const usedPercent = (user.storage_used / user.storage_quota) * 100;
  const remainingBytes = user.storage_quota - user.storage_used;

  return (
    <Layout title="マイIIIF画像" user={user} activePage="resources">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1>マイIIIF画像</h1>
          <a href="/resources/new" class="btn btn-primary">
            🆕 新規作成
          </a>
        </div>

        <div class="card mb-3">
          <div class="card-body">
            <h6 class="card-subtitle mb-2 text-muted">ストレージ使用状況</h6>
            <div class="progress" style="height: 20px;">
              <div
                class={`progress-bar ${usedPercent > 90 ? 'bg-danger' : usedPercent > 75 ? 'bg-warning' : 'bg-success'}`}
                style={`width: ${usedPercent}%`}
              >
                {usedPercent.toFixed(1)}%
              </div>
            </div>
            <small class="text-muted">
              使用量: {formatBytes(user.storage_used)} / {formatBytes(user.storage_quota)} (残り: {formatBytes(remainingBytes)})
            </small>
            {usedPercent > 80 && (
              <div class="mt-2">
                <a href="/quota/request" class="btn btn-sm btn-warning">
                  容量が不足しています - 増加を申請
                </a>
              </div>
            )}
          </div>
        </div>

        {resources.length === 0 ? (
          <div class="alert alert-info">
            <h4 class="alert-heading">IIIF画像がありません</h4>
            <p>まだIIIF画像を作成していません。</p>
            <hr />
            <a href="/resources/new" class="btn btn-primary">
              最初のIIIF画像を作成
            </a>
          </div>
        ) : (
          <>
            <div class="card mb-3">
              <div class="card-body">
                <div class="d-flex gap-2 align-items-center">
                  <button type="button" class="btn btn-sm btn-outline-secondary" id="select-all-btn">
                    すべて選択
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-secondary" id="deselect-all-btn">
                    選択解除
                  </button>
                  <div class="vr"></div>
                  <button type="button" class="btn btn-sm btn-primary" id="copy-selected-btn" disabled>
                    📋 選択中のURLをコピー
                  </button>
                  <small class="text-muted ms-2" id="selected-count">0件選択中</small>
                </div>
              </div>
            </div>

            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead class="table-light">
                  <tr>
                    <th style="width: 40px;">
                      <input type="checkbox" class="form-check-input" id="checkbox-all" />
                    </th>
                    <th style="width: 80px;">サムネイル</th>
                    <th>タイトル</th>
                    <th style="width: 100px;">画像枚数</th>
                    <th style="width: 100px;">ステータス</th>
                    <th style="width: 160px;">作成日時</th>
                    <th style="width: 280px;">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => {
                    const thumbnailFilename = resource.thumbnail?.ptiff_path?.split('/').pop() || `${resource.thumbnail?.id}.tif`;
                    const thumbnailUrl = resource.thumbnail && resource.status === 'ready'
                      ? `${CONFIG.cantaloupePublicUrl}/${encodeURIComponent(thumbnailFilename.replace(/\.tif$/, ''))}/full/!100,100/0/default.jpg`
                      : null;
                    const manifestUrl = `${CONFIG.baseUrl}/iiif/manifests/${resource.id}/manifest.json`;
                    const viewerUrl = `${CONFIG.baseUrl}/resources/${resource.id}`;

                    return (
                      <tr>
                        <td>
                          <input
                            type="checkbox"
                            class="form-check-input resource-checkbox"
                            data-manifest-url={manifestUrl}
                            data-resource-id={resource.id}
                          />
                        </td>
                        <td>
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={resource.title}
                              class="img-thumbnail"
                              style="width: 60px; height: 60px; object-fit: cover;"
                              onerror="this.style.display='none'"
                            />
                          ) : (
                            <div class="bg-light d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                              <small class="text-muted">🖼️</small>
                            </div>
                          )}
                        </td>
                        <td>
                          <a href={`/resources/${resource.id}`} class="text-decoration-none fw-semibold">
                            {resource.title}
                          </a>
                          {resource.description && (
                            <div>
                              <small class="text-muted">{truncate(resource.description, 60)}</small>
                            </div>
                          )}
                        </td>
                        <td>
                          <small>{resource.imageCount}コマ</small>
                        </td>
                        <td>
                          <span class={`badge ${getStatusBadgeClass(resource.status)}`}>
                            {getStatusText(resource.status)}
                          </span>
                        </td>
                        <td>
                          <small>{new Date(resource.created_at).toLocaleString('ja-JP', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</small>
                        </td>
                        <td>
                          <div class="btn-group btn-group-sm" role="group">
                            <button
                              type="button"
                              class="btn btn-outline-primary copy-url-btn"
                              data-manifest-url={manifestUrl}
                              title="IIIFマニフェストURLをコピー"
                            >
                              📋
                            </button>
                            <a
                              href={viewerUrl}
                              class="btn btn-outline-primary"
                              target="_blank"
                              title="ビューアで閲覧"
                            >
                              👁️
                            </a>
                            <a
                              href={`/resources/${resource.id}/edit`}
                              class="btn btn-outline-secondary"
                              title="編集"
                            >
                              ✏️
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        (function() {
          const checkboxAll = document.getElementById('checkbox-all');
          const resourceCheckboxes = document.querySelectorAll('.resource-checkbox');
          const selectAllBtn = document.getElementById('select-all-btn');
          const deselectAllBtn = document.getElementById('deselect-all-btn');
          const copySelectedBtn = document.getElementById('copy-selected-btn');
          const selectedCount = document.getElementById('selected-count');
          const copyUrlBtns = document.querySelectorAll('.copy-url-btn');

          function updateSelectedCount() {
            const checkedCount = document.querySelectorAll('.resource-checkbox:checked').length;
            selectedCount.textContent = checkedCount + '件選択中';
            copySelectedBtn.disabled = checkedCount === 0;

            if (checkedCount === 0) {
              checkboxAll.checked = false;
              checkboxAll.indeterminate = false;
            } else if (checkedCount === resourceCheckboxes.length) {
              checkboxAll.checked = true;
              checkboxAll.indeterminate = false;
            } else {
              checkboxAll.checked = false;
              checkboxAll.indeterminate = true;
            }
          }

          checkboxAll.addEventListener('change', function() {
            resourceCheckboxes.forEach(cb => cb.checked = this.checked);
            updateSelectedCount();
          });

          resourceCheckboxes.forEach(cb => {
            cb.addEventListener('change', updateSelectedCount);
          });

          selectAllBtn.addEventListener('click', function() {
            resourceCheckboxes.forEach(cb => cb.checked = true);
            updateSelectedCount();
          });

          deselectAllBtn.addEventListener('click', function() {
            resourceCheckboxes.forEach(cb => cb.checked = false);
            updateSelectedCount();
          });

          copySelectedBtn.addEventListener('click', function() {
            const selectedUrls = Array.from(document.querySelectorAll('.resource-checkbox:checked'))
              .map(cb => cb.dataset.manifestUrl)
              .join('\\n');

            if (selectedUrls) {
              navigator.clipboard.writeText(selectedUrls).then(() => {
                const count = selectedUrls.split('\\n').length;
                alert(count + '件のIIIF Manifest URLをコピーしました！');
              });
            }
          });

          copyUrlBtns.forEach(btn => {
            btn.addEventListener('click', function() {
              const url = this.dataset.manifestUrl;
              navigator.clipboard.writeText(url).then(() => {
                alert('IIIF Manifest URLをコピーしました！');
              });
            });
          });
        })();
      `}} />
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

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'ready':
      return 'bg-success';
    case 'processing':
      return 'bg-warning';
    case 'failed':
      return 'bg-danger';
    default:
      return 'bg-secondary';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'ready':
      return '準備完了';
    case 'processing':
      return '処理中';
    case 'failed':
      return '失敗';
    default:
      return '不明';
  }
}
