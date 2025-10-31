# Privacy Policy - Analytics & Data Collection

## Analytics Data Collection

### What We Collect

Discord SpyWatcher collects usage analytics to improve the application and understand how users interact with our features. The following data may be collected:

#### With Your Consent (Opt-in)
When you accept analytics tracking:
- **User Identifier**: Your user ID for correlating events
- **Session Information**: Session IDs to track user journeys
- **Usage Data**:
  - Pages you visit
  - Features you use
  - Buttons you click
  - Forms you submit
- **Technical Data**:
  - IP address (for geographic insights)
  - Browser user agent
  - Referrer URLs
  - Response times and performance metrics

#### Without Consent (Anonymized)
When you decline or haven't provided consent:
- **Anonymized Events**: All events are tracked but personal identifiers are hashed
- **Performance Metrics**: Aggregated response times and system performance
- **Error Events**: Anonymized error tracking for debugging

### What We Don't Collect

We DO NOT collect:
- Message content
- Private conversations
- Passwords or credentials
- Financial information
- Contact information beyond Discord profile
- Sensitive personal information

## How We Use Analytics

### Primary Purposes
1. **Feature Improvement**: Understand which features are most valuable
2. **Performance Optimization**: Identify and fix slow endpoints
3. **Error Detection**: Catch and resolve bugs faster
4. **User Experience**: Improve navigation and interface design
5. **Capacity Planning**: Understand usage patterns for scaling

### Secondary Purposes
- Generating aggregated, anonymized statistics
- Creating usage reports for transparency
- Research and development

## Your Rights & Choices

### Consent Management
You have complete control over analytics tracking:

**Opt-In**: Accept the consent banner to help improve the application
**Opt-Out**: Decline the consent banner for anonymized tracking only
**Change Consent**: Access Settings > Privacy to update your preferences

### Your Rights Under GDPR
If you are in the European Union, you have the right to:

1. **Right to Access**: Request a copy of your analytics data
2. **Right to Rectification**: Correct inaccurate data
3. **Right to Erasure**: Request deletion of your data
4. **Right to Restrict Processing**: Limit how we process your data
5. **Right to Data Portability**: Receive your data in a structured format
6. **Right to Object**: Object to processing of your data
7. **Right to Withdraw Consent**: Change your consent status at any time

### Exercising Your Rights
To exercise any of these rights:
1. Navigate to Settings > Privacy in the application
2. Use the data export feature
3. Submit a data deletion request
4. Contact us at [contact email]

## Data Storage & Security

### Where Data is Stored
Analytics data is stored:
- In our secure PostgreSQL database
- Encrypted at rest
- Accessible only to authorized personnel
- Located in [specify region/provider]

### How Long We Keep Data
- **Raw Analytics Events**: 90 days by default (configurable)
- **Aggregated Summaries**: Indefinitely (anonymized)
- **Deleted Account Data**: Removed within 30 days

### Security Measures
We protect your data with:
- Encryption in transit (HTTPS/TLS)
- Encryption at rest
- Access controls and authentication
- Regular security audits
- Automated data retention policies
- Secure backup procedures

## Data Sharing & Third Parties

### We DO NOT:
- Sell your analytics data to third parties
- Share personal data with advertisers
- Use your data for marketing without consent
- Transfer data outside our processing purposes

### We MAY Share:
- Anonymized, aggregated statistics publicly
- Data with service providers (hosting, monitoring)
- Data when legally required (court orders, etc.)

### Service Providers
We use the following services that may have access to aggregated data:
- **Hosting Provider**: [Provider name] - Data hosting
- **Monitoring Service**: Sentry - Error tracking
- **Metrics Service**: Prometheus - Performance monitoring

All service providers are contractually bound to protect your data.

## Anonymization Technology

### How We Anonymize
When you decline consent or before data retention expires:

1. **Hashing**: Personal identifiers are converted using SHA-256 cryptographic hash
2. **Truncation**: Hash values are truncated to 16 characters
3. **Irreversible**: Cannot be reversed to original values
4. **Consistent**: Same input produces same hash for analytics correlation

