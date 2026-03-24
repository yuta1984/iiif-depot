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
              <h2 class="h4 mb-3">1. 運営者</h2>
              <p>本サービスは、みんなで翻刻（以下「運営者」）が運営します。</p>
            </section>

            <section class="mb-5">
              <h2 class="h4 mb-3">2. お問い合わせ</h2>
              <p>
                <a href="mailto:support@honkoku.org">support@honkoku.org</a>
              </p>
            </section>

            <section class="mb-5">
              <h2 class="h4 mb-3">3. 本サービスの内容</h2>
              <p>本サービスは、利用者がアップロードした画像をIIIF（International Image Interoperability Framework）形式で公開し、共有および活用を可能にするサービスです。</p>
              <p>本サービスは、アップロードされた画像の一時的なIIIF公開とその活用を目的としたものであり、永続的な保存や常時のアクセスを保証するものではありません。</p>
            </section>

            <section class="mb-5">
              <h2 class="h4 mb-3">4. 利用条件およびライセンス</h2>
              <ul>
                <li class="mb-2">利用者は、本サービスに画像をアップロードするにあたり、当該画像について公開およびオープンライセンス付与を行う正当な権利を有していることを保証するものとします。</li>
                <li class="mb-2">利用者は、画像のアップロードにより、アップロード時に選択したオープンライセンス条件のもとで当該画像が公開されることに同意したものとみなします。</li>
                <li class="mb-2">利用者は、運営者に対し、本サービスの提供、改善および研究開発の目的に限り、当該画像を無償で複製、変換、配信および公開する非独占的な権利を許諾するものとします。</li>
                <li class="mb-2">本サービスで利用可能なオープンライセンスの種類は、運営者が別途定めるものとします。</li>
              </ul>
            </section>

            <section class="mb-5">
              <h2 class="h4 mb-3">5. 禁止事項</h2>
              <p>利用者は、以下の行為を行ってはなりません。</p>
              <ul>
                <li class="mb-2">第三者の権利（著作権、肖像権、プライバシー権その他の権利）を侵害する画像のアップロード</li>
                <li class="mb-2">法令または公序良俗に違反する行為</li>
                <li class="mb-2">本サービスの運営を妨害する行為</li>
                <li class="mb-2">その他、運営者が不適切と判断する行為</li>
              </ul>
            </section>

            <section class="mb-5">
              <h2 class="h4 mb-3">6. コンテンツの削除等</h2>
              <p>運営者は、利用者が本規約に違反した場合、または不適切と判断した場合には、事前の通知なく、当該コンテンツの削除、公開停止、または利用制限等の措置を講じることができます。</p>
            </section>

            <section class="mb-5">
              <h2 class="h4 mb-3">7. 免責事項</h2>
              <ul>
                <li class="mb-2">運営者は、本サービスの利用により利用者または第三者に生じた損害について、運営者の故意または重過失による場合を除き、一切の責任を負いません。</li>
                <li class="mb-2">運営者は、本サービスの内容の正確性、完全性、有用性等について保証しません。</li>
                <li class="mb-2">運営者は、予告なく本サービスの内容変更または提供の中断・終了を行うことがあります。</li>
              </ul>
            </section>

            <section class="mb-5">
              <h2 class="h4 mb-3">8. 規約の変更</h2>
              <p>運営者は、必要と判断した場合には、利用者に通知することなく本規約を変更することができます。変更後の規約は、本サービス上に掲載された時点で効力を生じるものとします。</p>
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
