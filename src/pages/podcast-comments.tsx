import { CONFIG } from 'src/config-global';

import { PodcastCommentsDashboard } from 'src/sections/podcasts/view';

export default function Page() {
  return (
    <>
      <title>{`Podcast Comments - ${CONFIG.appName}`}</title>
      <PodcastCommentsDashboard />
    </>
  );
}
