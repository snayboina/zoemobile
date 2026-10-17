import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  label = 'Quantidade *',
  value,
  min = 1,
  max,
  onChange,
}) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (max == null || value < max) {
      onChange(value + 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (isNaN(parsed)) {
      onChange(min);
    } else {
      let finalVal = Math.max(min, parsed);
      if (max != null) finalVal = Math.min(max, finalVal);
      onChange(finalVal);
    }
  };

  return (
    <div className="quantity-selector-container">
      {label && <label className="field-label">{label}</label>}
      <div className="quantity-controls">
        <button
          type="button"
          className="quantity-btn"
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label="Diminuir"
        >
          <Minus size={18} />
        </button>
        <input
          type="number"
          className="quantity-input"
          value={value}
          min={min}
          max={max}
          onChange={handleChange}
        />
        <button
          type="button"
          className="quantity-btn"
          onClick={handleIncrement}
          disabled={max != null && value >= max}
          aria-label="Aumentar"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};
