import { FC } from 'hono/jsx';
import { User } from '../types';
import { FlashMessages } from '../components/flash-message';

interface LayoutProps {
  title?: string;
  user?: User;
  children: any;
  currentUrl?: string;
  activePage?: 'home' | 'browse' | 'resources' | 'resources-new' | 'admin';
}

export const Layout: FC<LayoutProps> = ({ title = 'IIIF Depot', user, children, currentUrl, activePage }) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} - IIIF Depot</title>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{__html: `
          body {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          main {
            flex: 1;
          }
          .navbar-brand {
            font-weight: bold;
          }
          .storage-indicator {
            font-size: 0.875rem;
          }
        `}} />
      </head>
      <body>
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
          <div class="container">
            <a class="navbar-brand" href="/">IIIF Depot</a>
            <button
              class="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
            >
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
              <ul class="navbar-nav me-auto">
                <li class="nav-item">
                  <a class={`nav-link ${activePage === 'home' ? 'active' : ''}`} href="/">ホーム</a>
                </li>
                {user && (
                  <>
                    <li class="nav-item">
                      <a class={`nav-link ${activePage === 'resources' ? 'active' : ''}`} href="/resources">マイIIIF画像</a>
                    </li>
                    <li class="nav-item">
                      <a class={`nav-link ${activePage === 'resources-new' ? 'active' : ''}`} href="/resources/new">🆕 新規作成</a>
                    </li>
                    {user.is_admin && (
                      <li class="nav-item">
                        <a class={`nav-link ${activePage === 'admin' ? 'active' : ''}`} href="/admin/users">管理画面</a>
                      </li>
                    )}
                  </>
                )}
              </ul>
              <ul class="navbar-nav">
                {user ? (
                  <>
                    <li class="nav-item dropdown">
                      <a
                        class="nav-link dropdown-toggle"
                        href="#"
                        id="userDropdown"
                        role="button"
                        data-bs-toggle="dropdown"
                      >
                        {user.avatar_url && (
                          <img
                            src={user.avatar_url}
                            alt={user.name}
                            width="24"
                            height="24"
                            class="rounded-circle me-2"
                          />
                        )}
                        {user.name}
                      </a>
                      <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                          <a class="dropdown-item" href="/profile">
                            プロフィール
                            <div class="storage-indicator text-muted">
                              {formatBytes(user.storage_used)} / {formatBytes(user.storage_quota)}
                            </div>
                          </a>
                        </li>
                        <li><hr class="dropdown-divider" /></li>
                        <li>
                          <form method="post" action="/auth/logout" class="d-inline">
                            <button type="submit" class="dropdown-item">ログアウト</button>
                          </form>
                        </li>
                      </ul>
                    </li>
                  </>
                ) : (
                  <li class="nav-item">
                    <a class="nav-link" href="/auth/login">ログイン</a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </nav>

        <main class="py-4">
          <div class="container">
            <FlashMessages url={currentUrl} />
          </div>
          {children}
        </main>

        <footer class="bg-light py-3 mt-auto">
          <div class="container text-center text-muted">
            <small>&copy; 2026 IIIF Depot. All rights reserved.</small>
          </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      </body>
    </html>
  );
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
