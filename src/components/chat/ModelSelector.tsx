
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ModelSelectorProps {
  model: 'o3-mini';
  onModelChange: (model: 'o3-mini') => void;
}

export const ModelSelector = ({ model, onModelChange }: ModelSelectorProps) => {
  return (
    <Select value={model} onValueChange={onModelChange}>
      <SelectTrigger className="w-[180px] bg-black/20 border-white/10">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="o3-mini">O3 Mini (Latest)</SelectItem>
      </SelectContent>
    </Select>
  );
};
