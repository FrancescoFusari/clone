import { Card } from "@/components/ui/card";

export const Insights = () => {
  // Placeholder data
  const categories = [
    { name: "Work", percentage: 35 },
    { name: "Personal", percentage: 25 },
    { name: "Health", percentage: 20 },
    { name: "Learning", percentage: 20 },
  ];

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <Card className="max-w-2xl mx-auto mt-12 p-6 bg-card backdrop-blur-lg border-gray-200/20">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Insights</h1>
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{category.name}</span>
                <span>{category.percentage}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};