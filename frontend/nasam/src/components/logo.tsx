import { Link } from "react-router-dom";

export function Logo() {
  return (
    <Link to="/" className="flex items-center space-x-2">
      <div className="bg-primary p-1 rounded-md">
        <span className="text-white font-bold text-xl">NASAMS</span>
      </div>
      <span className="text-lg font-semibold">CIT-U</span>
    </Link>
  );
}