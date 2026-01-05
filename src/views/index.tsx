import { FC } from 'hono/jsx';
import { Layout } from './layout';
import { User } from '../types';

interface HomePageProps {
  user?: User;
}

export const HomePage: FC<HomePageProps> = ({ user }) => {
  return (
    <Layout title="ホーム" user={user} activePage="home">
      <div class="container">
        <div class="row">
          <div class="col-md-8 mx-auto">
            <div class="text-center mb-5">
              <h1 class="display-4 mb-3">IIIF Depot</h1>
              <p class="lead text-muted">
                高解像度画像を簡単に公開・共有できるサービス
              </p>
              {!user && (
                <a href="/auth/login" class="btn btn-primary btn-lg mt-3">
                  今すぐ始める
                </a>
              )}
            </div>

            <div class="row mb-5">
              <div class="col-md-4 mb-3">
                <div class="card h-100">
                  <div class="card-body text-center">
                    <h5 class="card-title">📤 簡単アップロード</h5>
                    <p class="card-text text-muted">
                      画像をアップロードするだけで自動処理。複数の画像をまとめて公開できます
                    </p>
                  </div>
                </div>
              </div>
              <div class="col-md-4 mb-3">
                <div class="card h-100">
                  <div class="card-body text-center">
                    <h5 class="card-title">🔍 高画質ズーム</h5>
                    <p class="card-text text-muted">
                      大きな画像も軽快に表示。拡大しても鮮明な画質を保ちます
                    </p>
                  </div>
                </div>
              </div>
              <div class="col-md-4 mb-3">
                <div class="card h-100">
                  <div class="card-body text-center">
                    <h5 class="card-title">🌐 簡単共有</h5>
                    <p class="card-text text-muted">
                      URLを共有するだけで誰でも閲覧可能。世界中の画像ビューアで表示できます
                    </p>
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
