# IP Blocking

Advanced IP-based access control and network security features for Spywatcher.

## Overview

IP blocking provides network-level security controls:

- **IP Blacklisting**: Block malicious IPs and ranges
- **IP Whitelisting**: Allow trusted IPs to bypass restrictions
- **GeoIP Blocking**: Geographic access control
- **Proxy Detection**: Block VPNs, proxies, and Tor
- **Rate Limiting**: Per-IP rate limits
- **DDoS Protection**: Automatic threat mitigation

## IP Address Management

### Understanding IP Types

**IPv4 Addresses**
```
Single IP: 192.0.2.1
CIDR Range: 192.0.2.0/24 (256 addresses)
Subnet Mask: 255.255.255.0
```

**IPv6 Addresses**
```
Single IP: 2001:0db8:85a3::8a2e:0370:7334
CIDR Range: 2001:0db8:85a3::/48
```

**Special IP Ranges**
- `127.0.0.1`: Localhost
- `10.0.0.0/8`: Private network
- `172.16.0.0/12`: Private network
- `192.168.0.0/16`: Private network

### IP Lookup

Look up IP address information:

**Admin Panel** → **IP Management** → **Lookup**

**Available Information:**
- Geographic location (country, city, region)
- ISP and organization
- Connection type (residential, datacenter, mobile)
- Threat intelligence data
- Proxy/VPN detection
- Historical access patterns
- Associated user accounts

**Example Lookup:**
```
IP Address: 203.0.113.42

Location:
  Country: United States
  City: San Francisco, CA
  Coordinates: 37.7749° N, 122.4194° W

Network:
  ISP: Example ISP Inc.
  Organization: Example Corp
  AS Number: AS15169
  Connection Type: Corporate

Security:
  Proxy: No
  VPN: No
  Tor Exit Node: No
  Known Threat: No
  Abuse Reports: 0

Activity:
  First Seen: 2024-01-15
  Last Seen: 2024-11-03
  Total Requests: 1,247
  Failed Logins: 2
  Associated Accounts: 3
```

## IP Blacklisting

### Adding IPs to Blacklist

Block specific IPs or ranges:

**Via Admin Panel:**

1. **Admin Panel** → **IP Management** → **Blacklist** → **Add**

2. Enter IP information:
   ```
   IP Address: 198.51.100.42
   OR
   IP Range (CIDR): 198.51.100.0/24
   ```

3. Configure block settings:
   ```
   Reason: Automated scraping detected
   Block Type: Hard / Soft
   Duration: Permanent / Temporary (specify)
   Priority: High / Medium / Low
   ```

4. Additional options:
   - Block subdomains
   - Block API access
   - Block WebSocket connections
   - Log all access attempts

5. Click **Add to Blacklist**

**Via API:**

```bash
POST /api/admin/ip-blocks
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "ipAddress": "198.51.100.42",
  "type": "blacklist",
  "reason": "Automated scraping detected",
  "duration": "PERMANENT",
  "blockType": "HARD"
}
```

### Blacklist Block Types

**Hard Block**
- Complete access denial
- All requests rejected (HTTP 403)
- No bypass possible
- Immediate effect
- Use for: Malicious IPs, attacks

**Soft Block**
- Rate limiting applied
- Requests throttled but not blocked
- Can be bypassed with authentication
- Gradual enforcement
- Use for: Suspicious IPs, monitoring

**Smart Block**
- Adaptive blocking based on behavior
- Escalates from soft to hard
- Automatic downgrade on good behavior
- Machine learning assisted
- Use for: Unknown threats, testing

### Viewing Blacklist

**Admin Panel** → **IP Management** → **Blacklist**

**Display Columns:**
- IP address or range
- Reason for block
- Block type
- Added by (admin)
- Date added
- Expiration date
- Hit count (blocked requests)
- Status (active/expired)

**Filter Options:**
- Block type (hard/soft/smart)
- Duration (permanent/temporary)
- Date range
- Added by admin
- Reason keywords
- Hit count threshold

**Bulk Actions:**
- Export blacklist
- Remove expired entries
- Convert block types
- Extend duration
- Remove multiple entries

### Managing Blacklist Entries

**Edit Entry:**
1. Select IP → **Actions** → **Edit**
2. Modify settings
3. Add edit reason
4. Save changes

**Remove from Blacklist:**
1. Select IP → **Actions** → **Remove**
2. Provide removal reason
3. Confirm removal
4. Optional: Add to whitelist

