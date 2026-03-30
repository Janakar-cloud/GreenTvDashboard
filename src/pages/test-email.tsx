import { CONFIG } from 'src/config-global';

import { TestEmailCard } from 'src/sections/admin';

export default function Page() {
  return (
    <>
      <title>{`Test Email - ${CONFIG.appName}`}</title>
      <TestEmailCard />
    </>
  );
}
