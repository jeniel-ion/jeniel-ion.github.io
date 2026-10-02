/**
 * Disclosure Records — responsible disclosures only.
 * Rule: full detail only because each issue is remediated.
 * Never publish live payloads or target internals.
 */
window.DisclosureRecords = [
    {
        targetOrganization: "NCIIPC — national critical digital infrastructure",
        vulnerabilityClass: "Information Leak",
        filterKey: "Information Leak",
        severityLevel: "High",
        disclosureYear: "2024"
    },
    {
        targetOrganization: "United Nations",
        vulnerabilityClass: "Cross-Site Scripting",
        filterKey: "Cross-Site Scripting",
        severityLevel: "High",
        disclosureYear: "2024"
    },
    {
        targetOrganization: "Gynzy — education platform (1.6M students, 92K teachers)",
        vulnerabilityClass: "Account takeover",
        filterKey: "Broken Access Control",
        severityLevel: "High",
        disclosureYear: "2024"
    }
];
