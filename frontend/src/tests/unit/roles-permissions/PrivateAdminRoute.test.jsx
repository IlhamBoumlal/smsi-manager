import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrivateAdminRoute from '../../../components/PrivateAdminRoute';
import { useAuth } from '../../../context/AuthContext';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

function renderAdminRolesRoute() {
  return render(
    <MemoryRouter initialEntries={['/admin/roles']}>
      <Routes>
        <Route
          path="/admin/roles"
          element={
            <PrivateAdminRoute allowedRoles={['Admin Societe']}>
              <div>Roles Page</div>
            </PrivateAdminRoute>
          }
        />
        <Route path="/tableau-bord" element={<div>Dashboard Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PrivateAdminRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('autorise Admin Societe', () => {
    useAuth.mockReturnValue({
      user: { role: 'Admin Societe' },
      isSuperAdmin: false
    });

    renderAdminRolesRoute();
    expect(screen.getByText('Roles Page')).toBeInTheDocument();
  });

  test('redirige Consultant vers tableau de bord', () => {
    useAuth.mockReturnValue({
      user: { role: 'Consultant' },
      isSuperAdmin: false
    });

    renderAdminRolesRoute();
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  test('redirige utilisateur non connecte vers login', () => {
    useAuth.mockReturnValue({
      user: null,
      isSuperAdmin: false
    });

    renderAdminRolesRoute();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});