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

import { Issue } from '../backend/Issue';
import { TransitiveDependencyReport } from '../backend/TransitiveDependencyReport';

export class DependencyReport {
    /**
    * PackageURL used to identify a dependency artifact
    */
    'ref'?: string;
    'issues'?: Array<Issue>;
    'transitive'?: Array<TransitiveDependencyReport>;
    /**
    * PackageURL used to identify a dependency artifact
    */
    'recommendation'?: string;
    'highestVulnerability'?: Issue;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "ref",
            "baseName": "ref",
            "type": "string",
            "format": ""
        },
        {
            "name": "issues",
            "baseName": "issues",
            "type": "Array<Issue>",
            "format": ""
        },
        {
            "name": "transitive",
            "baseName": "transitive",
            "type": "Array<TransitiveDependencyReport>",
            "format": ""
        },
        {
            "name": "recommendation",
            "baseName": "recommendation",
            "type": "string",
            "format": ""
        },
        {
            "name": "highestVulnerability",
            "baseName": "highestVulnerability",
            "type": "Issue",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return DependencyReport.attributeTypeMap;
    }

    public constructor() {
    }
}

