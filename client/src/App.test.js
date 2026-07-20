import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn((url) =>
    Promise.resolve({
      ok: true,
      headers: {
        get: () => 'application/json',
      },
      json: async () => {
        if (url.includes('/sectors')) return [];
        if (url.includes('/configurations')) return [];
        if (url.includes('/history')) return [];
        return [];
      },
    })
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders the irrigation dashboard title', () => {
  render(<App />);
  const heading = screen.getByText(/sistema de riego/i);
  expect(heading).toBeInTheDocument();
});

test('shows onboarding for first-time setup when no sectors exist', async () => {
  render(<App />);
  expect(await screen.findByText(/crea tu primer sector/i)).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: /configuración/i })).toBeInTheDocument();
});

test('hides the main irrigation toggle when no sectors exist', async () => {
  render(<App />);
  expect(await screen.findByText(/crea tu primer sector/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /encender riego|apagar riego/i })).not.toBeInTheDocument();
});
