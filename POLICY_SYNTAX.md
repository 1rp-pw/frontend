# Policy Language Syntax Guide

This guide documents all available syntax features in the policy language, with examples and explanations.

## Table of Contents
1. [Comments](#comments)
2. [Rules](#rules)
3. [Objects](#objects)
4. [Selectors](#selectors)
5. [Labels and References](#labels-and-references)
6. [Comparisons](#comparisons)
7. [Values](#values)
8. [Rule References](#rule-references)

## Comments

Comments start with `#` and continue to the end of the line.

```
# This is a comment
# Comments explain the policy logic
```

**Syntax Highlighting**: Comments appear in gray (`text-gray-400`)

## Rules

Rules define conditions and outcomes. They follow this pattern:

```
A **object** action
  if condition1
  and condition2
  or condition3.
```

### Basic Rule
```
A **driver** gets a driving licence
  if the **driver** passes the test requirements.
```

### Labeled Rule
Rules can have labels for reference:
```
driver.test. A **driver** passes the age test
  if the __date of birth__ of the **person** is earlier than 2008-12-12.
```

**Syntax Highlighting**: 
- Labels appear in yellow (`text-yellow-500`)
- Referenced rule definitions appear in fuchsia (`text-fuchsia-500`)

## Objects

Objects are entities in your policy, wrapped in double asterisks `**object**`.

```
A **driver** gets a driving licence
A **person** has an age
```

### Nested Objects
Objects can contain other objects using dot notation:
```
the **drivingTest.testDates.practical**
```

### Object Path Navigation
Navigate through object properties:
```
the **practical** of the **test dates** in the **driving test**
```

**Syntax Highlighting**: Objects appear in blue (`text-blue-500`)

## Selectors

Selectors are properties of objects, wrapped in double underscores `__selector__`.

```
the __date of birth__ of the **person**
the __center__ of the **practical**
the __multiple choice__ of the **theory**
```

**Syntax Highlighting**: Selectors appear in green (`text-green-500`)

## Labels and References

### Label Definition
Define a labeled rule:
```
driver.test. A **driver** passes the age test
practical. A **driver** passes the practical test
```

### Label References
Reference labeled rules using `§` or `$`:
```
if §driver.test is valid
if $practical is satisfied
```

### Label Predicates
Label references can include predicates:
- `clears`
- `succeeds`
- `qualifies`
- `passes`
- `meets requirements`
- `satisfies`
- `is valid`
- `is approved`
- `has passed`
- `is authorized`
- `is sanctioned`
- `is certified`
- `is permitted`
- `is legitimate`
- `is satisfied`

Example:
```
if §driver.test is valid
if $practical is satisfied
```

**Syntax Highlighting**: 
- Label definitions appear in yellow (`text-yellow-500`)
- Label references appear in dark yellow (`text-yellow-700`)

## Comparisons

### Numeric Comparisons
- `is at least` - greater than or equal to
- `is no more than` - less than or equal to
- `is greater than`
- `is less than`
- `is equal to`

```
if the __score__ is at least 43
if the __minor__ is no more than 17
```

### Date Comparisons
- `is earlier than`
- `is later than`
- `is within`

```
if the __date of birth__ is earlier than 2008-12-12
if the __date__ is within 2 years
```

### Set Membership
- `is in` - check if value is in a list
- `is not in`

```
if the __center__ is in ["Manchester", "Coventry"]
```

### Other Comparisons
- `contains`
- `is the same as`
- `is not the same as`

**Syntax Highlighting**: Comparison operators appear in purple (`text-purple-500`)

## Values

### Booleans
```
is equal to true
is equal to false
```
**Syntax Highlighting**: 
- `true` appears in emerald (`text-emerald-500`)
- `false` appears in red (`text-red-500`)

### Numbers
```
is at least 43
is no more than 17
```
**Syntax Highlighting**: Numbers appear in orange (`text-orange-500`)

### Dates
Dates can be written as:
- Plain format: `2008-12-12`
- Function format: `date(2025-06-11)`

```
is earlier than 2008-12-12
is later than date(2025-01-01)
```
**Syntax Highlighting**: Dates appear in dark orange (`text-orange-700`)

### Time Periods
```
is within 2 years
is within 30 days
```
**Syntax Highlighting**: Time units appear in orange (`text-orange-500`)

### Lists/Arrays
```
is in ["Manchester", "Coventry", "London"]
```

## Rule References

Rules can reference other rules directly by their action text:

```
A **driver** gets a driving licence
  if the **driver** passes the test requirements
  and the **driver** has taken the test in the time period.

A **driver** passes the test requirements
  if **driver** passes the theory test.
```

In this example, "passes the test requirements" is referenced in the first rule and defined in the second rule.

**Syntax Highlighting**: 
- Rule references appear in teal (`text-teal-500`)
- Referenced rule definitions appear in fuchsia (`text-fuchsia-500`)

## Complete Example

Here's a complete policy using all features:

```
# Driving Test Example

A **driver** gets a driving licence
  if §driver.test is valid
  and the **driver** passes the test requirements
  and the **driver** has taken the test in the time period
  and the **driver** did their test at a valid center.

A **driver** did their test at a valid center
  if the __center__ of the **drivingTest.testDates.practical** is in ["Manchester", "Coventry"]
  and the __center__ of the **practical** of the **test dates** in the **driving test** is in ["Manchester", "Coventry"].

driver.test. A **driver** passes the age test
  if the __date of birth__ of the **person** in the **driving test** is earlier than 2008-12-12.

A **driver** passes the test requirements
  if **driver** passes the theory test
  and $practical is satisfied.

A **driver** passes the theory test
  if the __multiple choice__ of the **theory** of the **scores** in the **driving test** is at least 43
  and the __hazard perception__ of the **theory** of the **scores** in the **driving test** is at least 44.

practical. A **driver** passes the practical test
  if the __minor__ in the **practical** of the **scores** in the **driving test** is no more than 17
  and the __major__ in the **practical** of the **scores** in the **driving test** is equal to false.

A **driver** has taken the test in the time period
  if the __date__ of the __theory__ of the **testDates** in the **driving test** is within 2 years
  and the __date__ of the __practical__ of the **testDates** in the **driving test** is within 30 days.
```

## Golden Rule

Every policy must have exactly one "golden rule" - a rule that is not referenced by any other rule. This is the entry point for policy evaluation. In the example above, "A **driver** gets a driving licence" is the golden rule.

## Syntax Highlighting Color Reference

| Element | Color | CSS Class |
|---------|-------|-----------|
| Comments (#) | Gray | `text-gray-400` |
| Objects (**object**) | Blue | `text-blue-500` |
| Selectors (__selector__) | Green | `text-green-500` |
| Numbers | Orange | `text-orange-500` |
| Dates | Dark Orange | `text-orange-700` |
| Booleans (true) | Emerald | `text-emerald-500` |
| Booleans (false) | Red | `text-red-500` |
| Comparison Operators | Purple | `text-purple-500` |
| Rule References | Teal | `text-teal-500` |
| Referenced Rule Definitions | Fuchsia | `text-fuchsia-500` |
| Labels | Yellow | `text-yellow-500` |
| Label References (§ or $) | Dark Yellow | `text-yellow-700` |