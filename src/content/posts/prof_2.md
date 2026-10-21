---
title: 專二
date: 2026-10-20
excerpt: "Suck it"
draft: false
tags:
  - c
---
# C
[C Basic Data Type Sizing](https://en.wikipedia.org/wiki/64-bit_computing#64-bit_data_models)
## Struct Padding
[reference](https://en.wikipedia.org/wiki/Data_structure_alignment#Typical_alignment_of_C_structs_on_x86)
1. 找最大的類型並且設n = 最大型別大小 
3. 找先后順序填元素，先填充 `(-p % n) = (-p & (n-1))` 的空白(p 爲現在位置, n 爲此元素大小(如爲陣列取第一個), -p 爲5 bit二補數運算(因爲最大8 byte, 由LSB到MSB找到第一個1後的bit全部反向))，再填入元素
```c
#include <stddef.h>
#include <stdio.h>

int main() {
  int len = 0;
  char sym[10];
  int siz[10];
  while (len < 10) {
    char tmp = getchar();
    while (tmp == '\n') {
      tmp = getchar();
    }
    if (tmp == '0') {
      break;
    }
    sym[len] = tmp;
    scanf("%d", &siz[len]);
    len++;
  }

  int strictest = 0;
  for (int i = 0; i < len; i++) {
    if (siz[i] > strictest) {
      strictest = siz[i]; // let alignment be size( for basic data types )
    }
  }

  int sum = 0, left = 0, current_offset = 0, aligned, padding;
  for (int i = 0; i < len; i++) {
    padding = (siz[i] - (current_offset % siz[i])) % siz[i];
    // eq: padding = -current_offset & (siz[i] - 1);
    for (int j = 0; j < padding; j++) {
      putchar('|');
      putchar(' ');
    }
    current_offset += padding;

    if (current_offset % strictest == 0 && current_offset != 0) {
      putchar('|');
      putchar('\n');
    }

    for (int j = 0; j < siz[i]; j++) {
      putchar('|');
      putchar(sym[i]);
    }
    current_offset += siz[i];
  }

  for (int i = current_offset;
       i < ((current_offset + strictest - 1) / strictest) * strictest; i++) {
    putchar('|');
    putchar(' ');
  }
  putchar('|');
  putchar('\n');
}
```

### 驗証 
```c
#include <stddef.h>
#include <stdio.h>
struct test {
  int a;
  char b[3];
  short c;
};
int main() {
  printf("%d\n", offsetof(struct test, a));
  printf("%d\n", offsetof(struct test, b));
  printf("%d\n", offsetof(struct test, c));
  printf("%ld\n", sizeof(struct test));
}
```

EX:  
```c
struct f{
    short b;
    int c;
    char a;
    long long d;
};
```

| | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7|
|------| --------------- | --------------- | --------------- | --------------- | --------------- | --------------- | --------------- | --------------- |
|0| b | b |  |  | c | c | c | c |
|1| a |  |  |  |  |  |  | |
|2| d | d | d | d | d | d | d  | d |


EX:  
```c
struct f{
    char a[20];
    long long b;
};
```

| | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7|
|------| --------------- | --------------- | --------------- | --------------- | --------------- | --------------- | --------------- | --------------- |
|2| a|a|a|a| | | | | 
|3| b|b |b |b |b |b |b |b |


# FSM Simplify (米利機 / 摩爾機 化簡)
[reference](https://zuiyu.me/2025/07/09/status-simple/)
[convert to registers input](https://mil.ufl.edu/3701/classes/joel/16%20Lecture.pdf)
```python
from typing import  Dict, List, Tuple

def find_in_grp(tgt:Tuple[int,int], garr: List[List[int]])->Tuple[int,int]:
    t1 = 0
    t2 = 0
    for idx, i in enumerate(garr):
        if tgt[0] in i:
            t1 = idx
        if tgt[1] in i:
            t2 = idx
    return (t1,t2)

# ST is state transfer
def simplify(S: List[int], O:List[Tuple[int,int]], ST:List[Tuple[int,int]]):

    # dict[output, state_indexes]
    G:Dict[Tuple[int,int], List[int]] = {}

    # split by output
    for index in range(len(S)):
        G.setdefault(O[index],[]).append(index)

    GArr = []
    # List[List[int]]: A List of same-grouped state_indexes
    GArr_new = [i for i in G.values()]

    while GArr != GArr_new:
        GArr = GArr_new
        GArr_new = []
        for  grp in GArr:
            # use dict to collect elements should belong to another group
            split_inner:Dict[Tuple[int,int], List[int]] = {}
            for elem in grp:
                split_inner.setdefault(find_in_grp(ST[elem], GArr),[]).append(elem)
            # append to new array
            GArr_new.extend(split_inner.values())
    print(GArr)
    return GArr


if __name__ == "__main__":
    # [[0, 7], [2], [1], [3, 5], [4, 6]]
    S = list(range(8))
    O = [(0,0),(0,0),(0,0),(1,0),(1,0),(1,0),(1,0),(0,0)]
    ST = [(0,5),(1,2),(7,4),(4,3),(0,5),(4,3),(7,5),(0,3)]

    # [[0], [5], [1, 3], [2, 4]]
    # S = list(range(6))
    # O = [(0,0),(0,1),(0,0),(0,1),(0,0),(0,0)]
    # ST= [(2,5), (4,5),(1,2),(2,5),(3,4),(0,4)]

    simplify(S,O,ST)
```
