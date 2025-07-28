import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Chat from "./components/Chat";
import ProtectedRoute from "./components/ProtectedRoute";
import Authentication from "./components/Authentication";
import AuthCallBack from "./components/AuthCallBack";
import AddFriends from "./components/AddFriends";

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
    </Routes>
  );
};

export default App;
