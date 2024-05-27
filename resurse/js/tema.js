document.addEventListener("DOMContentLoaded", function () {
  const currentTheme = localStorage.getItem("tema");
  if (currentTheme) {
    document.body.classList.add(currentTheme);
  } else {
    document.body.classList.remove("dark", "mocha");
  }

  document.getElementById("light_theme").onclick = function () {
    document.body.classList.remove("dark", "mocha");
    localStorage.removeItem("tema");
  };

  document.getElementById("dark_theme").onclick = function () {
    document.body.classList.remove("mocha");
    document.body.classList.add("dark");
    localStorage.setItem("tema", "dark");
  };

  document.getElementById("mocha_theme").onclick = function () {
    document.body.classList.remove("dark");
    document.body.classList.add("mocha");
    localStorage.setItem("tema", "mocha");
  };
});
