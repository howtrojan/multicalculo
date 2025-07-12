import React from "react";

interface InputDateProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
}

const InputDate: React.FC<InputDateProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  required,
  disabled,
  min,
  max,
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={name} className="text-sm font-medium text-black">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type="date"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        className={`border text-gray-400 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200 ${
          error ? "border-red-400" : "border-gray-300"
        }`}
      />
      {error && <span className="text-xs text-red-600 mt-1">{error}</span>}
    </div>
  );
};

export default InputDate; 