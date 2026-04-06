import { CONFIG } from 'src/config-global';

import UploadArticleView from 'src/sections/article/view/upload-article-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Upload Article - ${CONFIG.appName}`}</title>

      <UploadArticleView />
    </>
  );
}
