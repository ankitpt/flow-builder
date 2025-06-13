import { FiMenu } from "react-icons/fi";
import { useState } from "react";
import NodeIcon from "./NodeIcon";

const Toolbar = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const toggleMenu = () => setMenuVisible(!menuVisible);

  return (
    <div className="w-fit h-full max-w-[200px] bg-white border border-gray-200 p-2 z-20 toolbar">
      <div className="flex flex-col items-center justify-center">
        {menuVisible ? (
          <div className="min-w-[200px]">
            <div className="justify-between flex flex-row items-center px-2">
              <a
                href="/"
                className="font-bold hover:text-blue-600 transition-colors"
              >
                Flow Builder
              </a>
              <button
                className="p-2 hover:text-blue-600 transition-colors"
                onClick={toggleMenu}
              >
                <FiMenu className="text-lg text-gray-500" />
              </button>
            </div>
            <hr className="my-2" />
            <div className="p-2 text-sm">Drag and drop to add nodes</div>
            <div className="flex flex-col text-sm">
              <NodeIcon type="control-point" label="Control Point" />
              <NodeIcon type="action" label="Action" />
              <NodeIcon type="condition" label="Conditional" />
            </div>
            <hr className="my-2" />
            <div className="p-2 text-sm">Shortcuts</div>
            <div className="flex flex-col text-sm">
              <div className="p-2">
                <span className="key">Ctrl</span> +{" "}
                <span className="key">C</span>: Copy Node
              </div>
              <div className="p-2">
                <span className="key">Ctrl</span> +{" "}
                <span className="key">V</span>: Paste Node
              </div>
              <div className="p-2">
                <span className="key">Delete</span>: Delete Node
              </div>
            </div>
            <hr className="my-2" />
            <p className="text-xs text-gray-500 p-2">
              Tip: drag from the connection points on a node and drop to create
              a new node!
            </p>
          </div>
        ) : (
          <>
            <button
              className="p-2 hover:text-gray-600 transition-colors"
              onClick={toggleMenu}
            >
              <FiMenu className="text-lg text-gray-500" />
            </button>
            {/* <button className="p-2 hover:text-gray-600 transition-colors">
              <FaRegEdit className="text-lg text-gray-500" />
            </button> */}
          </>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
