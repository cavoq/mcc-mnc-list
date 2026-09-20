export type Operator = {
    type: 'Test' | 'National' | 'International'
    countryName: string | null
    countryCode: string | null
    mcc: string
    mnc: string
    brand: string | null
    operator: string | null
    status: string | null
    bands: string | null
    notes: string | null
}

export type Filters = {
    countryCode?: string
    mcc?: string | number
    mnc?: string | number
    mccmnc?: string | number
    statusCode?: string
}

export declare const all: () => Operator[];
export declare const filter: (filters?: Filters | null) => Operator[];
export declare const find: (filters?: Filters | null) => Operator | undefined;
export declare const statusCodes: () => string[];
