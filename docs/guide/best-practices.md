# Best Practices

Learn the best practices for using Spywatcher effectively and responsibly to monitor and manage your Discord community.

## General Guidelines

### Respect User Privacy

**Principle: Transparency First**

Always be transparent with your community about monitoring:

```markdown
# Example Server Rules Section
🔍 **Server Monitoring**
This server uses Spywatcher for analytics and security:
- We track presence and activity patterns
- Message counts are recorded (not content)
- Data is used to improve server management
- All data is stored securely and privately
- Users can request data deletion
```

**What to Do:**
- ✅ Inform users about monitoring in server rules
- ✅ Provide a privacy policy
- ✅ Allow users to opt out or request data deletion
- ✅ Use data only for legitimate server management
- ✅ Protect user data with appropriate security measures

**What NOT to Do:**
- ❌ Monitor without user knowledge
- ❌ Share user data with third parties without consent
- ❌ Use data for harassment or discrimination
- ❌ Collect more data than necessary
- ❌ Keep data longer than needed

### Set Appropriate Permissions

**Principle: Least Privilege**

Grant Spywatcher access only to those who need it:

```javascript
// Recommended Permission Structure
{
  "Roles": {
    "Server Owner": "Full Access",
    "Administrators": "Full Access",
    "Senior Moderators": "View + Export",
    "Moderators": "View Only",
    "Everyone Else": "No Access"
  }
}
```

**Permission Levels:**

1. **View Only**
   - See dashboard and analytics
   - Cannot modify settings
   - Cannot ban users
   - Cannot export data

2. **View + Export**
   - View only permissions
   - Export reports
   - Create custom filters
   - Save dashboard layouts

3. **Full Access**
   - All view permissions
   - Modify settings
   - Manage bans
   - Configure alerts
   - Manage other users

### Regular Data Audits

**Principle: Data Minimization**

Regularly review and clean up unnecessary data:

**Monthly Tasks:**
- Review data retention settings
- Archive old, unused data
- Check for anomalies in data collection
- Verify compliance with privacy policies

**Quarterly Tasks:**
- Audit user access permissions
- Review and update privacy notices
- Clean up old exports and reports
- Update security configurations

**Annually:**
- Complete security assessment
- Review all stored data
- Update terms and privacy policy
- Training for moderators on proper use

## Analytics Best Practices

### Understanding Your Data

**Start with Questions**

Before diving into analytics, define what you want to learn:

Good Questions:
- "When are users most active?"
- "Which channels have the most engagement?"
- "Are new members sticking around?"
- "What's our member growth rate?"
- "Which roles are most active?"

**Avoid Analysis Paralysis**

Focus on actionable insights:

```javascript
// Good: Actionable insight
"Peak activity is 8-10 PM EST"
→ Action: Schedule events at 8 PM EST

// Bad: Interesting but not actionable
"User #12345 was online 47.3% of the time last week"
→ Action: ??? (not clear what to do)
```

### Interpreting Metrics Correctly

**Context Matters**

Always consider context when interpreting data:

| Metric | Good Context | Bad Context |
|--------|--------------|-------------|
| **Low Activity** | Off-peak hours (expected) | Prime time (investigate) |
| **High Ghost Count** | New server (normal) | Established server (concern) |
| **Suspicion Spike** | Raid or bot attack | Individual user behavior |

**Avoid Common Mistakes:**

1. **Correlation ≠ Causation**
   - Just because two metrics change together doesn't mean one causes the other
   - Look for actual causal relationships

2. **Sample Size Matters**
   - Don't draw conclusions from small datasets
   - Wait for sufficient data (at least 30 days recommended)

3. **Consider Seasonality**
   - Activity varies by day of week
   - Consider holidays and events
   - Account for school schedules, work cycles

### Acting on Insights

**Data-Driven Decisions**

Use analytics to inform your actions:

**Example 1: Optimal Event Timing**
```
Analysis: Heatmap shows peak activity 8-10 PM EST
Action: Schedule weekly events at 8:30 PM EST
Measure: Track event attendance over 4 weeks
Result: 40% increase in participation
```

**Example 2: Channel Optimization**
```
Analysis: 3 channels have <1% of total messages
Action: Archive or consolidate underused channels
Measure: Overall channel engagement rate
Result: Increased engagement in remaining channels
```

**Example 3: Role Balancing**
```
Analysis: 80% of users have default role only
Action: Create pathway for role progression
Measure: Role distribution over time
Result: More balanced role hierarchy
```

## Security Best Practices

### Ghost Detection

**When to Investigate:**

Investigate users with:
- High presence time but zero messages (30+ days)
- Only online during unusual hours (3-6 AM consistently)
- Multiple simultaneous clients without explanation
- Suspicious naming patterns
- Recently created accounts with high presence

**Investigation Process:**

1. **Review Timeline**
   - Check presence patterns
   - Look for activity spikes
   - Note unusual patterns

