import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CourseProvider, useCourse } from './contexts/CourseContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Menu from './pages/Menu';
import CourseNotFound from './components/CourseNotFound';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const { currentCourse, loading, error } = useCourse();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !currentCourse) {
    return <CourseNotFound />;
  }

  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <CourseProvider>
      <AppContent />
    </CourseProvider>
  );
}

export default App;