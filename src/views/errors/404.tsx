import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User } from '../../types';

interface NotFoundPageProps {
  user?: User;
  path?: string;
}

export const NotFoundPage: FC<NotFoundPageProps> = ({ user, path }) => {
  return (
    <Layout title="404 Not Found" user={user}>
      <div class="container">
        <div class="row">
          <div class="col-md-6 mx-auto text-center" style="margin-top: 100px;">
            <h1 class="display-1 text-muted">404</h1>
            <h2 class="mb-4">ページが見つかりません</h2>
            <p class="text-muted mb-4">
              お探しのページは存在しないか、移動した可能性があります。
            </p>
            {path && (
              <p class="text-muted small mb-4">
                <code>{path}</code>
              </p>
            )}
            <div>
              <a href="/" class="btn btn-primary me-2">
                ホームに戻る
              </a>
              {user && (
                <a href="/resources" class="btn btn-outline-primary">
                  マイリソース
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
