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

## Getting Started

### Quick Start
1. Open `index.html` in any modern web browser
2. Add your family members and their expected healthcare usage
3. Add insurance plans you're considering
4. Compare total annual costs across all plans

### Adding Family Members
1. Click "Add Person" 
2. Enter their name
3. Fill in expected annual visits for each type of care
4. Add any medications with tiers and refill frequency

### Adding Insurance Plans
1. Click "Add Plan"
2. Enter plan details manually, or
3. Use "Add using LLM" for AI-assisted import:
   - Copy the generated prompt
   - Upload your plan's SBC document to an AI assistant
   - Paste the JSON response back into the tool

### Using Scenarios
1. Click "Enable Scenarios"
2. Switch between Best Case, Most Likely, and Worst Case
3. Adjust healthcare usage for each scenario
4. Compare plan costs across all scenarios

## Technical Details

### Built With
- **React 18**: Modern UI framework
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Beautiful iconography
- **Local Storage API**: Browser-based data persistence
- **Vanilla JavaScript**: No build process required

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### File Structure
```
healthcarecompare/
├── index.html          # Main application file
├── README.md           # This file
└── icon.png           # Social media preview image (optional)
```

## Data Privacy

- **No Server**: All data stays in your browser
- **Local Storage Only**: Nothing is transmitted over the internet
- **Export Control**: You control all data exports
- **No Tracking**: No analytics or tracking scripts

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

This is a single-file application designed for simplicity and portability. To modify:

1. Open `index.html` in a text editor
2. Modify the React components within the `<script type="text/babel">` section
3. Test in a browser
4. Share your improvements!

## License

Open source - feel free to use, modify, and distribute.

## Support

For questions or issues:
1. Check the built-in help tooltips
2. Review this README
3. Examine the code comments in `index.html`

## Roadmap

Potential future enhancements:
- [ ] HSA/FSA account integration
- [ ] Provider network considerations
- [ ] Prescription drug lookup
- [ ] Multi-year projections
- [ ] PDF report generation
- [ ] Mobile app version

---

**Disclaimer**: This tool provides estimates based on your inputs. Actual healthcare costs may vary. Always consult with insurance providers and healthcare professionals for official cost information.