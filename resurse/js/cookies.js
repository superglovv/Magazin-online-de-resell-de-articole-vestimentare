//setCookie("a",10, 1000)
function setCookie(nume, val, timpExpirare) {
  //timpExpirare in milisecunde
  d = new Date();
  d.setTime(d.getTime() + timpExpirare);
  document.cookie = `${nume}=${val}; expires=${d.toUTCString()}`;
}

function setLastVisitedPage() {
  const lastVisitedPage = new URL(document.referrer).pathname;
  if (lastVisitedPage) {
    setCookie("last_visited_page", lastVisitedPage, 604800000);
  }
}

function getLastVisitedPage() {
  const lastVisitedPage = getCookie("last_visited_page");
  if (lastVisitedPage) {
    return lastVisitedPage;
  } else {
    return "Nu există informații despre ultima pagină vizitată.";
  }
}

function getCookie(nume) {
  vectorParametri = document.cookie.split(";"); // ["a=10","b=ceva"]
  for (let param of vectorParametri) {
    if (param.trim().startsWith(nume + "=")) return param.split("=")[1];
  }
  return null;
}

function deleteCookie(nume) {
  console.log(`${nume}; expires=${new Date().toUTCString()}`);
  document.cookie = `${nume}=0; expires=${new Date().toUTCString()}`;
  document.getElementById("banner").style.display = "block";
}

function deleteAllCookies() {
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    var eqPos = cookie.indexOf("=");
    var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = `${name}=0; expires=${new Date().toUTCString()}`;
  }
}

window.addEventListener("load", function () {
  if (getCookie("acceptat_banner")) {
    document.getElementById("banner").style.display = "none";
    document.getElementById("ultima-pagina").style.display = "block";

    document.getElementById("ultima-pagina").innerHTML =
      "Ultima pagină vizitată este: " +
      getLastVisitedPage() +
      '<button id="ok_cookies2" class="ok_cookies2">Elimina</button>';

    document.getElementById("ok_cookies2").onclick = function () {
      document.getElementById("ultima-pagina").style.display = "none";
      deleteCookie("acceptat_banner");
    };

    // document.getElementById("ok_cookies2").onclick = function () {
    //   document.getElementById("ultima-pagina").style.display = "none";
    //   deleteAllCookies();
    //   document.getElementById("banner").style.display = "block";
    // };
  }

  document.getElementById("ok_cookies").onclick = function () {
    setCookie("acceptat_banner", true, 60000);
    document.getElementById("banner").style.display = "none";
  };

  setLastVisitedPage();
  // setari coockies setate sa expire/ reapara dupa o saptamana
  //   this.document.getElementById("ok_cookies").onclick = function () {
  //     setCookie("acceptat_banner", true, 604800000);
  //     document.getElementById("banner").style.display = "none";
  //   };
});

function saveFilters() {
  const filters = {
    nume: document.getElementById("inp-nume").value,
    descriere: document.getElementById("inp-descriere").value,
    marime: document.querySelector('input[name="gr_rad"]:checked').value,
    pret: document.getElementById("inp-pret").value,
    culoare: document.getElementById("inp-culoare").value,
    conditie: Array.from(
      document.querySelectorAll('input[name="gr_check"]:checked')
    ).map((e) => e.value),
    caracteristici: Array.from(
      document.querySelectorAll('input[name="gr_check2"]:checked')
    ).map((e) => e.value),
    brand: document.getElementById("inp-categorie").value,
    stil: Array.from(document.getElementById("inp-stil").selectedOptions).map(
      (option) => option.value
    ),
  };

  localStorage.setItem("savedFilters", JSON.stringify(filters));
  setCookie("savedFilters", JSON.stringify(filters), 7 * 24 * 60 * 60 * 1000);
}

// Functie pentru incarcarea filtrelor din localStorage
function loadFilters() {
  console.log("loadFilters called");
  const savedFilters =
    JSON.parse(localStorage.getItem("savedFilters")) ||
    JSON.parse(getCookie("savedFilters"));
  if (savedFilters) {
    document.getElementById("inp-nume").value = savedFilters.nume;
    document.getElementById("inp-descriere").value = savedFilters.descriere;
    document.querySelector(
      `input[name="gr_rad"][value="${savedFilters.marime}"]`
    ).checked = true;
    document.getElementById("inp-pret").value = savedFilters.pret;
    document.getElementById("inp-culoare").value = savedFilters.culoare;
    document.querySelectorAll('input[name="gr_check"]').forEach((input) => {
      input.checked = savedFilters.conditie.includes(input.value);
    });
    document.querySelectorAll('input[name="gr_check2"]').forEach((input) => {
      input.checked = savedFilters.caracteristici.includes(input.value);
    });
    document.getElementById("inp-categorie").value = savedFilters.brand;
    document.getElementById("inp-stil").value = savedFilters.stil;
  }
}

// Functie pentru resetarea filtrelor si stergerea din localStorage si cookie
function resetFilters() {
  localStorage.removeItem("savedFilters");
  deleteCookie("savedFilters");
  document.getElementById("save-filters").checked = false;
}

document.getElementById("filtrare").addEventListener("click", function () {
  if (document.getElementById("save-filters").checked) {
    saveFilters();
  }
});

document.getElementById("resetare").addEventListener("click", function () {
  resetFilters();
});

window.addEventListener("load", function () {
  loadFilters();
});
