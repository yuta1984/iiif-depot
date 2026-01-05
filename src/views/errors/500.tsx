import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User } from '../../types';

interface ErrorPageProps {
  user?: User;
  error?: string;
  isDevelopment?: boolean;
}

export const ErrorPage: FC<ErrorPageProps> = ({ user, error, isDevelopment = false }) => {
  return (
    <Layout title="500 Internal Server Error" user={user}>
      <div class="container">
        <div class="row">
          <div class="col-md-8 mx-auto text-center" style="margin-top: 100px;">
            <h1 class="display-1 text-danger">500</h1>
            <h2 class="mb-4">サーバーエラー</h2>
            <p class="text-muted mb-4">
              申し訳ございません。サーバーでエラーが発生しました。
              <br />
              しばらく時間をおいてから再度お試しください。
            </p>
            {isDevelopment && error && (
              <div class="alert alert-danger text-start mb-4">
                <strong>開発環境エラー情報:</strong>
                <pre class="mt-2 mb-0" style="white-space: pre-wrap; word-break: break-all;">
                  {error}
                </pre>
              </div>
            )}
            <div>
              <a href="/" class="btn btn-primary">
                ホームに戻る
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
