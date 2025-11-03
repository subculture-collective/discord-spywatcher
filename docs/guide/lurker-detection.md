# Lurker Detection

Identify passive users who rarely engage with your Discord community.

## What is a Lurker?

A lurker is a user who:
- Is a member of the server
- Rarely or never sends messages
- May or may not be online frequently
- Passively consumes content without participating

## Lurker vs Ghost

| Characteristic | Lurker | Ghost |
|----------------|--------|-------|
| **Online Presence** | Variable | High |
| **Message Activity** | Very Low | Very Low |
| **Primary Metric** | Message count | Presence/Message ratio |

## Detection Algorithm

Lurkers are identified based on:
1. Low message count over time period
2. Account age (excludes new members)
3. Server join date
4. Reaction activity (optional)

## Using Lurker Detection

1. Navigate to **Lurker Detection**
2. Set detection parameters
3. Run scan
4. Review results

## Legitimate Lurkers

Not all lurkers are problematic:
- New members still getting comfortable
- Different timezone users
- Content consumers (readers vs writers)
- Voice-only participants

::: tip
Consider server culture when interpreting lurker data. Some communities naturally have more passive members.
:::

## Related

- [Ghost Detection](./ghost-detection)
- [Suspicion Scores](./suspicion-scores)
