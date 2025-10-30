# Health Care Compare

A comprehensive web application for comparing health insurance plans with detailed cost calculations. Calculate and compare annual healthcare costs including premiums, copays, medications, and medical visits for your entire family.

## Features

### 🏥 Family Member Management
- Add multiple family members
- Track annual medical visits for each person:
  - Primary care visits
  - Specialist visits
  - Urgent care visits
  - Emergency room visits
  - Mental health visits
  - Diagnostic tests
  - Imaging (X-rays, MRIs, etc.)
  - Rehabilitation services
  - Habilitation services

### 💊 Medication Tracking
- Add medications for each family member
- Specify medication tiers (1-5)
- Set refills per year
- Option to use custom medication costs
- Automatically calculates costs based on plan formulary

### 📊 Insurance Plan Comparison
- Add unlimited insurance plans
- Comprehensive plan details:
  - Monthly premiums
  - Medical and prescription deductibles
  - Out-of-pocket maximums
  - Copays for all service types
  - Coinsurance percentages
  - Prescription drug tier costs
  - Special benefits (dental, vision)

### 🎯 Scenario Planning
- **Most Likely Scenario**: Your expected healthcare usage
- **Best Case Scenario**: Reduced healthcare needs (50-70% of expected)
- **Worst Case Scenario**: Increased healthcare needs (additional visits)
- Compare costs across all scenarios to understand potential ranges

### 🤖 AI-Powered Plan Import
- Generate prompts for AI assistants (ChatGPT, Claude, etc.)
- Import plan data from Summary of Benefits and Coverage (SBC) documents
- Structured JSON format for accurate data extraction
- Automated plan creation from AI-generated data

### 📁 Data Management
- **Local Storage**: All data saved automatically in your browser
- **Export/Import**: Save and load individual family members or plans
- **Bulk Operations**: Export all data or clear everything
- **JSON Format**: Standard format for easy data portability

### 🔍 Detailed Cost Analysis
- Annual cost breakdowns by category
- Per-person cost calculations
- Medication cost analysis with tier-based pricing
- Visit cost summaries
- Total cost comparisons across plans


## Data Privacy

- **No Server**: All data stays in your browser
- **Local Storage Only**: Nothing is transmitted over the internet
- **Export Control**: You control all data exports
- **No Tracking**: No analytics or tracking scripts
- **GDPR Compliant**: No cookies, no personal data collection
- **Open Source**: Fully auditable code

## Cost Calculation Details

### Premium Costs
- Monthly premium × 12 months

### Medical Visit Costs
- Visits × copay amount per visit type
- Imaging costs use coinsurance on assumed $200 base cost

### Medication Costs
- **Tiers 1-2**: Fixed copay × refills per year
- **Tiers 3-5**: Coinsurance × assumed drug cost × refills
- **Custom Costs**: User-specified cost × refills
- **Deductible Waived**: Some tiers may waive prescription deductible

### Scenarios
- **Best Case**: 20-70% reduction in expected visits
- **Most Likely**: Your baseline estimates
- **Worst Case**: Additional visits added to baseline

## Contributing

We welcome contributions! See **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)** for guidelines.


## License

This project is licensed under the **Polyform Noncommercial License 1.0.0**.

You may use, copy, modify, and distribute this software for noncommercial purposes. Commercial use, including selling, offering paid services based on it, or using it within commercial products, is not permitted.

See the [LICENSE](LICENSE) file for the full license text, or visit [https://polyformproject.org/licenses/noncommercial/1.0.0/](https://polyformproject.org/licenses/noncommercial/1.0.0/)

---

**Disclaimer**: This tool provides estimates based on your inputs. Actual healthcare costs may vary. Always consult with insurance providers and healthcare professionals for official cost information.