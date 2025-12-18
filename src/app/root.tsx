import React, { Suspense } from 'react';
import { ErrorProvider } from '@/errors/error-context';

const LazyChatLayout = React.lazy(() => import('@/components/layouts/chat-layout'));

function App() {
  return (
    <ErrorProvider>
      <Suspense
        fallback={
          <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            backgroundColor: '#111'
          }}>
            Loading Application...
          </div>
        }
      >
        <LazyChatLayout />
      </Suspense>
    </ErrorProvider>
  );
}

export default App;