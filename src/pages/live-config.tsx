import { CONFIG } from 'src/config-global';

import { LiveConfigDashboard } from 'src/sections/live/view';

export default function Page() {
  return (
    <>
      <title>{`Live Config - ${CONFIG.appName}`}</title>
      <LiveConfigDashboard />
    </>
  );
}
