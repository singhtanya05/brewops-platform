import { render, screen } from '@testing-library/react';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { useCartStore } from '@/store/useCartStore';

// Mock Zustand Store
jest.mock('@/store/useCartStore', () => ({
  useCartStore: jest.fn(),
}));

describe('CartDrawer', () => {
  it('renders cart items and total correctly', () => {
    (useCartStore as unknown as jest.Mock).mockReturnValue({
      isCartOpen: true,
      items: [
        {
          id: '1',
          productId: 'prod1',
          variantId: 'var1',
          name: 'Cappuccino',
          price: 150,
          quantity: 2,
          customizations: 'Oat Milk'
        }
      ],
      toggleCart: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      getTotalPrice: () => 300,
      clearCart: jest.fn(),
      getSessionId: () => 'test-session',
    });

    render(<CartDrawer />);
    
    expect(screen.getByText('Cappuccino')).toBeInTheDocument();
    expect(screen.getByText('Note: Oat Milk')).toBeInTheDocument();
    expect(screen.getByText('$300.00')).toBeInTheDocument();
  });
});
