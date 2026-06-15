import { useCartStore } from './useCartStore';

describe('useCartStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    useCartStore.getState().clearCart();
    useCartStore.setState({ isCartOpen: false });
  });

  it('should initialize with empty cart', () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.isCartOpen).toBe(false);
    expect(state.sessionId).toBeNull();
  });

  it('should generate a sessionId if none exists', () => {
    const sessionId = useCartStore.getState().getSessionId();
    expect(sessionId).toBeDefined();
    expect(sessionId.startsWith('web-')).toBe(true);
    expect(useCartStore.getState().sessionId).toBe(sessionId);
  });

  it('should add a new item and open cart', () => {
    const newItem = {
      id: 'var-1',
      productId: 'prod-1',
      variantId: 'var-1',
      name: 'Coffee',
      price: 4.5,
      quantity: 1,
    };

    useCartStore.getState().addItem(newItem);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual(newItem);
    expect(state.isCartOpen).toBe(true);
  });

  it('should increment quantity if adding an existing item', () => {
    const item = {
      id: 'var-1',
      productId: 'prod-1',
      variantId: 'var-1',
      name: 'Coffee',
      price: 4.5,
      quantity: 1,
    };

    useCartStore.getState().addItem(item);
    useCartStore.getState().addItem({ ...item, quantity: 2 });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(3);
  });

  it('should remove an item', () => {
    const item = {
      id: 'var-1',
      productId: 'prod-1',
      variantId: 'var-1',
      name: 'Coffee',
      price: 4.5,
      quantity: 1,
    };

    useCartStore.getState().addItem(item);
    useCartStore.getState().removeItem('var-1');

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
  });

  it('should update item quantity', () => {
    const item = {
      id: 'var-1',
      productId: 'prod-1',
      variantId: 'var-1',
      name: 'Coffee',
      price: 4.5,
      quantity: 1,
    };

    useCartStore.getState().addItem(item);
    useCartStore.getState().updateQuantity('var-1', 5);

    const state = useCartStore.getState();
    expect(state.items[0].quantity).toBe(5);
  });

  it('should remove item when quantity is updated to 0', () => {
    const item = {
      id: 'var-1',
      productId: 'prod-1',
      variantId: 'var-1',
      name: 'Coffee',
      price: 4.5,
      quantity: 1,
    };

    useCartStore.getState().addItem(item);
    useCartStore.getState().updateQuantity('var-1', 0);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
  });

  it('should calculate total price and items', () => {
    useCartStore.getState().addItem({
      id: 'var-1',
      productId: 'prod-1',
      variantId: 'var-1',
      name: 'Coffee',
      price: 4.5,
      quantity: 2,
    });
    
    useCartStore.getState().addItem({
      id: 'var-2',
      productId: 'prod-2',
      variantId: 'var-2',
      name: 'Tea',
      price: 3.0,
      quantity: 1,
    });

    const state = useCartStore.getState();
    expect(state.getTotalItems()).toBe(3); // 2 + 1
    expect(state.getTotalPrice()).toBe(12.0); // (4.5 * 2) + (3.0 * 1)
  });

  it('should toggle cart open state', () => {
    useCartStore.getState().toggleCart();
    expect(useCartStore.getState().isCartOpen).toBe(true);

    useCartStore.getState().toggleCart();
    expect(useCartStore.getState().isCartOpen).toBe(false);
  });
});
