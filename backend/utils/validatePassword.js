// utils/validatePassword.js
function validatePassword(password) {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!regex.test(password)) {
    return {
      valid: false,
      message:
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
    };
  }

  return { valid: true };
}

module.exports = validatePassword;
