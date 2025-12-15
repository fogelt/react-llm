import React, { Suspense } from 'react';

const LazyChatLayout = React.lazy(() => import('@/components/layouts/chat-layout'));

function App() {
  return (
    <Suspense
      fallback={
        <div style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          Loading Application...
        </div>
      }
    >
      <LazyChatLayout />
    </Suspense>
  );
}

export default App;