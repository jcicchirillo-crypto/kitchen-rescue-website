import React from "react";
import AdminUnavailableDatesPanel from "../components/AdminUnavailableDatesPanel";

// Check environment variable to show admin panel
// In Vite, environment variables must be prefixed with VITE_ and accessed via import.meta.env
const showAdmin = import.meta.env.VITE_SHOW_AVAIL_ADMIN === "true";

export default function Availability() {
  return (
    <div id="main-content" tabIndex={-1} className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Availability Calendar</h1>
      
      {/* Public availability calendar would go here */}
      <div className="mb-6">
        <p className="text-slate-600">
          This is the public availability calendar view. Users can check dates and book here.
        </p>
      </div>

      {/* Conditionally show admin panel based on environment variable */}
      {showAdmin ? (
        <AdminUnavailableDatesPanel />
      ) : null}
    </div>
  );
}

