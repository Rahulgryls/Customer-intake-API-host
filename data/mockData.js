// Realistic fictitious mock data derived from the Customer Intake data model
// (BSN = official 999-test series, IBAN/KVK/RSIN checksum-style, all fictitious).

const customers = {
  "110023456": {
    customerId: "110023456", siebelId: "1-3K7P9Q", partyType: "ORGANISATION",
    customerStatus: "ACTIVE", customerSince: "2008-05-14",
    organisationDetails: {
      legalName: "De Groot Kaashandel B.V.", tradeName: "De Groot Kaas",
      kvkNumber: "33256689", rsin: "823456705", lei: "724500TEST0NL0KAAS43",
      legalForm: "BV", sbiCode: "46331", sbiDescription: "Groothandel in kaas en zuivelproducten",
      dateOfIncorporation: "2005-09-01", countryOfRegistration: "NL",
      numberOfEmployees: 24, annualTurnover: { value: 4800000.00, currency: "EUR" },
      ubos: [
        { name: "Johannes de Groot", uboType: "OWNERSHIP", ownershipPercentage: 60.00, pepIndicator: false },
        { name: "Maria de Groot-Visser", uboType: "OWNERSHIP", ownershipPercentage: 40.00, pepIndicator: false }
      ]
    },
    contactDetails: {
      addresses: [{ addressType: "REGISTERED_OFFICE", street: "Kaasmarkt", houseNumber: 12, postalCode: "3441 BH", city: "Woerden", country: "NL", validFrom: "2012-07-01" }],
      phoneNumbers: [{ type: "WORK", number: "+31348123456" }],
      emailAddresses: [{ type: "WORK", address: "info@degrootkaas.example.nl" }],
      preferredLanguage: "nl"
    },
    relationship: { segment: "SME", localBankCode: "0142", localBankName: "Rabobank Utrecht e.o.", relationshipManagerId: "NL10233", relationshipManagerName: "S. Willems", serviceModel: "MANAGED" },
    kycInformation: { cddStatus: "COMPLETED", lastCddReviewDate: "2025-11-20", nextCddReviewDate: "2028-11-20", identificationMethod: "NOTARY", taxResidencies: [{ country: "NL", tin: "823456705" }], usPersonIndicator: false },
    accounts: [
      { iban: "NL62RABO0300065432", accountType: "CURRENT", productCode: "RCR-0011", productName: "Rabo BedrijfsRekening", currency: "EUR", accountStatus: "ACTIVE", openedDate: "2008-05-14", holderRole: "HOLDER" },
      { iban: "NL83RABO0117653450", accountType: "SAVINGS", productCode: "RCS-0022", productName: "Rabo BedrijfsSpaarRekening", currency: "EUR", accountStatus: "ACTIVE", openedDate: "2015-03-02", holderRole: "HOLDER" }
    ],
    consents: { marketingConsent: true, consentTimestamp: "2024-02-10T10:00:00.000Z" }
  },
  "110034567": {
    customerId: "110034567", siebelId: "1-8Q2W4E", partyType: "PERSON",
    customerStatus: "ACTIVE", customerSince: "2010-09-21",
    personDetails: { initials: "E.J.", firstName: "Emma", middleName: "van den", lastName: "Berg", dateOfBirth: "1987-04-12", gender: "FEMALE", nationality: "NL", countryOfBirth: "NL", maritalStatus: "MARRIED", bsn: "999990019", residencyStatus: "RESIDENT", deceasedIndicator: false },
    contactDetails: {
      addresses: [{ addressType: "RESIDENTIAL", street: "Rozengracht", houseNumber: 148, houseNumberAddition: "2", postalCode: "1016 LV", city: "Amsterdam", country: "NL", validFrom: "2019-03-01" }],
      phoneNumbers: [{ type: "MOBILE", number: "+31612345678" }],
      emailAddresses: [{ type: "PERSONAL", address: "emma.vdberg@example.nl" }],
      preferredLanguage: "nl"
    },
    relationship: { segment: "RETAIL", localBankCode: "0871", localBankName: "Rabobank Amsterdam", serviceModel: "SELF_SERVICE" },
    kycInformation: { cddStatus: "COMPLETED", lastCddReviewDate: "2023-05-10", nextCddReviewDate: "2028-05-10", identificationMethod: "ID_DOCUMENT", idDocumentType: "PASSPORT", idDocumentNumber: "****9F44", idDocumentExpiryDate: "2031-06-15", taxResidencies: [{ country: "NL", tin: "999990019" }], usPersonIndicator: false },
    accounts: [
      { iban: "NL03RABO0345678901", accountType: "CURRENT", productCode: "RPR-0001", productName: "Rabo DirectRekening", currency: "EUR", accountStatus: "ACTIVE", openedDate: "2010-09-21", holderRole: "HOLDER" },
      { iban: "NL72RABO0139876542", accountType: "SAVINGS", productCode: "RPS-0004", productName: "Rabo InternetSparen", currency: "EUR", accountStatus: "ACTIVE", openedDate: "2012-01-05", holderRole: "JOINT" }
    ],
    consents: { marketingConsent: false, consentTimestamp: "2023-05-10T14:22:05.000Z" }
  },
  "110045678": {
    customerId: "110045678", siebelId: "1-5T6Y7U", partyType: "ORGANISATION",
    customerStatus: "ACTIVE", customerSince: "2011-06-30",
    organisationDetails: {
      legalName: "Van Dijk Transport & Logistiek V.O.F.", tradeName: "Van Dijk Logistiek",
      kvkNumber: "27124765", rsin: "823456717", legalForm: "VOF", sbiCode: "4941", sbiDescription: "Goederenvervoer over de weg",
      dateOfIncorporation: "2011-06-01", countryOfRegistration: "NL", numberOfEmployees: 11,
      annualTurnover: { value: 1900000.00, currency: "EUR" },
      ubos: [
        { name: "Arie van Dijk", uboType: "OWNERSHIP", ownershipPercentage: 50.00, pepIndicator: false },
        { name: "Petra van Dijk-Smit", uboType: "OWNERSHIP", ownershipPercentage: 50.00, pepIndicator: false }
      ]
    },
    contactDetails: {
      addresses: [{ addressType: "REGISTERED_OFFICE", street: "Waalhaven Zuidzijde", houseNumber: 21, postalCode: "3089 JH", city: "Rotterdam", country: "NL", validFrom: "2011-06-01" }],
      phoneNumbers: [{ type: "WORK", number: "+31102908765" }],
      preferredLanguage: "nl"
    },
    relationship: { segment: "SME", localBankCode: "1102", localBankName: "Rabobank Rotterdam", relationshipManagerId: "NL20877", relationshipManagerName: "K. Meijer", serviceModel: "MANAGED" },
    kycInformation: { cddStatus: "COMPLETED", lastCddReviewDate: "2026-02-14", nextCddReviewDate: "2027-02-14", identificationMethod: "ID_DOCUMENT", taxResidencies: [{ country: "NL", tin: "823456717" }], usPersonIndicator: false },
    accounts: [
      { iban: "NL32RABO0187654321", accountType: "CURRENT", productCode: "RCR-0011", productName: "Rabo BedrijfsRekening", currency: "EUR", accountStatus: "ACTIVE", openedDate: "2011-06-30", holderRole: "HOLDER" },
      { iban: "NL97RABO0334455667", accountType: "LOAN", productCode: "RCL-0301", productName: "Rabo Zakelijke Lening", currency: "EUR", accountStatus: "ACTIVE", openedDate: "2021-04-15", holderRole: "HOLDER" }
    ],
    consents: { marketingConsent: false },
    dataQuality: { warnings: [
      { code: "DQW-002", message: "Annual turnover older than 24 months (last update 2024-05-31)" },
      { code: "DQW-005", message: "No registered email address for this customer" }
    ]}
  }
};

