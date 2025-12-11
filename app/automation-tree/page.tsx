"use client";

import AutomationTreeView from "@/components/AutomationTreeView";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AutomationTreePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-[2000px] mx-auto h-[calc(100vh-2rem)]">
        <div className="mb-4 flex items-center space-x-4">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Automation Research Tree
            </h1>
            <p className="text-gray-600 text-sm">
              Complete decision tree for ROAS anomaly investigation workflow
            </p>
          </div>
        </div>

        <div className="h-[calc(100%-80px)]">
          <AutomationTreeView />
        </div>
      </div>
    </main>
  );
}
