import React from 'react';

const FormField = React.forwardRef(({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  required,
  options = [],
  rows = 3,
  className = '',
  helpText,
  ...rest
}, ref) => {
  const baseInputClass = `w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 outline-none
    ${error
      ? 'border-error bg-error/5 focus:ring-2 focus:ring-error/30'
      : 'border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20'
    } ${className}`;

  const renderInput = () => {
    if (type === 'select') {
      return (
        <select name={name} ref={ref} className={baseInputClass} {...rest}>
          <option value="">{placeholder || 'Select an option'}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          name={name}
          ref={ref}
          rows={rows}
          placeholder={placeholder}
          className={`${baseInputClass} resize-none`}
          {...rest}
        />
      );
    }

    return (
      <input
        type={type}
        name={name}
        ref={ref}
        placeholder={placeholder}
        className={baseInputClass}
        {...rest}
      />
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {helpText && !error && (
        <p className="text-xs text-text-secondary">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-error font-medium flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;
