
import Auth from "../Auth";
import React from "react";

const Header = () => {
  return (
    <div className="flex items-center justify-between p-4 w-full z-10">
        <div className="text-2xl font-bold">Flowchart Builder</div>
        <Auth />
    </div>
  );
};

export default Header;
