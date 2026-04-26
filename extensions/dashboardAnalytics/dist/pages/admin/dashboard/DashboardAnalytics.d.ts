import React from 'react';
export default function DashboardAnalytics({ statsApi }: {
    statsApi: string;
}): React.JSX.Element;
export declare const layout: {
    areaId: string;
    sortOrder: number;
};
export declare const query = "\n  query Query {\n    statsApi: url(routeId: \"dashboardStats\")\n  }\n";
