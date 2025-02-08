
import { useState } from "react";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { useDebouncedCallback } from "use-debounce";
import type { Node } from "./types";

type NodeType = "category" | "subcategory" | "entry" | "tag";

interface GraphControlsProps {
  nodes: Node[];
  onSearch: (term: string) => void;
  onNodeClick: (node: Node) => void;
  onFilterChange: (types: NodeType[]) => void;
}

export const GraphControls = ({ nodes, onSearch, onNodeClick, onFilterChange }: GraphControlsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<NodeType[]>(["category", "subcategory", "entry", "tag"]);
  
  const debouncedSearch = useDebouncedCallback((value: string) => {
    onSearch(value);
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleTypeToggle = (type: NodeType, checked: boolean) => {
    const newTypes = checked 
      ? [...selectedTypes, type]
      : selectedTypes.filter(t => t !== type);
    setSelectedTypes(newTypes);
    onFilterChange(newTypes);
  };

  const searchResults = searchTerm
    ? nodes.filter(node => 
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        selectedTypes.includes(node.type as NodeType)
      ).slice(0, 5)
    : [];

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />
          {searchResults.length > 0 && (
            <ScrollArea className="h-[200px] w-full rounded-md border p-2">
              <div className="space-y-2">
                {searchResults.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => onNodeClick(node)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary cursor-pointer"
                  >
                    <span>{node.name}</span>
                    <Badge variant="secondary">{node.type}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        <div className="flex flex-wrap gap-4">
          {["category", "subcategory", "entry", "tag"].map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={type}
                checked={selectedTypes.includes(type as NodeType)}
                onCheckedChange={(checked) => handleTypeToggle(type as NodeType, checked as boolean)}
              />
              <Label htmlFor={type} className="capitalize">
                {type}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
