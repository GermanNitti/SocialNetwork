import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { PreferencesProvider } from "./context/PreferencesContext.jsx";
import { LightboxProvider } from "./context/LightboxContext.jsx";

const queryClient = new QueryClient();

window.addEventListener('error', (event) => {
  console.group('🚨 GLOBAL ERROR - Uncaught error:');
  console.error('Message:', event.message);
  console.error('File:', event.filename);
  console.error('Line:', event.lineno);
  console.error('Column:', event.colno);
  console.error('Error object:', event.error);
  console.groupEnd();
});

window.addEventListener('unhandledrejection', (event) => {
  console.group('🚨 GLOBAL ERROR - Unhandled promise rejection:');
  console.error('Reason:', event.reason);
  console.error('Promise:', event.promise);
  console.groupEnd();
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('✅ App loaded successfully');
  console.log('📄 Current URL:', window.location.href);
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <PreferencesProvider>
            <LightboxProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </LightboxProvider>
          </PreferencesProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
