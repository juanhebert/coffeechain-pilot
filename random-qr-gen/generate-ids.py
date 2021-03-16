#!/usr/bin/env python3

import random
import string

NUMBER_CODES = 200

strings = set()
while(len(strings) < NUMBER_CODES):
    letters = ''.join(random.choice(string.ascii_uppercase) for i in range(3))
    numbers = ''.join(random.choice(string.digits) for i in range(3))
    strings.add('{}-{}'.format(letters, numbers))

for s in strings:
    print(s)
