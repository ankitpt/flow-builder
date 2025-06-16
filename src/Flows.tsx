import FlowNavigation from "./components/Flows/FlowNavigation";
import Header from "./components/Flows/Header";
import { HistoryProvider } from "./contexts/HistoryContext";
import { ReactFlowProvider } from "@xyflow/react";

const Flows = () => {
  return (
    <ReactFlowProvider>
      <HistoryProvider>
        <div>
          <Header />
          <FlowNavigation />
        </div>
      </HistoryProvider>
    </ReactFlowProvider>
  );
};

export default Flows;
