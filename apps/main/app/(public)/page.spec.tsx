import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';
import React from 'react';

import HomePage from '@mediature/main/app/(public)/page';

describe.skip('HomePage', () => {
  it('renders', () => {
    render(<HomePage />);

    const heading = screen.getByRole('heading', {
      name: /Web/i,
    });

    expect(heading).toBeInTheDocument();
  });
});