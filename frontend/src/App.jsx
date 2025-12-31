import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Chat from "./components/Chat";
import ProtectedRoute from "./components/ProtectedRoute";
import Authentication from "./components/Authentication";
import AuthCallBack from "./components/AuthCallBack";
import AddFriends from "./components/AddFriends";
import AccessDenied from "./components/ErrorPages/AccessDenied";
import NotFound from "./components/ErrorPages/NotFound";
import ErrorPage from "./components/ErrorPages/Error";

const App = () => {
  return (
    <Routes>
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Authentication />} />
      <Route path="/auth/callback" element={<AuthCallBack />} />
      <Route path="/add" element={<AddFriends />} />
      <Route path="/accessdenied" element={<AccessDenied />} />
      <Route path="/notfound" element={<NotFound />} />
      <Route path="/error" element={<ErrorPage />} />
    </Routes>
  );
};

export default App;
