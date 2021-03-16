#!/bin/bash

CODES=$(python3 generate-ids.py)

rm -rf codes/ output.*
mkdir -p codes

cat tex_start > output.tex

for CODE in $CODES
do
    qrencode -s 9 -o "codes/${CODE}.png" ${CODE}
    echo "\includegraphics[scale=0.5]{${CODE}}" >> output.tex
done

cat tex_end >> output.tex

pdflatex -output-directory=codes output.tex
mv codes/output.pdf codes.pdf
rm -rf codes output.tex
