#!/bin/bash
cd /usr/share/nginx/html &&
rm -Rf tools/wubi-dict-editor-web/* &&
mv wubi-dcit-editor-web-* tools/wubi-dict-editor-web/ &&
cd tools/wubi-dict-editor-web/ &&
unzip wubi-dict-editor-web-* &&
rm -f wubi-dict-editor-web-*
echo 'Wubi Editor deploy finished.'
