import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User, IIIFResource } from '../../types';

interface ResourceEditProps {
  user: User;
  resource: IIIFResource;
  errors?: { [key: string]: string };
}

export const ResourceEdit: FC<ResourceEditProps> = ({ user, resource, errors = {} }) => {
  return (
    <Layout title={`編集: ${resource.title}`} user={user}>
      <div class="container">
        <div class="row">
          <div class="col-md-8 mx-auto">
            <h1 class="mb-4">メタデータ編集</h1>

            <div class="card">
              <div class="card-body">
                <form method="post" action={`/resources/${resource.id}`}>
                  <div class="mb-3">
                    <label for="title" class="form-label">タイトル *</label>
                    <input
                      type="text"
                      class={`form-control ${errors.title ? 'is-invalid' : ''}`}
                      id="title"
                      name="title"
                      value={resource.title}
                      required
                      maxLength={200}
                    />
                    {errors.title && (
                      <div class="invalid-feedback">{errors.title}</div>
                    )}
                  </div>

                  <div class="mb-3">
                    <label for="description" class="form-label">説明</label>
                    <textarea
                      class={`form-control ${errors.description ? 'is-invalid' : ''}`}
                      id="description"
                      name="description"
                      rows={4}
                      maxLength={2000}
                    >{resource.description || ''}</textarea>
                    {errors.description && (
                      <div class="invalid-feedback">{errors.description}</div>
                    )}
                  </div>

                  <div class="mb-3">
                    <label for="attribution" class="form-label">著作権者・出典</label>
                    <input
                      type="text"
                      class={`form-control ${errors.attribution ? 'is-invalid' : ''}`}
                      id="attribution"
                      name="attribution"
                      value={resource.attribution || ''}
                      maxLength={500}
                      placeholder="例: ©2026 山田太郎"
                    />
                    {errors.attribution && (
                      <div class="invalid-feedback">{errors.attribution}</div>
                    )}
                    <div class="form-text">
                      画像の著作権者や出典を記入してください
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="license" class="form-label">利用条件（ライセンス）</label>
                    <select
                      class={`form-select ${errors.license ? 'is-invalid' : ''}`}
                      id="license"
                      name="license"
                    >
                      <option value="" selected={!resource.license}>未指定</option>
                      <option value="https://creativecommons.org/licenses/by-sa/4.0/deed.ja" selected={resource.license === 'https://creativecommons.org/licenses/by-sa/4.0/deed.ja'}>
                        CC BY-SA 4.0（出典を示せば自由に利用OK）
                      </option>
                      <option value="https://creativecommons.org/licenses/by-nc/4.0/deed.ja" selected={resource.license === 'https://creativecommons.org/licenses/by-nc/4.0/deed.ja'}>
                        CC BY-NC 4.0（非営利なら自由に利用OK）
                      </option>
                      <option value="https://creativecommons.jp/sciencecommons/aboutcc0/" selected={resource.license === 'https://creativecommons.jp/sciencecommons/aboutcc0/'}>
                        CC0（完全に自由に利用OK）
                      </option>
                    </select>
                    {errors.license && (
                      <div class="invalid-feedback">{errors.license}</div>
                    )}
                    <div class="form-text">
                      他の人がこの画像を使う際の条件を設定できます
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="homepage" class="form-label">関連Webページ（任意）</label>
                    <input
                      type="url"
                      class={`form-control ${errors.homepage ? 'is-invalid' : ''}`}
                      id="homepage"
                      name="homepage"
                      value={resource.homepage || ''}
                      placeholder="https://example.com/"
                    />
                    {errors.homepage && (
                      <div class="invalid-feedback">{errors.homepage}</div>
                    )}
                    <div class="form-text">
                      関連するWebページがあれば記入してください
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="viewingDirection" class="form-label">閲覧方向</label>
                    <select
                      class="form-select"
                      id="viewingDirection"
                      name="viewingDirection"
                    >
                      <option value="left-to-right" selected={resource.viewing_direction === 'left-to-right'}>左から右（横書き）</option>
                      <option value="right-to-left" selected={resource.viewing_direction === 'right-to-left'}>右から左（漫画など）</option>
                      <option value="top-to-bottom" selected={resource.viewing_direction === 'top-to-bottom'}>上から下（縦書き）</option>
                    </select>
                    <div class="form-text">
                      複数の画像を見る際の順序を設定します
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">追加情報（任意）</label>
                    <div id="metadata-fields">
                      {resource.metadata && JSON.parse(resource.metadata).map((item: { label: string; value: string }, index: number) => (
                        <div class="row g-2 mb-2">
                          <div class="col-5">
                            <input
                              type="text"
                              class="form-control"
                              name={`metadata[${index}][label]`}
                              placeholder="ラベル"
                              value={item.label}
                            />
                          </div>
                          <div class="col-6">
                            <input
                              type="text"
                              class="form-control"
                              name={`metadata[${index}][value]`}
                              placeholder="値"
                              value={item.value}
                            />
                          </div>
                          <div class="col-1">
                            <button type="button" class="btn btn-outline-danger btn-sm w-100 remove-metadata">×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="add-metadata-btn">
                      ＋ 情報を追加
                    </button>
                    <div class="form-text">
                      その他の情報（年代、場所など）を追加できます
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="visibility" class="form-label">公開設定</label>
                    <select
                      class="form-select"
                      id="visibility"
                      name="visibility"
                    >
                      <option value="public" selected={resource.visibility === 'public'}>
                        公開
                      </option>
                      <option value="private" selected={resource.visibility === 'private'}>
                        非公開
                      </option>
                    </select>
                  </div>

                  <div class="d-flex justify-content-between">
                    <a href={`/resources/${resource.id}`} class="btn btn-secondary">
                      キャンセル
                    </a>
                    <button type="submit" class="btn btn-primary">保存</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        (function() {
          // Dynamic metadata fields
          let metadataIndex = ${resource.metadata ? JSON.parse(resource.metadata).length : 0};
          const addMetadataBtn = document.getElementById('add-metadata-btn');
          const metadataFields = document.getElementById('metadata-fields');

          // Add event listeners to existing remove buttons
          document.querySelectorAll('.remove-metadata').forEach(btn => {
            btn.addEventListener('click', function() {
              this.closest('.row').remove();
            });
          });

          addMetadataBtn.addEventListener('click', function() {
            const fieldGroup = document.createElement('div');
            fieldGroup.className = 'row g-2 mb-2';
            fieldGroup.innerHTML = \`
              <div class="col-5">
                <input
                  type="text"
                  class="form-control"
                  name="metadata[\${metadataIndex}][label]"
                  placeholder="ラベル"
                />
              </div>
              <div class="col-6">
                <input
                  type="text"
                  class="form-control"
                  name="metadata[\${metadataIndex}][value]"
                  placeholder="値"
                />
              </div>
              <div class="col-1">
                <button type="button" class="btn btn-outline-danger btn-sm w-100 remove-metadata">×</button>
              </div>
            \`;

            fieldGroup.querySelector('.remove-metadata').addEventListener('click', function() {
              fieldGroup.remove();
            });

            metadataFields.appendChild(fieldGroup);
            metadataIndex++;
          });
        })();
      `}} />
    </Layout>
  );
};
