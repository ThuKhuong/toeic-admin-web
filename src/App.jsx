import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Vocabulary from "./pages/Vocabulary";
import Tests from "./pages/Tests";
import Users from "./pages/Users";
import Questions from "./pages/Questions";
import Listening from "./pages/Listening";
import TestAttempts from "./pages/TestAttempts";
import "./App.css";

const ProtectedRoute = ({ children }) => {
  const token =
    localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");

  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ConfigProvider locale={viVN} theme={{ token: { colorPrimary: "#218577", colorInfo: "#218577", colorText: "#203b4b", colorTextSecondary: "#7c8d99", colorBgLayout: "#f3f6f8", colorBorder: "#dfe7ec", borderRadius: 8, controlHeight: 38, fontSize: 13, fontFamily: "Segoe UI, Arial, sans-serif" }, components: { Card: { borderRadiusLG: 12 }, Table: { cellPaddingBlock: 16 }, Menu: { darkItemBg: "#122b3b", darkItemSelectedBg: "#247e73", darkItemColor: "#b6c9d3" }, Tabs: { inkBarColor: "#218577" } } }}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="vocabulary" element={<Vocabulary />} />
            <Route path="tests" element={<Tests />} />
            <Route path="test-attempts" element={<TestAttempts />} />
            <Route path="questions" element={<Questions />} />
            <Route path="listening" element={<Listening />} />
            <Route path="users" element={<Users />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;

