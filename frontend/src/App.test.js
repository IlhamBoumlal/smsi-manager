import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';

function renderWithProviders(initialRoute = '/') {
  return render(
    <MemoryRouter
      initialEntries={[initialRoute]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}

test('renders login page route', () => {
  renderWithProviders('/login');
  expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument();
});
