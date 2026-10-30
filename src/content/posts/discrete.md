---
title: Discrete Math (A)
date: 2026-10-20
excerpt: "The abyss of non-continuous world"
draft: false
tags:
  - math
  - logic
---
# Term

| Term | Description| 
| ------------- | -------------- |
| Proposition | a declarative sentence, declare a fact (T or F) |
| Compound Proposition | Proposition with logical connectives (the logic operators) |
| converse | $q->p$ = converse $p->q$ |
| contrapositive | $not q -> not p equiv p -> q$ = contrapositive $p->q$ |
| inverse | $not p -> not q$ = inverse $p->q$|
| Commutative Law | 交換律 |
| Associated Law | 結合律 |
| Distributive Law | $p or (q and r) equiv (p or q) and (p or r)$<br>$p and (q or r) equiv (p and q) or (p and r)$ |
| Absorption Law | $p or (p and q) equiv p and (p or q) equiv p$ |
| satisfiable | any value for any variable can make it T |
| unsatisfiable | no value for any variable can make it T |
| taotology | Always T |
| contradiction| Always F |
| contingency| neither tautology nor contradiction |
| Predicates| a proposition with parameter $x>0$|
| Propositional function | generalized proposition / proposition as function with parameter ( P(x) ) |
| Compound Expression | propositional logic with predicates $P(3) and P(-1)$ |


# Symbol

| Column1 | Column2 |
| -------------- | --------------- |
| U | Domain |
| $and$ | conjunction/and |
| $or$ | disjunction/or |
| $not$ | not |
| $->$| implication / $p->q equiv not p or q$|
| $<->$ | if and only if / iff / xnor / $ (p->q) and (q->p)$ |
| $forall$ | for all |
| $exists$ | exists/for some |

# Precendence
1. $forall$ $exists$ 
2. $not$
3. $and$ $or$
4. $→$ $<->$


# Implication
## Expression
$p->q$ is equivalent to 
1. if p then q
2. if p, q
3. q unless $not p$
4. q if p
5. q whenever p
6. q follows from p 
7. p implies q
8. p only if q
9. q when p
10. p is sufficient for q
11. q is neccessary for p
12. a neccessary condition for p is q
12. a sufficient condition for q is p

## Equivalent
$p -> (q and r) equiv (p -> q) and (p -> r)$  
$p -> (q or r) equiv (p -> q) or (p -> r)$  
$(p or q) -> r equiv (p -> r) and (q -> r)$ (de morgan)   
$(p and q) -> r equiv (p -> r) or (q -> r)$  

# Logically Equivalent
Prop p,q   
$p <-> q$ is tautology   
written as $equiv, <=>$

# Quantifier / Predicate
## Universal
$$
U = NN \
P(x): x>0 \
forall x(P(x))
$$
for all x, P(x)  
All natural number is greater than 0

## Existential 
$$
U = NN \
P(x): x = 1\
exists x(P(x))
$$
for some x, P(x) / there exists

There is an element in  natural number and it is 1

## Uniqueness (Optional)
$$
exists !x (P(x)) = exists x (P(x) and forall y (P(y) → y=x ))
$$
There is a unique x, one and only one

## Examples
U = all people  
S(x) = student  
H(x) = study hard  
G(x) = High score  
### No one studies hard
$forall x [not H(x)]$

### All students study hard
$forall x [S(x) → H(x)]$

### Some students get high score
$exists x[S(x) and G(x)]$

### If any student studies hard then he will get a high score
$forall x[S(x) and H(x) → G(x)]$

### No student gets a high score
$not exists x[G(x) and S(x)]$

## Examples 2
* All lions are fierce  
* Some lions do not drink coffee
* Some fierce creatures do not drink coffee

logics:  
U=creature  
$L(x)$ is lion  
$F(x)$ is fierce  
$C(x)$ drink coffee  

* $forall x(L(x) → F(x))$  
* $exists x(L(x) and not C(x))$  
* $exists x(F(x) and not C(x))$  


# Logically Equivalent
1. Same truth value(iff)
2. Valid in every domain of discourse 

$forall x [P(x) and Q(x)] equiv forall x P(x) and forall x Q(x)$  
check
1. $forall x [P(x) and Q(x)] -> forall x P(x) and forall x Q(x)$
1. $forall x P(x) and forall x Q(x) -> forall x [P(x) and Q(x)]$

# De Morgan for Quantifier
$$
not forall x P(x) equiv exists x not P(x) \
forall not x P(x) equiv  not exists x P(x)
$$

