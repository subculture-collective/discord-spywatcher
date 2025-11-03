# Ghost Detection

Ghost detection identifies users who are frequently present in the Discord server but rarely participate in conversations.

## What is a Ghost User?

A ghost user is someone who:

- ✅ Has **high presence counts** (online frequently)
- ✅ Has **low message counts** (rarely speaks)
- ❓ May be lurking or using automated tools
- ❓ Could be legitimate passive observers

## How It Works

Spywatcher calculates a **"ghost score"** for each user based on their activity patterns:

```
Ghost Score = Presence Count / (Message Count + 1)
```

### Why This Formula?

- **Presence Count**: Number of times the bot detected the user online
- **Message Count**: Number of messages sent in tracked channels
- **+1 Denominator**: Prevents division by zero for users with no messages
- **Higher Score**: Indicates more "ghostly" behavior (high presence, low participation)

### Example Calculation

For a user named "SilentBob":

```json
{
  "userId": "123456789",
  "username": "SilentBob#1234",
  "presenceCount": 150,
  "messageCount": 5,
  "ghostScore": 25.0
}
```

**Calculation**: 150 / (5 + 1) = 25.0

This user has been online 150 times but only sent 5 messages, indicating strong ghost-like behavior.

## Interpreting Results

### Ghost Score Ranges

| Score Range | Classification | Interpretation |
|-------------|---------------|----------------|
| **> 50** | 🔴 **Extreme Ghost** | Almost certainly automated or surveillance account |
| **25-50** | 🟠 **Strong Ghost** | Very high presence with minimal participation |
| **10-25** | 🟡 **Likely Ghost** | High presence, low participation |
| **5-10** | 🟢 **Passive Lurker** | Moderate presence, some participation |
| **< 5** | ✅ **Normal User** | Balanced presence and participation |

### What Each Level Means

#### Extreme Ghost (> 50)

**Characteristics:**
- Online constantly but virtually never speaks
- May be a bot monitoring the server
- Could be using automated tools
- Possible surveillance or data collection account

**Recommended Action:**
- Investigate account creation date
- Check if the account is a bot
- Review permissions and roles
- Consider restricting access to sensitive channels

#### Strong Ghost (25-50)

**Characteristics:**
- Very frequent online presence
- Minimal message activity
- May be legitimate lurker or passive consumer
- Could be monitoring specific channels

**Recommended Action:**
- Monitor for pattern changes
- Check if they react to messages
- Review channel access history
- Consider reaching out to understand their usage

#### Likely Ghost (10-25)

**Characteristics:**
- Regular online presence
- Occasional messages
- Possibly shy or passive community member
- May prefer reading to writing

**Recommended Action:**
- Generally acceptable behavior
- Monitor for changes
- Encourage participation through events
- No immediate action needed

## Using the Ghost Detection Tool

### Step 1: Access Ghost Detection

Navigate to **Ghost Detection** from the sidebar or dashboard.

### Step 2: Configure Detection Parameters

Set your detection criteria:

#### Minimum Presence Count

- **Default**: 50
- **Purpose**: Only analyze users with sufficient data
- **Low values**: More users, less reliable
- **High values**: Fewer users, more reliable

```
Recommended: 30-100 depending on server activity
```

#### Maximum Message Count

- **Default**: 10
- **Purpose**: Threshold for "low participation"
- **Low values**: Stricter (fewer messages = ghost)
- **High values**: More lenient

```
Recommended: 5-15 depending on server culture
```

#### Time Period

- **Options**: 7 days, 30 days, 90 days, All time
- **Default**: 30 days
- **Purpose**: Analyze recent or historical behavior

```
Recommended: 30 days for current behavior
```

### Step 3: Run Detection

Click **"Run Detection"** to analyze users based on your criteria.

### Step 4: Review Results

Results are displayed in a sortable table:

| Column | Description |
|--------|-------------|
| **Username** | User's Discord name and discriminator |
| **Presence Count** | Times detected online |
| **Message Count** | Messages sent in period |
| **Ghost Score** | Calculated score |
| **Last Seen** | Last online timestamp |
| **Actions** | View details, timeline, or export |

### Step 5: Investigate Users

Click **"Details"** on any user to see:

- **Activity Timeline**: When they were online
- **Channel Distribution**: Which channels they visit
- **Message Patterns**: When they do speak
- **Role History**: Changes in permissions
- **Multi-client Usage**: Simultaneous device usage

## Advanced Features

### Filtering Results

Refine your ghost list with filters:

#### By Score Range

```
Minimum Score: 10
Maximum Score: 50
```

Shows only users within specific ghost score range.

#### By Role

```
Role Filter: @Members, @Verified
```

Analyze specific role groups for ghost behavior.

#### By Join Date

```
Joined After: 2024-01-01
Joined Before: 2024-12-31
```

Focus on users who joined in a specific period.

### Batch Operations

Select multiple users and:

- **Export Data**: Download as CSV or JSON
- **Add to Watchlist**: Monitor for changes
- **Generate Report**: Create summary document
- **Set Alert Thresholds**: Get notified of changes

### Automated Monitoring

Set up automatic ghost detection:

