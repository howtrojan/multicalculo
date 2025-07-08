import React from "react";

interface Option {
  label: string;
  value: string;
}

interface InputSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  options: Option[];
}

const InputSelect: React.FC<InputSelectProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  required,
  disabled,
  options,
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={name} className="text-sm font-medium text-cyan-900">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        className={`border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white ${
          error ? "border-red-400" : "border-cyan-300"
        }`}
      >
        <option value="" disabled>
          Selecione...
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600 mt-1">{error}</span>}
    </div>
  );
};

export default InputSelect; 