### Example
```
Original:   user-id-12345
Hashed:     8d969eef6ecad3c2
```

### What Remains Anonymous
- Event types (page views, clicks)
- Feature usage patterns
- Performance metrics
- Error patterns
- Timestamp information

## Cookies & Tracking Technologies

### Cookies We Use

**Analytics Consent Cookie**
- Name: `analyticsConsent`
- Purpose: Remember your consent choice
- Duration: 1 year
- Type: First-party, necessary for consent management

**Session Cookie**
- Name: [session cookie name]
- Purpose: Maintain your login session
- Duration: Session
- Type: First-party, necessary for authentication

### Local Storage
We use browser local storage for:
- Analytics consent preferences
- User interface preferences
- Temporary caching

### No Third-Party Trackers
We do not use:
- Google Analytics
- Facebook Pixel
- Advertising networks
- Cross-site trackers

## Children's Privacy

Discord SpyWatcher is not intended for users under 13 years of age. We do not knowingly collect analytics data from children under 13.

If you believe we have collected data from a child under 13:
1. Contact us immediately
2. Provide the relevant user information
3. We will delete the data within 24 hours

## International Data Transfers

If you access our service from outside [primary region]:
- Your data may be transferred to and processed in [region]
- We comply with GDPR for EU users
- Standard contractual clauses are used for data transfers
- Appropriate safeguards are in place

## Changes to Privacy Policy

### How We Notify Changes
- Email notification to registered users
- In-app notification banner
- Updated "Last Modified" date on this page
- Consent re-request for material changes

### Your Options
When we make material changes:
1. Review the updated policy
2. Accept or decline the new terms
3. Contact us with questions
4. Export or delete your data

## Contact Information

### Privacy Questions
For questions about this privacy policy or our analytics practices:

**Email**: [privacy@example.com]
**Data Protection Officer**: [name/email if applicable]
**Address**: [physical address if applicable]

### Response Time
We aim to respond to privacy inquiries within:
- General questions: 7 business days
- Data access requests: 30 days
- Data deletion requests: 30 days
- Urgent matters: 48 hours

## Compliance

### Standards We Follow
- **GDPR**: General Data Protection Regulation (EU)
- **CCPA**: California Consumer Privacy Act
- **Privacy Shield**: [If applicable]
- **Industry Best Practices**: OWASP, NIST frameworks

### Regular Audits
We conduct:
- Annual privacy policy reviews
- Quarterly security assessments
- Regular data retention cleanups
- Compliance verification checks

## Transparency

### Analytics Dashboard
View aggregated, anonymized analytics:
- Navigate to `/metrics` in the application
- Requires authentication
- Shows anonymized usage patterns
- No personal data exposed

### Data Access
Request your personal analytics data:
1. Go to Settings > Privacy
2. Click "Request Data Export"
3. Receive download link within 30 days
4. Data provided in JSON format

### Public Reports
We may publish:
- Quarterly usage statistics (anonymized)
- Feature adoption reports
- Performance benchmarks
- No individual user data

## Best Practices for Users

### Maximize Privacy
To minimize data collection:
1. Decline analytics consent
2. Use private browsing mode
3. Clear cookies regularly
4. Review privacy settings periodically

### Report Concerns
If you believe your privacy has been violated:
1. Contact us immediately
2. Provide specific details
3. We investigate within 48 hours
4. Remediation actions taken promptly

## Glossary

**Anonymization**: Process of removing personal identifiers from data

**Consent**: Explicit permission to collect and process your data

**Personal Data**: Any information relating to an identified or identifiable person

**Processing**: Any operation performed on data (collection, storage, use, deletion)

**Pseudonymization**: Replacing identifiers with artificial identifiers (hashing)

**Data Subject**: Individual whose personal data is processed

**Data Controller**: Entity that determines purposes of data processing

**Data Processor**: Entity that processes data on behalf of controller

---

**Last Modified**: [Current Date]

**Version**: 1.0

**Effective Date**: [Date]

By using Discord SpyWatcher, you acknowledge that you have read and understood this Privacy Policy regarding analytics and data collection.
