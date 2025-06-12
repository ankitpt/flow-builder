import { FaRegEdit } from "react-icons/fa";
import { FiMenu } from "react-icons/fi";
import { useState } from "react";

const Toolbar = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const toggleMenu = () => setMenuVisible(!menuVisible);

  return (
    <div className="fixed top-0 left-0 w-fit h-[calc(100%-72px)] bg-white border border-gray-200 p-2 z-20">
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
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex flex-row justify-start items-center gap-2">
                <button className="p-2 hover:text-gray-600 transition-colors">
                  <FaRegEdit className="text-lg text-gray-500" />
                </button>
                <p>Edit Flow</p>
              </div>
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
