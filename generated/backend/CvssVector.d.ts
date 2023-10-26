/**
 * Exhort API
 * Vulnerability analysis with Red Hat Trusted Profile Analyzer
 *
 * OpenAPI spec version: 4.0.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
export declare class CvssVector {
    'attackVector'?: string;
    'attackComplexity'?: string;
    'privilegesRequired'?: string;
    'userInteraction'?: string;
    'scope'?: string;
    'confidentialityImpact'?: string;
    'integrityImpact'?: string;
    'availabilityImpact'?: string;
    'exploitCodeMaturity'?: string;
    'remediationLevel'?: string;
    'reportConfidence'?: string;
    'cvss'?: string;
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