**Temporary to Permanent:**
1. Select temporary block
2. **Actions** → **Make Permanent**
3. Confirm conversion

## IP Whitelisting

### Adding Trusted IPs

Exempt IPs from restrictions:

**Via Admin Panel:**

1. **Admin Panel** → **IP Management** → **Whitelist** → **Add**

2. Enter whitelist details:
   ```
   IP Address: 203.0.113.10
   OR
   IP Range: 203.0.113.0/24
   ```

3. Configure whitelist settings:
   ```
   Label: Corporate Office Network
   Reason: Trusted internal network
   Priority: High
   Bypass Rate Limits: Yes
   Bypass Blacklist: Yes
   Expires: Never / Date
   ```

4. Set exemptions:
   - Bypass rate limiting
   - Bypass IP blacklist
   - Bypass auto-ban rules
   - Bypass GeoIP blocks
   - Bypass proxy detection

5. Click **Add to Whitelist**

::: tip Priority System
Higher priority whitelist entries override lower priority blacklist entries.
:::

### Whitelist Use Cases

**Corporate Networks**
```
IP Range: 203.0.113.0/24
Label: HQ Office Network
Priority: High
Bypass: All restrictions
```

**Partner Organizations**
```
IP Range: 198.51.100.0/28
Label: Partner Corp API Access
Priority: Medium
Bypass: Rate limits, some security rules
```

**Development/Testing**
```
IP Range: 192.168.1.0/24
Label: Internal Dev Network
Priority: High
Bypass: All restrictions
```

**VIP Users**
```
IPs: Multiple specific IPs
Label: Premium Support Customers
Priority: Medium
Bypass: Basic rate limits
```

### Managing Whitelist

**View Whitelist:**
**Admin Panel** → **IP Management** → **Whitelist**

**Actions:**
- Edit whitelist entry
- Remove from whitelist
- Extend expiration
- Adjust priority
- View access logs

## GeoIP Blocking

### Geographic Access Control

Block or allow access by country:

**Admin Panel** → **Settings** → **GeoIP Blocking**

### Country Blocking

**Block Specific Countries:**

```yaml
Mode: Blacklist (block selected)

Blocked Countries:
  - CN (China)
  - RU (Russia)
  - KP (North Korea)

Action: Block access
Show Message: "Access from your country is restricted"
```

**Allow Specific Countries:**

```yaml
Mode: Whitelist (allow only selected)

Allowed Countries:
  - US (United States)
  - CA (Canada)
  - GB (United Kingdom)
  - AU (Australia)

Action: Block all others
Show Message: "Service not available in your region"
```

### Regional Blocking

Block by continent or region:

```yaml
Blocked Regions:
  - Asia/Pacific (excluding Japan, South Korea)
  - Eastern Europe
  - Middle East

Allowed Regions:
  - North America
  - Western Europe
  - Oceania
```

### GeoIP Exceptions

Create exceptions to geographic rules:

**Whitelist Exceptions:**
- Specific IPs in blocked countries
- Known VPNs for staff
- Partner organizations
- Testing accounts

**Example:**
```yaml
Block Country: CN (China)

Exceptions:
  - 203.0.113.0/24 (Partner office in Beijing)
  - VPN provider for remote staff
  - Testing account: test@example.com
```

## Proxy and VPN Detection

### Detection Settings

Configure proxy/VPN detection:

**Admin Panel** → **Settings** → **Proxy Detection**

**Detection Methods:**

**Commercial VPNs**
```yaml
Detect: Yes
Action: Block / Flag / Monitor
Known VPN Providers: NordVPN, ExpressVPN, etc.
Confidence Threshold: 80%
```

**Data Center IPs**
```yaml
Detect: Yes
Action: Flag (soft block)
Providers: AWS, DigitalOcean, Azure, GCP
Allow Whitelisted: Yes
```

**Tor Exit Nodes**
```yaml
Detect: Yes
Action: Block
Update Frequency: Hourly
Block List: Tor Project official
```

**Web Proxies**
```yaml
Detect: Yes
Action: Block
Types: HTTP, HTTPS, SOCKS5
Check Headers: X-Forwarded-For, Via, Proxy
```

**Residential Proxies**
```yaml
Detect: Attempt (hard to detect)
Action: Monitor and flag
Behavioral Analysis: Yes
ML Detection: Enabled
```

### Proxy Detection Actions

**Block**
- Complete access denial
- Clear error message
- Log detection event

**Flag**
- Allow access
- Mark in logs
- Trigger additional monitoring
- Require additional verification

