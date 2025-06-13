import { useReactFlow } from "@xyflow/react";
import { initialNodes } from "../nodes";
import { initialEdges } from "../edges";
import { useSchemaStore } from "../store/schemaStore";
import { TbFileImport } from "react-icons/tb";
import { RiResetLeftFill } from "react-icons/ri";
import { RiSave3Fill } from "react-icons/ri";
import { MdSaveAlt } from "react-icons/md";
import Auth from "./Auth";
import React from "react";

const Header = () => {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const { setIdCounter } = useSchemaStore();

  const handleExport = () => {
    const nodes = getNodes();
    const edges = getEdges();
    const flowData = {
      nodes,
      edges,
    };
    const jsonString = JSON.stringify(flowData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `flow_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const flowData = JSON.parse(event.target?.result as string);
            if (flowData.nodes && flowData.edges) {
              setNodes(flowData.nodes);
              setEdges(flowData.edges);
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
            alert("Invalid flow data file");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleNew = () => {
    setIdCounter(1);
    setNodes([...initialNodes]);
    setEdges([...initialEdges]);
    localStorage.clear();
  };

  const handleSave = async () => {
    try {
      const nodes = getNodes();
      const edges = getEdges();
      const flowData = { nodes, edges };
      
      // Get the user ID from the stored token
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to save flows');
        return;
      }
      
      const { userId } = JSON.parse(token);
      
      const response = await fetch('/api/flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Flow ${new Date().toLocaleString()}`,
          flow: flowData,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save flow');
      }

      alert('Flow saved successfully!');
    } catch (error) {
      console.error('Error saving flow:', error);
      alert('Failed to save flow');
    }
  };

  return (
    <div className="flex items-center justify-end p-4 fixed top-0 left-0 w-full z-10">
      <div className="flex items-center space-x-4">
        <button
          onClick={handleNew}
          className="text-2xl hover:text-blue-600 transition-colors"
          title="New Flow"
        >
          <RiResetLeftFill />
        </button>
        <button
          onClick={handleImport}
          className="text-2xl hover:text-blue-600 transition-colors"
          title="Import Flow"
        >
          <TbFileImport />
        </button>
        <button
          onClick={handleExport}
          className="text-2xl hover:text-blue-600 transition-colors"
          title="Export Flow"
        >
          <MdSaveAlt />
        </button>
        <button onClick={handleSave} className="text-2xl hover:text-blue-600 transition-colors" title="Save Flow">
          <RiSave3Fill />
        </button>
        <div className="h-6 w-px bg-gray-300 mx-2"></div>
        <Auth />
      </div>
    </div>
  );
};

export default Header;
