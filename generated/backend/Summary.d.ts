/**
 * CodeReady Dependency Analytics API
 * Vulnerability analysis with Red Hat CodeReady Dependency Analytics
 *
 * OpenAPI spec version: 3.0.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { DependenciesSummary } from '../backend/DependenciesSummary';
import { ProviderStatus } from '../backend/ProviderStatus';
import { VulnerabilitiesSummary } from '../backend/VulnerabilitiesSummary';
export declare class Summary {
    'dependencies'?: DependenciesSummary;
    'vulnerabilities'?: VulnerabilitiesSummary;
    'providerStatuses'?: Array<ProviderStatus>;
    static readonly discriminator: string | undefined;
    static readonly attributeTypeMap: Array<{
        name: string;
        baseName: string;
        type: string;
        format: string;
    }>;
    static getAttributeTypeMap(): {
        name: string;
        baseName: string;
        type: string;
        format: string;
    }[];
    constructor();
}