const siebelIndex = { "1-3K7P9Q": "110023456", "1-8Q2W4E": "110034567", "1-5T6Y7U": "110045678" };

const exitedCustomer = { id: "110067890", exitedOn: "2024-11-30" };
const sanctionsBlockedCustomer = { id: "110056789", legalName: "Baltex Trade B.V." };
const prospectNoRatingCustomer = { id: "110078901" };

const riskProfiles = {
  "110023456": {
    customerId: "110023456", partyType: "ORGANISATION",
    creditRiskRating: { ratingSystem: "RRR", ratingGrade: "R11", probabilityOfDefault: 0.006200, ratingModelCode: "RSME-2024.1", ratingDate: "2026-03-15", ratingStatus: "FINAL", nextReviewDate: "2027-03-15", overrideIndicator: false, previousRatingGrade: "R10", ratingTrend: "DETERIORATED" },
    regulatoryClassification: { exposureClass: "CORPORATES", smeIndicator: true, performingStatus: "PERFORMING", defaultStatus: false, daysPastDue: 0, forbearanceStatus: "NONE", ifrs9Stage: "STAGE_1", watchlistStatus: "NONE", unlikelinessToPayIndicator: false },
    financialRiskMetrics: { totalExposure: { value: 1750000.00, currency: "EUR" }, exposureAtDefault: { value: 1690000.00, currency: "EUR" }, lossGivenDefault: 0.285000, expectedLoss: { value: 2986.23, currency: "EUR" }, riskWeightedAssets: { value: 812000.00, currency: "EUR" }, collateralValue: { value: 2300000.00, currency: "EUR" } },
    amlRiskProfile: { wwftRiskClassification: "MEDIUM", riskClassificationDate: "2025-11-20", pepStatus: "NOT_PEP", sanctionsScreeningResult: "NO_MATCH", sanctionsListsChecked: ["EU_CONSOLIDATED", "UN_SC", "OFAC_SDN", "NL_NATIONAL"], lastScreeningDate: "2026-07-30T02:15:00.000Z", adverseMediaIndicator: false, tmAlertsLast12Months: 0 },
    externalBureauData: { businessBureau: { provider: "CREDITSAFE", score: 71, ratingDate: "2026-07-01" } }
  },
  "110034567": {
    customerId: "110034567", partyType: "PERSON",
    creditRiskRating: { ratingSystem: "RRR", ratingGrade: "R6", probabilityOfDefault: 0.001500, ratingModelCode: "RPRV-2023.2", ratingDate: "2026-01-10", ratingStatus: "FINAL", nextReviewDate: "2027-01-10", overrideIndicator: false, previousRatingGrade: "R6", ratingTrend: "STABLE" },
    regulatoryClassification: { exposureClass: "RETAIL", smeIndicator: false, performingStatus: "PERFORMING", defaultStatus: false, daysPastDue: 0, forbearanceStatus: "NONE", ifrs9Stage: "STAGE_1", watchlistStatus: "NONE", unlikelinessToPayIndicator: false },
    financialRiskMetrics: { totalExposure: { value: 7500.00, currency: "EUR" }, exposureAtDefault: { value: 7500.00, currency: "EUR" }, lossGivenDefault: 0.450000, expectedLoss: { value: 5.06, currency: "EUR" } },
    amlRiskProfile: { wwftRiskClassification: "LOW", riskClassificationDate: "2023-05-10", pepStatus: "NOT_PEP", sanctionsScreeningResult: "NO_MATCH", sanctionsListsChecked: ["EU_CONSOLIDATED", "UN_SC", "NL_NATIONAL"], lastScreeningDate: "2026-07-30T02:15:00.000Z", adverseMediaIndicator: false, tmAlertsLast12Months: 0 },
    externalBureauData: { bkrCheck: { checkDate: "2026-07-29", registrationsFound: true, registrations: [{ contractType: "RK", startDate: "2022-01-15", creditLimit: { value: 7500.00, currency: "EUR" } }] } }
  },
  "110045678": {
    customerId: "110045678", partyType: "ORGANISATION",
    creditRiskRating: { ratingSystem: "RRR", ratingGrade: "R16", probabilityOfDefault: 0.089000, ratingModelCode: "RSME-2024.1", ratingDate: "2026-06-20", ratingStatus: "FINAL", nextReviewDate: "2026-12-20", overrideIndicator: true, overrideReason: "Model outcome R15 overridden to R16: sustained arrears on term loan and sector headwinds (road freight)", previousRatingGrade: "R13", ratingTrend: "DETERIORATED" },
    regulatoryClassification: { exposureClass: "CORPORATES", smeIndicator: true, performingStatus: "PERFORMING", defaultStatus: false, daysPastDue: 45, forbearanceStatus: "PERFORMING_FORBORNE", ifrs9Stage: "STAGE_2", watchlistStatus: "WATCH", unlikelinessToPayIndicator: false },
    financialRiskMetrics: { totalExposure: { value: 2400000.00, currency: "EUR" }, exposureAtDefault: { value: 2310000.00, currency: "EUR" }, lossGivenDefault: 0.352000, expectedLoss: { value: 72367.61, currency: "EUR" }, riskWeightedAssets: { value: 1980000.00, currency: "EUR" }, provisionAmount: { value: 72400.00, currency: "EUR" }, collateralValue: { value: 1650000.00, currency: "EUR" } },
    amlRiskProfile: { wwftRiskClassification: "HIGH", riskClassificationDate: "2026-02-14", pepStatus: "NOT_PEP", sanctionsScreeningResult: "NO_MATCH", sanctionsListsChecked: ["EU_CONSOLIDATED", "UN_SC", "OFAC_SDN", "NL_NATIONAL"], lastScreeningDate: "2026-07-30T02:15:00.000Z", adverseMediaIndicator: false, tmAlertsLast12Months: 2 },
    externalBureauData: { businessBureau: { provider: "CREDITSAFE", score: 28, ratingDate: "2026-07-01" } },
    earlyWarningSignals: [
      { signalCode: "EWS-014", signalDescription: "Overdraft utilisation above 90% of limit for more than 30 consecutive days", severity: "MEDIUM", detectedDate: "2026-06-12", status: "OPEN" },
      { signalCode: "EWS-031", signalDescription: "Instalment arrears of 45 days on term loan NL97RABO0334455667", severity: "HIGH", detectedDate: "2026-06-16", status: "OPEN" }
    ]
  }
};

