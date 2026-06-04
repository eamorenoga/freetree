import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Admin from "./pages/Admin";
import BuyTree from "./pages/BuyTree";
import CarbonFootprint from "./pages/CarbonFootprint";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MyTrees from "./pages/MyTrees";
import Profile from "./pages/Profile";
import PublicTree from "./pages/PublicTree";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Tracking from "./pages/Tracking";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/tree/public/:qrCode" element={<PublicTree />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="comprar-arbol" element={<BuyTree />} />
            <Route path="mis-arboles" element={<MyTrees />} />
            <Route path="seguimiento" element={<Tracking />} />
            <Route path="huella-carbono" element={<CarbonFootprint />} />
            <Route path="perfil" element={<Profile />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