# The Argument
```typst
    #import "@preview/curryst:0.6.0": prooftree, rule
    
    #prooftree(
      rule(
        stack(
          dir: ttb,
          spacing: 0.8em,
          $p -> q$,
          $q -> r$,
        ),
        $therefore p -> r$,
      ),
    )
```
is equivalent to $((p->q) and (q->r))->(p->r)$

# Rule of Inference
## Modus Ponens
```typst size=1.2
#import "@preview/curryst:0.6.0": prooftree, rule
    
    #prooftree(
      rule(
        stack(
          dir: ttb,
          spacing: 0.8em,
          $p -> q$,
          $p$,
        ),
        $therefore q$,
      ),
    )
```

## Modus Tollens
```typst size=1.2
    #import "@preview/curryst:0.6.0": prooftree, rule
    
    #prooftree(
      rule(
        stack(
          dir: ttb,
          spacing: 0.8em,
          $p -> q$,
          $not q$,
        ),
        $therefore not p$,
      ),
    )
```

## Hypothetical Syllogism
```typst size=1.2
    #import "@preview/curryst:0.6.0": prooftree, rule
    
    #prooftree(
      rule(
        stack(
          dir: ttb,
          spacing: 0.8em,
          $p -> q$,
          $q -> r$,
        ),
        $therefore p -> r$,
      ),
    )
```

## Disjunctive Syllogism 
```typst size=1.2
    #import "@preview/curryst:0.6.0": prooftree, rule
    
    #prooftree(
      rule(
        stack(
          dir: ttb,
          spacing: 0.8em,
          $p or q$,
          $not p $,
        ),
        $therefore q$,
      ),
    )
```
## Addition
```typst size=1.2
    #import "@preview/curryst:0.6.0": prooftree, rule
    
    #prooftree(
      rule(
        stack(
          dir: ttb,
          spacing: 0.8em,
          $p $,
        ),
        $therefore p or q$,
      ),
    )
```

## Simplification
```typst size=1.2
    #import "@preview/curryst:0.6.0": prooftree, rule
    
    #prooftree(
      rule(
        stack(
          dir: ttb,
          spacing: 0.8em,
          $p and q$,
        ),
        $therefore q$,
      ),
    )
```

## Resolution
```typst size=1.2
    #import "@preview/curryst:0.6.0": prooftree, rule
    
    #prooftree(
      rule(
        stack(
          dir: ttb,
          spacing: 0.8em,
          $p or r$,
          $not p or q$,
        ),
        $therefore q or r$,
      ),
    )
```
$(p and q) or (not p and r) equiv p and (q or r)$

## Universal Instantiation (UI)
```typst size=1.1
#import "@preview/curryst:0.6.0": prooftree, rule
#prooftree(
    rule(
        $forall x P(x)$,
        $therefore P(c)$,
        ),
    )
```

## Universal Generalization (UG)
```typst 
#import "@preview/curryst:0.6.0": prooftree, rule
#prooftree(
  rule(
    $P(c) "for an arbitary c"$,
    $therefore forall x P(x)$,
  ),
)
```

## Existential Instantiation (EI)
```typst
#import "@preview/curryst:0.6.0": prooftree, rule
#prooftree(
    rule(
        $exists x P(x)$,
        $therefore P(c) "for some element c"$,
        ),
    )
```

## Existential Generalization (EG)
```typst
#import "@preview/curryst:0.6.0": prooftree, rule
#prooftree(
  rule(
    $P(c) "for some c"$,
    $therefore exists x P(x)$,
  ),
)
```

# Valid Argument
example: $p and (p->q)$
```typst
#table(
columns: (auto ,auto, auto),
inset: 10pt,
  align: horizon,
  table.header(
    [],[*Step*], [*Reason*],
  ),
  [1],$p and (p->q)$, [premise],
  [2],$p$, [simplification],
  [3],$p->q$, [simplification],
  [4],$q$, [Modus Ponens from 2,3],
)
```

## Example
```typst
#import "@preview/curryst:0.6.0": prooftree, rule
#prooftree(
  rule(
  $forall x [P(x) or Q(x)]$,
  $forall x [P(x) -> R(x)]$,
  $therefore forall x [not R(x) -> Q(x)]$
  ),
)
```

# Proofs
trivial proof: $(p->q) and q$  
vacuous proof: $(p->q) and not p$
## Direct Proof
$p->q$ assume p is true and inference to make q must be true
## Contrapositon
$ not q -> not p$ assume $not q$ is true and inference to make $not p$ must be true
## Contradiction
$p and not p$ assume $not p$ is true, derive $p$ is  true with $not p -> F = T -> p $
## Proof by cases
$(a or b or c or d)->q equiv (a->q) and (b->q) and (c->q) and (d->q)$
a b c d are cases, and enumerate all cases
### Without Loss Of Generality
show that x,y are integer, if both xy and x+y are even, then both x and y are even  
if not both x and y are even then not both xy and x+y are even  
if x is not even or y is not even then xy is not even or x+y is not even  

