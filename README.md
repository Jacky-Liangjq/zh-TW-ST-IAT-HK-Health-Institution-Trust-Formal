# zh-TW ST-IAT HK Health Institution Trust Formal

Formal 4-round ST-IAT for Hong Kong health institution trust.

## Files

- `qstiat-formal.js`: shared Minno extension and formal trial generator.
- `HKHealthTrustSTIAT.js`: desktop Minno task entry.
- `HKHealthTrustSTIAT-mobile.js`: mobile Minno task entry.
- `qualtrics-desktop.js`: Qualtrics wrapper for desktop.
- `qualtrics-mobile.js`: Qualtrics wrapper for mobile.
- `test-formal-design.js`: JavaScript validation for the formal design.

## Internal Labels

- Institution: `institution`
- Trustworthy: `trust_ability`, `trust_benevolence`, `trust_integrity`
- Not trustworthy: `distrust_ability`, `distrust_benevolence`, `distrust_integrity`
- Response sides: `left`, `right`
- Conditions: `POS`, `NEG`
- Rounds: `block1_practice_pos`, `block2_test_pos`, `block3_practice_neg`, `block4_test_neg`
- Block order assignment: `positive_first` or `negative_first`

Displayed task text remains Chinese.

## Block Order

Participants are randomly assigned to one of two block orders with equal probability:

- `positive_first`: blocks 1, 2, 3, 4
- `negative_first`: blocks 3, 4, 1, 2

The on-screen instruction pages always display the participant-facing sequence as parts 1 to 4. The log output records the assigned order in the `bOrd` column and includes a `block_order` metadata row.

## Acknowledgement

This task is implemented with MinnoJS and follows the Qualtrics ST-IAT approach documented by MinnoJS / Project Implicit.

The Traditional Chinese localization, Hong Kong health institution stimulus set, formal trial design, logging labels, and the mobile touch-response version were developed specifically for this project.

References:

- Zlotnick, E., Dzikiewicz, A. J., & Bar-Anan, Y. (2015). Minno.js (Version 0.3) [Computer software].
- Bengayev, E. (2020, July 10). Running Project Implicit's ST-IAT from Qualtrics [Blog post]. Retrieved from https://minnojs.github.io/minnojs-blog/qualtrics-stiat/
