import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { ToastProvider } from "./context/ToastContext";
import HomePage from "./pages/home-page";
import LoginPage from "./pages/login-page";
import RegisterPage from "./pages/register-page";
import VerifyCodePage from "./pages/verify-code-page";
import ForgotPasswordPage from "./pages/forgot-password-page";
import ResetPasswordPage from "./pages/reset-password-page";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <Router>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-code" element={<VerifyCodePage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Routes>
              <PWAInstallPrompt />
            </Router>
          </SubscriptionProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