2. **Cross-Reference Data**
   - Compare with other ghost accounts
   - Check for coordinated activity
   - Review join date and invite source

3. **Take Appropriate Action**
   - False Positive: Clear and whitelist
   - Legitimate Lurker: Monitor but allow
   - Suspicious: Investigate further or ban
   - Bot Account: Ban immediately

**Avoid False Positives:**

Some legitimate users may appear as ghosts:
- Timezone differences (different active hours)
- Voice-only users (don't send messages)
- Mobile users (different presence patterns)
- Busy/shy users (observe but rarely participate)

### Suspicion Scores

**Score Thresholds:**

Recommended action thresholds:

```javascript
const actions = {
  0-40: "No action needed",
  41-60: "Monitor for patterns",
  61-75: "Investigate within 48 hours",
  76-90: "Investigate immediately",
  91-100: "Take immediate action"
};
```

**Investigation Workflow:**

```
High Suspicion Score Detected
        ↓
Review User Timeline
        ↓
Check Contributing Factors
        ↓
   Is it suspicious? ───Yes──→ Take Action
        ↓                           ↓
       No                      Ban/Warn/Monitor
        ↓
  Clear Alert & Whitelist
```

**Common False Positives:**

- VPN users (IP changes)
- Travelers (timezone changes)
- Device upgrades (client changes)
- Network issues (rapid reconnects)
- Legitimate power users (high activity)

### Ban Management

**Before Banning:**

1. **Gather Evidence**
   - Screenshots of behavior
   - Timeline analysis
   - Suspicion score factors
   - Other moderator observations

2. **Document Reason**
   - Clear policy violation
   - Specific incidents
   - Attempts at resolution
   - Escalation path followed

3. **Consider Alternatives**
   - Warning (first offense)
   - Temporary mute
   - Role restriction
   - Probation period

**After Banning:**

1. **Document the Ban**
   ```json
   {
     "user_id": "123456789",
     "banned_by": "Moderator Name",
     "reason": "Automated spam bot",
     "evidence": [
       "Suspicion score: 95",
       "1000+ messages in 1 hour",
       "Identical message content"
     ],
     "date": "2024-01-15",
     "appeal_eligible": false
   }
   ```

2. **Monitor for Patterns**
   - Are similar accounts appearing?
   - Is this part of a larger attack?
   - Do policies need updating?

3. **Review Process**
   - Was the ban justified?
   - What can be improved?
   - Update procedures if needed

## Performance Optimization

### Dashboard Loading

**Optimize for Speed:**

1. **Use Appropriate Date Ranges**
   ```
   Good:
   - Last 7 days for daily monitoring
   - Last 30 days for trend analysis
   - Last 90 days for quarterly reviews
   
   Avoid:
   - "All time" for daily use (slow)
   - Very specific small ranges (noisy data)
   ```

2. **Enable Caching**
   ```bash
   # Backend .env
   ENABLE_CACHING=true
   CACHE_TTL=300  # 5 minutes
   ```

3. **Limit Concurrent Requests**
   - Load one dashboard section at a time
   - Use pagination for large lists
   - Defer loading of non-critical data

### Data Management

**Keep Your Database Healthy:**

**Weekly:**
```bash
# Vacuum and analyze
npm run db:vacuum

# Check database size
npm run db:size
```

**Monthly:**
```bash
# Archive old data (>90 days)
npm run archive:old-data

# Rebuild indexes
npm run db:reindex

# Update statistics
npm run db:analyze
```

**Quarterly:**
```bash
# Full backup before maintenance
npm run db:backup

# Optimize tables
npm run db:optimize

# Clean up orphaned data
npm run db:cleanup
```

### Resource Monitoring

**Set Up Alerts:**

```yaml
alerts:
  - name: High CPU
    condition: cpu > 80%
    duration: 5 minutes
    action: alert_admins
    
  - name: Low Memory
    condition: memory < 10%
    duration: 1 minute
    action: restart_service
    
  - name: Database Full
    condition: disk > 90%
    duration: immediate
    action: critical_alert
    
  - name: Bot Offline
    condition: bot_status == offline
    duration: 1 minute
    action: restart_bot
```

**Monitor Key Metrics:**
- CPU usage
- Memory usage
- Disk space
- Database connections
- API response times
- Error rates
- Bot uptime

## Community Management

### Using Analytics for Growth

**Track Key Metrics:**

1. **Growth Metrics**
   - New members per week
   - Member retention rate (30/60/90 day)
   - Active user percentage
   - Message growth rate

2. **Engagement Metrics**
   - Messages per user per day
   - Active channels ratio
   - Voice chat participation
   - Event attendance

3. **Health Metrics**
   - Ghost account percentage
   - Average suspicion score
   - Ban rate
   - Dispute rate

### Improving Engagement

**Data-Driven Strategies:**

1. **Identify Peak Times**
   ```
   Use heatmap to find when most users are online
   → Schedule events and announcements accordingly
   → Ensure moderators are available during peaks
   ```

2. **Find Popular Content**
   ```
   Analyze which channels have most activity
   → Create more channels with similar themes
   → Promote successful content types
   → Archive or revamp inactive channels
   ```

3. **Recognize Active Members**
   ```
   Identify top contributors with analytics
   → Give recognition/roles
   → Encourage continued participation
   → Create incentives for engagement
   ```

### Moderator Workflows

**Daily Routine:**
```
Morning Check (5 minutes):
- Review overnight activity
- Check for new suspicion alerts
- Verify bot is online
- Quick scan of active users

Midday Review (10 minutes):
- Respond to any flags
- Review pending investigations
- Check for unusual patterns

Evening Wrap-up (15 minutes):
- Full suspicion review
- Update investigation notes
- Plan next day priorities
- Generate daily report
```

**Weekly Review:**
```
- Export weekly analytics report
- Review growth and engagement trends
- Update moderator notes
- Adjust monitoring thresholds if needed
- Team meeting to discuss findings
```

## Compliance and Legal

### GDPR Considerations

**User Rights:**

1. **Right to Access**
   - Users can request their data
   - Provide within 30 days
   - Include all stored information

2. **Right to Deletion**
   - Users can request data deletion
   - Remove within 30 days
   - Document the request

3. **Right to Portability**
   - Provide data in machine-readable format
   - JSON or CSV preferred
   - Include all personal data

**Implementation:**
```bash
# Export user data
npm run export:user-data --user=<discord_id>

# Delete user data
npm run delete:user-data --user=<discord_id> --confirm

# Anonymize instead of delete (if needed for analytics)
npm run anonymize:user-data --user=<discord_id>
```

### Data Protection

**Encryption:**
- ✅ Database encryption at rest
- ✅ TLS/SSL for all connections
- ✅ Encrypted backups
- ✅ Secure credential storage

**Access Control:**
- ✅ Role-based permissions
- ✅ Two-factor authentication for admins
- ✅ Audit logs for all access
- ✅ Regular access reviews

**Data Retention:**
```javascript
// Recommended retention policy
{
  "user_data": "Until account deletion + 30 days",
  "activity_logs": "90 days",
  "presence_data": "30 days",
  "analytics_aggregates": "2 years",
  "audit_logs": "1 year (legally required)",
  "backups": "30 days rolling"
}
```

## Emergency Procedures

### Handling a Raid

**If you detect a coordinated attack:**

1. **Immediate Actions (0-5 minutes)**
   ```
   - Enable slowmode in all channels
   - Restrict new member permissions
   - Enable verification requirements
   - Alert all moderators
   ```

2. **Identification (5-15 minutes)**
   ```
   - Check suspicion scores (will spike)
   - Look for account creation patterns
   - Identify similar usernames/avatars
   - Note join times and patterns
   ```

3. **Mitigation (15-30 minutes)**
   ```
   - Mass ban identified attackers
   - Lock vulnerable channels
   - Announce to community
   - Document the event
   ```

4. **Recovery (30+ minutes)**
   ```
   - Review all actions taken
   - Restore normal settings gradually
   - Thank moderators and community
   - Update security measures
   - Create post-incident report
   ```

### Data Breach Response

**If you suspect a security breach:**

1. **Contain**
   - Disconnect affected systems
   - Revoke compromised credentials
   - Enable additional authentication
   - Preserve logs and evidence

2. **Assess**
   - Determine scope of breach
   - Identify compromised data
   - Document everything
   - Consult security experts

3. **Notify**
   - Inform affected users
   - Report to relevant authorities (if required)
   - Notify hosting provider
   - Update community

4. **Recover**
   - Restore from backups if needed
   - Reset all credentials
   - Implement additional security
   - Monitor for further issues

## Quick Reference

### Daily Checklist
- [ ] Check bot status
- [ ] Review overnight suspicion alerts
- [ ] Scan for unusual activity patterns
- [ ] Respond to any flagged users

### Weekly Checklist
- [ ] Export weekly analytics report
- [ ] Review growth and engagement metrics
- [ ] Clean up old exports and temp data
- [ ] Update moderator documentation
- [ ] Team review meeting

### Monthly Checklist
- [ ] Archive old data (>90 days)
- [ ] Review and update permissions
- [ ] Audit data retention compliance
- [ ] Check for software updates
- [ ] Review security logs
- [ ] Update privacy documentation

### Quarterly Checklist
- [ ] Full security audit
- [ ] Review all policies and procedures
- [ ] Update privacy policy if needed
- [ ] Train moderators on new features
- [ ] Comprehensive backup verification
- [ ] Performance optimization review

---

::: tip Remember
The goal of Spywatcher is to help you build a safer, more engaged community. Always use it responsibly and with your users' best interests in mind.
:::

*Last updated: November 2024*
