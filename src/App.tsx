import { Routes, Route, Navigate } from "react-router-dom";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import Menu from "./pages/Menu";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<EmployeeDashboard />}>
          <Route index element={<Home />} />
          <Route path="orders" element={<Orders />} />
          <Route path="menu" element={<Menu />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}
