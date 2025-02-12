
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ModelSelectorProps {
  model: 'gpt-4o-mini' | 'gpt-4o';
  onModelChange: (model: 'gpt-4o-mini' | 'gpt-4o') => void;
}

export const ModelSelector = ({ model, onModelChange }: ModelSelectorProps) => {
  return (
    <Select value={model} onValueChange={onModelChange}>
      <SelectTrigger className="w-[180px] bg-black/20 border-white/10">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="gpt-4o-mini">GPT-4 Mini (Fast)</SelectItem>
        <SelectItem value="gpt-4o">GPT-4 (Powerful)</SelectItem>
      </SelectContent>
    </Select>
  );
};
