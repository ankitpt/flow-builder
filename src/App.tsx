import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactFlowProvider } from "@xyflow/react";
import Flows from "./Flows";
import FlowBuilder from "./FlowBuilder";
import React from "react";

export default function App() {
  return (
    <GoogleOAuthProvider clientId="213346239684-41k3092gbhm8tldfn2g7s2oubhdnicvg.apps.googleusercontent.com">
      <Router>
        <Routes>
          <Route path="/" element={<Flows />} />
          <Route
            path="/builder/:flowId?"
            element={
              <ReactFlowProvider>
                <FlowBuilder />
              </ReactFlowProvider>
            }
          />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}
