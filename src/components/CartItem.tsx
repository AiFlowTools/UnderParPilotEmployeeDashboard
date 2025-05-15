import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  note?: string;
  onNoteChange?: (id: string, note: string) => void;
}

export default function CartItem({
  id,
  name,
  price,
  quantity,
  onUpdateQuantity,
  onRemove,
  note,
  onNoteChange,
}: CartItemProps) {
  return (
    <div className="cart-item">
      <div className="cart-item-content">
        <h4 className="cart-item-title">{name}</h4>
        <p className="cart-item-price">${price.toFixed(2)} each</p>
        {onNoteChange && (
          <input
            type="text"
            placeholder="Add a note (e.g. no onions)"
            value={note || ''}
            onChange={(e) => onNoteChange(id, e.target.value)}
            className="cart-note-input"
          />
        )}
      </div>
      
      <div className="cart-item-controls">
        <button
          onClick={() => onUpdateQuantity(id, -1)}
          className="cart-quantity-button"
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <span className="w-8 text-center font-medium">
          {quantity}
        </span>
        
        <button
          onClick={() => onUpdateQuantity(id, 1)}
          className="cart-quantity-button"
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => onRemove(id)}
          className="cart-delete-button"
          aria-label="Remove item"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}