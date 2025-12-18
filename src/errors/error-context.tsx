import { createContext, useContext, useState, ReactNode } from 'react';
import { ErrorModal } from '@/components/ui';

interface ErrorContextType {
  showError: (message: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);

  const showError = (message: string) => setError(message);
  const hideError = () => setError(null);

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      {error && <ErrorModal message={error} onClose={hideError} />}
    </ErrorContext.Provider>
  );
}

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) throw new Error("useError must be used within an ErrorProvider");
  return context;
};