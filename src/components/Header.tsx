import { useReactFlow } from "@xyflow/react";
import { useSchemaStore } from "../store/schemaStore";
import { initialNodes } from "../nodes";
import { initialEdges } from "../edges";

const Header = () => {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const { nodeSchemas, setNodeSchema, resetSchemas } = useSchemaStore();
  const { setIdCounter } = useSchemaStore();

  const handleExport = () => {
    const nodes = getNodes();
    const edges = getEdges();

    // Ensure we capture the schema data for ToolbarNodes
    const processedNodes = nodes.map((node) => {
      if (node.type === "toolbar") {
        const schema = nodeSchemas[node.id];
        return {
          ...node,
          data: {
            ...node.data,
            schema: schema || null,
          },
        };
      }
      return node;
    }); 

    const flowData = {
      nodes: processedNodes,
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
              // Process nodes and store their schemas
              const processedNodes = flowData.nodes.map((node: any) => {
                if (node.type === "toolbar" && node.data.schema) {
                  // Store the schema in our store
                  setNodeSchema(node.id, node.data.schema);
                }
                return node;
              });

              setNodes(processedNodes);
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
    console.log("handleNew");
    resetSchemas();
    setIdCounter(0);
    setNodes([...initialNodes]);
    setEdges([...initialEdges]);
    localStorage.clear();
  };

  return (
    <div className="flex items-center justify-end p-4 fixed top-0 left-0 w-full z-10">
      <div className="space-x-2">
        <button
          onClick={handleNew}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Reset Flow
        </button>
        <button
          onClick={handleImport}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Import
        </button>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Export
        </button>
      </div>
    </div>
  );
};

export default Header;