1. Go to **Settings** > **Scheduled Tasks**
2. Enable **"Weekly Ghost Scan"**
3. Configure parameters:
   - Schedule: Every Monday at 9:00 AM
   - Minimum Score: 15
   - Notification: Discord webhook
4. Save configuration

You'll receive weekly reports automatically.

## Common Scenarios

### Scenario 1: Bot Accounts

**Observation**: User with score > 100, online 24/7

**Analysis**:
```json
{
  "username": "SuspiciousBot#0001",
  "presenceCount": 5000,
  "messageCount": 0,
  "ghostScore": 5000,
  "pattern": "Constant online presence, never offline"
}
```

**Action**: Likely a bot. Verify and remove if unauthorized.

### Scenario 2: Legitimate Lurker

**Observation**: User with score 8, occasionally speaks

**Analysis**:
```json
{
  "username": "ShyMember#1234",
  "presenceCount": 80,
  "messageCount": 10,
  "ghostScore": 7.27,
  "pattern": "Regular presence, minimal but genuine participation"
}
```

**Action**: Normal behavior, no action needed.

### Scenario 3: Surveillance Account

**Observation**: New account with immediate high presence

**Analysis**:
```json
{
  "username": "NewAccount#5678",
  "presenceCount": 200,
  "messageCount": 1,
  "ghostScore": 100,
  "accountAge": "7 days",
  "pattern": "Joined recently, immediately active but silent"
}
```

**Action**: Investigate thoroughly. May be monitoring server.

## Best Practices

### ✅ Do's

1. **Use Context**: Consider server culture and purpose
2. **Investigate First**: High scores don't always mean malicious intent
3. **Regular Monitoring**: Run detection weekly or bi-weekly
4. **Adjust Thresholds**: Tune parameters for your community
5. **Combine Metrics**: Use with suspicion scores and timeline analysis

### ❌ Don'ts

1. **Don't Auto-Ban**: Never automatically ban based solely on ghost score
2. **Don't Ignore Low Scores**: Some malicious users may participate occasionally
3. **Don't Forget Legitimate Use Cases**: Some users prefer passive consumption
4. **Don't Overlook New Users**: New members may need time to engage
5. **Don't Ignore Context**: Time zones and activity patterns matter

## Legitimate Ghost Users

Not all ghosts are problematic:

### Voice Chat Participants

Users who primarily use voice channels:
- High presence in voice
- Low message count
- Legitimate participation

### Timezone Differences

Users in different timezones:
- Online when chat is slow
- May appear as ghosts despite being active

### Content Consumers

Users who prefer reading:
- Genuine interest in community
- Passive consumption is their style
- May participate through reactions

### Moderators

Staff using monitoring tools:
- High presence for oversight
- Low public messages
- Legitimate administrative role

## Integration with Other Features

### Suspicion Scores

Ghost detection feeds into suspicion scoring:
- High ghost score increases suspicion
- Combined with other behavioral signals
- More comprehensive threat assessment

### Timeline Analysis

View ghost users' timelines:
- Identify presence patterns
- Correlate with server events
- Detect coordinated behavior

### Privacy Controls

Respect user privacy:
- Some users opt out of tracking
- Ghost scores may be limited
- Check privacy status in user details

## Troubleshooting

### No Users Detected

**Cause**: Thresholds too strict or insufficient data

**Solution**: Lower presence count minimum or extend time period

### Too Many Users

**Cause**: Thresholds too lenient

**Solution**: Increase minimum presence count or decrease message count threshold

### Inaccurate Scores

**Cause**: Bot not tracking all presence events

**Solution**: Verify bot has proper intents and permissions

## Export and Reporting

### CSV Export

Export ghost detection results:

```csv
Username,UserID,PresenceCount,MessageCount,GhostScore,LastSeen
SilentBob#1234,123456789,150,5,25.0,2024-11-03T12:00:00Z
```

### JSON Export

```json
[
  {
    "userId": "123456789",
    "username": "SilentBob#1234",
    "presenceCount": 150,
    "messageCount": 5,
    "ghostScore": 25.0,
    "lastSeen": "2024-11-03T12:00:00Z",
    "roles": ["@Member", "@Verified"],
    "accountCreated": "2023-01-15T10:00:00Z"
  }
]
```

### Report Generation

Generate PDF reports with:
- Executive summary
- Top ghost users
- Trend analysis
- Recommendations

## Related Features

- **[Lurker Detection](./lurker-detection)** - Similar but different metrics
- **[Suspicion Scores](./suspicion-scores)** - Comprehensive behavior analysis
- **[Timeline Analysis](./timeline)** - Individual user tracking
- **[Heatmap](./heatmap)** - Visual activity patterns

::: tip Pro Tip
Combine ghost detection with timeline analysis to understand if users are consistent ghosts or if their behavior changed recently.
:::

::: warning Important
Some legitimate users may have high ghost scores (moderators, voice-only users, different timezones). Always investigate before taking action.
:::

## Next Steps

1. **[Run your first ghost detection](./quick-start#step-5-run-your-first-detection)**
2. **[Learn about suspicion scores](./suspicion-scores)**
3. **[Explore timeline analysis](./timeline)**
