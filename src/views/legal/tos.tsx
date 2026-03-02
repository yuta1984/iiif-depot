import { FC } from 'hono/jsx';
import { Layout } from '../layout';
import { User } from '../../types';

interface TosPageProps {
  user?: User;
}

export const TosPage: FC<TosPageProps> = ({ user }) => {
  return (
    <Layout title="利用規約" user={user}>
      <div class="container my-5">
        <div class="row">
          <div class="col-md-8 mx-auto">
            <h1 class="mb-5">IIIF Depot利用規約</h1>

            <section class="mb-5">
              <h2 class="h4 mb-3">運営者</h2>
              <p>みんなで翻刻（以下「運営者」）</p>
            </section>

            <section class="mb-5">
              <h2 class="h4 mb-3">お問い合わせ</h2>
              <p>
                <a href="mailto:support@honkoku.org">support@honkoku.org</a>
              </p>
            </section>

            <section class="mb-5">
              <h2 class="h4 mb-3">利用条件およびライセンスについて</h2>
              <ul>
                <li class="mb-2">
                  利用者は、本サービスに画像をアップロードするにあたり、当該画像について公開およびオープンライセンス付与を行う正当な権利を有していることを保証するものとします。
                </li>
                <li class="mb-2">
                  画像のアップロードにより、利用者は、アップロード時に選択したオープンライセンス条件のもとで、当該画像が公開されることに同意したものとみなします。
                </li>
                <li class="mb-2">
                  また、利用者は、運営者が本サービスの提供およびIIIF配信の目的に限り、当該画像を複製、変換、配信、公開することを無償で許諾するものとします。
                </li>
              </ul>
            </section>

            <section class="mb-5">
              <h2 class="h4 mb-3">禁止事項</h2>
              <p>第三者の権利（著作権、肖像権、プライバシー権等）を侵害する画像のアップロードを禁止します。</p>
            </section>

            <section class="mb-5">
              <h2 class="h4 mb-3">免責事項</h2>
              <ul>
                <li class="mb-2">
                  本サービスの利用により生じたいかなる損害についても、運営者は直接的・間接的を問わず一切の責任を負いません。
                </li>
                <li class="mb-2">
                  本サービスは、アップロードされた画像の永続的な保存や常時のアクセスを保証するものではありません。
                </li>
                <li class="mb-2">
                  運営者は、予告なく本サービスの内容変更または提供を終了することがあります。
                </li>
              </ul>
            </section>

            <div class="mt-5">
              <a href="/auth/login" class="btn btn-primary">ログインページに戻る</a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
