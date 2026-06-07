import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "@notes/context/AuthContext";
import { ThemeProvider } from "@notes/context/ThemeContext";
import { SubscriptionProvider } from "@notes/context/SubscriptionContext";
import { ToastProvider } from "@notes/context/ToastContext";
import HomePage from "@notes/pages/home-page";
import LoginPage from "@notes/pages/login-page";
import RegisterPage from "@notes/pages/register-page";
import VerifyCodePage from "@notes/pages/verify-code-page";
import ForgotPasswordPage from "@notes/pages/forgot-password-page";
import ResetPasswordPage from "@notes/pages/reset-password-page";
import { PWAInstallPrompt } from "@notes/components/PWAInstallPrompt";
import "@notes/index.css";

export default function NotesTool() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <Routes>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="verify-code" element={<VerifyCodePage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
            </Routes>
            <PWAInstallPrompt />
          </SubscriptionProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
