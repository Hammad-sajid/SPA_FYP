import React, { useState } from 'react';

const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder = "Enter password", 
  className = "form-control",
  required = false,
  label = "Password",
  error = null
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="mb-3">
      <label className="mb-1">
        <strong>{label}</strong>
      </label>
      <div className="position-relative">
        <input
          type={showPassword ? "text" : "password"}
          className={className}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
        <button
          type="button"
          className="btn position-absolute"
          style={{
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "#6c757d",
            padding: "0",
            fontSize: "16px"
          }}
          onClick={togglePasswordVisibility}
        >
          {showPassword ? (
            <i className="fas fa-eye-slash"></i>
          ) : (
            <i className="fas fa-eye"></i>
          )}
        </button>
      </div>
      {error && <div className="text-danger fs-12">{error}</div>}
    </div>
  );
};

export default PasswordInput; 