function tx(id, e2e, bd, amt, cdi, cpName, cpIban, cpBic, remit, fam, sub, prod, purp, bal) {
  const t = { transactionId: id, bookingDate: bd, valueDate: bd, bookingDateTime: bd + "T09:00:00.000Z",
    amount: { value: amt, currency: "EUR" }, creditDebitIndicator: cdi, status: "BOOKED",
    remittanceInformationUnstructured: remit,
    bankTransactionCode: { domain: "PMNT", family: fam, subFamily: sub }, paymentProduct: prod,
    balanceAfterBooking: { value: bal, currency: "EUR" } };
  if (e2e) t.endToEndId = e2e;
  if (cpName) t.counterparty = { name: cpName, ...(cpIban ? { iban: cpIban } : {}), ...(cpBic ? { bic: cpBic } : {}) };
  if (purp) t.purposeCode = purp;
  return t;
}

const transactions = {
  "110023456": {
    accounts: [
      { iban: "NL62RABO0300065432", currency: "EUR", accountType: "CURRENT", openingBalance: { value: 38452.10, currency: "EUR" }, closingBalance: { value: 45310.55, currency: "EUR" }, transactions: [
        tx("RABO-2026-0730-000418301", "E2E-INV-2026-0698", "2026-07-30", 18620.00, "CRDT", "Zuivelcoöperatie Milkuria U.A.", "NL03INGB0004567890", "INGBNL2A", "Invoice 2026-0698 cheese wholesale July", "RCDT", "ESCT", "SEPA_CT", "SUPP", 45310.55),
        tx("RABO-2026-0728-000417802", "E2E-PO-2026-1187", "2026-07-28", -12500.00, "DBIT", "Kaasmakerij Terschuur B.V.", "NL38ABNA0517164300", "ABNANL2A", "Purchase order PO-2026-1187 raw cheese", "ICDT", "ESCT", "SEPA_CT", "SUPP", 26690.55),
        tx("RABO-2026-0727-000417510", "E2E-SAL-2026-07", "2026-07-27", -28450.00, "DBIT", null, null, null, "Salarisrun 2026-07, 24 medewerkers", "ICDT", "ESCT", "SEPA_CT", "SALA", 39190.55),
        tx("RABO-2026-0724-000416773", "E2E-LH-2026-07", "2026-07-24", -8912.45, "DBIT", "Belastingdienst", "NL89INGB0000445588", "INGBNL2A", "Loonheffing juli 2026 kenmerk 8234567050L01", "ICDT", "ESCT", "SEPA_CT", "TAXS", 67640.55),
        tx("RABO-2026-0720-000415466", "E2E-INV-2026-0687", "2026-07-20", 7420.10, "CRDT", "Horeca Groothandel Vermeer B.V.", "NL20RABO0244556677", "RABONL2U", "Factuur 2026-0687", "RCDT", "ESCT", "SEPA_CT", "SUPP", 78703.00)
      ]},
      { iban: "NL83RABO0117653450", currency: "EUR", accountType: "SAVINGS", openingBalance: { value: 250000.00, currency: "EUR" }, closingBalance: { value: 305641.55, currency: "EUR" }, transactions: [
        tx("RABO-2026-0715-000512204", null, "2026-07-15", 15000.00, "CRDT", "De Groot Kaashandel B.V.", "NL62RABO0300065432", "RABONL2U", "Maandelijkse afroming liquiditeit", "RCDT", "BOOK", "INTERNAL_TRANSFER", "INTC", 305641.55)
      ]}
    ],
    aggregates: { periodTotals: { totalCredits: { value: 1425300.00, currency: "EUR" }, totalDebits: { value: 1362800.00, currency: "EUR" }, netCashFlow: { value: 62500.00, currency: "EUR" } } }
  },
  "110034567": {
    accounts: [
      { iban: "NL03RABO0345678901", currency: "EUR", accountType: "CURRENT", openingBalance: { value: 1854.20, currency: "EUR" }, closingBalance: { value: 2310.45, currency: "EUR" }, transactions: [
        tx("RABO-2026-0729-000633891", null, "2026-07-29", -87.63, "DBIT", "Albert Heijn 1626 AMSTERDAM", null, null, "Betaalautomaat pasnr 003", "CCRD", "POSD", "CARD_PAYMENT", null, 2310.45),
        tx("RABO-2026-0728-000633412", "E2E-VF-2026-3312", "2026-07-28", -112.38, "DBIT", "Vattenfall Klantenservice N.V.", "NL03INGB0000226655", "INGBNL2A", "Termijnbedrag energie juli 2026", "RDDT", "ESDD", "SEPA_DD_CORE", null, 2398.08),
        tx("RABO-2026-0725-000632514", "E2E-SAL-2026-07-EB", "2026-07-25", 3850.00, "CRDT", "Bloembinderij Rozengracht B.V.", "NL89INGB0003217654", "INGBNL2A", "Salaris juli 2026 medewerker 00113", "RCDT", "ESCT", "SEPA_CT", "SALA", 2650.46),
        tx("RABO-2026-0701-000626020", "E2E-EH-2026-07", "2026-07-01", -1450.00, "DBIT", "Woningstichting Eigen Haard", "NL32ABNA0242244777", "ABNANL2A", "Huur Rozengracht 148-2 juli 2026", "ICDT", "ESCT", "SEPA_CT", "RENT", -1199.54)
      ]},
      { iban: "NL72RABO0139876542", currency: "EUR", accountType: "SAVINGS", openingBalance: { value: 12000.00, currency: "EUR" }, closingBalance: { value: 15450.75, currency: "EUR" }, transactions: [
        tx("RABO-2026-0705-000712230", null, "2026-07-05", 200.00, "CRDT", "E.J. van den Berg", "NL03RABO0345678901", "RABONL2U", "Automatisch sparen juli", "RCDT", "BOOK", "INTERNAL_TRANSFER", null, 15450.75)
      ]}
    ],
    aggregates: { periodTotals: { totalCredits: { value: 152807.00, currency: "EUR" }, totalDebits: { value: 148900.00, currency: "EUR" }, netCashFlow: { value: 3907.00, currency: "EUR" } },
      incomeIndicators: { recurringSalaryDetected: true, averageMonthlySalary: { value: 3850.00, currency: "EUR" }, salaryCounterpartyName: "Bloembinderij Rozengracht B.V." } }
  },
  "110045678": {
    accounts: [
      { iban: "NL32RABO0187654321", currency: "EUR", accountType: "CURRENT", openingBalance: { value: 42180.30, currency: "EUR" }, closingBalance: { value: -42120.25, currency: "EUR" }, transactions: [
        tx("RABO-2026-0729-000855120", "E2E-INV-2026-0455", "2026-07-29", 12500.00, "CRDT", "Bouwbedrijf Kerkhof B.V.", "NL27RABO0155667788", "RABONL2U", "Factuur 2026-0455 transport bouwmaterialen", "RCDT", "ESCT", "SEPA_CT", "SUPP", -42120.25),
        tx("RABO-2026-0728-000854783", "E2E-SFS-2026-2201", "2026-07-28", -9800.00, "DBIT", "Shell Fleet Solutions B.V.", "NL98ABNA0611223344", "ABNANL2A", "Brandstof wagenpark periode 2026-07", "RDDT", "ESDD", "SEPA_DD_B2B", null, -54620.25),
        tx("RABO-2026-0727-000854301", null, "2026-07-27", -5100.00, "DBIT", "Rabobank - Zakelijke Lening", "NL97RABO0334455667", "RABONL2U", "Termijn 063 lening RCL-0301 incl. achterstand deelbetaling", "ICDT", "BOOK", "INTERNAL_TRANSFER", "LOAN", -44820.25),
        tx("RABO-2026-0727-000854188", "E2E-SAL-2026-07-VD", "2026-07-27", -26400.00, "DBIT", null, null, null, "Salarisrun 2026-07, 11 medewerkers", "ICDT", "ESCT", "SEPA_CT", "SALA", -39720.25),
        tx("RABO-2026-0724-000853590", "E2E-INV-2026-0448", "2026-07-24", 8200.00, "CRDT", "Distrifresh Logistics B.V.", "NL36INGB0007654321", "INGBNL2A", "Factuur 2026-0448 gekoeld transport", "RCDT", "ESCT", "SEPA_CT", "SUPP", -13320.25)
      ]}
    ],
    aggregates: { periodTotals: { totalCredits: { value: 1580200.00, currency: "EUR" }, totalDebits: { value: 1664500.55, currency: "EUR" }, netCashFlow: { value: -84300.55, currency: "EUR" } } }
  }
};

module.exports = { customers, siebelIndex, riskProfiles, transactions, exitedCustomer, sanctionsBlockedCustomer, prospectNoRatingCustomer };
