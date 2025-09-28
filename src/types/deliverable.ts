export interface DeliverableType {
    id: number;
    name: string;
    displayName: string;
    description?: string;
    isRequired: boolean;
    isActive: boolean;
    sortOrder: number;
}
