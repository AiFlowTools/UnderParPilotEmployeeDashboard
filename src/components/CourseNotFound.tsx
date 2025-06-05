import React from 'react';
import { Goal } from 'lucide-react';

export default function CourseNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <Goal className="w-16 h-16 text-gray-400 mb-4 mx-auto" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Not Found</h1>
        <p className="text-gray-600">The requested golf course could not be found.</p>
      </div>
    </div>
  );
}