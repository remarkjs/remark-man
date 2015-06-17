#
# Script to generate a unicode to groff entitie mapping.
#

GROFF_PATH="script/groff"
GLYPH_PATH="script/uniglyph.cpp"
OUT_PATH="script/uniglyph.text"

if [[ ! -e "$GLYPH_PATH" ]]; then
  git clone git://git.savannah.gnu.org/groff.git "$GROFF_PATH"
  cp "$GROFF_PATH/src/libs/libgroff/uniglyph.cpp" "$GLYPH_PATH"
  rm -rf "$GROFF_PATH"
fi

> "$OUT_PATH"

echo "unicode	glyph" >> "$OUT_PATH"

cat script/uniglyph.cpp |
  grep -Eow "  \{[^\}]+\},?" |
  sed 's/  { "//' |
  sed 's/" },//' |
  sed 's/", "/	/' >> "$OUT_PATH"

node script/build-unigroff.js
