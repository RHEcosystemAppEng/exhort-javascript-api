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
import { PackageRef } from '../backend/PackageRef';
export declare class Remediation {
    'issueRef'?: string;
    'mavenPackage'?: PackageRef;
    'productStatus'?: string;
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
