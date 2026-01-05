import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User } from '../../types';

interface ResourceNewProps {
  user: User;
  errors?: { [key: string]: string };
}

export const ResourceNew: FC<ResourceNewProps> = ({ user, errors = {} }) => {
  const usedPercent = (user.storage_used / user.storage_quota) * 100;
  const remainingBytes = user.storage_quota - user.storage_used;

  return (
    <Layout title="新規作成" user={user}>
      <div class="container">
        <div class="row">
          <div class="col-md-8 mx-auto">
            <h1 class="mb-4">IIIF画像の作成</h1>
            <p class="text-muted mb-4">
              複数の画像をまとめて1つのIIIF画像として公開できます
            </p>

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
                  残り容量: {formatBytes(remainingBytes)}
                </small>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <form method="post" action="/resources" enctype="multipart/form-data">
                  <div class="mb-3">
                    <label for="title" class="form-label">タイトル *</label>
                    <input
                      type="text"
                      class={`form-control ${errors.title ? 'is-invalid' : ''}`}
                      id="title"
                      name="title"
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
                    ></textarea>
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
                      <option value="">未指定</option>
                      <option value="https://creativecommons.org/licenses/by-sa/4.0/deed.ja">
                        CC BY-SA 4.0（出典を示せば自由に利用OK）
                      </option>
                      <option value="https://creativecommons.org/licenses/by-nc/4.0/deed.ja">
                        CC BY-NC 4.0（非営利なら自由に利用OK）
                      </option>
                      <option value="https://creativecommons.jp/sciencecommons/aboutcc0/">
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
                      <option value="left-to-right" selected>左から右（横書き）</option>
                      <option value="right-to-left">右から左（漫画など）</option>
                      <option value="top-to-bottom">上から下（縦書き）</option>
                    </select>
                    <div class="form-text">
                      複数の画像を見る際の順序を設定します
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">追加情報（任意）</label>
                    <div id="metadata-fields">
                      {/* 動的に追加されるフィールド */}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="add-metadata-btn">
                      ＋ 情報を追加
                    </button>
                    <div class="form-text">
                      その他の情報（年代、場所など）を追加できます
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="images" class="form-label">画像ファイル *</label>
                    <input
                      type="file"
                      class={`form-control ${errors.images ? 'is-invalid' : ''}`}
                      id="images"
                      name="images[]"
                      accept="image/jpeg,image/jpg,image/png,image/tiff"
                      multiple
                      required
                    />
                    {errors.images && (
                      <div class="invalid-feedback">{errors.images}</div>
                    )}
                    <div class="form-text">
                      対応形式: JPEG, PNG, TIFF (複数選択可能)
                    </div>
                  </div>

                  {/* Image Previews */}
                  <div id="image-previews" class="row g-2 mb-3"></div>

                  <div class="d-flex justify-content-between">
                    <a href="/resources" class="btn btn-secondary">キャンセル</a>
                    <button type="submit" class="btn btn-primary" id="submit-btn">アップロード</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        (function() {
          const fileInput = document.getElementById('images');
          const previewContainer = document.getElementById('image-previews');
          const submitBtn = document.getElementById('submit-btn');
          let selectedFiles = new DataTransfer();

          fileInput.addEventListener('change', function(e) {
            // Clear previous previews
            previewContainer.innerHTML = '';

            // Reset selectedFiles
            selectedFiles = new DataTransfer();

            const files = Array.from(e.target.files);

            files.forEach(file => {
              if (!file.type.startsWith('image/')) return;

              // Add to DataTransfer
              selectedFiles.items.add(file);

              // Create preview
              const reader = new FileReader();
              reader.onload = function(event) {
                const col = document.createElement('div');
                col.className = 'col-md-3 col-sm-4 col-6';

                const card = document.createElement('div');
                card.className = 'card';

                const img = document.createElement('img');
                img.src = event.target.result;
                img.className = 'card-img-top';
                img.style.height = '150px';
                img.style.objectFit = 'cover';

                const cardBody = document.createElement('div');
                cardBody.className = 'card-body p-2';

                const fileName = document.createElement('small');
                fileName.className = 'd-block text-truncate mb-1';
                fileName.textContent = file.name;

                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.className = 'btn btn-sm btn-danger w-100';
                deleteBtn.textContent = '削除';
                deleteBtn.onclick = function() {
                  removeFile(file);
                  col.remove();
                };

                cardBody.appendChild(fileName);
                cardBody.appendChild(deleteBtn);
                card.appendChild(img);
                card.appendChild(cardBody);
                col.appendChild(card);
                previewContainer.appendChild(col);
              };
              reader.readAsDataURL(file);
            });

            // Update file input
            fileInput.files = selectedFiles.files;
          });

          function removeFile(fileToRemove) {
            const dt = new DataTransfer();
            for (let i = 0; i < selectedFiles.files.length; i++) {
              const file = selectedFiles.files[i];
              if (file !== fileToRemove) {
                dt.items.add(file);
              }
            }
            selectedFiles = dt;
            fileInput.files = selectedFiles.files;

            // Disable submit if no files
            if (selectedFiles.files.length === 0) {
              submitBtn.disabled = true;
            }
          }

          // Dynamic metadata fields
          let metadataIndex = 0;
          const addMetadataBtn = document.getElementById('add-metadata-btn');
          const metadataFields = document.getElementById('metadata-fields');

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
