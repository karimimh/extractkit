import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { apiClient } from "../utils/api";

const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState<string>("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate("/notes/forgot-password");
    }
  }, [email, navigate]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const checkPasswordStrength = (password: string): string => {
    if (password.length === 0) return "";
    if (password.length < 8) return "weak";

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 1) return "weak";
    if (strength <= 2) return "medium";
    return "strong";
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const verificationCode = code.join("");
    if (verificationCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.auth.resetPassword(email, verificationCode, newPassword);

      if (response.success) {
        setSuccessMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/notes/login");
        }, 2000);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Password reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await apiClient.auth.forgotPassword(email);
      if (response.success) {
        setSuccessMessage("A new verification code has been sent to your email");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setResendTimer(60);
      } else {
        if (response.wait_time) {
          setResendTimer(response.wait_time);
          setError(`Please wait ${response.wait_time} seconds before requesting another code.`);
        } else {
          setError(response.message);
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  const handleGoBack = () => {
    navigate("/notes/forgot-password", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--text-primary)]">NoteMD</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Reset your password</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="sm:bg-[var(--bg-secondary)] py-8 px-4 sm:shadow sm:rounded-lg sm:px-10">
          <div className="mb-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              We've sent a 6-digit verification code to
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{email}</p>
            <button
              type="button"
              onClick={handleGoBack}
              className="mt-2 text-xs text-blue-600 hover:text-blue-500 underline"
            >
              Change email address
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Verification Code
              </label>
              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-[var(--text-secondary)]"
              >
                New Password
              </label>
              <div className="mt-1">
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    setPasswordStrength(checkPasswordStrength(e.target.value));
                  }}
                  className="appearance-none block w-full px-3 py-2 border border-[var(--border-primary)] rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  placeholder="Enter new password"
                />
              </div>
              {newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    <div
                      className={`h-1 flex-1 rounded ${
                        passwordStrength === "weak"
                          ? "bg-red-500"
                          : passwordStrength === "medium"
                          ? "bg-yellow-500"
                          : passwordStrength === "strong"
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded ${
                        passwordStrength === "medium"
                          ? "bg-yellow-500"
                          : passwordStrength === "strong"
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded ${
                        passwordStrength === "strong" ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    Password strength:{" "}
                    <span
                      className={
                        passwordStrength === "weak"
                          ? "text-red-600"
                          : passwordStrength === "medium"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }
                    >
                      {passwordStrength}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[var(--text-secondary)]"
              >
                Confirm New Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-[var(--border-primary)] rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || code.join("").length !== 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-[var(--text-tertiary)]">
              Didn't receive the code?{" "}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50"
                onClick={handleResendCode}
                disabled={isResending || resendTimer > 0}
              >
                {isResending
                  ? "Sending..."
                  : resendTimer > 0
                  ? `Resend (${resendTimer}s)`
                  : "Resend"}
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/notes/login" className="text-sm text-blue-600 hover:text-blue-500">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
