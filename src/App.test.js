import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./routes/RenderRouter', () => () => <div>App routes</div>);

test('renders app router content', () => {
  render(<App />);
  const content = screen.getByText(/app routes/i);
  expect(content).toBeInTheDocument();
});