**Monitor**
- Allow access
- Log for analysis
- No user impact
- Build detection database

**Challenge**
- Present CAPTCHA
- Require email verification
- Two-factor authentication
- Additional security questions

### Managing Detected Proxies

**View Detections:**
**Admin Panel** → **IP Management** → **Proxy Detections**

**Detection Log:**
- IP address
- Detection type (VPN, Tor, Proxy)
- Confidence score
- Detection method
- User account (if authenticated)
- Action taken
- Timestamp

**Bulk Actions:**
- Add to blacklist
- Add to whitelist (false positives)
- Apply custom action
- Export detection log

## Rate Limiting by IP

### Per-IP Rate Limits

Configure rate limits per IP address:

**Admin Panel** → **Settings** → **Rate Limiting** → **IP-Based**

**Global IP Limits:**
```yaml
Unauthenticated Requests:
  Limit: 100 requests per 15 minutes
  Burst: 20 requests
  Block Duration: 15 minutes

Authenticated Requests:
  Limit: 1000 requests per 15 minutes
  Burst: 50 requests
  Block Duration: 5 minutes

API Endpoints:
  Limit: 60 requests per minute
  Burst: 10 requests
  Block Duration: 1 minute
```

### Dynamic Rate Limiting

Adjust limits based on behavior:

**Good Behavior:**
- Increase limits gradually
- Reward compliance
- Extend burst capacity
- Reduce cooldown time

**Bad Behavior:**
- Decrease limits
- Increase cooldown
- Reduce burst capacity
- Escalate to temporary ban

**Configuration:**
```yaml
Dynamic Rate Limiting:
  Enabled: Yes
  
  Good Behavior Rewards:
    Threshold: 1000 requests without errors
    Limit Increase: 20%
    Duration: 24 hours
  
  Bad Behavior Penalties:
    Threshold: 50 errors or rate limit hits
    Limit Decrease: 50%
    Duration: 1 hour
    Escalation: Temp ban after 3 strikes
```

### Rate Limit Monitoring

**View Rate Limit Stats:**
**Admin Panel** → **Analytics** → **Rate Limits**

**Metrics:**
- Top IPs by request count
- Rate limit violations
- Average requests per IP
- Burst usage patterns
- Block frequency

**Alerts:**
- IP exceeding limits
- Sustained high traffic
- Unusual patterns
- Potential attacks

## DDoS Protection

### Automatic DDoS Mitigation

Built-in DDoS protection:

**Admin Panel** → **Settings** → **DDoS Protection**

**Protection Levels:**

**Level 1: Low (Monitor Only)**
```yaml
Detection: Yes
Mitigation: No
Alerting: Yes
```

**Level 2: Medium (Automatic)**
```yaml
Detection: Yes
Mitigation: Rate limiting + challenges
Automatic IP blocks: Temporary (1 hour)
```

**Level 3: High (Aggressive)**
```yaml
Detection: Yes
Mitigation: Aggressive rate limiting
Automatic IP blocks: Permanent
Challenge: All requests
```

**Level 4: Lockdown**
```yaml
Detection: Yes
Mitigation: Whitelist-only mode
Automatic IP blocks: Permanent
Challenge: Required + manual review
```

### DDoS Detection

**Detection Criteria:**

**Request Volume**
```yaml
Threshold: 1000 requests/second
Window: 10 seconds
Action: Enable Level 2
```

**Error Rate**
```yaml
Threshold: 50% errors
Window: 1 minute
Action: Enable Level 2
```

**Pattern Recognition**
```yaml
Repeated patterns in:
  - User agents
  - Request URLs
  - Request timing
Action: Flag as bot attack
```

**Geographic Clustering**
```yaml
Same country flood: 80%+ requests
Window: 5 minutes
Action: Enable GeoIP blocking
```

### Mitigation Actions

**During Attack:**

1. **Automatic Response:**
   - Enable higher protection level
   - Block attacking IPs
   - Enable challenges
   - Notify administrators

2. **Manual Response:**
   - Review attack patterns
   - Adjust protection level
   - Add IP ranges to blacklist
   - Enable GeoIP blocks
   - Contact upstream provider

3. **Communication:**
   - Status page update
   - User notification
   - Social media announcement

**After Attack:**

1. **Analysis:**
   - Review attack logs
   - Identify vulnerabilities
   - Document attack pattern
   - Update detection rules

2. **Hardening:**
   - Adjust rate limits
   - Update blacklists
   - Improve detection
   - Test mitigation

## Advanced Features

