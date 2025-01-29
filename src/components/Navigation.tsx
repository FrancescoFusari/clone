import { Home, PieChart, Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-card backdrop-blur-lg rounded-full px-6 py-3 shadow-lg border border-gray-200/20 z-50">
      <ul className="flex items-center space-x-8">
        <li>
          <Link
            to="/"
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
              isActive("/")
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-secondary"
            }`}
          >
            <Home className="w-6 h-6" />
          </Link>
        </li>
        <li>
          <Link
            to="/new"
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
              isActive("/new")
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-secondary"
            }`}
          >
            <Plus className="w-6 h-6" />
          </Link>
        </li>
        <li>
          <Link
            to="/insights"
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
              isActive("/insights")
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-secondary"
            }`}
          >
            <PieChart className="w-6 h-6" />
          </Link>
        </li>
      </ul>
    </nav>
  );
};