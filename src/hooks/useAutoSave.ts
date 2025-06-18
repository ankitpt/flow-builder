import { useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useFlow } from "./useFlow";
import { useFlowOperations } from "./useFlowOperations";

export function useAutoSave() {
  const { flowId } = useParams();
  const { lastUpdated, setLastUpdated } = useFlow();
  const { autoSaveFlow } = useFlowOperations();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const performAutoSave = useCallback(async () => {
    if (!flowId || flowId === "builder") {
      console.log("Auto-save: Skipping - no flow ID or new flow");
      return;
    }

    console.log("Auto-save: Starting automatic save...");
    try {
      await autoSaveFlow();
      const now = new Date();
      setLastUpdated(now);
      console.log("Auto-save: Successfully saved at", now.toLocaleTimeString());
    } catch (error) {
      console.error("Auto-save: Failed to save flow", error);
    }
  }, [flowId, autoSaveFlow, setLastUpdated]);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only start auto-save if we have a valid flow ID (not "builder")
    if (flowId && flowId !== "builder") {
      console.log("Auto-save: Starting auto-save interval for flow", flowId);
      intervalRef.current = setInterval(performAutoSave, 60000); // 60 seconds

      // Perform initial save after 1 minute
      const initialTimeout = setTimeout(performAutoSave, 60000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        clearTimeout(initialTimeout);
        console.log("Auto-save: Stopped auto-save interval");
      };
    } else {
      console.log("Auto-save: Not starting - no valid flow ID");
    }
  }, [flowId, performAutoSave]);

  return { lastUpdated };
}
