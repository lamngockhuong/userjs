// ==UserScript==
// @name         Change Translate Attribute
// @namespace    https://userjs.khuong.dev
// @version      0.3
// @description  Change translate="no" to translate="yes"
// @icon64       data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0Ij4KICA8cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxMiIgZmlsbD0iIzQyODVmNCIvPgogIDx0ZXh0IHg9IjMyIiB5PSI0NCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjMyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuaWh0E8L3RleHQ+Cjwvc3ZnPgo=
// @author       Lam Ngoc Khuong
// @updateURL    https://raw.githubusercontent.com/lamngockhuong/userjs/main/scripts/general/change-translate-attribute.user.js
// @downloadURL  https://raw.githubusercontent.com/lamngockhuong/userjs/main/scripts/general/change-translate-attribute.user.js
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const htmlTag = document.querySelector('html');

  if (htmlTag.getAttribute('translate') === 'no') {
    htmlTag.setAttribute('translate', 'yes');
    console.log('Attribute translate changed to "yes"');
  }
})();
