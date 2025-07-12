import React from "react";

interface InputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  placeholder?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  required,
  disabled,
  type = "text",
  min,
  max,
  step,
  placeholder,
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={name} className="text-sm font-medium text-black">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className={`border text-gray-400 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200 ${
          error ? "border-red-400" : "border-gray-300"
        }`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        autoComplete="off"
      />
      {error && (
        <span id={`${name}-error`} className="text-xs text-red-600 mt-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input; 