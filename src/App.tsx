import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactFlowProvider } from "@xyflow/react";
import Flows from "./Flows";
import FlowBuilder from "./FlowBuilder";
import { HistoryProvider } from "./contexts/HistoryContext";
import { NotificationProvider } from "./contexts/NotificationContext";

export default function App() {
  console.log("VITE_GOOGLE_CLIENT_ID", import.meta.env.VITE_GOOGLE_CLIENT_ID);
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}>
      <Router>
        <Routes>
          <Route path="/" element={<Flows />} />
          <Route
            path="/builder/:flowId?"
            element={
              <ReactFlowProvider>
                <NotificationProvider>
                  <HistoryProvider>
                    <FlowBuilder />
                  </HistoryProvider>
                </NotificationProvider>
              </ReactFlowProvider>
            }
          />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}
