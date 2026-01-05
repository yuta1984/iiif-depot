import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User, IIIFResource, Image, JobStatus } from '../../types';

interface ProgressPageProps {
  user: User;
  resource: IIIFResource;
  images: Image[];
  jobStatuses: JobStatus[];
}

export const ProgressPage: FC<ProgressPageProps> = ({ user, resource, images, jobStatuses }) => {
  const jobStatusMap = new Map(jobStatuses.map(js => [js.image_id, js]));
  const allCompleted = images.every(img => img.status === 'ready' || img.status === 'failed');

  return (
    <Layout title={`処理状況: ${resource.title}`} user={user}>
      <div class="container">
        <div class="row">
          <div class="col-md-8 mx-auto">
            <h1 class="mb-4">画像処理の進捗</h1>

            {!allCompleted && (
              <div class="alert alert-info">
                <strong>処理中:</strong> 画像を変換しています。このページは自動的に更新されます。
              </div>
            )}

            {allCompleted && (
              <div class="alert alert-success">
                <strong>完了:</strong> すべての画像処理が完了しました。
                <a href={`/resources/${resource.id}`} class="alert-link ms-2">
                  リソースページへ
                </a>
              </div>
            )}

            <div class="card">
              <div class="card-body">
                <h5 class="card-title">{resource.title}</h5>

                <div class="mt-4">
                  {images.map((image, index) => {
                    const jobStatus = jobStatusMap.get(image.id);
                    const progress = jobStatus?.progress || 0;

                    return (
                      <div class="mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <strong>#{index + 1}</strong> {image.original_filename}
                          </div>
                          <span class={`badge ${getImageStatusBadgeClass(image.status)}`}>
                            {getImageStatusText(image.status)}
                          </span>
                        </div>

                        {image.status === 'processing' && (
                          <div class="progress" style="height: 25px;">
                            <div
                              class="progress-bar progress-bar-striped progress-bar-animated"
                              role="progressbar"
                              style={`width: ${progress}%`}
                            >
                              {progress}%
                            </div>
                          </div>
                        )}

                        {image.status === 'ready' && (
                          <div class="progress" style="height: 25px;">
                            <div class="progress-bar bg-success" style="width: 100%">
                              完了
                            </div>
                          </div>
                        )}

                        {image.status === 'failed' && (
                          <div class="alert alert-danger mb-0">
                            エラー: {image.error_message || '処理に失敗しました'}
                          </div>
                        )}

                        {image.status === 'uploaded' && (
                          <div class="progress" style="height: 25px;">
                            <div
                              class="progress-bar bg-info progress-bar-striped progress-bar-animated"
                              style="width: 100%"
                            >
                              待機中...
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div class="mt-3 text-center">
              <a href={`/resources/${resource.id}`} class="btn btn-primary">
                リソースページへ戻る
              </a>
            </div>
          </div>
        </div>
      </div>

      {!allCompleted && (
        <script dangerouslySetInnerHTML={{__html: `
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        `}} />
      )}
    </Layout>
  );
};

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
    case 'ready': return '完了';
    case 'processing': return '処理中';
    case 'uploaded': return '待機中';
    case 'failed': return '失敗';
    default: return '不明';
  }
}
