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

Displayed task text remains Chinese.

## Acknowledgement

This task is implemented with MinnoJS and follows the Qualtrics ST-IAT approach documented by MinnoJS / Project Implicit.

The Traditional Chinese localization, Hong Kong health institution stimulus set, formal trial design, logging labels, and the mobile touch-response version were developed specifically for this project.

Suggested citations:

- Zlotnick, E., Dzikiewicz, A. J., & Bar-Anan, Y. (2015). Minno.js (Version 0.3) [Computer software].
- Bengayev, E. (2020, July 10). Running Project Implicit's ST-IAT from Qualtrics [Blog post]. Retrieved from https://minnojs.github.io/minnojs-blog/qualtrics-stiat/
