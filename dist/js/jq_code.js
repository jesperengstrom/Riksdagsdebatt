'use strict';

/**
 * The dropup-menu for party filtering closes by default when you toggle a button. I didn't want this, so i snatched a solution from
 * http://stackoverflow.com/questions/25089297/twitter-bootstrap-avoid-dropdown-menu-close-on-click-inside
 */

$(document).on('click', '#drop-noclose', function (e) {
  e.stopPropagation();
});