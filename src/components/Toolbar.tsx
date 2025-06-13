import { FaRegEdit } from "react-icons/fa";
import { FiMenu } from "react-icons/fi";
import { useState } from "react";
import NodeIcon from "./NodeIcon";
import React from "react";

const Toolbar = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const toggleMenu = () => setMenuVisible(!menuVisible);

  return (
    <div className="w-fit h-full bg-white border border-gray-200 p-2 z-20 toolbar">
      <div className="flex flex-col items-center justify-center">
        {menuVisible ? (
          <div className="min-w-[200px]">
            <div className="justify-between flex flex-row items-center">
              <p className="font-bold">Flow Builder</p>
              <button
                className="p-2 hover:text-gray-600 transition-colors"
                onClick={toggleMenu}
              >
                <FiMenu className="text-lg text-gray-500" />
              </button>
            </div>
            <hr className="my-2" />
            <div className="p-2 text-sm">
              Drag and drop to add nodes
            </div>
            <div className="flex flex-col text-sm">
              <NodeIcon type="control-point" label="Control Point" />
              <NodeIcon type="action" label="Action" />
            </div>
          </div>
        ) : (
          <>
            <button
              className="p-2 hover:text-gray-600 transition-colors"
              onClick={toggleMenu}
            >
              <FiMenu className="text-lg text-gray-500" />
            </button>
            <button className="p-2 hover:text-gray-600 transition-colors">
              <FaRegEdit className="text-lg text-gray-500" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
