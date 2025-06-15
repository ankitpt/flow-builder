import { TbFileImport } from "react-icons/tb";
import { RiResetLeftFill } from "react-icons/ri";
import { RiSave3Fill } from "react-icons/ri";
import { MdSaveAlt } from "react-icons/md";
import Auth from "../Auth";
import { useFlowOperations } from "@/hooks/useFlowOperations";

const Header = () => {
  const { resetFlow, exportFlow, importFlow, saveFlow } = useFlowOperations();

  return (
    <div className="flex items-center justify-end p-4 fixed top-0 left-0 w-full z-10">
      <div className="flex items-center space-x-4">
        <button
          onClick={resetFlow}
          className="text-2xl hover:text-blue-600 transition-colors"
          title="Reset Flow"
        >
          <RiResetLeftFill />
        </button>
        <button
          onClick={importFlow}
          className="text-2xl hover:text-blue-600 transition-colors"
          title="Import Flow"
        >
          <TbFileImport />
        </button>
        <button
          onClick={exportFlow}
          className="text-2xl hover:text-blue-600 transition-colors"
          title="Export Flow"
        >
          <MdSaveAlt />
        </button>
        <div className="relative">
          <button
            onClick={saveFlow}
            className="text-2xl hover:text-blue-600 transition-colors"
            title="Save Flow"
          >
            <RiSave3Fill />
          </button>
        </div>
        <div className="h-6 w-px bg-gray-300 mx-2"></div>
        <Auth />
      </div>
    </div>
  );
};

export default Header;
