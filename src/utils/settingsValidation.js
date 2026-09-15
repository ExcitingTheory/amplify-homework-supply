export function validatePasswordChange({
  oldPassword,
  newPassword,
  confirmNewPassword,
}) {
  if (!oldPassword || !newPassword || !confirmNewPassword) {
    return {
      isValid: false,
      message: "Please complete all password fields before submitting.",
    };
  }

  if (newPassword.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long.",
    };
  }

  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);

  if (!(hasLetter && hasNumber && hasSymbol)) {
    return {
      isValid: false,
      message: "Password must include letters, numbers, and symbols.",
    };
  }

  if (newPassword !== confirmNewPassword) {
    return {
      isValid: false,
      message: "New password and confirmation must match.",
    };
  }

  return { isValid: true, message: "" };
}

export function getSettingsErrorMessage(error) {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  const message = error.message || String(error);

  if (/Invalid password format|password.*format/i.test(message)) {
    return "Password must be at least 8 characters and include letters, numbers, and symbols.";
  }

  if (
    /CodeMismatchException|Invalid code provided|confirmation code/i.test(
      message,
    )
  ) {
    return "The confirmation code is incorrect. Please try again.";
  }

  if (/Incorrect username or password/i.test(message)) {
    return "Incorrect username or password.";
  }

  return message;
}
