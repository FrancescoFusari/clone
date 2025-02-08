
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import type { Database } from "@/integrations/supabase/types";

type EntryCategory = Database["public"]["Enums"]["entry_category"];
export type NodeType = "category" | "subcategory" | "entry" | "tag" | "user";

interface Node {
  id: string;
  name: string;
  type: NodeType;
}

interface GraphControlsProps {
  onSearchChange: (value: string) => void;
  onTypeFilter: (types: NodeType[]) => void;
  onNodeSelect?: (node: Node) => void;
  searchValue: string;
  activeTypes: NodeType[];
  showUserNode?: boolean;
  nodes?: Node[];
}

const NODE_TYPES: NodeType[] = ["category", "subcategory", "entry", "tag"];

export function GraphControls({
  onSearchChange,
  onTypeFilter,
  onNodeSelect,
  searchValue,
  activeTypes,
  showUserNode,
  nodes = [],
}: GraphControlsProps) {
  const types: NodeType[] = showUserNode ? [...NODE_TYPES, "user"] : NODE_TYPES;
  const [searchResults, setSearchResults] = useState<Node[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState(searchValue);

  const toggleType = (type: NodeType) => {
    if (activeTypes.includes(type)) {
      onTypeFilter(activeTypes.filter(t => t !== type));
    } else {
      onTypeFilter([...activeTypes, type]);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Update search results
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const filteredNodes = nodes.filter(node => 
      node.name.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
      activeTypes.includes(node.type)
    ).slice(0, 5); // Limit to 5 results

    setSearchResults(filteredNodes);
  }, [debouncedSearch, nodes, activeTypes]);

  const handleResultClick = (node: Node) => {
    if (onNodeSelect) {
      onNodeSelect(node);
    }
    setSearchResults([]);
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
        {searchResults.length > 0 && (
          <div className="absolute w-full mt-1 bg-background border rounded-md shadow-lg">
            <ScrollArea className="h-auto max-h-48">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <span className="text-sm font-medium">{result.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {result.type}
                  </span>
                </button>
              ))}
            </ScrollArea>
          </div>
        )}
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
