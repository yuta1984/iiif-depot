import { Context, Next } from 'hono';

export async function requireAdmin(c: Context, next: Next): Promise<void | Response> {
  const user = c.get('user');

  if (!user) {
    return c.redirect('/auth/login');
  }

  if (!user.is_admin) {
    return c.html(
      <html>
        <head>
          <title>403 Forbidden</title>
          <style>{`
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .error { text-align: center; }
            h1 { color: #dc3545; }
          `}</style>
        </head>
        <body>
          <div class="error">
            <h1>403 Forbidden</h1>
            <p>管理者権限が必要です</p>
            <a href="/">ホームに戻る</a>
          </div>
        </body>
      </html>,
      403
    );
  }

  await next();
}
