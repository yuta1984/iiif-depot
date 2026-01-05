import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User } from '../../types';

interface ProfileEditProps {
  user: User;
  errors?: { [key: string]: string };
}

export const ProfileEdit: FC<ProfileEditProps> = ({ user, errors = {} }) => {
  return (
    <Layout title="プロフィール編集" user={user}>
      <div class="container">
        <div class="row">
          <div class="col-md-8 mx-auto">
            <h1 class="mb-4">プロフィール編集</h1>

            <div class="card">
              <div class="card-body">
                <form method="post" action="/profile/edit">
                  <div class="mb-3">
                    <label for="name" class="form-label">名前 *</label>
                    <input
                      type="text"
                      class={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      id="name"
                      name="name"
                      value={user.name}
                      required
                      maxLength={100}
                    />
                    {errors.name && (
                      <div class="invalid-feedback">{errors.name}</div>
                    )}
                  </div>

                  <div class="mb-3">
                    <label for="profile" class="form-label">プロフィール</label>
                    <textarea
                      class={`form-control ${errors.profile ? 'is-invalid' : ''}`}
                      id="profile"
                      name="profile"
                      rows={4}
                      maxLength={500}
                    >{user.profile || ''}</textarea>
                    {errors.profile && (
                      <div class="invalid-feedback">{errors.profile}</div>
                    )}
                    <div class="form-text">最大500文字</div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">メールアドレス</label>
                    <input
                      type="email"
                      class="form-control"
                      value={user.email}
                      disabled
                    />
                    <div class="form-text">メールアドレスは変更できません</div>
                  </div>

                  <div class="d-flex justify-content-between">
                    <a href="/profile" class="btn btn-secondary">キャンセル</a>
                    <button type="submit" class="btn btn-primary">保存</button>
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
