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
export class AnalysisReport {
    'scanned';
    'providers';
    static discriminator = undefined;
    static attributeTypeMap = [
        {
            "name": "scanned",
            "baseName": "scanned",
            "type": "Scanned",
            "format": ""
        },
        {
            "name": "providers",
            "baseName": "providers",
            "type": "{ [key: string]: ProviderReport; }",
            "format": ""
        }
    ];
    static getAttributeTypeMap() {
        return AnalysisReport.attributeTypeMap;
    }
    constructor() {
    }
}
