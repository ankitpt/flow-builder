import { useReactFlow } from "@xyflow/react";
import { initialNodes } from "../nodes";
import { initialEdges } from "../edges";
import { useSchemaStore } from "../store/schemaStore";
import { TbFileImport } from "react-icons/tb";
import { TbFileExport } from "react-icons/tb";
import { RiResetLeftFill } from "react-icons/ri";
import { MdSaveAlt } from "react-icons/md";

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

  return (
    <div className="flex items-center justify-end p-4 fixed top-0 left-0 w-full z-10">
      <div className="space-x-2">
        <button
          onClick={handleNew}
          className="text-2xl"
        >
          <RiResetLeftFill className="mr-2" />
        </button>
        <button
          onClick={handleImport}
          className="text-2xl"
        >
          <TbFileImport className="mr-2" />
        </button>
        <button
          onClick={handleExport}
          className="text-2xl"
        >
          <MdSaveAlt className="mr-2" />
        </button>
      </div>
    </div>
  );
};

export default Header;
