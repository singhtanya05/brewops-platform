import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomizationModal } from './CustomizationModal';
import { useCartStore } from '@/store/useCartStore';

// Mock product
const mockProduct = {
  productId: 'prod-1',
  name: 'Latte',
  slug: 'latte',
  description: 'A nice latte',
  imageUrl: '/latte.jpg',
  variants: [
    {
      variantId: 'var-1',
      name: 'Regular',
      sku: 'LATTE-REG',
      price: 4.0,
      currency: 'USD',
      availableQuantity: 10,
    }
  ]
};

describe('CustomizationModal', () => {
  let onCloseMock: jest.Mock;

  beforeEach(() => {
    onCloseMock = jest.fn();
    useCartStore.getState().clearCart();
  });

  it('renders product name and base price', () => {
    render(
      <CustomizationModal 
        product={mockProduct} 
        categoryName="Coffee" 
        onClose={onCloseMock} 
      />
    );

    expect(screen.getByText('Latte')).toBeInTheDocument();
    expect(screen.getByText('$4.00 Base Price')).toBeInTheDocument();
  });

  it('shows coffee options when category is Coffee', () => {
    render(
      <CustomizationModal 
        product={mockProduct} 
        categoryName="Coffee" 
        onClose={onCloseMock} 
      />
    );

    expect(screen.getByText('Milk Choice')).toBeInTheDocument();
    expect(screen.getByText('Sweetness')).toBeInTheDocument();
  });

  it('hides coffee options when category is Pastry', () => {
    render(
      <CustomizationModal 
        product={mockProduct} 
        categoryName="Pastry" 
        onClose={onCloseMock} 
      />
    );

    expect(screen.queryByText('Milk Choice')).not.toBeInTheDocument();
    expect(screen.queryByText('Sweetness')).not.toBeInTheDocument();
  });

  it('increases total price when non-dairy milk is selected', () => {
    render(
      <CustomizationModal 
        product={mockProduct} 
        categoryName="Coffee" 
        onClose={onCloseMock} 
      />
    );

    const button = screen.getByRole('button', { name: /Add to Order/ });
    expect(button).toHaveTextContent('$4.00');

    fireEvent.click(screen.getByLabelText(/Oat Milk/));
    
    // Oat milk adds $0.50
    expect(button).toHaveTextContent('$4.50');
  });

  it('updates quantity and multiplies total', () => {
    render(
      <CustomizationModal 
        product={mockProduct} 
        categoryName="Pastry" 
        onClose={onCloseMock} 
      />
    );

    const button = screen.getByRole('button', { name: /Add to Order/ });
    expect(button).toHaveTextContent('$4.00');

    fireEvent.click(screen.getByRole('button', { name: '+' }));
    
    // Quantity 2
    expect(button).toHaveTextContent('$8.00');
  });

  it('adds item to cart with customizations and calls onClose', () => {
    render(
      <CustomizationModal 
        product={mockProduct} 
        categoryName="Coffee" 
        onClose={onCloseMock} 
      />
    );

    fireEvent.click(screen.getByLabelText(/Oat Milk/));
    fireEvent.click(screen.getByLabelText('Less Sweet'));
    fireEvent.change(screen.getByPlaceholderText('Any other specific requests?'), {
      target: { value: 'Extra hot' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Add to Order/ }));

    const cartItems = useCartStore.getState().items;
    expect(cartItems).toHaveLength(1);
    expect(cartItems[0]).toEqual(expect.objectContaining({
      productId: 'prod-1',
      variantId: 'var-1',
      name: 'Latte',
      price: 4.5, // 4.0 + 0.5 for Oat milk
      quantity: 1,
      customizations: 'Oat Milk, Less Sweet Sweetness | Extra hot'
    }));

    expect(onCloseMock).toHaveBeenCalled();
  });
});