### IP Reputation System

Track IP reputation scores:

**Scoring Factors:**
- Failed login attempts
- Rate limit violations
- Error rates
- Abuse reports
- Time since first seen

**Reputation Levels:**
- **Trusted** (90-100): No restrictions
- **Good** (70-89): Normal limits
- **Neutral** (40-69): Standard monitoring
- **Suspicious** (20-39): Enhanced monitoring
- **Bad** (0-19): Strict limits or block

**Auto-Actions by Reputation:**
```yaml
Trusted (90-100):
  Rate Limits: 200% of normal
  Challenges: Never
  
Good (70-89):
  Rate Limits: Normal
  Challenges: Rarely

Neutral (40-69):
  Rate Limits: Normal
  Challenges: Sometimes

Suspicious (20-39):
  Rate Limits: 50% of normal
  Challenges: Often
  Monitoring: Enhanced

Bad (0-19):
  Rate Limits: 25% of normal
  Challenges: Always
  Action: Consider blocking
```

### IP Intelligence Integration

Integrate threat intelligence feeds:

**Supported Feeds:**
- AbuseIPDB
- IPQualityScore
- Spamhaus
- MaxMind GeoIP2
- Custom feeds

**Configuration:**
```yaml
Threat Intelligence:
  Enabled: Yes
  
  Feeds:
    - AbuseIPDB:
        API Key: your_key_here
        Confidence Threshold: 75
        Check Frequency: On first request
    
    - Spamhaus:
        Lists: [DROP, EDROP, ASN-DROP]
        Update: Daily
    
  Actions:
    High Confidence (90%+): Auto-block
    Medium Confidence (70-89%): Flag and monitor
    Low Confidence (<70%): Log only
```

## Best Practices

### IP Management Best Practices

✅ **Do:**
- Regularly review blacklist for expired entries
- Keep whitelist up-to-date
- Monitor rate limit effectiveness
- Use smart blocks for testing
- Document all manual blocks
- Test GeoIP rules thoroughly
- Review DDoS protection levels
- Keep threat intelligence updated

❌ **Don't:**
- Block large IP ranges unnecessarily
- Ignore false positives
- Block shared IPs without consideration
- Forget to whitelist corporate networks
- Disable DDoS protection
- Ignore reputation scores
- Block without logging
- Skip whitelist expiration dates

### When to Use Each Feature

**IP Blacklist:**
- Known malicious IPs
- Repeated attacks
- Abuse sources
- Bot networks

**IP Whitelist:**
- Corporate networks
- Partner organizations
- VIP customers
- Testing environments

**GeoIP Blocking:**
- Regulatory compliance
- Service availability
- Targeted attacks
- Regional restrictions

**Proxy Detection:**
- Terms of service enforcement
- Fraud prevention
- Account security
- Usage tracking

**Rate Limiting:**
- API protection
- Resource management
- Fair usage
- DDoS mitigation

## Troubleshooting

### Legitimate Users Blocked

**Symptoms:**
- Valid users reporting access denied
- Whitelist not working
- Corporate network blocked

**Solutions:**
1. Check IP against blacklist
2. Verify whitelist entries
3. Check GeoIP settings
4. Review auto-ban rules
5. Check rate limits
6. Verify IP priority settings
7. Add to whitelist if needed

### DDoS False Positives

**Symptoms:**
- Legitimate traffic flagged as attack
- Users experiencing challenges
- Rate limits too aggressive

**Solutions:**
1. Lower DDoS protection level
2. Add legitimate IPs to whitelist
3. Adjust detection thresholds
4. Review traffic patterns
5. Whitelist user agents
6. Adjust rate limits
7. Consider CDN/proxy configuration

### GeoIP Incorrect Location

**Symptoms:**
- Users blocked from wrong country
- Location data inaccurate
- VPN detected incorrectly

**Solutions:**
1. Update GeoIP database
2. Check IP lookup results
3. Add IP to exception list
4. Verify GeoIP provider
5. Consider multiple providers
6. Manual override for known IPs

## Related Documentation

- [Ban Management](./ban-management) - User banning
- [Security Settings](./security) - Overall security
- [Rate Limiting](./rate-limiting) - Rate limit configuration
- [Monitoring](./monitoring) - Security monitoring
- [Incident Response](./incident-response) - Handling attacks

---

::: tip Need Help?
For additional support, check the [troubleshooting guide](/guide/troubleshooting) or open an issue on [GitHub](https://github.com/subculture-collective/discord-spywatcher/issues).
:::
