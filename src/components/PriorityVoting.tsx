import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";

interface PriorityItem {
  id: string;
  text: string;
  rank: number;
}

interface PriorityVotingProps {
  questionId: string;
  items: string[];
  maxSelections?: number;
  value?: string;
  onChange: (value: string) => void;
}

export const PriorityVoting = ({
  questionId,
  items,
  maxSelections = 3,
  value,
  onChange,
}: PriorityVotingProps) => {
  const [selectedItems, setSelectedItems] = useState<PriorityItem[]>([]);

  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        setSelectedItems(parsed);
      } catch {
        setSelectedItems([]);
      }
    }
  }, [value]);

  const addItem = (text: string) => {
    if (selectedItems.length >= maxSelections) return;
    if (selectedItems.find((item) => item.text === text)) return;

    const newItems = [
      ...selectedItems,
      { id: `${questionId}-${Date.now()}`, text, rank: selectedItems.length + 1 },
    ];
    setSelectedItems(newItems);
    onChange(JSON.stringify(newItems));
  };

  const removeItem = (text: string) => {
    const filtered = selectedItems.filter((item) => item.text !== text);
    const reranked = filtered.map((item, index) => ({ ...item, rank: index + 1 }));
    setSelectedItems(reranked);
    onChange(JSON.stringify(reranked));
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === selectedItems.length - 1) return;

    const newItems = [...selectedItems];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    
    const reranked = newItems.map((item, i) => ({ ...item, rank: i + 1 }));
    setSelectedItems(reranked);
    onChange(JSON.stringify(reranked));
  };

  const isSelected = (text: string) => selectedItems.some((item) => item.text === text);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        최대 {maxSelections}개까지 선택할 수 있습니다. (현재 {selectedItems.length}개 선택)
      </div>

      {/* Selected items with ranking */}
      {selectedItems.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">선택된 항목 (우선순위순)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                  {item.rank}
                </Badge>
                <span className="flex-1 text-sm">{item.text}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveItem(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveItem(index, "down")}
                    disabled={index === selectedItems.length - 1}
                  >
                    <ArrowDown className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.text)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Available items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => (
          <Button
            key={item}
            variant={isSelected(item) ? "secondary" : "outline"}
            className="justify-start h-auto py-3 px-4 whitespace-normal text-left"
            onClick={() => (isSelected(item) ? removeItem(item) : addItem(item))}
            disabled={!isSelected(item) && selectedItems.length >= maxSelections}
          >
            {item}
          </Button>
        ))}
      </div>
    </div>
  );
};
