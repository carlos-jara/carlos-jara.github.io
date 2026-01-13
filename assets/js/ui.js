const banner = document.getElementById("banner");
const stickyHeader = document.getElementById("sticky-header");

function onScroll() {
  const bannerBottom = banner.getBoundingClientRect().bottom;

  if (bannerBottom <= 0) {
    stickyHeader.classList.add("scrolled");
  } else {
    stickyHeader.classList.remove("scrolled");
  }
}

window.addEventListener("scroll", onScroll);
onScroll();
