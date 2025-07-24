import { Bell, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white text-sm" size={16} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">StockGenie</h1>
              <p className="text-xs text-muted">AI Trading Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-2 h-2 bg-success rounded-full absolute -top-1 -right-1 animate-pulse"></div>
              <Bell className="text-muted" size={20} />
            </div>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-300 text-gray-600 text-sm">U</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
