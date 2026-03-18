"use client"
import { Suspense, lazy } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { ToastProvider } from "./contexts/ToastContext"
import Layout from "./components/Layout/Layout"
import LoadingSpinner from "./components/UI/LoadingSpinner"
import "./App.css"

const Login = lazy(() => import("./pages/Login"))
const Register = lazy(() => import("./pages/Register"))
const Landing = lazy(() => import("./pages/Landing"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const ChatbotBuilder = lazy(() => import("./pages/ChatbotBuilder"))
const ChatInterface = lazy(() => import("./pages/ChatInterface"))
const Analytics = lazy(() => import("./pages/Analytics"))
const AdCampaignBuilder = lazy(() => import("./pages/AdCampaignBuilder"))
const BusinessPrediction = lazy(() => import("./pages/BusinessPrediction"))

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return !isAuthenticated ? children : <Navigate to="/dashboard" />
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.08),_transparent_30%),linear-gradient(180deg,_#f5fbfa_0%,_#eef6fb_100%)]">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-slate-500">Loading workspace...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Suspense fallback={<RouteFallback />}>
            <div className="App">
              <Routes>
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <PublicRoute>
                      <Landing />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chatbots/new"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ChatbotBuilder />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chatbots/:chatbotId/edit"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ChatbotBuilder />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chatbots/:chatbotId/chat"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ChatInterface />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chatbots/:chatbotId/analytics"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Analytics />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/campaigns"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <AdCampaignBuilder />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/predictions"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <BusinessPrediction />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </Suspense>
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
