import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiClient } from "../utils/api";
import { useAuth } from "../hooks/use-auth";

const VerifyCodePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const email = location.state?.email || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate("/notes/register");
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

    setIsLoading(true);

    try {
      const response = await apiClient.auth.verifyEmail({
        email,
        code: verificationCode,
      });

      if (response.success) {
        await checkAuth();
        navigate("/notes");
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await apiClient.auth.resendCode(email);
      if (response.success) {
        setSuccessMessage("A new verification code has been sent to your email");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setResendTimer(60); // Set 60 second timer
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
    navigate("/notes/register", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--text-primary)]">NoteMD</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Verify your email</p>
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

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 mb-6">
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

            <button
              type="submit"
              disabled={isLoading || code.join("").length !== 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Verify Email"}
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
        </div>
      </div>
    </div>
  );
};

export default VerifyCodePage;
