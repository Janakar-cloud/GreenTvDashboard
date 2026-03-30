import { CONFIG } from 'src/config-global';

import { CaseStoriesDashboard } from 'src/sections/caseStories/view';

export default function Page() {
  return (
    <>
      <title>{`Case Stories - ${CONFIG.appName}`}</title>
      <CaseStoriesDashboard />
    </>
  );
}
