import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactFlowProvider } from "@xyflow/react";
import Flows from "./Flows";
import FlowBuilder from "./FlowBuilder";
import { HistoryProvider } from "./contexts/HistoryContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { FlowProvider } from "./contexts/FlowContext";
import { Admin } from "./components/Admin/Admin";
import AdminFlows from "./components/Admin/AdminFlows";
import AdminFlowViewer from "./components/Admin/AdminFlowViewer";

export default function App() {
  console.log("VITE_GOOGLE_CLIENT_ID", import.meta.env.VITE_GOOGLE_CLIENT_ID);
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}>
      <Router>
        <ReactFlowProvider>
          <FlowProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/" element={<Flows />} />
                <Route
                  path="/builder/:flowId?"
                  element={
                    <HistoryProvider>
                      <FlowBuilder />
                    </HistoryProvider>
                  }
                />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/flows" element={<AdminFlows />} />
                <Route
                  path="/admin/view/:flowId"
                  element={
                    <HistoryProvider>
                      <AdminFlowViewer />
                    </HistoryProvider>
                  }
                />
              </Routes>
            </NotificationProvider>
          </FlowProvider>
        </ReactFlowProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}
