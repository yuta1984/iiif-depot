import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User, IIIFResource, Image } from '../../types';
import { CONFIG } from '../../config';

interface ResourceDetailProps {
  user: User;
  resource: IIIFResource;
  images: Image[];
  isOwner: boolean;
}

export const ResourceDetail: FC<ResourceDetailProps> = ({ user, resource, images, isOwner }) => {
  const manifestUrl = `${CONFIG.baseUrl}/iiif/manifests/${resource.id}/manifest.json`;
  const allImagesReady = images.every(img => img.status === 'ready');
  const hasProcessing = images.some(img => img.status === 'processing');
  const hasFailed = images.some(img => img.status === 'failed');

  return (
    <Layout title={resource.title} user={user}>
      <div class="container">
        <div class="row">
          <div class="col-md-8 mx-auto">
            <div class="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h1>{resource.title}</h1>
                <div class="mt-2">
                  <span class={`badge ${getStatusBadgeClass(resource.status)}`}>
                    {getStatusText(resource.status)}
                  </span>
                  <span class={`badge ${resource.visibility === 'public' ? 'bg-success' : 'bg-secondary'} ms-2`}>
                    {resource.visibility === 'public' ? '公開' : '非公開'}
                  </span>
                </div>
              </div>
              {isOwner && (
                <div>
                  <a href={`/resources/${resource.id}/edit`} class="btn btn-outline-primary me-2">
                    編集
                  </a>
                  <button
                    type="button"
                    class="btn btn-outline-danger"
                    data-bs-toggle="modal"
                    data-bs-target="#deleteModal"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>

            {hasProcessing && (
              <div class="alert alert-warning">
                <strong>処理中:</strong> 画像を変換しています。完了までしばらくお待ちください。
                <a href={`/resources/${resource.id}/progress`} class="alert-link ms-2">
                  進捗を見る
                </a>
              </div>
            )}

            {hasFailed && (
              <div class="alert alert-danger">
                <strong>エラー:</strong> 一部の画像の処理に失敗しました。
              </div>
            )}

            <div class="card mb-4">
              <div class="card-body">
                <h5 class="card-title">詳細情報</h5>

                {resource.description && (
                  <div class="mb-3">
                    <label class="text-muted small">説明</label>
                    <div>{resource.description}</div>
                  </div>
                )}

                {resource.attribution && (
                  <div class="mb-3">
                    <label class="text-muted small">帰属表示</label>
                    <div>{resource.attribution}</div>
                  </div>
                )}

                {resource.license && (
                  <div class="mb-3">
                    <label class="text-muted small">ライセンス</label>
                    <div>{resource.license}</div>
                  </div>
                )}

                <div class="mb-3">
                  <label class="text-muted small">作成日</label>
                  <div>{new Date(resource.created_at).toLocaleString('ja-JP')}</div>
                </div>

                <div class="mb-3">
                  <label class="text-muted small">更新日</label>
                  <div>{new Date(resource.updated_at).toLocaleString('ja-JP')}</div>
                </div>
              </div>
            </div>

            {allImagesReady && (
              <>
                <div class="card mb-4">
                  <div class="card-body">
                    <h5 class="card-title">IIIF ビューア</h5>
                    <iframe
                      src={`/resources/${resource.id}/viewer`}
                      style="width: 100%; height: 600px; border: none; display: block;"
                      allowfullscreen
                    ></iframe>
                  </div>
                </div>

                <div class="card mb-4">
                  <div class="card-body">
                    <h5 class="card-title">IIIF マニフェスト</h5>
                    <div class="input-group">
                      <input
                        type="text"
                        class="form-control"
                        value={manifestUrl}
                        readonly
                        id="manifestUrl"
                      />
                      <button
                        class="btn btn-outline-secondary"
                        type="button"
                        onclick={`navigator.clipboard.writeText('${manifestUrl}'); alert('コピーしました');`}
                      >
                        コピー
                      </button>
                    </div>
                    <div class="mt-2">
                      <a href={manifestUrl} class="btn btn-sm btn-outline-primary" target="_blank">
                        マニフェストを開く
                      </a>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div class="card">
              <div class="card-body">
                <h5 class="card-title">画像一覧 ({images.length})</h5>

                {images.length === 0 ? (
                  <p class="text-muted">画像がありません</p>
                ) : (
                  <div class="list-group">
                    {images.map((image, index) => (
                      <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>#{index + 1}</strong> {image.original_filename}
                            <div class="small text-muted">
                              {image.width && image.height && (
                                <span>{image.width} × {image.height}px, </span>
                              )}
                              {formatBytes(image.file_size)}
                            </div>
                          </div>
                          <div>
                            <span class={`badge ${getImageStatusBadgeClass(image.status)}`}>
                              {getImageStatusText(image.status)}
                            </span>
                          </div>
                        </div>
                        {image.error_message && (
                          <div class="alert alert-danger mt-2 mb-0">
                            {image.error_message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isOwner && (
        <div class="modal fade" id="deleteModal" tabIndex={-1}>
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">リソースの削除</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <p>本当に「{resource.title}」を削除しますか?</p>
                <p class="text-danger">この操作は取り消せません。</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                  キャンセル
                </button>
                <form method="post" action={`/resources/${resource.id}/delete`} class="d-inline">
                  <button type="submit" class="btn btn-danger">削除する</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'ready': return 'bg-success';
    case 'processing': return 'bg-warning';
    case 'failed': return 'bg-danger';
    default: return 'bg-secondary';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'ready': return '準備完了';
    case 'processing': return '処理中';
    case 'failed': return '失敗';
    default: return '不明';
  }
}

function getImageStatusBadgeClass(status: string): string {
  switch (status) {
    case 'ready': return 'bg-success';
    case 'processing': return 'bg-warning';
    case 'uploaded': return 'bg-info';
    case 'failed': return 'bg-danger';
    default: return 'bg-secondary';
  }
}

function getImageStatusText(status: string): string {
  switch (status) {
    case 'ready': return '準備完了';
    case 'processing': return '処理中';
    case 'uploaded': return 'アップロード済み';
    case 'failed': return '失敗';
    default: return '不明';
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
