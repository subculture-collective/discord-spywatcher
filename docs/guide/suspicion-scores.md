# Suspicion Scores

Understand how Spywatcher calculates behavioral suspicion scores.

## What are Suspicion Scores?

Suspicion scores are automated ratings (0-100) that indicate potentially unusual or suspicious user behavior.

## Score Calculation

Scores are based on multiple factors:

### Presence Patterns (30%)
- Unusual online hours
- Constant availability
- Sudden pattern changes

### Message Activity (25%)
- Message frequency
- Content patterns
- Spam indicators

### Multi-client Usage (20%)
- Simultaneous device usage
- Client switching patterns
- Abnormal client combinations

### Account Characteristics (15%)
- Account age
- Join date
- Username patterns

### Behavioral Changes (10%)
- Sudden activity spikes
- Pattern shifts
- Role changes

## Score Ranges

| Score | Classification | Action |
|-------|---------------|---------|
| **80-100** | 🔴 High Risk | Immediate investigation |
| **60-79** | 🟠 Medium Risk | Monitor closely |
| **40-59** | 🟡 Low Risk | Occasional review |
| **0-39** | ✅ Normal | No action needed |

## Interpreting Scores

### High Scores (80-100)

**Possible Causes:**
- Bot or automated account
- Account compromise
- Coordinated behavior
- Malicious intent

**Recommended Actions:**
- Investigate immediately
- Review timeline
- Check correlations with other users
- Consider temporary restrictions

### Medium Scores (60-79)

**Possible Causes:**
- Unusual but not necessarily malicious
- Legitimate power users
- Timezone differences
- Platform limitations

**Recommended Actions:**
- Monitor activity
- Note patterns
- Compare with historical data
- No immediate action

### Low Scores (40-59)

**Possible Causes:**
- Minor anomalies
- New users adjusting
- Occasional unusual behavior

**Recommended Actions:**
- Passive monitoring
- No intervention needed

## False Positives

Legitimate users may have high scores:
- Moderators with unusual hours
- International users
- Power users with unique patterns
- Voice-only participants

Always investigate before taking action.

## Using Suspicion Scores

### View Scores

Navigate to **Suspicion Scores** to see:
- User list sorted by score
- Score trends over time
- Contributing factors

### Set Alerts

Configure alerts for:
- Scores above threshold
- Sudden score increases
- Multiple high-score users

### Export Data

Export suspicion data for:
- Detailed analysis
- Reporting
- Historical tracking

## Related

- [Ghost Detection](./ghost-detection)
- [Lurker Detection](./lurker-detection)
- [Timeline Analysis](./timeline)

::: warning Important
Suspicion scores are indicators, not proof. Always investigate before taking moderation action.
:::