let x = 2n+1, y =2k $ n, k in ZZ$  
xy = (2n+1)(2k) = 2(2nk)+2k = 2(2nk+k)  
x+y = (2n+1)+(2k) = 2(n+k) + 1

WLOG, x,y can swap, so x = 2n ,y = 2k+1 is proved

let x = 2n+1, y =2k+1 $ n, k in ZZ$  
xy = (2n+1)(2k+1) =  2n2k +2n+2k+1 = 2(2nk+n+k) + 1  
x+y = (2n+1)+(2k+1) = 2(n+k+1)   


## Existence Proof/ Constructive Existence Proof
an example for $exists x [P(x)]$

there is a positive integer can be writtern as the sum of cubes of positive integers in two way
$1729 = 10^3+9^3 = 12 ^3 + 1 ^3$
## Nonconstructive Existence Proof
without actually an example
show that there exists irrational number x and y such that $x^y$ is rational  
if $sqrt(2)^sqrt(2)$ is irrational then $(sqrt(2)^(sqrt(2)))^(sqrt(2))  = sqrt(2)^(sqrt(2) * sqrt(2)) = sqrt(2)^2 = 2$ proved  
if $sqrt(2)^sqrt(2)$ is rational then proved

## Backward Reasoning
a game, the last person remove the rocks win, a person can remove $[1,3]$ rock(s), show that the first player can always wins

a first, b second.  
1. leave $[1,3]$, a
1. leave $4$,b
1. leave $[5,7]$,a
1. leave $8$,b
1. leave $[9,11]$,a
1. leave $[12]$,b
a take 3 when first round

## Example

```typst size=0.9
#table(
columns: (auto ,auto, auto),
inset: 10pt,
  align: horizon,
  table.header(
    [],[*Step*], [*Reason*],
  ),
  [1],$forall x [P(x) or Q(x)]$, [premise],
  [2],$P(x) or Q(x)$, [UI 1],
  [3],$forall x [P(x) -> R(x)]$, [premise],
  [4],$P(x) -> R(x)$, [UI 3],
  [5],$not R(x) -> not P(x)$, [contrapositive 4],
  [6],$R(x) or (P(x) or Q(x))$, [addition 2],
  [7],$R(x) or not P(x)$, [equivalent 5],
  [8],$R(x) or not P(x) or Q(x)$, [addition 7],
  [9],$R(x) or (not P(x) and P(x)) or Q(x)$, [conj 8 6 \ with distributive law],
  [10],$R(x) or Q(x)$, [negation law 9],
  [11],$not not R(x) or Q(x)$, [double negation 10],
  [12],$not R(x) -> Q(x)$, [equivalent],
)
```

## Example 2 (28 p84)
```typst
#import "@preview/curryst:0.6.0": prooftree, rule
#prooftree(
  rule(
  $forall x [P(x) or Q(x)]$,
  $forall x [(not P(x) and Q(x)) -> R(x)]$,
  $therefore forall x [not R(x) -> P(x)]$
  ),
)
```

```typst size=0.9
#table(
columns: (auto ,auto, auto),
inset: 10pt,
  align: horizon,
  table.header(
    [],[*Step*], [*Reason*],
  ),
  [1],$forall x [P(x) or Q(x)]$, [premise],
  [2],$P(x) or Q(x)$, [UI 1],
  [3],$R(x) or P(x) or Q(x)$, [addition 2],
  [4],$not R(x) -> P(x) or Q(x)$, [equiv 2],
  [5],$forall x [(not P(x) and Q(x)) -> R(x)]$,[premise],
  [6],$(not P(x) and Q(x)) -> R(x)$,[UI 5],
  [7],$not R(x) -> not (not P(x) and Q(x)) $,[equiv 6],
  [8],$not R(x) -> (P(x) or not Q(x)) $,[equiv 7],
  [9],$not R(x) -> (P(x) or not Q(x)) and (P(x) or Q(x)) $,[conj 8 4],
  [10],$not R(x) -> P(x) $,[equiv 9 (distribute)],
  [11],$forall x [not R(x) -> P(x)]$,[UG 10],
)
```


# Tricks
$$
(a and b) or ( not a and c ) or (b and c)  \
equiv (a and b) or ( not a and c ) or (b and c and (a and not a))  \
equiv (a and b) or ( not a and c ) or (b and c and a) or (b and c and not a)  \
equiv (a and b ) or ( not a and c )  or (b and c and not a)  \
equiv (a and b ) or ( not a and c ) 
$$
