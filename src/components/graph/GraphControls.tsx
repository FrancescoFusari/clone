
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import type { Database } from "@/integrations/supabase/types";

type EntryCategory = Database["public"]["Enums"]["entry_category"];
type NodeType = "category" | "subcategory" | "entry" | "tag" | "user";

interface GraphControlsProps {
  onSearchChange: (value: string) => void;
  onTypeFilter: (types: NodeType[]) => void;
  searchValue: string;
  activeTypes: NodeType[];
  showUserNode?: boolean;
}

const NODE_TYPES: NodeType[] = ["category", "subcategory", "entry", "tag"];

export function GraphControls({
  onSearchChange,
  onTypeFilter,
  searchValue,
  activeTypes,
  showUserNode,
}: GraphControlsProps) {
  const types = showUserNode ? [...NODE_TYPES, "user"] : NODE_TYPES;

  const toggleType = (type: NodeType) => {
    if (activeTypes.includes(type)) {
      onTypeFilter(activeTypes.filter(t => t !== type));
    } else {
      onTypeFilter([...activeTypes, type]);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-4 w-72 bg-background/50 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search nodes..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <Button
            key={type}
            variant={activeTypes.includes(type) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleType(type)}
            className="capitalize"
          >
            {type}
          </Button>
        ))}
      </div>
    </div>
  );
}
