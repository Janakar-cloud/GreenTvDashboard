import { CONFIG } from 'src/config-global';

import { AboutDashboard } from 'src/sections/about/view';

export default function Page() {
  return (
    <>
      <title>{`About Blocks - ${CONFIG.appName}`}</title>
      <AboutDashboard />
    </>
  );
}
