// Shared types for all routing services
export interface RouteQuote {
    aggregator: string;
    transactionData: any;
    expectedOutput: string;
    gasCostUsd: number;
    routeData: any;
}
